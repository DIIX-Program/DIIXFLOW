#!/bin/bash
set -e

echo "[FlowOps Init] Seeding baseline development records into flowops-main..."

NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Seed Default Workspace
awslocal dynamodb put-item \
  --table-name flowops-main \
  --region ap-southeast-1 \
  --item "{
    \"PK\": {\"S\": \"WORKSPACE#ws-core-enterprise\"},
    \"SK\": {\"S\": \"METADATA\"},
    \"id\": {\"S\": \"ws-core-enterprise\"},
    \"name\": {\"S\": \"Enterprise Production Workspace\"},
    \"tier\": {\"S\": \"ENTERPRISE\"},
    \"createdAt\": {\"S\": \"$NOW\"}
  }" || true

# Seed Sample Order Risk Workflow
awslocal dynamodb put-item \
  --table-name flowops-main \
  --region ap-southeast-1 \
  --item "{
    \"PK\": {\"S\": \"WORKSPACE#ws-core-enterprise\"},
    \"SK\": {\"S\": \"WORKFLOW#wf-order-fulfillment-prod\"},
    \"GSI1PK\": {\"S\": \"STATUS#PUBLISHED\"},
    \"GSI1SK\": {\"S\": \"$NOW\"},
    \"id\": {\"S\": \"wf-order-fulfillment-prod\"},
    \"name\": {\"S\": \"Order Fulfillment & Risk Gate\"},
    \"description\": {\"S\": \"Validates charges, checks fraud thresholds, and requests manager signoff.\"},
    \"currentVersion\": {\"N\": \"3\"},
    \"triggerType\": {\"S\": \"WEBHOOK\"},
    \"updatedAt\": {\"S\": \"$NOW\"}
  }" || true

echo "[FlowOps Init] Development seeding complete."
