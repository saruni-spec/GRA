# API Specification: GRA Informal Sector Tax POC

## Base URL
`http://localhost:3000/api/v1`

## 1. Workflow Integration (WABA Platform)
These endpoints are called by your Workflow Builder to process user input and get a response.

### `POST /workflow/process-input`
**Description**: The main entry point. The Workflow sends the user's input (text or audio URL), and the backend processes it (NLP/STT) and returns the reply to be sent back to the user.

**Request Body**:
```json
{
  "phoneNumber": "233244123456",
  "inputType": "TEXT", // or "AUDIO"
  "content": "Sold 50 cedis rice", // Text content or Audio URL
  "workflowSessionId": "sess_123" // Optional: to track conversation state
}
```

**Response**:
```json
{
  "status": "SUCCESS",
  "replyText": "✅ Recorded: Sales - 50 GHS. Is this correct?",
  "requiresConfirmation": true,
  "extractedData": {
    "type": "INCOME",
    "amount": 50,
    "category": "Sales"
  }
}
```

### `POST /workflow/confirm-transaction`
**Description**: Called when the user clicks "Yes" or replies "Yes" in the workflow to confirm a pending transaction.

**Request Body**:
```json
{
  "phoneNumber": "233244123456",
  "confirmation": "YES",
  "transactionData": { ... } // Optional: Pass back data if workflow is stateless
}
```

**Response**:
```json
{
  "status": "SAVED",
  "replyText": "Transaction saved successfully! 🎉"
}
```

---

## 2. OSINT (Business Identification)
Endpoints to manage scraped leads.

### `POST /osint/scrape`
**Description**: Trigger a scraping job for a specific location.
**Body**:
```json
{
  "location": "Madina, Accra",
  "businessType": "Tailor",
  "source": "GOOGLE_MAPS"
}
```
**Response**:
```json
{
  "jobId": "job_123",
  "status": "QUEUED"
}
```

### `GET /osint/leads`
**Description**: Retrieve identified leads.
**Query Params**:
- `minConfidence`: Filter by confidence score (e.g., 0.7).
- `limit`: Max results (default 50).

**Response**:
```json
[
  {
    "id": "uuid",
    "businessName": "Ama Seamstress",
    "phoneNumber": "+23324...",
    "location": "Madina Market",
    "confidenceScore": 0.85,
    "source": "GOOGLE_MAPS"
  }
]
```

---

## 3. Bookkeeping & Reporting
Endpoints for the frontend dashboard or internal tools.

### `GET /reports/daily-summary/:userId`
**Description**: Get the daily P&L for a specific user.
**Response**:
```json
{
  "date": "2025-11-22",
  "currency": "GHS",
  "totalIncome": 450.00,
  "totalExpense": 20.00,
  "netProfit": 430.00,
  "transactionCount": 5
}
```

### `GET /transactions/:userId`
**Description**: List recent transactions for a user.
**Response**:
```json
[
  {
    "id": "uuid",
    "type": "INCOME",
    "category": "Sales",
    "amount": 450.00,
    "rawText": "Sold rice 450",
    "createdAt": "2025-11-22T10:00:00Z"
  }
]
```
