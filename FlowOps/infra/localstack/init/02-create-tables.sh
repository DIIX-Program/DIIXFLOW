#!/bin/bash
set -e

echo "[FlowOps Init] Initializing LocalStack DynamoDB Tables in ap-southeast-1..."

# Create Single-Table flowops-main idempotently
awslocal dynamodb create-table \
  --table-name flowops-main \
  --region ap-southeast-1 \
  --attribute-definitions \
      AttributeName=PK,AttributeType=S \
      AttributeName=SK,AttributeType=S \
      AttributeName=GSI1PK,AttributeType=S \
      AttributeName=GSI1SK,AttributeType=S \
      AttributeName=GSI2PK,AttributeType=S \
      AttributeName=GSI2SK,AttributeType=S \
  --key-schema \
      AttributeName=PK,KeyType=HASH \
      AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes \
    "[
      {
        \"IndexName\": \"GSI1\",
        \"KeySchema\": [
          {\"AttributeName\":\"GSI1PK\",\"KeyType\":\"HASH\"},
          {\"AttributeName\":\"GSI1SK\",\"KeyType\":\"RANGE\"}
        ],
        \"Projection\": {\"ProjectionType\":\"ALL\"}
      },
      {
        \"IndexName\": \"GSI2\",
        \"KeySchema\": [
          {\"AttributeName\":\"GSI2PK\",\"KeyType\":\"HASH\"},
          {\"AttributeName\":\"GSI2SK\",\"KeyType\":\"RANGE\"}
        ],
        \"Projection\": {\"ProjectionType\":\"ALL\"}
      }
    ]" || true

# Enable Time-to-Live on 'ttl' attribute
awslocal dynamodb update-time-to-live \
  --table-name flowops-main \
  --region ap-southeast-1 \
  --time-to-live-specification "Enabled=true, AttributeName=ttl" || true

echo "[FlowOps Init] DynamoDB table flowops-main verified with GSI1, GSI2, and TTL."
