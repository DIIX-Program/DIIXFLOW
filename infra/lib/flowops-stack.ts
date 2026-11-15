import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigwv2_integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as apigwv2_authorizers from 'aws-cdk-lib/aws-apigatewayv2-authorizers';

export class FlowOpsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // --- 1. DynamoDB Single Table (flowops-main) ---
    const table = new dynamodb.Table(this, 'FlowOpsMainTable', {
      tableName: 'flowops-main',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // GSI1: Status & Timeline Index
    table.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI2: Workflow History Index
    table.addGlobalSecondaryIndex({
      indexName: 'GSI2',
      partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // --- 2. Amazon S3 Artifacts Bucket ---
    const artifactsBucket = new s3.Bucket(this, 'FlowOpsArtifactsBucket', {
      bucketName: `flowops-artifacts-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
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
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // --- 3. Amazon Cognito User Pool ---
    const userPool = new cognito.UserPool(this, 'FlowOpsUserPool', {
      userPoolName: 'flowops-users',
      selfSignUpEnabled: false,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
      },
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
    });

    const userPoolClient = userPool.addClient('FlowOpsWebClient', {
      userPoolClientName: 'flowops-web-spa',
      generateSecret: false,
      authFlows: { userSrp: true },
    });

    // --- 4. AWS Lambda Task Executors (ARM64 Graviton) ---
    const httpExecutorLambda = new lambda.Function(this, 'HttpTaskExecutorLambda', {
      functionName: 'flowops-http-task-executor',
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 512,
      timeout: cdk.Duration.seconds(45),
      handler: 'httpTaskExecutor.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log("FlowOps HTTP Executor Invoked:", JSON.stringify(event));
          return { statusCode: 200, status: "SUCCESS" };
        };
      `),
      environment: {
        REGION: this.region,
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

    table.grantWriteData(approvalDispatcherLambda);

    // --- 5. Step Functions State Machine Execution IAM Role ---
    const sfnRole = new iam.Role(this, 'FlowOpsStateMachineRole', {
      roleName: 'FlowOpsStepFunctionsExecutionRole',
      assumedBy: new iam.ServicePrincipal('states.amazonaws.com'),
    });

    httpExecutorLambda.grantInvoke(sfnRole);
    approvalDispatcherLambda.grantInvoke(sfnRole);

    // --- 6. API Gateway HTTP API v2 ---
    const httpApi = new apigwv2.HttpApi(this, 'FlowOpsHttpApi', {
      apiName: 'flowops-api',
      corsPreflight: {
        allowHeaders: ['Authorization', 'Content-Type', 'x-workspace-id'],
        allowMethods: [
          apigwv2.CorsHttpMethod.GET,
          apigwv2.CorsHttpMethod.POST,
          apigwv2.CorsHttpMethod.PUT,
          apigwv2.CorsHttpMethod.DELETE,
        ],
        allowOrigins: ['*'],
      },
    });

    // Stack Outputs
    new cdk.CfnOutput(this, 'DynamoDBTableName', { value: table.tableName });
    new cdk.CfnOutput(this, 'S3ArtifactsBucketName', { value: artifactsBucket.bucketName });
    new cdk.CfnOutput(this, 'CognitoUserPoolId', { value: userPool.userPoolId });
    new cdk.CfnOutput(this, 'CognitoClientId', { value: userPoolClient.userPoolClientId });
    new cdk.CfnOutput(this, 'ApiGatewayUrl', { value: httpApi.url || '' });
    new cdk.CfnOutput(this, 'HttpExecutorArn', { value: httpExecutorLambda.functionArn });
  }
}
