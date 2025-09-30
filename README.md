# Creer Web Consulting API

Backend API for CreerWebConsulting website contact form.

## Architecture

- **API Gateway**: REST API endpoint for contact form submissions
- **Lambda**: Processes form data, stores leads, sends emails
- **DynamoDB**: Stores lead information
- **SES**: Sends email notifications
- **CloudFormation**: Infrastructure as Code

## Prerequisites

- AWS CLI configured with credentials
- Node.js 18.x or later
- AWS account with SES verified email

## Project Structure

```
creer-web-consulting-api/
├── src/
│   └── contact-form/
│       ├── index.js           # Lambda handler
│       └── package.json       # Lambda dependencies
├── cloudformation/
│   └── template.yaml          # CloudFormation template
├── scripts/
│   ├── deploy.sh              # Deployment script
│   └── package-lambda.sh      # Package Lambda function
├── .env.example               # Environment variables template
├── .gitignore
└── README.md
```

## Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd creer-web-consulting-api
   ```

2. **Install Lambda dependencies**
   ```bash
   cd src/contact-form
   npm install
   cd ../..
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

4. **Verify SES email**
   ```bash
   aws ses verify-email-identity --email-address spencercreer@gmail.com
   # Check your email and click the verification link
   ```

5. **Deploy the stack**
   ```bash
   chmod +x scripts/deploy.sh
   ./scripts/deploy.sh
   ```

## Environment Variables

- `SENDER_EMAIL`: Email address to send from (must be verified in SES)
- `RECIPIENT_EMAIL`: Email address to receive contact form submissions
- `CORS_ORIGIN`: Frontend URL for CORS (e.g., https://creerwebconsulting.com)

## API Endpoint

After deployment, you'll get an API endpoint:
```
POST https://{api-id}.execute-api.{region}.amazonaws.com/prod/contact
```

### Request Body
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "(602) 555-1234",
  "subject": "Web Development Inquiry",
  "message": "I need a website for my business..."
}
```

### Response
```json
{
  "success": true,
  "message": "Thank you for contacting us. We'll get back to you soon!",
  "leadId": "uuid-here"
}
```

## Development

### Local Testing
```bash
cd src/contact-form
npm test
```

### View Logs
```bash
aws logs tail /aws/lambda/ContactFormFunction --follow
```

### View Leads in DynamoDB
```bash
aws dynamodb scan --table-name ContactLeads
```

## Deployment

The deployment script will:
1. Package the Lambda function with dependencies
2. Upload to S3
3. Deploy/update CloudFormation stack
4. Output the API endpoint URL

## Cost Estimate

- API Gateway: ~$3.50 per million requests
- Lambda: ~$0.20 per million requests
- DynamoDB: ~$0.25/month (on-demand pricing)
- SES: $0.10 per 1,000 emails

**Expected monthly cost for typical contact form usage: $1-2**

## Security

- API Gateway has CORS configured for your domain only
- Lambda has minimal IAM permissions (DynamoDB write, SES send)
- No authentication required (public contact form)
- Rate limiting via API Gateway throttling

## Monitoring

- CloudWatch Logs: Lambda execution logs
- CloudWatch Metrics: API Gateway requests, Lambda errors
- DynamoDB: All leads stored with timestamp

## Future Enhancements

- [ ] Add reCAPTCHA validation
- [ ] Implement rate limiting per IP
- [ ] Add SNS for SMS notifications
- [ ] Create admin dashboard to view leads
- [ ] Add automated follow-up emails
- [ ] Integrate with CRM (HubSpot, Salesforce)
