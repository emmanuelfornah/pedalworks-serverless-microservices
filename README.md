# 🚲 PedalWorks — Serverless Microservices Platform

A cloud-native e-commerce platform for a bicycle-parts shop, built as
**serverless microservices on AWS**. The React frontend is hosted as a static
site on **S3 + CloudFront**; the backend is a set of independent
**AWS Lambda** functions behind **Amazon API Gateway**, each backed by its own
**Amazon DynamoDB** table. Infrastructure is defined as code with **AWS SAM**
and shipped through **GitHub Actions** CI/CD.

---

## Why this exists

PedalWorks began as a monolithic Django app on Elastic Beanstalk + RDS. That
design coupled every feature into one deployable unit: a bug in inventory
reporting could take down the storefront, and scaling meant scaling everything.
This project decomposes the monolith into independent services to get fault
isolation, independent scaling, zero database administration, and per-service
deploys.

| Before (monolith) | After (serverless) |
|---|---|
| Elastic Beanstalk + Django | S3/CloudFront + Lambda (Python 3.12) |
| Amazon RDS (SQL) | Amazon DynamoDB (NoSQL, one table per service) |
| Single deployment unit | Independent deploy per service via AWS SAM |
| Manual capacity planning | Automatic scaling — pay per request |
| One failure affects all features | Fault isolation per microservice |

## Architecture

```
Customer / Employee
        │
        ▼
Amazon S3 + CloudFront ── React/Vite frontend (static SPA)
        │
        ▼
Amazon API Gateway (BikeAPI, REST)
  ├── GET  /get_products  ──► Lambda (Python 3.12) ──► DynamoDB: Products  (public)
  ├── POST /orders        ──► Lambda (Python 3.12) ──► DynamoDB: Orders    (public)
  ├── GET  /orders        ──► Lambda (Python 3.12) ──► DynamoDB: Orders    (Cognito)
  ├── GET  /orders/{id}   ──► Lambda (Python 3.12) ──► DynamoDB: Orders    (Cognito)
  └── POST /create-report ──► Lambda (Python 3.12) ──► Step Functions ──► SNS ──► SES

Amazon Cognito ── User Pool + Hosted UI (JWT) protects employee endpoints
AWS X-Ray      ── active tracing across API Gateway, Lambda, Step Functions
```

> The repository currently deploys the **Products** service end to end
> (`backend/sam-app`). Orders and Inventory follow the same SAM pattern.
> See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full design and ADRs.

## Tech stack

React 19 · Vite · Vitest · React Testing Library · AWS Lambda (Python 3.12) ·
API Gateway · DynamoDB · Cognito · Step Functions · SNS/SES · S3 · CloudFront ·
X-Ray · AWS SAM · GitHub Actions

## Repository structure

```
├── bike-app/                 # React/Vite frontend
│   ├── src/                  # components + Vitest tests
│   └── .env.example          # environment template
├── backend/
│   ├── sam-app/              # AWS SAM app — template.yaml + Lambda handlers
│   └── utils/                # data seeding + S3 bucket scripts
├── docs/                     # architecture, deployment, build log
├── .github/workflows/        # CI + deploy pipelines
└── README.md                 # you are here
```

## Quick start (local)

**Prerequisites:** Node.js 20+, Python 3.12, AWS CLI v2, AWS SAM CLI.

```bash
# 1. Frontend
cd bike-app
cp .env.example .env        # set VITE_API_GATEWAY_URL and VITE_APP_S3_BUCKET_URL
npm install
npm run dev                 # http://localhost:8081

# 2. Backend (local API emulation)
cd backend/sam-app
sam build
sam local start-api         # http://localhost:3000

# 3. (First time) deploy backend + seed data — see docs/DEPLOYMENT.md
```

## Testing

```bash
cd bike-app
npm run lint                # ESLint (flat config)
npm run test                # Vitest with coverage
npm run build               # production build
cd ../backend/sam-app && sam validate --lint
```

## CI/CD

- **CI** (`.github/workflows/ci.yml`) — on every PR/push: frontend lint, tests,
  and build; backend Python syntax check and `sam validate --lint`.
- **Deploy Frontend** (`deploy-frontend.yml`) — builds the app and syncs
  `dist/` to S3, then invalidates CloudFront. Triggered on changes to
  `bike-app/` or manually.
- **Deploy Backend** (`deploy-backend.yml`) — `sam build` + `sam deploy`.
  Triggered on changes to `backend/` or manually.

AWS authentication uses **GitHub OIDC** (no long-lived access keys in the repo).
Setup steps, required secrets/variables, and the same-day launch checklist are
in **[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)**.

## Documentation

| Doc | Purpose |
|---|---|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System design, tech stack, ADRs |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | AWS setup, secrets, and deploy steps |
| [`docs/PICTURES.md`](docs/PICTURES.md) | Illustrated build log (TDD + SAM milestones) |
| [`bike-app/README.md`](bike-app/README.md) | Frontend app guide |
| [`backend/sam-app/README.md`](backend/sam-app/README.md) | Backend/SAM guide |

## Author

**Emmanuel Fornah** — AWS CCP · AI Practitioner · Terraform Associate ·
[GitHub](https://github.com/emmanuelfornah)

## License

MIT
