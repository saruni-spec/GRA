# OSINT Business Identification - cURL Test Commands

## Quick Reference

### 1. Scrape Hair Salons in Madina
```bash
curl -X POST http://localhost:4000/api/v1/osint/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Madina, Accra",
    "businessType": "hair salon",
    "source": "GOOGLE_MAPS"
  }'
```

### 2. Scrape Chop Bars in Kaneshie
```bash
curl -X POST http://localhost:3000/api/v1/osint/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Kaneshie, Accra",
    "businessType": "chop bar",
    "source": "GOOGLE_MAPS"
  }'
```

### 3. Scrape Tailor Shops in Kumasi
```bash
curl -X POST http://localhost:3000/api/v1/osint/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Kumasi Central",
    "businessType": "tailor shop",
    "source": "GOOGLE_MAPS"
  }'
```

### 4. Scrape Phone Repair Shops in Osu
```bash
curl -X POST http://localhost:3000/api/v1/osint/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Osu, Accra",
    "businessType": "phone repair",
    "source": "GOOGLE_MAPS"
  }'
```

### 5. Scrape Mechanics in Tema
```bash
curl -X POST http://localhost:3000/api/v1/osint/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Tema",
    "businessType": "mechanic",
    "source": "GOOGLE_MAPS"
  }'
```

---

## Get Leads Endpoints

### 6. Get All Leads (Default: confidence >= 0.60)
```bash
curl -X GET http://localhost:3000/api/v1/osint/leads
```

### 7. Get High Confidence Leads (>= 0.80)
```bash
curl -X GET "http://localhost:3000/api/v1/osint/leads?minConfidence=0.80"
```

### 8. Get Leads with Pagination (First 10)
```bash
curl -X GET "http://localhost:3000/api/v1/osint/leads?limit=10&offset=0"
```

### 9. Get Next Page (Offset 10)
```bash
curl -X GET "http://localhost:3000/api/v1/osint/leads?limit=10&offset=10"
```

### 10. Get Medium Confidence Leads (0.60-0.79)
```bash
curl -X GET "http://localhost:3000/api/v1/osint/leads?minConfidence=0.60&limit=100"
```

---

## Pretty Print with jq

Add `| jq '.'` to any command for formatted JSON output:

```bash
curl -X POST http://localhost:3000/api/v1/osint/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Madina, Accra",
    "businessType": "hair salon",
    "source": "GOOGLE_MAPS"
  }' | jq '.'
```

---

## Run All Tests

Execute the test script:
```bash
./osint_test_commands.sh
```

Or if you don't have jq installed:
```bash
chmod +x osint_test_commands.sh
./osint_test_commands.sh
```

---

## Expected Response Examples

### Scrape Response
```json
{
  "jobId": "job_1732345678000",
  "status": "COMPLETED",
  "leadsFound": 15,
  "duplicatesSkipped": 3,
  "invalidPhonesSkipped": 2,
  "totalScraped": 20,
  "leads": [
    {
      "id": "clx...",
      "businessName": "Ama's Beauty Salon",
      "phone": "+233244123456",
      "category": "hairdressing",
      "confidence": 0.85
    }
  ]
}
```

### Get Leads Response
```json
{
  "leads": [
    {
      "id": "clx...",
      "source": "GOOGLE_MAPS",
      "businessName": "Ama's Beauty Salon",
      "phoneNumber": "0244 123 456",
      "normalizedPhone": "+233244123456",
      "location": "Madina, Accra",
      "gpsLat": 5.6892,
      "gpsLng": -0.1677,
      "category": "hairdressing",
      "confidenceScore": 0.85,
      "isOnboarded": false,
      "scrapedAt": "2025-11-23T05:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

---

## Troubleshooting

### Server Not Running
```bash
# Start the development server
npm run dev
```

### Port Already in Use
```bash
# Check what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Database Connection Error
```bash
# Check your .env file has DATABASE_URL set
cat .env | grep DATABASE_URL
```
