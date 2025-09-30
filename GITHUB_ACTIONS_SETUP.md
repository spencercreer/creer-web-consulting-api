# GitHub Actions Setup Guide

Automated deployment for the backend API when changes are merged to main.

## Overview

When you push to the `main` branch, GitHub Actions will automatically:
1. Install Lambda dependencies
2. Package the Lambda function
3. Upload to S3
4. Deploy/update CloudFormation stack
5. Update Lambda function code
6. Test the API endpoint

## Prerequisites

- GitHub repository created
- AWS account with appropriate permissions
- AWS IAM user with programmatic access

## Step 1: Create AWS IAM User for GitHub Actions

### 1.1 Create IAM User

```bash
aws iam create-user --user-name github-actions-deployer
```

### 1.2 Create IAM Policy

Save this as `github-actions-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:*",
        "lambda:*",
        "apigateway:*",
        "dynamodb:*",
        "ses:*",
        "iam:GetRole",
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:PutRolePolicy",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:DeleteRolePolicy",
        "iam:PassRole",
        "logs:*",
        "s3:*"
      ],
      "Resource": "*"
    }
  ]
}
```

Create the policy:
```bash
aws iam create-policy \
  --policy-name GitHubActionsDeployPolicy \
  --policy-document file://github-actions-policy.json
```

### 1.3 Attach Policy to User

```bash
aws iam attach-user-policy \
  --user-name github-actions-deployer \
  --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/GitHubActionsDeployPolicy
```

Replace `YOUR_ACCOUNT_ID` with your AWS account ID.

### 1.4 Create Access Keys

```bash
aws iam create-access-key --user-name github-actions-deployer
```

**Save the output!** You'll need:
- `AccessKeyId`
- `SecretAccessKey`

## Step 2: Create GitHub Repository

### 2.1 Initialize Git (if not already done)

```bash
cd /Users/screer8203/Documents/2-Misc/creer-web-consulting-api
git remote add origin https://github.com/YOUR_USERNAME/creer-web-consulting-api.git
```

### 2.2 Push to GitHub

```bash
git branch -M main
git push -u origin main
```

## Step 3: Configure GitHub Secrets

Go to your GitHub repository:
1. Click **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**

Add these secrets:

### Required Secrets

| Secret Name | Value | Description |
|------------|-------|-------------|
| `AWS_ACCESS_KEY_ID` | Your access key ID | From Step 1.4 |
| `AWS_SECRET_ACCESS_KEY` | Your secret access key | From Step 1.4 |
| `SENDER_EMAIL` | spencercreer@gmail.com | Email to send from (must be verified in SES) |
| `RECIPIENT_EMAIL` | spencercreer@gmail.com | Email to receive form submissions |
| `CORS_ORIGIN` | https://creerwebconsulting.com | Your frontend domain (or `*` for development) |

### How to Add Secrets

For each secret:
1. Click **New repository secret**
2. Enter the **Name** (e.g., `AWS_ACCESS_KEY_ID`)
3. Enter the **Secret** (the actual value)
4. Click **Add secret**

## Step 4: Test the Workflow

### 4.1 Manual Trigger

1. Go to **Actions** tab in your GitHub repository
2. Click on **Deploy to AWS** workflow
3. Click **Run workflow** → **Run workflow**
4. Watch the deployment progress

### 4.2 Automatic Trigger

Make a change and push to main:

```bash
# Make a change (e.g., update README)
echo "# Test" >> README.md
git add README.md
git commit -m "Test CI/CD"
git push origin main
```

The workflow will automatically run!

## Step 5: Monitor Deployments

### View Workflow Runs

1. Go to **Actions** tab
2. Click on a workflow run to see details
3. Click on the **deploy** job to see logs

### Deployment Summary

After each successful deployment, you'll see:
- ✅ API Endpoint URL
- ✅ Stack Name
- ✅ Deployment timestamp

## Workflow Features

### ✅ What It Does

- **Automated Deployment** - Deploys on every push to main
- **Dependency Caching** - Faster builds with npm cache
- **Error Handling** - Fails gracefully with clear error messages
- **API Testing** - Tests endpoint after deployment
- **Deployment Summary** - Shows key info in GitHub UI
- **Manual Trigger** - Can trigger manually via GitHub UI

### 🔒 Security

- Uses GitHub Secrets for sensitive data
- IAM user has minimal required permissions
- No secrets exposed in logs
- Secure credential handling via AWS Actions

## Troubleshooting

### Workflow Fails on First Run

**Problem:** Stack doesn't exist yet

**Solution:** Run manual deployment first:
```bash
./scripts/deploy.sh
```

Then subsequent GitHub Actions runs will update the existing stack.

### Permission Denied Errors

**Problem:** IAM user lacks permissions

**Solution:** 
1. Check IAM policy is attached correctly
2. Verify policy includes all required actions
3. Check CloudFormation stack name matches

### SES Email Not Verified

**Problem:** Email sending fails

**Solution:**
```bash
aws ses verify-email-identity --email-address spencercreer@gmail.com
```

Check your email and click verification link.

### CORS Errors After Deployment

**Problem:** Frontend can't access API

**Solution:**
1. Update `CORS_ORIGIN` secret in GitHub
2. Re-run workflow or push a new commit

## Advanced Configuration

### Deploy to Multiple Environments

Create separate workflows for staging/production:

```yaml
# .github/workflows/deploy-staging.yml
on:
  push:
    branches:
      - develop

env:
  STACK_NAME: creer-web-consulting-api-staging
  S3_BUCKET: creer-web-consulting-lambda-staging
```

### Add Approval Step for Production

```yaml
jobs:
  deploy:
    environment:
      name: production
      url: ${{ steps.get-endpoint.outputs.endpoint }}
    # ... rest of job
```

Then configure environment protection rules in GitHub Settings.

### Slack Notifications

Add to workflow:

```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## Best Practices

1. **Branch Protection**
   - Require pull request reviews before merging to main
   - Require status checks to pass

2. **Environment Variables**
   - Use different stacks for staging/production
   - Never commit secrets to repository

3. **Testing**
   - Add unit tests for Lambda function
   - Run tests in CI before deployment

4. **Monitoring**
   - Set up CloudWatch alarms
   - Monitor deployment success rate
   - Track API errors

5. **Rollback Strategy**
   - Keep previous Lambda versions
   - Use CloudFormation change sets for review
   - Have manual rollback procedure documented

## Next Steps

1. ✅ Set up GitHub repository
2. ✅ Configure secrets
3. ✅ Test manual workflow trigger
4. ✅ Make a test commit to trigger automatic deployment
5. ⬜ Set up branch protection rules
6. ⬜ Add staging environment
7. ⬜ Configure CloudWatch alarms

**Note:** Frontend deployment is handled separately by AWS Amplify.

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS CloudFormation Documentation](https://docs.aws.amazon.com/cloudformation/)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)

## Support

For issues with GitHub Actions:
- Check workflow logs in Actions tab
- Review this guide's troubleshooting section
- Check AWS CloudFormation events in AWS Console
