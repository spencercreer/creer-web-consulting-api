# Quick Start Guide

Get your contact form API up and running in 10 minutes!

## TL;DR

```bash
# 1. Setup
cd /Users/screer8203/Documents/2-Misc/creer-web-consulting-api
cp .env.example .env
nano .env  # Edit with your values

# 2. Verify email in SES
aws ses verify-email-identity --email-address spencercreer@gmail.com
# Check your email and click verification link

# 3. Deploy
./scripts/deploy.sh

# 4. Copy the API endpoint URL from output

# 5. Update frontend
cd /Users/screer8203/Documents/2-Misc/creer-web-consulting
cp .env.example .env
nano .env  # Add REACT_APP_API_ENDPOINT=<your-api-url>

# 6. Test
npm start
# Go to http://localhost:3000/contact and submit form
```

## What You Get

✅ **Serverless API** - No servers to manage  
✅ **Email Notifications** - Get notified of every submission  
✅ **Lead Storage** - All submissions saved to DynamoDB  
✅ **CORS Configured** - Works with your frontend  
✅ **Error Handling** - Graceful failures with user feedback  
✅ **Cost Effective** - ~$1-2/month  

## Architecture

```
User fills form → Frontend → API Gateway → Lambda → DynamoDB
                                              ↓
                                            SES (Email)
```

## Files Overview

```
creer-web-consulting-api/
├── src/contact-form/index.js       # Lambda function (main logic)
├── cloudformation/template.yaml    # Infrastructure definition
├── scripts/
│   ├── deploy.sh                   # Deploy everything
│   ├── test-api.sh                 # Test the API
│   ├── view-logs.sh                # View Lambda logs
│   └── view-leads.sh               # View submitted leads
├── .env                            # Your configuration
└── README.md                       # Full documentation
```

## Next Steps

1. **Deploy to production**
   - Update CORS_ORIGIN in `.env` to your production domain
   - Redeploy: `./scripts/deploy.sh`

2. **Monitor submissions**
   - View logs: `./scripts/view-logs.sh`
   - View leads: `./scripts/view-leads.sh`

3. **Optional enhancements**
   - Add reCAPTCHA to prevent spam
   - Create admin dashboard to manage leads
   - Integrate with CRM (HubSpot, Salesforce)
   - Add automated follow-up emails

## Support

📖 Full documentation: `README.md`  
🚀 Deployment guide: `DEPLOYMENT_GUIDE.md`  
📧 Questions: spencercreer@gmail.com
