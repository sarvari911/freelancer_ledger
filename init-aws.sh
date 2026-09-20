#!/bin/bash
echo "=== LocalStack Auto-Initialization Started ==="

# Create Clients Table
awslocal dynamodb create-table \
  --table-name freelancer-ledger-clients-local \
  --attribute-definitions AttributeName=userId,AttributeType=S AttributeName=clientId,AttributeType=S \
  --key-schema AttributeName=userId,KeyType=HASH AttributeName=clientId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1

# Create Invoices Table
awslocal dynamodb create-table \
  --table-name freelancer-ledger-invoices-local \
  --attribute-definitions AttributeName=userId,AttributeType=S AttributeName=invoiceId,AttributeType=S \
  --key-schema AttributeName=userId,KeyType=HASH AttributeName=invoiceId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1

# Create Payments Table
awslocal dynamodb create-table \
  --table-name freelancer-ledger-payments-local \
  --attribute-definitions AttributeName=userId,AttributeType=S AttributeName=paymentId,AttributeType=S \
  --key-schema AttributeName=userId,KeyType=HASH AttributeName=paymentId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1

# Create S3 Bucket
awslocal s3 mb s3://freelancer-ledger-pdfs-local

echo "=== LocalStack Auto-Initialization Complete ==="