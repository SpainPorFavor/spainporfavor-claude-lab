# AWS Secure Document Storage — Setup Guide

> This guide walks you through setting up the private AWS S3 bucket, KMS encryption, IAM permissions, and CORS configuration required for SpainPorFavor's secure document storage.

---

## Overview

SpainPorFavor stores sensitive immigration documents (passports, criminal records, etc.) in a **dedicated private S3 bucket** in `eu-south-2` (Spain). Documents are:

- Encrypted at rest with AWS KMS (customer-managed key)
- Never publicly accessible — only via short-lived presigned URLs
- Access-logged in the application database AND via CloudTrail
- Subject to retention policies (7-year default, GDPR deletion on request)

---

## 1. Create the S3 Bucket

```bash
aws s3api create-bucket \
  --bucket spainporfavor-documents-private \
  --region eu-south-2 \
  --create-bucket-configuration LocationConstraint=eu-south-2
```

### Block all public access

```bash
aws s3api put-public-access-block \
  --bucket spainporfavor-documents-private \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

### Enable versioning (for audit trail)

```bash
aws s3api put-bucket-versioning \
  --bucket spainporfavor-documents-private \
  --versioning-configuration Status=Enabled
```

### Set lifecycle rules

```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket spainporfavor-documents-private \
  --lifecycle-configuration '{
    "Rules": [
      {
        "ID": "AbortIncompleteMultipartUploads",
        "Status": "Enabled",
        "Filter": {"Prefix": ""},
        "AbortIncompleteMultipartUpload": {"DaysAfterInitiation": 1}
      },
      {
        "ID": "TransitionToIA",
        "Status": "Enabled",
        "Filter": {"Prefix": "cases/"},
        "Transitions": [
          {"Days": 90, "StorageClass": "STANDARD_IA"}
        ]
      }
    ]
  }'
```

---

## 2. Create KMS Key

```bash
aws kms create-key \
  --region eu-south-2 \
  --description "SpainPorFavor document encryption key" \
  --key-usage ENCRYPT_DECRYPT \
  --origin AWS_KMS
```

Note the `KeyId` from the response (e.g., `arn:aws:kms:eu-south-2:123456789012:key/abcd1234-...`).

### Create an alias for easy reference

```bash
aws kms create-alias \
  --alias-name alias/spainporfavor-documents \
  --target-key-id <KEY_ID_FROM_ABOVE> \
  --region eu-south-2
```

### Set default bucket encryption to use this key

```bash
aws s3api put-bucket-encryption \
  --bucket spainporfavor-documents-private \
  --server-side-encryption-configuration '{
    "Rules": [
      {
        "ApplyServerSideEncryptionByDefault": {
          "SSEAlgorithm": "aws:kms",
          "KMSMasterKeyID": "<KEY_ARN>"
        },
        "BucketKeyEnabled": true
      }
    ]
  }'
```

---

## 3. Create IAM User

```bash
aws iam create-user --user-name spainporfavor-doc-service
```

### Attach inline policy

```bash
aws iam put-user-policy \
  --user-name spainporfavor-doc-service \
  --policy-name S3DocumentAccess \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "S3BucketAccess",
        "Effect": "Allow",
        "Action": [
          "s3:PutObject",
          "s3:GetObject",
          "s3:HeadObject",
          "s3:DeleteObject"
        ],
        "Resource": "arn:aws:s3:::spainporfavor-documents-private/*"
      },
      {
        "Sid": "S3BucketList",
        "Effect": "Allow",
        "Action": ["s3:ListBucket"],
        "Resource": "arn:aws:s3:::spainporfavor-documents-private"
      },
      {
        "Sid": "KMSAccess",
        "Effect": "Allow",
        "Action": [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:DescribeKey"
        ],
        "Resource": "<KEY_ARN>"
      }
    ]
  }'
```

### Create access keys

```bash
aws iam create-access-key --user-name spainporfavor-doc-service
```

Save the `AccessKeyId` and `SecretAccessKey` — you'll need these for the environment variables.

---

## 4. Configure CORS

The bucket needs CORS to allow presigned PUT uploads from the browser:

```bash
aws s3api put-bucket-cors \
  --bucket spainporfavor-documents-private \
  --cors-configuration '{
    "CORSRules": [
      {
        "AllowedOrigins": [
          "https://spainporfavor.com",
          "https://www.spainporfavor.com",
          "https://vivaspain-zhzm5zou.manus.space"
        ],
        "AllowedMethods": ["PUT", "HEAD"],
        "AllowedHeaders": ["Content-Type", "Content-Length", "x-amz-server-side-encryption", "x-amz-server-side-encryption-aws-kms-key-id"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3600
      }
    ]
  }'
```

---

## 5. Enable CloudTrail (Optional but Recommended)

For full audit trail of all S3 data events:

```bash
aws cloudtrail create-trail \
  --name spainporfavor-document-audit \
  --s3-bucket-name spainporfavor-cloudtrail-logs \
  --region eu-south-2

aws cloudtrail put-event-selectors \
  --trail-name spainporfavor-document-audit \
  --event-selectors '[{
    "ReadWriteType": "All",
    "IncludeManagementEvents": false,
    "DataResources": [{
      "Type": "AWS::S3::Object",
      "Values": ["arn:aws:s3:::spainporfavor-documents-private/"]
    }]
  }]'

aws cloudtrail start-logging --name spainporfavor-document-audit
```

---

## 6. Set Environment Variables

Add these to your Manus project via **Settings → Secrets**:

| Variable | Value | Description |
|----------|-------|-------------|
| `AWS_REGION` | `eu-south-2` | AWS region for the document bucket |
| `AWS_S3_DOCUMENT_BUCKET` | `spainporfavor-documents-private` | Bucket name |
| `AWS_ACCESS_KEY_ID` | `AKIA...` | IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | `wJalr...` | IAM user secret key |
| `AWS_KMS_KEY_ID` | `arn:aws:kms:eu-south-2:...` | KMS key ARN (optional — falls back to AES-256 if not set) |

Optional TTL overrides (defaults are fine for most cases):

| Variable | Default | Description |
|----------|---------|-------------|
| `DOCUMENT_PRESIGNED_UPLOAD_TTL_SECONDS` | `600` (10 min) | How long upload URLs are valid |
| `DOCUMENT_PRESIGNED_DOWNLOAD_TTL_SECONDS` | `300` (5 min) | How long download URLs are valid |

---

## 7. Verify Setup

After setting the environment variables and restarting the server:

1. Go to `/documents/start?product=eu-registration` while logged in
2. Select a document type and upload a test file
3. The upload should succeed via presigned URL (check browser Network tab for a PUT to `s3.eu-south-2.amazonaws.com`)
4. In the management center, verify staff can download the document (check `document_access_logs` table)

If AWS is not configured, the system automatically falls back to the legacy Manus Forge storage (base64 upload via `portal.uploadDocument`).

---

## Security Checklist

- [x] Bucket blocks all public access
- [x] Versioning enabled for audit trail
- [x] KMS encryption at rest (customer-managed key)
- [x] CORS restricted to production domains only
- [x] IAM user has minimal permissions (no `s3:*`)
- [x] Presigned URLs expire quickly (10min upload, 5min download)
- [x] No AWS credentials exposed to frontend
- [x] All staff downloads logged in `document_access_logs`
- [x] All document events tracked in `document_events`
- [x] Incomplete multipart uploads auto-deleted after 1 day
- [ ] CloudTrail enabled (optional but recommended)
- [ ] Bucket policy denying non-HTTPS requests (add if needed)

---

## Bucket Policy (Optional — Force HTTPS)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyInsecureTransport",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::spainporfavor-documents-private",
        "arn:aws:s3:::spainporfavor-documents-private/*"
      ],
      "Condition": {
        "Bool": { "aws:SecureTransport": "false" }
      }
    }
  ]
}
```

Apply with:
```bash
aws s3api put-bucket-policy \
  --bucket spainporfavor-documents-private \
  --policy file://bucket-policy.json
```

---

## Cost Estimate

For ~100 documents/month (average 2MB each):

| Item | Monthly Cost |
|------|-------------|
| S3 Storage (200MB) | ~€0.005 |
| S3 Requests (200 PUT + 500 GET) | ~€0.003 |
| KMS (700 requests) | ~€0.02 |
| Data Transfer (1GB) | ~€0.09 |
| **Total** | **~€0.12/month** |

Costs scale linearly. Even at 10,000 documents/month, expect under €12/month.
