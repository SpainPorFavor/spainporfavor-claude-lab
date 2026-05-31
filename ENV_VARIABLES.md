# Required Environment Variables

This file documents all environment variables used by SpainPorFavor. Copy these into your `.env` file with appropriate values.

## Critical (app will not start without these)

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | MySQL/TiDB connection string | `mysql://user:pass@localhost:3306/spainporfavor` |
| `JWT_SECRET` | Session cookie signing secret | Any random 32+ character string |
| `VITE_APP_ID` | Manus OAuth application ID | UUID |
| `OAUTH_SERVER_URL` | Manus OAuth backend base URL | `https://oauth.manus.app` |

## Authentication

| Variable | Purpose |
|----------|---------|
| `VITE_OAUTH_PORTAL_URL` | Manus login portal URL (frontend redirect) |
| `OWNER_OPEN_ID` | Owner's Manus Open ID |
| `OWNER_NAME` | Owner's display name |

## Stripe Payments

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_...` or `sk_live_...`) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_test_...` or `pk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`) |
| `STRIPE_TEST_MODE` | Set to `true` for test mode, `false` for live |
| `VITE_STRIPE_TEST_MODE` | Frontend mirror of test mode flag |

## Manus Forge API (LLM, Storage, Notifications)

| Variable | Purpose |
|----------|---------|
| `BUILT_IN_FORGE_API_URL` | Forge API base URL (server-side) |
| `BUILT_IN_FORGE_API_KEY` | Forge API bearer token (server-side) |
| `VITE_FRONTEND_FORGE_API_URL` | Forge API base URL (frontend) |
| `VITE_FRONTEND_FORGE_API_KEY` | Forge API bearer token (frontend) |

## Email

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | Resend API key for transactional emails |

## AWS S3 Secure Document Storage (optional)

| Variable | Purpose |
|----------|---------|
| `AWS_ACCESS_KEY_ID` | AWS IAM access key |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key |
| `AWS_REGION` | AWS region (default: `eu-west-1`) |
| `AWS_S3_DOCUMENT_BUCKET` | S3 bucket name for secure documents |
| `AWS_KMS_KEY_ID` | KMS key ID for document encryption |

## Optional

| Variable | Purpose | Default |
|----------|---------|---------|
| `PORT` | Server port | Auto-assigned |
| `DOCUMENT_PRESIGNED_UPLOAD_TTL_SECONDS` | Upload URL expiry | `600` |
| `DOCUMENT_PRESIGNED_DOWNLOAD_TTL_SECONDS` | Download URL expiry | `300` |
| `VITE_ANALYTICS_ENDPOINT` | Analytics endpoint URL | — |
| `VITE_ANALYTICS_WEBSITE_ID` | Analytics website ID | — |
