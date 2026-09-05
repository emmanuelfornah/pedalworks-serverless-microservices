# 🚲 PedalWorks — Serverless Microservices Platform

[![CI](https://github.com/emmanuelfornah/pedalworks-serverless-microservices/actions/workflows/ci.yml/badge.svg)](https://github.com/emmanuelfornah/pedalworks-serverless-microservices/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Emmanuel Fornah** · Dallas, TX · March 2026

> **Project status.** This repository implements the Products and Orders
> services (React/Vite frontend, API Gateway, two Python Lambdas, DynamoDB,
> S3 + CloudFront hosting, SAM IaC, and a CI/CD pipeline). Sections 1 and 2
> also describe the broader target design; features not yet built are labeled
> *planned* and listed in the [Roadmap](#39-roadmap).

---

## Table of Contents

- [Section 1 — Business Case](#section-1--business-case)
- [Section 2 — Technical Documentation](#section-2--technical-documentation)
- [Section 3 — README](#section-3--readme)

---

# Section 1 — Business Case

## 1.1 Company Background

PedalWorks Bicycle Parts is an e-commerce company founded by a group of friends who share a passion for cycling. The company sells bicycle parts, provides installation assistance, offers tune-up and repair services, and builds custom bicycles to meet specific customer needs.

The company serves two user types:

- **Customers** — browse the product catalog, submit orders, and view order history online
- **Employees** — generate low-inventory reports to manage stock levels

## 1.2 The Problem — Monolithic Architecture

The company's website was originally built as a monolithic Django application running on AWS Elastic Beanstalk, backed by Amazon RDS. While functional, the architecture created significant business and technical challenges as the company grew.

| Business Problem | Technical Root Cause |
|---|---|
| A bug in inventory reporting could take down the entire storefront | All functions deployed as a single unit — no fault isolation |
| Scaling for traffic spikes required scaling everything, not just the busy service | No independent scaling — entire Elastic Beanstalk environment scales together |
| Development team changes required full redeployment of the entire application | Tightly coupled codebase — no independent deployability |
| Development team lacked SQL experience and did not want to manage databases | RDS required schema design, query optimization, and database administration |
| Difficult to add new features without risk of breaking existing functionality | Single codebase — every change touches shared code |

## 1.3 Business Requirements

1. **Fault tolerance** — a failure in one feature must not affect other features
2. **Independent scaling** — individual services must scale independently based on demand
3. **Reduced maintenance** — the development team must be able to deploy changes to one service without touching others
4. **No database management** — the team has limited SQL experience and wants serverless, managed data storage
5. **Focus on code, not infrastructure** — developers want to write Python and JavaScript without managing servers

## 1.4 The Solution — Serverless Microservices

The design decomposes the storefront into independent services, each aligned to
a business capability with its own data store. The table below shows the target
design and what is implemented in this repository today.

| Service | Endpoints | Data Store | Status |
|---|---|---|---|
| Products | `GET /get_products` | DynamoDB `Products` | **Implemented** |
| Orders | `POST /orders` | DynamoDB `Orders` | **Implemented** |
| Orders (history) | `GET /orders` · `GET /orders/{id}` | DynamoDB `Orders` | Planned |
| Inventory report | `POST /create-report` | DynamoDB `Inventory` | Planned |

## 1.5 From Monolith to Microservices — Comparison

| Original Monolith (Django + RDS) | Refactored Architecture (Serverless) |
|---|---|
| AWS Elastic Beanstalk | Amazon S3 + CloudFront (React frontend) |
| Django MVC monolith (Python) | Independent Lambda functions (Python 3.12) |
| Amazon RDS (PostgreSQL / relational) | Amazon DynamoDB (NoSQL — one table per service) |
| Single deployment unit for all features | Independent deploy per microservice via AWS SAM |
| Manual server capacity planning | Automatic Lambda scaling — pay per invocation |
| SQL schema design + migrations required | No schema management — DynamoDB is schemaless |
| Orders + Order_Items relational join | Single Orders DynamoDB document with nested `order_items` list |
| One failure affects all features | Fault isolation — inventory failure cannot affect storefront |

## 1.6 Design Benefits

The serverless approach delivers these properties for the implemented services,
and the same pattern extends to the planned ones:

- **Fault isolation** — each function deploys and fails independently, so one service cannot take down another
- **Independent scaling** — Lambda scales per function based on its own demand
- **Zero database administration** — DynamoDB is fully managed, no patching or schema migrations
- **Deploy as code** — AWS SAM defines the infrastructure; CI/CD deploys via GitHub OIDC
- **Lower operational cost** — Lambda charges per invocation, no idle server cost

---

# Section 2 — Technical Documentation

## 2.1 System Architecture

The application follows a serverless pattern. A React/Vite single-page app is
hosted on a private S3 bucket behind CloudFront and talks to Amazon API Gateway.
Each endpoint invokes an independent Python Lambda that reads from or writes to a
DynamoDB table. Infrastructure is defined and deployed as code with AWS SAM.

**What this repository implements and deploys:**

```
┌────────────────────────────────────────────────────────────────┐
│                          AWS Cloud                             │
│                                                                │
│  Browser ──►  CloudFront ──►  S3 (private, OAC)  [React/Vite]  │
│                   │                                            │
│                   ▼                                            │
│          Amazon API Gateway — BikeAPI (REST, CORS)             │
│          ┌───────────────────────────────┐                     │
│          │  GET  /get_products           │  ── public          │
│          │  POST /orders                 │  ── public          │
│          └───────────────┬───────────────┘                     │
│                          │                                     │
│        ┌─────────────────┴─────────────────┐                   │
│        ▼                                   ▼                   │
│   GetProducts Lambda                  CreateOrder Lambda        │
│        │                                   │                   │
│   DynamoDB: Products                 DynamoDB: Orders           │
│                                                                │
│  Amazon Cognito — User Pool + App Client (provisioned)         │
└────────────────────────────────────────────────────────────────┘
```

Each Lambda has its own least-privilege IAM role (Products = DynamoDB read;
Orders = DynamoDB write). A Cognito User Pool and app client are provisioned by
the template for future authenticated endpoints; the current endpoints are
public.

> **Scope note.** Sections 2.3 onward marked *(planned)* describe the intended
> full design (order history, an inventory-report pipeline with Step Functions
> and SNS/SES, Cognito-protected endpoints, X-Ray tracing). Those are **not**
> implemented in this repository — the code here is the Products and Orders
> services plus the frontend and its hosting infrastructure.

## 2.2 Tech Stack

Implemented in this repository:

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 19 + Vite + JavaScript | Product catalog and order form (SPA) |
| API Layer | Amazon API Gateway (REST) | BikeAPI — single entry point with CORS |
| Compute | AWS Lambda (Python 3.12) | One function per endpoint — GetProducts, CreateOrder |
| Database | Amazon DynamoDB | Products and Orders tables |
| Hosting | Amazon S3 + CloudFront | Private bucket (OAC) fronted by CloudFront |
| Auth (provisioned) | Amazon Cognito | User Pool + app client defined for future protected endpoints |
| IaC | AWS SAM (`template.yaml`) | Infrastructure defined and deployed as code |
| CI/CD | GitHub Actions + OIDC | Lint/test gate; guarded, manual deploy (no static keys) |
| Testing | Vitest | React component unit tests |

Planned (see roadmap, not in this repo): order history endpoints, an inventory
report pipeline (Step Functions + SNS/SES), Cognito-protected endpoints, and
X-Ray tracing.

## 2.3 Services — Detailed Design (implemented)

### Products Service — `GET /get_products`

| | |
|---|---|
| Handler | `handlers/get_products/get_products.py` |
| Endpoint | `GET /get_products` |
| Auth | None — public endpoint |
| DynamoDB Table | `Products` — partition key: `id` (String) |
| Attributes | `id`, `product_name`, `description`, `price`, `inventory_count`, `image_url` |
| Response | `{ "products": [...], "count": N }` |
| CORS | `Access-Control-Allow-Origin: *` in Lambda return |

The handler scans the Products table (paginating on `LastEvaluatedKey`) and
serializes DynamoDB `Decimal` values to JSON numbers. See
`handlers/get_products/get_products.py` for the implementation.

### Orders Service — `POST /orders`

| | |
|---|---|
| Handler | `handlers/create_order/create_order.py` |
| Endpoint | `POST /orders` |
| Auth | None — public endpoint |
| DynamoDB Table | `Orders` — partition key: `id` (String) |
| Design | `order_items` stored as a DynamoDB List attribute — one document per order, no relational join |
| Order ID | `uuid.uuid4()` — returned to the frontend on creation |
| CORS | API Gateway `Cors` config (OPTIONS preflight) + Lambda headers |

The handler accepts a `{ product_name: { id, quantity, price } }` map, filters
zero-quantity items, computes the total, and writes one order document:

```json
{
    "id": "uuid-generated-order-id",
    "total_amount": "393.00",
    "order_date_time": "2026-09-05T13:00:00+00:00",
    "order_items": [
        { "product_name": "wheel", "product_id": "8", "quantity": "2", "amount": "358.00" },
        { "product_name": "chain", "product_id": "4", "quantity": "1", "amount": "35.00"  }
    ]
}
```

## 2.4 Authentication — Amazon Cognito (provisioned, not yet enforced)

The SAM template provisions a Cognito User Pool and app client so protected
endpoints can be added later. The current endpoints (`GET /get_products`,
`POST /orders`) are public, and the frontend does not yet implement a sign-in
flow. Enforcing Cognito on employee-only endpoints (e.g. order history and the
inventory report) is part of the roadmap below.

| | |
|---|---|
| Public endpoints (implemented) | `GET /get_products` · `POST /orders` |
| Planned protected endpoints | `GET /orders` · `GET /orders/{id}` · `POST /create-report` |

## 2.5 CORS Configuration

Two-layer CORS is required because browsers send an OPTIONS preflight request before POST requests to a different origin.

| Layer | What it handles |
|---|---|
| Lambda return headers | Actual GET and POST responses — set on each Lambda handler |
| BikeAPI SAM `Cors:` block | OPTIONS preflight responses — required for `POST /orders` |

```yaml
# SAM template — BikeAPI resource
BikeAPI:
  Type: AWS::Serverless::Api
  Properties:
    StageName: Prod
    Cors:
      AllowMethods: "'GET,POST,PUT,DELETE,OPTIONS'"
      AllowHeaders: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
      AllowOrigin: "'*'"
```

## 2.6 Observability

Lambda functions log to Amazon CloudWatch Logs by default, which is how the
deployed CreateOrder import error was diagnosed during this work. AWS X-Ray
distributed tracing is part of the roadmap and is not enabled in this template.

## 2.7 Architecture Decision Records (Summary)

| Decision | Choice Made | Rationale |
|---|---|---|
| Compute | Lambda per endpoint | Independent deploy and scaling; fault isolation per function |
| Database | DynamoDB over RDS | No schema management; order stored as one document with an `order_items` list instead of a relational join |
| IaC | AWS SAM | Native to the serverless stack; `sam build` + `sam deploy` is the whole workflow |
| Frontend hosting | Private S3 + CloudFront (OAC) | Bucket stays private; CloudFront serves the SPA over HTTPS with SPA error routing |
| CORS approach | Two-layer (Lambda + API GW) | Lambda headers handle responses; the API Gateway `Cors` block handles OPTIONS preflight for POST |
| CI/CD auth | GitHub OIDC | Short-lived credentials, no long-lived AWS keys stored in GitHub |

---

# Section 3 — README

## 3.1 Repository Structure

```
pedalworks-serverless-microservices/
├── bike-app/                            # React/Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Products.jsx             # GET /get_products + POST /orders
│   │   │   ├── Services.jsx             # Static services listing
│   │   │   └── Sidebar.jsx              # Store info / banner controls
│   │   ├── App.jsx                      # Root component
│   │   └── __tests__/                   # Vitest unit tests
│   ├── .env.example
│   ├── eslint.config.js                 # ESLint 9 flat config
│   ├── vite.config.js
│   └── package.json
│
├── backend/
│   ├── sam-app/
│   │   ├── template.yaml                # AWS infrastructure as code (SAM)
│   │   ├── samconfig.toml               # SAM deploy configuration
│   │   ├── seed_products.py             # Seeds the DynamoDB Products table
│   │   └── handlers/
│   │       ├── get_products/            # Lambda: GET /get_products
│   │       └── create_order/            # Lambda: POST /orders
│   ├── oidc/
│   │   └── github-deploy-role.yaml      # GitHub OIDC deploy role (IaC)
│   └── utils/
│       ├── create_products/             # Alternate product seed util
│       └── s3/                          # Creates an S3 image bucket
│
├── .github/workflows/
│   ├── ci.yml                           # Lint + test + template validation
│   └── deploy.yml                       # Guarded manual deploy (OIDC)
│
└── docs/                                # Screenshots and notes
```

## 3.2 Prerequisites

| Tool | Version | Verify |
|---|---|---|
| AWS CLI v2 | 2.x | `aws --version` |
| AWS SAM CLI | Latest | `sam --version` |
| Python | 3.12 | `python --version` |
| Node.js | 18.x or 20.x | `node --version` |
| npm | 9.x or 10.x | `npm --version` |

```bash
aws configure       # set AWS Access Key ID, Secret, Region (us-east-1), output format (json)
aws sts get-caller-identity   # confirm connected to your account
```

## 3.3 Deploy Infrastructure

There are two ways to deploy: the automated GitHub Actions pipeline
(recommended) or a manual SAM deploy from your machine.

### 3.3.1 Automated deploy — GitHub Actions (recommended)

Deployment runs through `.github/workflows/deploy.yml`, which authenticates to
AWS with GitHub OIDC (no long-lived access keys). It builds and deploys the SAM
backend, seeds products, builds the React frontend, syncs it to S3, and
invalidates CloudFront.

The workflow is **manual and guarded** by design:

- It runs only via **Actions → Deploy PedalWorks → Run workflow**, and you must
  type `deploy` to confirm.
- It deploys to a dedicated **`pedalworks-app`** stack (override with the
  `DEPLOY_STACK_NAME` repository variable). It refuses to target the live
  `pedalworks-fixed` stack, so a mismatched template cannot delete live
  resources.
- A change-set preview step logs the planned changes before they are applied.

**One-time setup:**

1. Deploy the OIDC deploy role (defined as code):

   ```bash
   aws cloudformation deploy \
     --template-file backend/oidc/github-deploy-role.yaml \
     --stack-name pedalworks-github-oidc \
     --capabilities CAPABILITY_NAMED_IAM \
     --region us-east-1
   ```

2. Copy the role ARN from the stack output:

   ```bash
   aws cloudformation describe-stacks \
     --stack-name pedalworks-github-oidc \
     --region us-east-1 \
     --query "Stacks[0].Outputs[?OutputKey=='DeployRoleArn'].OutputValue" \
     --output text
   ```

3. In the repo, go to **Settings → Secrets and variables → Actions** and add a
   secret named `AWS_ROLE_ARN` set to that ARN. Optionally add the
   `DEPLOY_STACK_NAME` and `VITE_APP_S3_BUCKET_URL` variables.

See `backend/oidc/README.md` for details on the role and its scope.

### 3.3.2 Manual deploy — AWS SAM CLI

**1. Clone the repository**

```bash
git clone https://github.com/emmanuelfornah/pedalworks-serverless-microservices.git
cd pedalworks-serverless-microservices
```

**2. First deploy — guided setup**

```bash
cd backend/sam-app
sam build
sam deploy --guided

# Answer the prompts:
# Stack Name:                    pedalworks-app   (use a dedicated stack, not pedalworks-fixed)
# AWS Region:                    us-east-1
# Confirm changes before deploy: y
# Allow SAM CLI IAM role:        y
# Save arguments to file:        y  (creates samconfig.toml)
```

**3. Subsequent deploys — one command**

```bash
sam build
sam deploy --config-file samconfig.toml
```

**4. Copy the Outputs — you need these for `.env`**

```
# After sam deploy, copy these output values:
MicroserviceApi         → VITE_API_GATEWAY_URL
CognitoUserPoolClientId → VITE_CLIENT_ID
CognitoUserPoolDomain   → VITE_COGNITO_AUTH_URL (add https:// prefix)
```

## 3.4 Seed Data

The deploy pipeline seeds products automatically. To seed manually:

```bash
# From the SAM app (matches what CI runs)
cd backend/sam-app && python seed_products.py

# Or via the standalone util
cd backend/utils/create_products && python create_products.py

# Create a public S3 bucket for product images (optional)
cd backend/utils/s3 && python create_images_bucket.py
```

## 3.5 Configure and Run Frontend

```bash
cd bike-app
cp .env.example .env

# Edit .env — paste values from the sam deploy output:
VITE_API_GATEWAY_URL=https://UNIQUE-ID.execute-api.us-east-1.amazonaws.com/Prod
VITE_APP_S3_BUCKET_URL=https://your-images-bucket.s3.us-east-1.amazonaws.com

npm install
npm run dev        # starts at http://localhost:5173
```

If `VITE_APP_S3_BUCKET_URL` is omitted, the app falls back to the local
`public/images` directory, so it runs without any S3 bucket.

## 3.6 API Reference

Implemented endpoints:

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/get_products` | None | Returns the product catalog as `{ products, count }` |
| `POST` | `/orders` | None | Creates an order — returns `order_id` and `total_amount` |

**Sample Requests**

```bash
# Get products
curl https://{api-id}.execute-api.us-east-1.amazonaws.com/Prod/get_products/

# Create order
curl -X POST https://{api-id}.execute-api.us-east-1.amazonaws.com/Prod/orders \
  -H "Content-Type: application/json" \
  -d '{"wheel": {"id": 8, "quantity": 2, "price": "179.00"}}'
```

## 3.7 Running Tests

```bash
cd bike-app
npm run test                    # run all Vitest unit tests
npm run test -- --coverage      # with coverage report
npm run lint                    # ESLint check
```

## 3.8 Common Errors

| Error | Cause | Fix |
|---|---|---|
| CORS error on `POST /orders` | Missing API Gateway CORS config | Ensure the `Cors:` block exists on BikeAPI in `template.yaml` |
| `POST /orders` returns 502 | Lambda import/runtime error | Check the function's CloudWatch logs for the traceback |
| Products not displaying | Wrong `VITE_API_GATEWAY_URL` in `.env` | Copy the URL from the `sam deploy` `MicroserviceApi` output |
| Images not loading | Wrong or unset `VITE_APP_S3_BUCKET_URL` | Set the bucket URL, or unset it to use `public/images` locally |

## 3.9 Roadmap

The following are designed but not yet implemented in this repository:

- **Order history** — `GET /orders` and `GET /orders/{id}` with matching
  frontend views
- **Cognito-protected endpoints** — enforce the provisioned User Pool on
  employee-only routes and add a sign-in flow
- **Inventory report pipeline** — `POST /create-report` orchestrated by AWS
  Step Functions, delivering an S3 report via SNS/SES
- **X-Ray tracing** — distributed tracing across API Gateway, Lambda, and
  DynamoDB
- **Backend unit tests** — pytest + moto for the Lambda handlers

---

## Author

**Emmanuel Fornah**

| | |
|---|---|
| 🏅 Certifications | AWS CCP · AI Practitioner · Terraform Associate |

[GitHub](https://github.com/emmanuelfornah)

## License

MIT
