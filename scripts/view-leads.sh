#!/bin/bash

# View leads from DynamoDB
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Contact Form Leads ===${NC}\n"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

AWS_REGION=${AWS_REGION:-us-east-1}

echo -e "${YELLOW}Fetching leads from DynamoDB...${NC}\n"

aws dynamodb scan \
    --table-name ContactLeads \
    --region $AWS_REGION \
    --output json | jq '.Items[] | {
        leadId: .leadId.S,
        timestamp: .timestamp.S,
        name: .name.S,
        email: .email.S,
        subject: .subject.S,
        status: .status.S,
        emailSent: .emailSent.BOOL
    }'
