#!/bin/bash
set -e

echo "[FlowOps Init] Initializing LocalStack S3 Buckets in ap-southeast-1..."

# Create artifacts bucket idempotently
awslocal s3api create-bucket \
  --bucket flowops-artifacts-local \
  --region ap-southeast-1 \
  --create-bucket-configuration LocationConstraint=ap-southeast-1 || true

echo "[FlowOps Init] S3 bucket flowops-artifacts-local verified."
