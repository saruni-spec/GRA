#!/bin/bash

# OSINT Business Identification - Test Commands
# Run these commands to test the business scraping endpoints

BASE_URL="http://localhost:3000"

echo "=========================================="
echo "OSINT Business Identification Test Suite"
echo "=========================================="
echo ""

# Test 1: Scrape Hair Salons in Madina
echo "1. Scraping hair salons in Madina, Accra..."
echo ""
curl -X POST "${BASE_URL}/api/v1/osint/scrape" \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Madina, Accra",
    "businessType": "hair salon",
    "source": "GOOGLE_MAPS"
  }' | jq '.'

echo ""
echo "=========================================="
echo ""

# Test 2: Scrape Chop Bars in Kaneshie
echo "2. Scraping chop bars in Kaneshie, Accra..."
echo ""
curl -X POST "${BASE_URL}/api/v1/osint/scrape" \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Kaneshie, Accra",
    "businessType": "chop bar",
    "source": "GOOGLE_MAPS"
  }' | jq '.'

echo ""
echo "=========================================="
echo ""

# Test 3: Scrape Tailor Shops in Kumasi
echo "3. Scraping tailor shops in Kumasi Central..."
echo ""
curl -X POST "${BASE_URL}/api/v1/osint/scrape" \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Kumasi Central",
    "businessType": "tailor shop",
    "source": "GOOGLE_MAPS"
  }' | jq '.'

echo ""
echo "=========================================="
echo ""

# Test 4: Scrape Phone Repair Shops in Osu
echo "4. Scraping phone repair shops in Osu, Accra..."
echo ""
curl -X POST "${BASE_URL}/api/v1/osint/scrape" \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Osu, Accra",
    "businessType": "phone repair",
    "source": "GOOGLE_MAPS"
  }' | jq '.'

echo ""
echo "=========================================="
echo ""

# Test 5: Get All Leads (default filters)
echo "5. Retrieving all leads (confidence >= 0.60)..."
echo ""
curl -X GET "${BASE_URL}/api/v1/osint/leads" | jq '.'

echo ""
echo "=========================================="
echo ""

# Test 6: Get High Confidence Leads Only
echo "6. Retrieving high confidence leads (>= 0.80)..."
echo ""
curl -X GET "${BASE_URL}/api/v1/osint/leads?minConfidence=0.80&limit=20" | jq '.'

echo ""
echo "=========================================="
echo ""

# Test 7: Get Leads with Pagination
echo "7. Retrieving leads with pagination (first 10)..."
echo ""
curl -X GET "${BASE_URL}/api/v1/osint/leads?limit=10&offset=0" | jq '.'

echo ""
echo "=========================================="
echo "Tests Complete!"
echo "=========================================="
