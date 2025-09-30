#!/bin/bash

# Deployment script for Creer Web Consulting API
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Creer Web Consulting API Deployment ===${NC}\n"

# Load environment variables
if [ -f .env ]; then
    echo -e "${YELLOW}Loading environment variables...${NC}"
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${RED}Error: .env file not found${NC}"
    echo "Please create a .env file based on .env.example"
    exit 1
fi

# Set defaults if not provided
AWS_REGION=${AWS_REGION:-us-east-1}
STACK_NAME=${STACK_NAME:-creer-web-consulting-api}
S3_BUCKET=${S3_BUCKET:-creer-web-consulting-lambda-deployments}

echo -e "${YELLOW}Configuration:${NC}"
echo "  AWS Region: $AWS_REGION"
echo "  Stack Name: $STACK_NAME"
echo "  S3 Bucket: $S3_BUCKET"
echo "  Sender Email: $SENDER_EMAIL"
echo "  Recipient Email: $RECIPIENT_EMAIL"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    exit 1
fi

# Check if S3 bucket exists, create if not
echo -e "${YELLOW}Checking S3 bucket...${NC}"
if ! aws s3 ls "s3://$S3_BUCKET" 2>&1 > /dev/null; then
    echo -e "${YELLOW}Creating S3 bucket: $S3_BUCKET${NC}"
    aws s3 mb "s3://$S3_BUCKET" --region $AWS_REGION
else
    echo -e "${GREEN}S3 bucket exists${NC}"
fi

# Install Lambda dependencies
echo -e "\n${YELLOW}Installing Lambda dependencies...${NC}"
cd src/contact-form
npm install --production
cd ../..

# Package Lambda function
echo -e "\n${YELLOW}Packaging Lambda function...${NC}"
cd src/contact-form
zip -r ../../deployment-package.zip . -x "*.git*" "test.js"
cd ../..

# Upload to S3
echo -e "\n${YELLOW}Uploading Lambda package to S3...${NC}"
aws s3 cp deployment-package.zip "s3://$S3_BUCKET/contact-form-lambda.zip"

# Deploy CloudFormation stack
echo -e "\n${YELLOW}Deploying CloudFormation stack...${NC}"
aws cloudformation deploy \
    --template-file cloudformation/template.yaml \
    --stack-name $STACK_NAME \
    --parameter-overrides \
        SenderEmail=$SENDER_EMAIL \
        RecipientEmail=$RECIPIENT_EMAIL \
        CorsOrigin=$CORS_ORIGIN \
    --capabilities CAPABILITY_NAMED_IAM \
    --region $AWS_REGION

# Update Lambda function code
echo -e "\n${YELLOW}Updating Lambda function code...${NC}"
aws lambda update-function-code \
    --function-name ContactFormFunction \
    --s3-bucket $S3_BUCKET \
    --s3-key contact-form-lambda.zip \
    --region $AWS_REGION

# Wait for Lambda update to complete
echo -e "${YELLOW}Waiting for Lambda update to complete...${NC}"
aws lambda wait function-updated \
    --function-name ContactFormFunction \
    --region $AWS_REGION

# Get API endpoint
echo -e "\n${GREEN}=== Deployment Complete ===${NC}\n"
API_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
    --output text \
    --region $AWS_REGION)

echo -e "${GREEN}API Endpoint:${NC} $API_ENDPOINT"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Verify your sender email in SES:"
echo "   aws ses verify-email-identity --email-address $SENDER_EMAIL"
echo ""
echo "2. Update your frontend .env file with:"
echo "   REACT_APP_API_ENDPOINT=$API_ENDPOINT"
echo ""
echo "3. Test the API:"
echo "   curl -X POST $API_ENDPOINT \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"name\":\"Test\",\"email\":\"test@example.com\",\"subject\":\"Test\",\"message\":\"Test message\"}'"
echo ""

# Cleanup
rm -f deployment-package.zip

echo -e "${GREEN}Done!${NC}"
