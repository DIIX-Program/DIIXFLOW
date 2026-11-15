import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';

export class FlowOpsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. Amazon DynamoDB Single Table
    const table = new dynamodb.Table(this, 'FlowOpsMainTable', {
      tableName: 'flowops-main',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Global Secondary Indexes
    table.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    table.addGlobalSecondaryIndex({
      indexName: 'GSI2',
      partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // 2. Amazon S3 Artifacts Bucket
    const artifactsBucket = new s3.Bucket(this, 'FlowOpsArtifactsBucket', {
      bucketName: `flowops-artifacts-${this.account}-${this.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: 'TransitionExecutionTracesToGlacier',
          prefix: 'executions/',
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER_INSTANT_RETRIEVAL,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
    });

    // 3. Amazon Cognito User Pool
    const userPool = new cognito.UserPool(this, 'FlowOpsUserPool', {
      userPoolName: 'flowops-users',
      selfSignUpEnabled: false,
      signInAliases: { email: true },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'FlowOpsWebClient', {
      userPool,
      userPoolClientName: 'flowops-web-spa',
      generateSecret: false,
      authFlows: { userSrp: true },
    });

    // 4. AWS Lambda Execution Handlers (Node 22 ARM64 Graviton)
    const httpExecutorLambda = new lambda.Function(this, 'HttpTaskExecutorLambda', {
      functionName: 'flowops-http-executor',
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 512,
      timeout: cdk.Duration.seconds(35),
      handler: 'httpTaskExecutor.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log("FlowOps HTTP Executor Invoked:", JSON.stringify(event));
          return { statusCode: 200, status: "SUCCEEDED" };
        };
      `),
      environment: {
        NODE_OPTIONS: '--enable-source-maps',
      },
    });

    const approvalDispatcherLambda = new lambda.Function(this, 'ApprovalDispatcherLambda', {
      functionName: 'flowops-approval-dispatcher',
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 256,
      timeout: cdk.Duration.seconds(15),
      handler: 'approvalDispatcher.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log("FlowOps Approval Dispatcher Invoked:", JSON.stringify(event));
          return { status: "PENDING_APPROVAL" };
        };
      `),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    table.grantReadWriteData(approvalDispatcherLambda);

    // 5. AWS Step Functions State Machine Execution IAM Role
    const stateMachineRole = new iam.Role(this, 'FlowOpsStateMachineRole', {
      roleName: 'FlowOpsStepFunctionsExecutionRole',
      assumedBy: new iam.ServicePrincipal('states.amazonaws.com'),
    });

    httpExecutorLambda.grantInvoke(stateMachineRole);
    approvalDispatcherLambda.grantInvoke(stateMachineRole);

    // 6. Amazon API Gateway HTTP API (v2)
    const httpApi = new apigatewayv2.CfnApi(this, 'FlowOpsHttpApi', {
      name: 'flowops-api',
      protocolType: 'HTTP',
      corsConfiguration: {
        allowHeaders: ['Authorization', 'Content-Type', 'x-workspace-id'],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowOrigins: ['*'],
      },
    });

    new apigatewayv2.CfnStage(this, 'FlowOpsHttpApiDefaultStage', {
      apiId: httpApi.ref,
      stageName: '$default',
      autoDeploy: true,
    });

    // Stack Outputs
    new cdk.CfnOutput(this, 'DynamoDBTableName', { value: table.tableName });
    new cdk.CfnOutput(this, 'S3ArtifactsBucketName', { value: artifactsBucket.bucketName });
    new cdk.CfnOutput(this, 'CognitoUserPoolId', { value: userPool.userPoolId });
    new cdk.CfnOutput(this, 'CognitoClientId', { value: userPoolClient.userPoolClientId });
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: `https://${httpApi.ref}.execute-api.${this.region}.amazonaws.com/`,
    });
    new cdk.CfnOutput(this, 'HttpExecutorArn', { value: httpExecutorLambda.functionArn });
  }
}
