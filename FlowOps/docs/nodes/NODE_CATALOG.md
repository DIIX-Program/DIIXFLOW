# FlowOps Node Catalog & Ecosystem

FlowOps provides a comprehensive catalog of 67 typed workflow nodes spanning 7 distinct categories.

---

## 1. Node Categories Summary

| Category | Identifier | Count | Primary Runtime Target | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Triggers** | `TRIGGERS` | 6 | API Gateway / EventBridge | Event ingestion and workflow invocation |
| **Core Actions** | `ACTIONS` | 8 | Step Functions Task / Lambda | HTTP, Webhooks, GraphQL, Email, System Actions |
| **Logic & Control Flow** | `LOGIC_FLOW` | 10 | Step Functions Native States | Choice, Parallel, Map, Delay, Approval |
| **Data Transformation** | `DATA_TRANSFORM` | 9 | JSONata / Step Functions Intrinsics | JSON mapping, regex, filtering, aggregation |
| **AWS Cloud Services** | `AWS_SERVICES` | 14 | AWS Native SDK Tasks | Lambda, S3, DynamoDB, SQS, SNS, SES, ECS |
| **AI & Intelligent Agents** | `AI_AGENTS` | 9 | Amazon Bedrock / LLM Connectors | Text generation, prompt synthesis, embeddings |
| **Third-Party Integrations**| `THIRD_PARTY` | 11 | OAuth2 / Authenticated Connectors | Slack, GitHub, Stripe, Discord, Notion, Jira |
| **Total** | | **67** | | |

---

## 2. Complete Node Directory

### 2.1 Triggers (`TRIGGERS`)
1. `triggerManual` — Manual / On-Demand Invocation (`AVAILABLE`)
2. `triggerWebhook` — Authenticated Inbound HTTP Webhook (`AVAILABLE`)
3. `triggerSchedule` — Cron / EventBridge Time-Based Schedule (`AVAILABLE`)
4. `triggerHttp` — Inbound HTTP Endpoint with Custom Response (`AVAILABLE`)
5. `triggerS3Event` — S3 Object Created/Modified Event Trigger (`AVAILABLE`)
6. `triggerAppEvent` — FlowOps Internal Application Event Trigger (`AVAILABLE`)

### 2.2 Actions (`ACTIONS`)
7. `actionHttp` — Outbound HTTP / REST Request with SSRF guard (`AVAILABLE`)
8. `actionWebhook` — Outbound Webhook Delivery (`AVAILABLE`)
9. `actionGraphql` — GraphQL Query & Mutation Execution (`BETA`)
10. `actionEmail` — Transactional Outbound Email (`AVAILABLE`)
11. `actionLog` — CloudWatch Structured Event Logger (`AVAILABLE`)
12. `actionDelay` — Dynamic Wait State / Timer (`AVAILABLE`)
13. `actionStopAndError` — Deliberate Workflow Termination with Error (`AVAILABLE`)
14. `actionCustomCode` — Isolated Script Execution (`DISABLED`)

### 2.3 Logic & Control Flow (`LOGIC_FLOW`)
15. `controlCondition` — If/Else Branching (`Choice` State) (`AVAILABLE`)
16. `controlSwitch` — Multi-Branch Value Matching (`Choice` State) (`AVAILABLE`)
17. `controlLoop` — Sequential Item Iterator (`AVAILABLE`)
18. `controlParallel` — Concurrent Branch Execution (`Parallel` State) (`AVAILABLE`)
19. `controlWait` — Fixed Duration Timer (`Wait` State) (`AVAILABLE`)
20. `controlHumanApproval` — Human In The Loop Gate (`.waitForTaskToken`) (`AVAILABLE`)
21. `controlMerge` — Join Multiple Branches into Single Payload (`AVAILABLE`)
22. `controlFilter` — Array / Stream Condition Filtering (`AVAILABLE`)
23. `controlSubWorkflow` — Nested Workflow Invocation (`AVAILABLE`)
24. `controlSuccess` — Terminal Success State (`AVAILABLE`)

### 2.4 Data Transformation (`DATA_TRANSFORM`)
25. `transformJson` — JSON Parse, Stringify & Formatting (`AVAILABLE`)
26. `transformSet` — Set / Inject Variables into State (`AVAILABLE`)
27. `transformFilter` — State Array Filtering (`AVAILABLE`)
28. `transformAggregate` — Accumulate / Summarize Array Elements (`AVAILABLE`)
29. `transformSplitOut` — Unroll Array into Multiple Items (`AVAILABLE`)
30. `transformSort` — Ascending / Descending Array Sorting (`AVAILABLE`)
31. `transformDateTime` — ISO 8601 Timestamp Manipulation (`AVAILABLE`)
32. `transformRegex` — Regular Expression Pattern Extraction (`AVAILABLE`)
33. `transformSafeCode` — Sandboxed JavaScript Execution (`DISABLED` — MicroVM required)

### 2.5 AWS Cloud Services (`AWS_SERVICES`)
34. `awsLambda` — Invoke AWS Lambda Function (`AVAILABLE`)
35. `awsS3` — S3 Bucket Operations (Put/Get/Delete) (`AVAILABLE`)
36. `awsDynamoDb` — DynamoDB Single-Item CRUD (`AVAILABLE`)
37. `awsSqs` — SQS Message Send / Queue Batching (`AVAILABLE`)
38. `awsSns` — SNS Topic Publishing (`AVAILABLE`)
39. `awsSes` — Simple Email Service Delivery (`AVAILABLE`)
40. `awsEventBridge` — Custom Event Emission (`AVAILABLE`)
41. `awsEcsTask` — Fargate Task Runner (`AVAILABLE`)
42. `awsSecretsManager` — Secure Secret Retrieval (`AVAILABLE`)
43. `awsCloudWatch` — Metric Emission & Alerting (`AVAILABLE`)
44. `awsStepFunctions` — Parent/Child Execution Trigger (`AVAILABLE`)
45. `awsBedrockInvoke` — Amazon Bedrock Converse Stream (`PLANNED`)
46. `awsTextract` — OCR & Document Analysis (`PLANNED`)
47. `awsKinesis` — Real-Time Stream Ingestion (`PLANNED`)

### 2.6 AI & Intelligent Agents (`AI_AGENTS`)
48. `aiAgent` — Autonomous ReAct Agent Loop (`BETA`)
49. `aiTextGenerator` — Structured LLM Completion (`BETA`)
50. `aiSummarizer` — Context-Window Document Summarizer (`BETA`)
51. `aiClassifier` — Zero-Shot Category Classification (`BETA`)
52. `aiExtractor` — Schema-Constrained Information Extraction (`BETA`)
53. `aiEmbeddings` — Vector Embedding Generation (`PLANNED`)
54. `aiPromptChain` — Multi-Turn Sequential Prompt Runner (`BETA`)
55. `aiRAGSearch` — Vector Retrieval-Augmented Generation (`PLANNED`)
56. `aiHumanReview` — AI Confidence Threshold Approval Gate (`AVAILABLE`)

### 2.7 Third-Party Integrations (`THIRD_PARTY`)
57. `extSlack` — Slack Message & Block Kit Notification (`AVAILABLE`)
58. `extDiscord` — Discord Webhook & Embed Delivery (`AVAILABLE`)
59. `extGitHub` — GitHub Issues, PRs & Commit Operations (`AVAILABLE`)
60. `extStripe` — Stripe Customer & Payment Event Actions (`AVAILABLE`)
61. `extNotion` — Notion Database & Page Mutation (`AVAILABLE`)
62. `extJira` — Jira Issue Creation & Status Update (`AVAILABLE`)
63. `extGoogleSheets` — Spreadsheet Append & Read Rows (`AVAILABLE`)
64. `extSendgrid` — SendGrid Template Email Delivery (`AVAILABLE`)
65. `extHubSpot` — HubSpot CRM Contact & Deal Sync (`AVAILABLE`)
66. `extSalesforce` — Salesforce Lead & Opportunity Updates (`PLANNED`)
67. `extShopify` — Shopify Order & Fulfillment Events (`AVAILABLE`)
