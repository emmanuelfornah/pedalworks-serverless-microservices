# GitHub Actions OIDC Deploy Role

`github-deploy-role.yaml` provisions the IAM role that the PedalWorks deploy
workflow assumes via GitHub OIDC. No long-lived AWS access keys are stored in
GitHub.

## What it creates

- An IAM role (`GitHubActionsPedalWorksDeploy`) trusted **only** by the
  `emmanuelfornah/pedalworks-serverless-microservices` repository on the branch
  set by `GitHubRefPattern` (default `refs/heads/dev`).
- Permissions scoped to what the pipeline needs: CloudFormation/SAM,
  the SAM artifact bucket, the `pedalworks-app` frontend bucket, and the
  application resources (Lambda, API Gateway, DynamoDB, Cognito, CloudFront),
  plus IAM role management limited to `pedalworks-app*` roles.

The GitHub OIDC provider already exists in the account and is referenced via the
`OIDCProviderArn` parameter (not recreated).

## Deploy the role (one time)

```bash
aws cloudformation deploy \
  --template-file backend/oidc/github-deploy-role.yaml \
  --stack-name pedalworks-github-oidc \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

Get the role ARN:

```bash
aws cloudformation describe-stacks \
  --stack-name pedalworks-github-oidc \
  --region us-east-1 \
  --query "Stacks[0].Outputs[?OutputKey=='DeployRoleArn'].OutputValue" \
  --output text
```

## Wire up GitHub

1. In the repo, go to **Settings -> Secrets and variables -> Actions**.
2. Add a repository **secret** named `AWS_ROLE_ARN` set to the role ARN above.
3. (Optional) Add repository **variables**:
   - `DEPLOY_STACK_NAME` — override the default `pedalworks-app` stack name.
   - `VITE_APP_S3_BUCKET_URL` — product image bucket URL for the frontend build.

Once the secret is set, run the **Deploy PedalWorks** workflow manually
(Actions tab -> Run workflow -> type `deploy`).

## Notes

- To allow deploys from another branch, change `GitHubRefPattern`
  (e.g. `refs/heads/main`, or `refs/heads/*` for any branch).
- The deploy workflow refuses to target the live `pedalworks-fixed` stack, so
  this role and pipeline operate on a separate `pedalworks-app` environment.
