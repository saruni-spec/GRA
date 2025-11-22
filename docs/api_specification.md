# API Specification: GRA Informal Sector Tax POC

## Base URL
`http://localhost:3000/api/v1`

---

## 0. Authentication & User Management
Endpoints for user registration and profile management.

### `POST /auth/register`
**Description**: Register a new user with personal and business details. Only firstName, lastName, and phoneNumber are required. All other fields are optional and can be added later via the update endpoint.

**Request Body**:
```json
{
  "firstName": "Kwame",
  "lastName": "Mensah",
  "email": "kwame@example.com",
  "phoneNumber": "+233244123456",
  "businessName": "Kwame Tailoring",
  "businessType": "Services",
  "businessCategory": "Tailor",
  "businessDescription": "Custom clothing and alterations",
  "location": "Madina Market, Accra",
  "city": "Accra",
  "region": "Greater Accra",
  "gpsLat": 5.6892,
  "gpsLng": -0.1676,
  "tinNumber": "GHA123456789"
}
```

**Minimal Request (Required Fields Only)**:
```json
{
  "firstName": "Ama",
  "lastName": "Asante",
  "phoneNumber": "+233201234567"
}
```

**Response (201 Created)**:
```json
{
  "status": "SUCCESS",
  "message": "User registered successfully",
  "user": {
    "id": "uuid-here",
    "firstName": "Kwame",
    "lastName": "Mensah",
    "email": "kwame@example.com",
    "phoneNumber": "+233244123456",
    "businessName": "Kwame Tailoring",
    "businessType": "Services",
    "businessCategory": "Tailor",
    "registrationDate": "2025-11-22T18:00:00Z",
    "isVerified": false
  }
}
```

**Error Response (400 Bad Request)**:
```json
{
  "error": "Validation Error",
  "message": "firstName, lastName, and phoneNumber are required fields"
}
```

**Error Response (400 - Duplicate)**:
```json
{
  "error": "User Already Exists",
  "message": "A user with this phone number is already registered"
}
```

---

### `PATCH /auth/profile/:userId`
**Description**: Update user profile with additional details. Accepts partial updates - you can send any combination of fields to update. Only the fields provided will be updated.

**URL Parameters**:
- `userId`: The user's UUID

**Request Body (Any combination of fields)**:
```json
{
  "businessName": "Kwame's Premium Tailoring",
  "businessDescription": "High-quality custom suits and traditional wear",
  "tinNumber": "GHA987654321"
}
```

**Single Field Update Example**:
```json
{
  "email": "kwame.new@example.com"
}
```

**Multiple Fields Update Example**:
```json
{
  "city": "Kumasi",
  "region": "Ashanti",
  "gpsLat": 6.6885,
  "gpsLng": -1.6244
}
```

**Response (200 OK)**:
```json
{
  "status": "SUCCESS",
  "message": "User profile updated successfully",
  "updatedFields": ["businessName", "businessDescription", "tinNumber"],
  "user": {
    "id": "uuid-here",
    "firstName": "Kwame",
    "lastName": "Mensah",
    "email": "kwame@example.com",
    "phoneNumber": "+233244123456",
    "businessName": "Kwame's Premium Tailoring",
    "businessType": "Services",
    "businessCategory": "Tailor",
    "businessDescription": "High-quality custom suits and traditional wear",
    "location": "Madina Market, Accra",
    "city": "Accra",
    "region": "Greater Accra",
    "tinNumber": "GHA987654321",
    "isVerified": false,
    "updatedAt": "2025-11-22T18:30:00Z"
  }
}
```

**Error Response (404 Not Found)**:
```json
{
  "error": "User Not Found",
  "message": "No user found with the provided ID"
}
```

---

### `GET /auth/profile/:userId`
**Description**: Retrieve user profile with recent transactions.

**URL Parameters**:
- `userId`: The user's UUID

**Response (200 OK)**:
```json
{
  "status": "SUCCESS",
  "user": {
    "id": "uuid-here",
    "firstName": "Kwame",
    "lastName": "Mensah",
    "email": "kwame@example.com",
    "phoneNumber": "+233244123456",
    "businessName": "Kwame Tailoring",
    "businessType": "Services",
    "businessCategory": "Tailor",
    "businessDescription": "Custom clothing and alterations",
    "location": "Madina Market, Accra",
    "city": "Accra",
    "region": "Greater Accra",
    "gpsLat": 5.6892,
    "gpsLng": -0.1676,
    "tinNumber": "GHA123456789",
    "registrationDate": "2025-11-22T18:00:00Z",
    "isVerified": false,
    "createdAt": "2025-11-22T18:00:00Z",
    "updatedAt": "2025-11-22T18:30:00Z",
    "transactions": [
      {
        "id": "uuid",
        "type": "INCOME",
        "category": "Sales",
        "amount": "450.00",
        "currency": "GHS",
        "createdAt": "2025-11-22T10:00:00Z"
      }
    ]
  }
}
```

---

## 1. Workflow Integration (WABA Platform)
These endpoints are called by your Workflow Builder to process user input and get a response.

### `POST /workflow/process-input`
**Description**: The main entry point. The Workflow sends the user's input (text or audio URL), and the backend processes it (NLP/STT) and returns the reply to be sent back to the user.

**Request Body**:
```json
{
  "phoneNumber": "233244123456",
  "inputType": "TEXT", 
  "content": "Sold 50 cedis rice", 
  "workflowSessionId": "sess_123"
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
  "transactionData": { ... } 
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
