#!/bin/bash

# View Lambda function logs
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Viewing Lambda Logs ===${NC}\n"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

AWS_REGION=${AWS_REGION:-us-east-1}

echo -e "${YELLOW}Tailing logs for ContactFormFunction...${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop${NC}\n"

aws logs tail /aws/lambda/ContactFormFunction \
    --follow \
    --format short \
    --region $AWS_REGION
