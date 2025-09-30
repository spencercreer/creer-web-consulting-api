# Deployment Guide

Complete step-by-step guide to deploy the Creer Web Consulting Contact Form API.

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
3. **Node.js** 18.x or later
4. **Git** installed

## Step 1: Configure AWS CLI

```bash
aws configure
```

Enter your:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `us-east-1`)
- Default output format (`json`)

## Step 2: Clone and Setup Backend

```bash
cd /Users/screer8203/Documents/2-Misc/creer-web-consulting-api

# Copy environment template
cp .env.example .env

# Edit .env file with your values
nano .env
```

Update these values in `.env`:
```bash
AWS_REGION=us-east-1
SENDER_EMAIL=spencercreer@gmail.com
RECIPIENT_EMAIL=spencercreer@gmail.com
CORS_ORIGIN=http://localhost:3000  # Change to your domain after deployment
STACK_NAME=creer-web-consulting-api
S3_BUCKET=creer-web-consulting-lambda-deployments
```

## Step 3: Verify Email in SES

**Important:** You must verify your sender email in Amazon SES before sending emails.

```bash
# Verify sender email
aws ses verify-email-identity --email-address spencercreer@gmail.com

# Check your email and click the verification link
```

Check verification status:
```bash
aws ses get-identity-verification-attributes \
    --identities spencercreer@gmail.com
```

## Step 4: Install Dependencies

```bash
cd src/contact-form
npm install
cd ../..
```

## Step 5: Deploy the Stack

```bash
# Make scripts executable (if not already)
chmod +x scripts/*.sh

# Run deployment
./scripts/deploy.sh
```

The deployment script will:
1. Create S3 bucket for Lambda deployments
2. Install Lambda dependencies
3. Package Lambda function
4. Upload to S3
5. Deploy CloudFormation stack
6. Update Lambda function code
7. Output the API endpoint URL

## Step 6: Get API Endpoint

After deployment, the script will output your API endpoint:
```
API Endpoint: https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod/contact
```

Copy this URL - you'll need it for the frontend.

## Step 7: Test the API

```bash
# Test with the test script
./scripts/test-api.sh

# Or manually test
curl -X POST https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/prod/contact \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "(602) 555-1234",
    "subject": "Test Subject",
    "message": "This is a test message"
  }'
```

## Step 8: Configure Frontend

```bash
cd /Users/screer8203/Documents/2-Misc/creer-web-consulting

# Create .env file
cp .env.example .env

# Edit .env and add your API endpoint
nano .env
```

Add to `.env`:
```bash
REACT_APP_API_ENDPOINT=https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/prod/contact
```

## Step 9: Test Frontend Locally

```bash
# Start development server
npm start

# Navigate to http://localhost:3000/contact
# Fill out and submit the contact form
```

## Step 10: Update CORS for Production

Once you deploy your frontend to production, update the CORS origin:

```bash
cd /Users/screer8203/Documents/2-Misc/creer-web-consulting-api

# Edit .env
nano .env

# Change CORS_ORIGIN to your production domain
CORS_ORIGIN=https://creerwebconsulting.com

# Redeploy
./scripts/deploy.sh
```

## Monitoring & Debugging

### View Lambda Logs
```bash
./scripts/view-logs.sh
```

### View Submitted Leads
```bash
./scripts/view-leads.sh
```

### View CloudWatch Logs (Web Console)
1. Go to AWS Console → CloudWatch → Log groups
2. Find `/aws/lambda/ContactFormFunction`
3. View recent log streams

### View DynamoDB Table (Web Console)
1. Go to AWS Console → DynamoDB → Tables
2. Find `ContactLeads` table
3. Click "Explore table items"

## Troubleshooting

### Email Not Sending

**Problem:** Emails not being received

**Solutions:**
1. Verify sender email is verified in SES:
   ```bash
   aws ses get-identity-verification-attributes --identities spencercreer@gmail.com
   ```

2. Check if you're in SES Sandbox mode:
   - In sandbox, you can only send to verified emails
   - Request production access: AWS Console → SES → Account dashboard → Request production access

3. Check Lambda logs for errors:
   ```bash
   ./scripts/view-logs.sh
   ```

### CORS Errors

**Problem:** Browser shows CORS error

**Solutions:**
1. Verify CORS_ORIGIN in `.env` matches your frontend URL
2. Redeploy after changing CORS_ORIGIN:
   ```bash
   ./scripts/deploy.sh
   ```

### API Returns 500 Error

**Problem:** API returns Internal Server Error

**Solutions:**
1. Check Lambda logs:
   ```bash
   ./scripts/view-logs.sh
   ```

2. Verify Lambda has correct IAM permissions:
   - DynamoDB: PutItem
   - SES: SendEmail

3. Check environment variables are set correctly

### Deployment Fails

**Problem:** CloudFormation deployment fails

**Solutions:**
1. Check if stack already exists:
   ```bash
   aws cloudformation describe-stacks --stack-name creer-web-consulting-api
   ```

2. Delete and redeploy:
   ```bash
   aws cloudformation delete-stack --stack-name creer-web-consulting-api
   aws cloudformation wait stack-delete-complete --stack-name creer-web-consulting-api
   ./scripts/deploy.sh
   ```

## Cost Optimization

### Expected Costs (Monthly)

- **API Gateway**: $3.50 per million requests (~$0.01 for typical usage)
- **Lambda**: $0.20 per million requests (~$0.01 for typical usage)
- **DynamoDB**: $0.25/month (on-demand, first 25 GB free)
- **SES**: $0.10 per 1,000 emails (~$0.01 for typical usage)
- **S3**: Negligible (< $0.01)

**Total: ~$1-2/month for typical contact form usage**

### Free Tier Benefits

- Lambda: 1M requests/month free
- API Gateway: 1M requests/month free (first 12 months)
- DynamoDB: 25 GB storage free
- SES: 62,000 emails/month free (when sending from EC2)

## Security Best Practices

1. **Enable CloudWatch Alarms**
   - Set up alarms for Lambda errors
   - Monitor API Gateway 4xx/5xx errors

2. **Implement Rate Limiting**
   - Already configured in API Gateway (5 requests/second)
   - Consider adding per-IP rate limiting

3. **Add reCAPTCHA** (Future Enhancement)
   - Prevents spam submissions
   - Add to frontend form

4. **Rotate AWS Credentials**
   - Regularly rotate IAM access keys
   - Use IAM roles when possible

5. **Enable CloudTrail**
   - Track API calls for auditing
   - Monitor for suspicious activity

## Updating the API

### Update Lambda Code Only
```bash
cd src/contact-form
# Make your changes to index.js
cd ../..
./scripts/deploy.sh
```

### Update CloudFormation Template
```bash
# Edit cloudformation/template.yaml
./scripts/deploy.sh
```

### Rollback to Previous Version
```bash
aws cloudformation describe-stack-events \
    --stack-name creer-web-consulting-api \
    --max-items 20

# If needed, delete and redeploy previous version
```

## Production Checklist

Before going live:

- [ ] SES sender email verified
- [ ] SES moved out of sandbox (if needed)
- [ ] CORS_ORIGIN set to production domain
- [ ] Frontend .env updated with production API endpoint
- [ ] Test contact form end-to-end
- [ ] CloudWatch alarms configured
- [ ] Backup/export strategy for DynamoDB leads
- [ ] Documentation updated with production URLs

## Support

For issues or questions:
- Check CloudWatch logs first
- Review this guide's troubleshooting section
- Check AWS service health dashboard
- Contact: spencercreer@gmail.com
