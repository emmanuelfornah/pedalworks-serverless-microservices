# PedalWorks Frontend (`bike-app`)

The customer-facing single-page app for PedalWorks, built with **React 19 +
Vite**. It renders the product catalog from the serverless backend and submits
orders through Amazon API Gateway.

## Develop

```bash
cp .env.example .env   # set VITE_API_GATEWAY_URL and VITE_APP_S3_BUCKET_URL
npm install
npm run dev            # http://localhost:8081
```

### Environment variables (`.env`)

| Variable | Description |
|---|---|
| `VITE_API_GATEWAY_URL` | Base URL of the deployed API (`sam deploy` `MicroserviceApi` output) |
| `VITE_APP_S3_BUCKET_URL` | Public URL of the product-images S3 bucket |

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run lint` | ESLint (flat config) |
| `npm run test` | Vitest with coverage |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |

## Deploy

The app is deployed to **S3 + CloudFront** by the
[`Deploy Frontend`](../.github/workflows/deploy-frontend.yml) GitHub Actions
workflow. See [`docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md) for setup.

## Structure

```
src/
├── components/   # Products, Services, Sidebar
├── __tests__/    # Vitest unit/integration tests
├── App.jsx       # root component
└── main.jsx      # entry point
```
