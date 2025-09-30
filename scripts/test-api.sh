#!/bin/bash

# Test script for the Contact Form API
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

STACK_NAME=${STACK_NAME:-creer-web-consulting-api}
AWS_REGION=${AWS_REGION:-us-east-1}

# Get API endpoint from CloudFormation
echo -e "${YELLOW}Getting API endpoint...${NC}"
API_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
    --output text \
    --region $AWS_REGION)

if [ -z "$API_ENDPOINT" ]; then
    echo -e "${RED}Error: Could not get API endpoint${NC}"
    exit 1
fi

echo -e "${GREEN}API Endpoint: $API_ENDPOINT${NC}\n"

# Test 1: Valid request
echo -e "${YELLOW}Test 1: Valid contact form submission${NC}"
curl -X POST $API_ENDPOINT \
    -H 'Content-Type: application/json' \
    -d '{
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "(602) 555-1234",
        "subject": "Test Inquiry",
        "message": "This is a test message from the API test script."
    }' | jq '.'

echo -e "\n"

# Test 2: Invalid email
echo -e "${YELLOW}Test 2: Invalid email (should fail)${NC}"
curl -X POST $API_ENDPOINT \
    -H 'Content-Type: application/json' \
    -d '{
        "name": "Jane Doe",
        "email": "invalid-email",
        "subject": "Test",
        "message": "This should fail validation."
    }' | jq '.'

echo -e "\n"

# Test 3: Missing required fields
echo -e "${YELLOW}Test 3: Missing required fields (should fail)${NC}"
curl -X POST $API_ENDPOINT \
    -H 'Content-Type: application/json' \
    -d '{
        "name": "Test"
    }' | jq '.'

echo -e "\n${GREEN}Tests complete!${NC}"
