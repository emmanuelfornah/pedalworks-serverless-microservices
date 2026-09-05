# PedalWorks Backend (`sam-app`)

The serverless backend for PedalWorks, defined as an **AWS SAM** application.
`template.yaml` declares a **Lambda** function (Python 3.12), an **API
Gateway** REST endpoint, and a **DynamoDB** table — deployed together as one
CloudFormation stack.

## Prerequisites

- AWS CLI v2 (`aws configure`)
- AWS SAM CLI
- Python 3.12
- Docker (only for `sam build --use-container`)

## Validate, build, and test locally

```bash
sam validate --lint                          # check the template
sam build                                    # package the Lambda code
sam local invoke GetProductsFunction --event events/event.json
sam local start-api                          # serve the API on :3000
curl http://localhost:3000/get_products
```

## Deploy

```bash
sam build
sam deploy --guided        # first deploy (interactive, saves samconfig.toml)
sam deploy                 # subsequent deploys
```

After deploying, copy the outputs for the frontend `.env`:

| Output | Used for |
|---|---|
| `MicroserviceApi` | `VITE_API_GATEWAY_URL` |
| `EndpointForGetProducts` | products endpoint |

Seed the data afterwards — see `../utils/`.

## Logs

```bash
sam logs -n GetProductsFunction --stack-name sam-app --tail
```

## Cleanup

```bash
sam delete --stack-name sam-app
```

## CI/CD

The [`Deploy Backend`](../../.github/workflows/deploy-backend.yml) workflow
runs `sam build` and `sam deploy` on changes to `backend/`. See
[`docs/DEPLOYMENT.md`](../../docs/DEPLOYMENT.md) for AWS/OIDC setup.
