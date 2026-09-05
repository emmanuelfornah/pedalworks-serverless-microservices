# Deployment Guide

This project deploys to AWS in two parts: a **static frontend** (React/Vite on
S3 + CloudFront) and a **serverless backend** (AWS SAM → Lambda + API Gateway +
DynamoDB). GitHub Actions automate both; AWS authentication uses **OIDC** so no
long-lived access keys are stored in the repository.

---

## 1. One-time AWS setup (manual)

### 1.1 Bootstrap the backend stack

The SAM template references an existing IAM role (`LambdaApplicationRoleSam`)
and saves deployment settings in `backend/sam-app/samconfig.toml`. Deploy once
locally so the stack and role exist:

```bash
cd backend/sam-app
sam build
sam deploy --guided
# Stack Name: sam-app · Region: us-east-1 · Confirm changes: n
# Allow SAM CLI IAM role creation: y · Save arguments: y
```

Copy the outputs — you will need them for the frontend environment:

| SAM output | Used for |
|---|---|
| `MicroserviceApi` | `VITE_API_GATEWAY_URL` |
| `EndpointForGetProducts` | products endpoint |

### 1.2 Seed data and create the images bucket

```bash
cd backend/utils/create_products && python create_products.py
cd ../s3 && python create_images_bucket.py
```

The images bucket name is printed by the script
(`images-<account>-<date>`); use it for `VITE_APP_S3_BUCKET_URL`.

### 1.3 Create the frontend hosting bucket + CloudFront

1. Create an S3 bucket for the site (e.g. `pedalworks-frontend`).
2. Enable static website hosting or place it behind a CloudFront distribution
   with an Origin Access Control (OAC).
3. Note the bucket name and (optionally) the CloudFront distribution ID.

### 1.4 Create the GitHub OIDC provider and IAM role

1. In IAM → Identity providers, add an **OIDC provider**:
   - Provider URL: `https://token.actions.githubusercontent.com`
   - Audience: `sts.amazonaws.com`
2. Create an IAM role trusted by that provider, scoped to your repo:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Principal": { "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com" },
       "Action": "sts:AssumeRoleWithWebIdentity",
       "Condition": {
         "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
         "StringLike":   { "token.actions.githubusercontent.com:sub": "repo:<OWNER>/<REPO>:*" }
       }
     }]
   }
   ```

3. Attach least-privilege policies allowing the role to:
   - **Frontend:** `s3:PutObject/DeleteObject/ListBucket` on the frontend bucket
     and `cloudfront:CreateInvalidation` on the distribution.
   - **Backend:** deploy the SAM/CloudFormation stack, manage the Lambda,
     API Gateway, and DynamoDB resources (or start broad and tighten later).

---

## 2. GitHub configuration

### Secrets (Settings → Secrets and variables → Actions → Secrets)

| Name | Value |
|---|---|
| `AWS_ROLE_ARN` | ARN of the OIDC IAM role (used by both deploy workflows) |

### Variables (Settings → Secrets and variables → Actions → Variables)

| Name | Value |
|---|---|
| `FRONTEND_S3_BUCKET` | S3 bucket that hosts the built site |
| `VITE_API_GATEWAY_URL` | `MicroserviceApi` output from `sam deploy` |
| `VITE_APP_S3_BUCKET_URL` | Public URL of the product-images bucket |
| `CLOUDFRONT_DISTRIBUTION_ID` | (optional) enables cache invalidation |

---

## 3. Deploy

Deployments run automatically on every push to `main` that touches the
relevant code, or manually via **Actions → workflow → Run workflow**.

- **Frontend** — `Deploy Frontend`: builds `bike-app`, syncs `dist/` to S3,
  invalidates CloudFront if `CLOUDFRONT_DISTRIBUTION_ID` is set.
- **Backend** — `Deploy Backend`: `sam build` + `sam deploy` using
  `backend/sam-app/samconfig.toml`.

### Deploy today (fastest path)

1. Complete sections 1.1–1.4.
2. Add the secret and variables in section 2.
3. Push to `main` (or run both workflows manually).
4. Open the CloudFront / S3 website URL to verify the live site.

---

## 4. Local development

```bash
# Frontend
cd bike-app
cp .env.example .env    # fill in VITE_API_GATEWAY_URL and VITE_APP_S3_BUCKET_URL
npm install
npm run dev             # http://localhost:8081

# Backend (local API)
cd backend/sam-app
sam local start-api     # http://localhost:3000
```
