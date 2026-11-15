# ADR 001: Serverless-First Cloud Architecture

## Context
FlowOps is an enterprise cloud workflow automation platform designed to operate with high reliability, minimal operational overhead, and scalable performance across tenants. Traditional orchestration engines (like Celery, Airflow, or standalone container clusters) incur substantial idle costs (EC2 instances, container clusters, load balancers, and NAT gateways), require complex patch management, and present single points of failure.

## Decision
We adopt a **Serverless-First** architecture built on AWS native managed services:
- **Compute**: AWS Lambda (Node.js 22 on ARM64 Graviton)
- **State Orchestration**: AWS Step Functions Standard
- **API & Edge**: Amazon API Gateway HTTP API (v2) and Amazon CloudFront
- **Database**: Amazon DynamoDB On-Demand
- **Storage**: Amazon S3 for graph definitions and ASL artifacts
- **Identity**: Amazon Cognito User Pools

## Consequences
- **Positive**:
  - Zero idle cost when no workflows are executing.
  - Automatic multi-AZ high availability and scaling out of the box.
  - Simplified deployment and teardown via AWS CDK.
- **Negative / Mitigations**:
  - Lambda cold starts: Mitigated by lean bundle sizes (<15MB) and Graviton ARM64 architecture (cold starts < 250ms).
  - Step Functions state transition costs: Mitigated by compiling efficient ASL and planning future Express Workflow compilation for sub-second micro-tasks.
