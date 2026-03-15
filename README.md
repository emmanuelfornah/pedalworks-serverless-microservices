# 🚲 AnyCompany Bicycle Parts — Serverless E-Commerce Platform

A full-stack serverless e-commerce application for a bicycle parts retailer, built on AWS using a microservices architecture. The platform enables customers to browse products, place orders, and allows employees to view order history and generate inventory reports — all powered by serverless infrastructure defined as code.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              AWS Cloud                                  │
│                                                                         │
│  ┌──────────┐    ┌──────────────┐    ┌──────────┐    ┌──────────────┐  │
│  │  React   │───▶│ API Gateway  │───▶│  Lambda  │───▶│   DynamoDB   │  │
│  │   SPA    │    │  (REST API)  │    │ Functions│    │    Tables    │  │
│  └──────────┘    └──────────────┘    └──────────┘    └──────────────┘  │
│       │               │                   │                            │
│       │               │              ┌────┴─────┐                      │
│       ▼               ▼              ▼          ▼                      │
│  ┌──────────┐   ┌──────────┐   ┌─────────┐ ┌────────┐                 │
│  │Amazon S3 │   │ Cognito  │   │  Step   │ │  SNS   │                 │
│  │ (Images) │   │  (Auth)  │   │Functions│ │(Email) │                 │
│  └──────────┘   └──────────┘   └─────────┘ └────────┘                 │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  AWS SAM (IaC) │ X-Ray (Tracing) │ CodeCommit (Source Control)  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

## Features

- **Product Catalog** — Browse bicycle parts with images served from S3
- **Order Management** — Place orders and view order history with line-item details
- **Employee Authentication** — Secure login via Amazon Cognito with protected API routes
- **Inventory Reports** — On-demand report generation using Step Functions, delivered via email with presigned S3 URLs
- **Observability** — End-to-end distributed tracing with AWS X-Ray

## Microservices

| Service | Method | Endpoint | Auth | Description |
|---|---|---|---|---|
| GetProducts | `GET` | `/get_products` | Public | Retrieve product catalog |
| CreateOrder | `POST` | `/orders` | Public | Submit a new order |
| GetOrders | `GET` | `/orders` | Cognito | View order history |
| GetOrderDetails | `GET` | `/orders/{order_id}` | Cognito | View order line items |
| CreateReport | `POST` | `/create-report` | Cognito | Trigger inventory report generation |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, JavaScript, Vite, Axios |
| API | Amazon API Gateway (REST) |
| Compute | AWS Lambda (Python 3.12) |
| Database | Amazon DynamoDB |
| Storage | Amazon S3 |
| Auth | Amazon Cognito |
| Orchestration | AWS Step Functions |
| Notifications | Amazon SNS |
| Observability | AWS X-Ray |
| IaC | AWS SAM / CloudFormation |
| Source Control | AWS CodeCommit, GitHub |

## Project Structure

```
microservices/
├── bike-app/                          # React frontend
│   ├── src/
│   │   ├── components/                # Products, Services, Sidebar, OrderHistory, OrderDetails
│   │   ├── __tests__/                 # Unit tests (Vitest)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env                           # API Gateway & S3 URLs (not committed)
│   └── package.json
│
├── backend/
│   ├── sam-app/
│   │   ├── handlers/                  # Lambda functions
│   │   │   ├── get_products/
│   │   │   ├── get_orders/
│   │   │   ├── get_order/
│   │   │   ├── create_order/
│   │   │   ├── create_report/
│   │   │   ├── generate_report_data/
│   │   │   ├── generate_html/
│   │   │   └── generate_presigned_url/
│   │   ├── template.yaml              # SAM template (all infrastructure)
│   │   └── samconfig.toml
│   │
│   └── utils/                         # Data seeding scripts
│       ├── create_products/
│       ├── create_orders/
│       ├── create_inventory/
│       └── s3/
│
└── README.md
```

## How It Works

1. **Customer browses products** → React app calls `GET /get_products` → Lambda scans DynamoDB → returns product data with S3 image URLs
2. **Customer places an order** → React app calls `POST /orders` → Lambda writes order to DynamoDB
3. **Employee logs in** → Cognito authenticates user → returns JWT token stored in browser
4. **Employee views orders** → React app calls `GET /orders` with auth token → API Gateway validates via Cognito authorizer → Lambda returns order data
5. **Employee generates report** → `POST /create-report` triggers Step Functions state machine:
   - `GenerateReportData` → pulls inventory from DynamoDB
   - `GenerateHTML` + `GeneratePresignedURL` run in parallel
   - `TriggerSNS` → emails presigned URL to subscribers

## Deployment

```bash
# Backend
cd backend/sam-app
sam build
sam deploy --guided

# Frontend
cd bike-app
npm install
cp .env.example .env    # configure API Gateway & S3 URLs
npm run dev
```

## Key Design Decisions

| Decision | Rationale |
|---|---|
| Serverless architecture | Zero server management, pay-per-use, auto-scaling |
| DynamoDB over RDS | Schema-flexible NoSQL fits product catalog and order data |
| AWS SAM | Simplified IaC for serverless; deploys directly to CloudFormation |
| Step Functions for reports | Orchestrates multi-step async workflow with parallel execution |
| Cognito implicit grant | Lightweight auth for SPA (production would use authorization code + PKCE) |
| X-Ray tracing | Identifies latency bottlenecks across distributed microservices |

## Author

**Emmanuel Fornah**

## License

MIT
