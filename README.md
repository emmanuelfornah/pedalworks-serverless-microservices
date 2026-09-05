# 🚲 PedalWorks — Serverless Microservices Platform

[![CI](https://github.com/emmanuelfornah/pedalworks-serverless-microservices/actions/workflows/ci.yml/badge.svg)](https://github.com/emmanuelfornah/pedalworks-serverless-microservices/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Emmanuel Fornah** · Dallas, TX · March 2026

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

The monolithic application was decomposed into three independent microservices, each aligned to a distinct business capability. Each microservice owns its own data store, is deployed independently, and scales automatically.

| Microservice | Endpoints | Data Store | Business Use Cases |
|---|---|---|---|
| Products | `GET /get_products` | DynamoDB `Products` | Customer: browse product catalog |
| Orders | `GET /orders` · `GET /orders/{id}` · `POST /orders` | DynamoDB `Orders` | Customer: submit orders · Customer: view order history · Employee: review orders |
| Inventory | `POST /create-report` | DynamoDB `Inventory` | Employee: generate low-inventory email report |

## 1.5 From Monolith to Microservices — Comparison

| Original Monolith (Django + RDS) | Refactored Architecture (Serverless) |
|---|---|
| AWS Elastic Beanstalk | Amazon S3 (React frontend — static hosting) |
| Django MVC monolith (Python) | 3 independent Lambda functions (Python 3.12) |
| Amazon RDS (PostgreSQL / relational) | Amazon DynamoDB (NoSQL — one table per service) |
| Single deployment unit for all features | Independent deploy per microservice via AWS SAM |
| Manual server capacity planning | Automatic Lambda scaling — pay per invocation |
| SQL schema design + migrations required | No schema management — DynamoDB is schemaless |
| Orders + Order_Items relational join | Single Orders DynamoDB document with nested `order_items` list |
| One failure affects all features | Fault isolation — inventory failure cannot affect storefront |

## 1.6 Business Outcomes

- **Fault isolation** — a bug in the inventory report pipeline cannot take down the product catalog or order submission
- **Independent scaling** — the Products service handles peak customer traffic without scaling the inventory service
- **Zero database administration** — DynamoDB is fully managed with no patching, backups, or schema migrations
- **Faster deployments** — each microservice deploys in under 5 minutes via AWS SAM without touching other services
- **Lower operational cost** — Lambda charges only for actual invocations, no idle server costs
- **Developer velocity** — Python developers write function handlers without configuring or maintaining infrastructure

---

# Section 2 — Technical Documentation

## 2.1 System Architecture

The application follows a serverless microservices pattern. The React frontend communicates exclusively through Amazon API Gateway. Each API endpoint invokes an independent Lambda function that reads from or writes to its own DynamoDB table. Authentication is handled by Amazon Cognito. The inventory report pipeline is orchestrated by AWS Step Functions. All services are instrumented with AWS X-Ray for distributed tracing.

```
┌──────────────────────────────────────────────────────────────────────┐
│                           AWS Cloud                                  │
│                                                                      │
│  Customer ──►  Amazon S3 (React/Vite frontend)                       │
│  Employee ──►        │                                               │
│                      ▼                                               │
│             Amazon API Gateway — BikeAPI (REST)                      │
│             ┌────────────────────────────────────┐                   │
│             │  GET  /get_products                 │  ── public        │
│             │  POST /orders                       │  ── public        │
│             │  GET  /orders                       │  ── Cognito auth  │
│             │  GET  /orders/{order_id}            │  ── Cognito auth  │
│             │  POST /create-report                │  ── Cognito auth  │
│             └────────────┬───────────────────────┘                   │
│                          │                                           │
│        ┌─────────────────┼─────────────────┐                         │
│        ▼                 ▼                 ▼                         │
│   GetProducts       CreateOrder       CreateReport                   │
│   Lambda            Lambda            Lambda                         │
│        │                 │                 │                          │
│   DynamoDB          DynamoDB        Step Functions                    │
│   Products          Orders          ├── GenerateReportData           │
│                                     ├── GenerateHTML (parallel)      │
│                                     ├── GeneratePresignedURL         │
│                                     └── SNS ──► SES ──► Email        │
│                                                                      │
│  Amazon Cognito ── User Pool (bike_app) ── Hosted UI                 │
│  AWS X-Ray ─────── Active tracing on all Lambda + Step Functions     │
└──────────────────────────────────────────────────────────────────────┘
```

## 2.2 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 18 + Vite + JavaScript | Customer-facing SPA — product catalog, order form, order history |
| API Layer | Amazon API Gateway (REST) | BikeAPI — single entry point, CORS, Cognito authorizer |
| Compute | AWS Lambda (Python 3.12) | Serverless function per microservice endpoint |
| Database | Amazon DynamoDB | One table per microservice — Products, Orders, Inventory |
| Authentication | Amazon Cognito | User Pool + JWT tokens — protects employee-only endpoints |
| Workflow | AWS Step Functions | Inventory report pipeline — parallel state machine |
| Messaging | Amazon SNS + SES | Email delivery for inventory reports |
| Storage | Amazon S3 | Product images + HTML inventory reports |
| Tracing | AWS X-Ray | Distributed tracing across API Gateway + Lambda + Step Functions |
| IaC | AWS SAM (`template.yaml`) | All infrastructure defined and deployed as code |
| Source Control | AWS CodeCommit + GitHub | Version control and portfolio hosting |
| Testing | Vitest | React component unit tests |

## 2.3 Microservices — Detailed Design

### Products Microservice — `GET /get_products`

| | |
|---|---|
| Handler | `handlers/get_products/get_products.py` |
| Endpoint | `GET /get_products` |
| Auth | None — public endpoint |
| DynamoDB Table | `Products` — partition key: `id` (String) |
| Attributes | `id`, `product_name`, `description`, `price`, `product_group`, `image_url` |
| CORS | `Access-Control-Allow-Origin: *` in Lambda return |
| X-Ray | Active tracing — DynamoDB scan recorded as subsegment |

```python
def lambda_handler(event, context):
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('Products')
    response = table.scan()
    items = response['Items']
    while 'LastEvaluatedKey' in response:
        response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        items.extend(response['Items'])
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        'body': json.dumps(items)
    }
```

### Orders Microservice — `GET /orders` | `GET /orders/{id}` | `POST /orders`

| | |
|---|---|
| Handlers | `get_orders.py` / `get_order.py` / `create_order.py` |
| Auth | `GET /orders` + `GET /orders/{id}`: Cognito JWT required · `POST /orders`: public |
| DynamoDB Table | `Orders` — partition key: `id` (String) |
| Key design decision | `order_items` stored as a DynamoDB List attribute — replaces the Orders + Order_Items relational join from the original RDS schema |
| Order ID | `uuid.uuid4()` — unique per order, returned to frontend on creation |
| CORS | API Gateway BikeAPI Cors config + Lambda headers — handles OPTIONS preflight for POST |

DynamoDB order document structure:

```json
{
    "id": "uuid-generated-order-id",
    "total_amount": "358.00",
    "order_date_time": "2026-03-14T15:22:00Z",
    "order_items": [
        { "product_name": "wheel",  "product_id": "8", "quantity": "2", "amount": "179.00" },
        { "product_name": "chain",  "product_id": "3", "quantity": "1", "amount": "35.00"  }
    ]
}
```

### Inventory Report Microservice — `POST /create-report`

The most complex microservice — triggers an AWS Step Functions state machine that orchestrates four Lambda functions in sequence, with two running in parallel.

**Step Functions State Machine — execution flow:**

```
StartAt: GenerateReportData
  GenerateReportData  ──► queries DynamoDB Inventory table
        │
        ▼
  Parallel state (concurrent branches)
  ├── GenerateHTML          ──► builds HTML report, uploads to S3 report bucket
  └── GeneratePresignedURL  ──► creates 5-minute signed URL for the report
        │
        ▼
  TriggerSNS  ──► publishes presigned URL to SNS topic ──► SES ──► employee email
```

| | |
|---|---|
| Auth | Cognito JWT required — employee-only endpoint |
| Lambda: CreateReport | Starts Step Functions execution — returns `executionArn` immediately (async) |
| Lambda: GenerateReportData | Scans DynamoDB Inventory table — passes data to parallel branch |
| Lambda: GenerateHTML | Builds HTML report from inventory data — uploads to S3 report bucket |
| Lambda: GeneratePresignedURL | Generates S3 presigned URL (300-second expiry) |
| SNS Topic | `EmailReport` — email subscriber confirmed on first deploy |
| Why Parallel state | HTML generation and URL creation are independent — running concurrently cuts end-to-end latency |

## 2.4 Authentication — Amazon Cognito

Amazon Cognito User Pool (`bike_app`) handles employee authentication. The frontend uses the Cognito Hosted UI for sign-in. After successful authentication, the `id_token` is stored in the browser and attached to protected API requests.

```
Employee ──► Cognito Hosted UI ──► Sign in with email + password
          ──► Redirected back with id_token in URL fragment
          ──► Frontend stores token
          ──► API request: Authorization: Bearer <id_token>
          ──► API Gateway CognitoAuthorizer validates token
          ──► Lambda receives verified claims
```

| | |
|---|---|
| Protected endpoints | `GET /orders` · `GET /orders/{id}` · `POST /create-report` |
| Public endpoints | `GET /get_products` · `POST /orders` |

> **Note:** The Implicit Grant flow is used in this implementation. For production, AWS recommends Authorization Code Grant with PKCE for single-page applications. The Implicit Grant exposes tokens in the URL fragment and is used here for demonstration purposes only.

## 2.5 CORS Configuration

Two-layer CORS is required because browsers send an OPTIONS preflight request before POST requests to a different domain.

| Layer | What it handles |
|---|---|
| Lambda return headers | Actual GET and POST responses — required on every Lambda handler |
| BikeAPI SAM `Cors:` block | OPTIONS preflight responses — required for `POST /orders` and `POST /create-report` |

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

## 2.6 Observability — AWS X-Ray

X-Ray active tracing is enabled on all Lambda functions and the Step Functions state machine. The API Gateway Prod stage also has X-Ray tracing enabled. Every request generates a trace showing end-to-end latency from API Gateway through Lambda to DynamoDB.

- **GetProducts trace:** API Gateway → Lambda → DynamoDB scan (~15ms average)
- **CreateOrder trace:** API Gateway → Lambda → DynamoDB write
- **CreateReport trace:** API Gateway → Lambda → Step Functions → 4 Lambda invocations → SNS
- **X-Ray identified a production bug:** `NameError` on `report_dat` (should be `report_data`) in `generate_report_data.py` line 20 — pinpointed without log searching

## 2.7 Architecture Decision Records (Summary)

| Decision | Choice Made | Rationale |
|---|---|---|
| Decomposition strategy | By business capability | Products / Orders / Inventory map to team ownership and failure boundaries |
| Database | DynamoDB over RDS | No SQL experience on team; no schema management; Orders+Order_Items join replaced by DynamoDB list attribute |
| IaC | AWS SAM over Terraform | Native to serverless stack; `sam build` + `sam deploy` = entire workflow; `sam local invoke` for local testing |
| Report pipeline | Step Functions over single Lambda | Independent retry per step; Parallel state reduces latency; X-Ray traces each execution with full history |
| CORS approach | Two-layer (Lambda + API GW) | Lambda headers handle responses; API Gateway Cors block handles OPTIONS preflight for POST |
| Report delivery | S3 presigned URL via SNS | Report bucket stays private; 300-second URL limits exposure; async delivery via SNS |

---

# Section 3 — README

## 3.1 Repository Structure

```
pedalworks/
├── bike-app/                            # React/Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Products.jsx             # GET /get_products → renders catalog
│   │   │   ├── Services.jsx             # Static services listing
│   │   │   ├── Sidebar.jsx              # Navigation
│   │   │   ├── OrderHistory.jsx         # GET /orders (Cognito auth)
│   │   │   └── OrderDetails.jsx         # GET /orders/{id} (Cognito auth)
│   │   └── App.jsx                      # Root + Cognito auth flow
│   ├── src/__tests__/                   # Vitest unit tests
│   ├── .env.example                     # Environment variable template
│   ├── vite.config.js
│   └── package.json
│
├── backend/
│   ├── sam-app/
│   │   ├── template.yaml                # All AWS infrastructure as code
│   │   ├── samconfig.toml               # Saved SAM deploy configuration
│   │   └── handlers/
│   │       ├── get_products/            # Lambda: GET /get_products
│   │       ├── get_orders/              # Lambda: GET /orders
│   │       ├── get_order/               # Lambda: GET /orders/{order_id}
│   │       ├── create_order/            # Lambda: POST /orders
│   │       ├── create_report/           # Lambda: POST /create-report
│   │       ├── generate_report_data/    # Step Functions: query Inventory
│   │       ├── generate_html/           # Step Functions: build HTML report
│   │       └── generate_presigned_url/  # Step Functions: S3 presigned URL
│   └── utils/
│       ├── create_products/             # Seeds DynamoDB Products table
│       ├── create_orders/               # Seeds DynamoDB Orders table
│       ├── create_inventory/            # Seeds DynamoDB Inventory table
│       └── s3/                          # Creates S3 image + report buckets
│
└── docs/
    ├── architecture.png
    ├── xray-service-map.png
    └── architecture-decisions.md
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

```bash
cd backend/utils/create_products  && python create_products.py
cd ../create_orders               && python create_orders.py
cd ../create_inventory            && python create_inventory.py
cd ../s3                          && python create_images_bucket.py
cd ../s3                          && python create_report_bucket.py
```

## 3.5 Configure and Run Frontend

```bash
cd bike-app
cp .env.example .env

# Edit .env — paste values from sam deploy output:
VITE_API_GATEWAY_URL=https://UNIQUE-ID.execute-api.us-east-1.amazonaws.com/Prod
VITE_APP_S3_BUCKET_URL=https://images-ACCOUNT-DATE.s3.us-east-1.amazonaws.com
VITE_COGNITO_AUTH_URL=https://YOUR-PREFIX.auth.us-east-1.amazoncognito.com
VITE_CLIENT_ID=your-cognito-app-client-id
VITE_REDIRECT_URI=http://localhost:5173/

npm install
npm run dev        # starts at http://localhost:5173
```

## 3.6 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/get_products` | None | Returns full product catalog from DynamoDB Products table |
| `POST` | `/orders` | None | Creates a new order — returns `order_id` |
| `GET` | `/orders` | Cognito JWT | Returns all orders (employee: full history) |
| `GET` | `/orders/{order_id}` | Cognito JWT | Returns details for a specific order |
| `POST` | `/create-report` | Cognito JWT | Triggers inventory report state machine — returns `executionArn` |

**Sample Requests**

```bash
# Get products (no auth)
curl https://{api-id}.execute-api.us-east-1.amazonaws.com/Prod/get_products

# Create order (no auth)
curl -X POST https://{api-id}.execute-api.us-east-1.amazonaws.com/Prod/orders \
  -H "Content-Type: application/json" \
  -d '{"wheel": {"id": 8, "quantity": 2, "price": "179.00"}}'

# Get order history (Cognito auth required)
curl https://{api-id}.execute-api.us-east-1.amazonaws.com/Prod/orders \
  -H "Authorization: Bearer {id_token}"

# Trigger inventory report (Cognito auth required)
curl -X POST https://{api-id}.execute-api.us-east-1.amazonaws.com/Prod/create-report \
  -H "Authorization: Bearer {id_token}"
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
| CORS error on `GET /get_products` | Missing headers in Lambda return | Add `Access-Control-Allow-Origin: *` to response |
| CORS error on `POST /orders` | Missing API GW CORS config | Add `Cors:` block to BikeAPI in `template.yaml` |
| `{"message": "Unauthorized"}` | Expired or missing Cognito token | Re-authenticate via Employee Login |
| Products not displaying | Wrong `VITE_API_GATEWAY_URL` in `.env` | Copy URL from `sam deploy` MicroserviceApi output |
| `sam deploy` rollback | `LambdaApplicationRoleSam` not found | Confirm role exists in IAM console |
| State machine fails | `report_dat` typo in `generate_report_data.py` line 20 | Fix to `report_data` — identified via X-Ray Exceptions tab |
| Images not loading | Wrong `VITE_APP_S3_BUCKET_URL` | Check S3 console for bucket name `images-{account}-{date}` |

---

## Author

**Emmanuel Fornah**

| | |
|---|---|
| 🏅 Certifications | AWS CCP · AI Practitioner · Terraform Associate |

[GitHub](https://github.com/emmanuelfornah)

## License

MIT
