# Architecture

PedalWorks is a serverless microservices platform. The React frontend talks to
the backend exclusively through Amazon API Gateway; each endpoint is an
independent Lambda function backed by its own DynamoDB table.

## Target architecture (AWS)

```
Customer / Employee
        │
        ▼
Amazon S3 + CloudFront ── React/Vite frontend (static SPA)
        │
        ▼
Amazon API Gateway (BikeAPI, REST)
  ├── GET  /get_products    ──► Lambda (Python 3.12) ──► DynamoDB: Products   (public)
  ├── POST /orders          ──► Lambda (Python 3.12) ──► DynamoDB: Orders     (public)
  ├── GET  /orders          ──► Lambda (Python 3.12) ──► DynamoDB: Orders     (Cognito)
  ├── GET  /orders/{id}     ──► Lambda (Python 3.12) ──► DynamoDB: Orders     (Cognito)
  └── POST /create-report   ──► Lambda (Python 3.12) ──► Step Functions
                                                            ├── GenerateReportData
                                                            ├── GenerateHTML (parallel)
                                                            ├── GeneratePresignedURL
                                                            └── SNS ──► SES ──► email

Amazon Cognito  ── User Pool + Hosted UI (JWT) ── protects employee endpoints
AWS X-Ray       ── active tracing across API Gateway, Lambda, Step Functions
```

> The current repository deploys the **Products** microservice end to end
> (`backend/sam-app`). The Orders and Inventory services follow the same SAM
> pattern and are documented in the original business case (see the root
> README history / `docs/PICTURES.md`).

## Tech stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 19 + Vite | Static SPA |
| Testing | Vitest + React Testing Library | Component/unit tests |
| API | Amazon API Gateway (REST) | Single entry point, CORS, Cognito authorizer |
| Compute | AWS Lambda (Python 3.12) | One function per endpoint |
| Database | Amazon DynamoDB | One table per microservice |
| Auth | Amazon Cognito | User Pool + JWT |
| Workflow | AWS Step Functions + SNS + SES | Inventory report pipeline |
| Storage | Amazon S3 | Product images + static frontend hosting |
| CDN | Amazon CloudFront | Frontend distribution + caching |
| Tracing | AWS X-Ray | Distributed tracing |
| IaC / CI-CD | AWS SAM + GitHub Actions | Infrastructure as code, automated deploys |

## Architecture decision records (summary)

| Decision | Choice | Rationale |
|---|---|---|
| Decomposition | By business capability | Products / Orders / Inventory map to ownership and failure boundaries |
| Database | DynamoDB over RDS | No schema management; Orders+Order_Items join replaced by a list attribute |
| IaC | AWS SAM over Terraform | Native to serverless; `sam build`/`sam deploy`/`sam local` cover the workflow |
| Frontend hosting | S3 + CloudFront | Cheapest, fastest path to a production URL for a static SPA |
| Report pipeline | Step Functions over a single Lambda | Independent retries; parallel branches cut latency; X-Ray traces each step |
| CORS | Two-layer (Lambda + API Gateway) | Lambda headers handle responses; the API Gateway `Cors` block handles preflight |

## Repository layout

```
pedalworks-serverless-microservices/
├── bike-app/                 # React/Vite frontend (apps/web)
│   ├── src/                  # components, tests
│   ├── .env.example          # environment template
│   └── package.json
├── backend/
│   ├── sam-app/              # AWS SAM app — template.yaml + Lambda handlers
│   └── utils/                # data seeding + S3 bucket scripts
├── docs/                     # architecture, deployment, build-log
├── .github/workflows/        # CI + deploy pipelines
└── README.md                 # start here
```
