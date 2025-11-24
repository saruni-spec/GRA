# ToT API Quick Reference

## 🚀 Quick Start

### Import Postman Collection

1. Open Postman
2. Click **Import** button
3. Select `ToT_API.postman_collection.json`
4. Collection will be imported with all endpoints ready to test

### Test Flows

#### ✅ Branch A: User with TIN (Complete Flow)
Run these requests in order:
1. **Branch A → 1. Check TIN Status** (nationalId: "22957832")
2. **Branch A → 3. Register for ToT**
3. **Branch A → 4. Check ToT Status**

#### 🆕 Branch B: User without TIN (Complete Flow)
Run these requests in order:
1. **Branch B → 1. Check TIN Status** (nationalId: "27750418")
2. **Branch B → 2. Register for TIN**
3. **Branch B → 3. Verify TIN Assignment**
4. **Branch B → 4. Register for ToT**
5. **Branch B → 5. Check ToT Status**

#### 📝 Filing & Payment Flow (Daily)
Run these requests in order (after ToT registration):
1. **Filing Flow → Daily → 1. Validate Taxpayer** (nationalId: "22957832")
2. **Filing Flow → Daily → 2. Get Available Daily Periods**
3. **Filing Flow → Daily → 3. Calculate Tax** (grossSales: 5000)
4. **Filing Flow → Daily → 4. File Daily Return**
5. **Filing Flow → Daily → 5. View Filing History**

#### 📝 Filing & Payment Flow (Monthly)
Run these requests in order (after ToT registration):
1. **Filing Flow → Monthly → 1. Get Available Monthly Periods**
2. **Filing Flow → Monthly → 2. File Monthly Return** (grossSales: 150000)

---

## 📋 API Endpoints

### Registration Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/tot/check-tin` | POST | Check if user has TIN |
| `/api/v1/tot/get-user-details` | POST | Get complete user info |
| `/api/v1/tot/register-tin` | POST | Register new TIN |
| `/api/v1/tot/register-tot` | POST | Register for ToT |
| `/api/v1/tot/status` | POST | Get ToT status |

### Filing & Payment Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/tot/available-periods` | POST | Get unfiled periods |
| `/api/v1/tot/calculate-tax` | POST | Calculate 3% tax |
| `/api/v1/tot/file-return` | POST | File return + get PRN |
| `/api/v1/tot/filing-history` | POST | Get all filings |
| `/api/v1/tot/return-details` | POST | Get return by PRN |

---

## 🧪 Sample Test Users

### Users WITH TIN (Branch A) - Can Register & File
```json
{ "nationalId": "22957832", "yearOfBirth": "1980" }
{ "nationalId": "26256450", "yearOfBirth": "1989" }
{ "nationalId": "20720990", "yearOfBirth": "1977" }
```

### Users WITHOUT TIN (Branch B) - Need TIN First
```json
{ "nationalId": "27750418", "yearOfBirth": "1989" }
{ "nationalId": "27607871", "yearOfBirth": "1988" }
{ "nationalId": "25758371", "yearOfBirth": "1988" }
```

---

## 📝 cURL Examples

### Registration Examples

**Check TIN**
```bash
curl -X POST http://localhost:3000/api/v1/tot/check-tin \
  -H "Content-Type: application/json" \
  -d '{"nationalId": "22957832", "yearOfBirth": "1980"}'
```

**Register TIN**
```bash
curl -X POST http://localhost:3000/api/v1/tot/register-tin \
  -H "Content-Type: application/json" \
  -d '{"nationalId": "27750418", "firstName": "Kwame", "yearOfBirth": "1989"}'
```

**Register ToT**
```bash
curl -X POST http://localhost:3000/api/v1/tot/register-tot \
  -H "Content-Type: application/json" \
  -d '{"nationalId": "22957832", "yearOfBirth": "1980"}'
```

### Filing Examples

**Get Available Periods (Daily)**
```bash
curl -X POST http://localhost:3000/api/v1/tot/available-periods \
  -H "Content-Type: application/json" \
  -d '{
    "nationalId": "22957832",
    "yearOfBirth": "1980",
    "filingType": "DAILY"
  }'
```

**Calculate Tax**
```bash
curl -X POST http://localhost:3000/api/v1/tot/calculate-tax \
  -H "Content-Type: application/json" \
  -d '{"grossSales": 5000}'
```

**File Daily Return**
```bash
curl -X POST http://localhost:3000/api/v1/tot/file-return \
  -H "Content-Type: application/json" \
  -d '{
    "nationalId": "22957832",
    "yearOfBirth": "1980",
    "grossSales": 5000,
    "filingType": "DAILY",
    "filingPeriod": "24 Nov 2025"
  }'
```

**File Monthly Return**
```bash
curl -X POST http://localhost:3000/api/v1/tot/file-return \
  -H "Content-Type: application/json" \
  -d '{
    "nationalId": "22957832",
    "yearOfBirth": "1980",
    "grossSales": 150000,
    "filingType": "MONTHLY",
    "filingPeriod": "November 2025"
  }'
```

**Get Filing History**
```bash
curl -X POST http://localhost:3000/api/v1/tot/filing-history \
  -H "Content-Type: application/json" \
  -d '{"nationalId": "22957832", "yearOfBirth": "1980"}'
```

**Get Return by PRN**
```bash
curl -X POST http://localhost:3000/api/v1/tot/return-details \
  -H "Content-Type: application/json" \
  -d '{"prn": "GRA-000001"}'
```

---

## 📚 Documentation

- **Full Documentation**: [docs/TOT_API_DOCUMENTATION.md](docs/TOT_API_DOCUMENTATION.md)
- **Postman Collection**: [ToT_API.postman_collection.json](ToT_API.postman_collection.json)

---

## 🔄 Testing Flow

1. **Start server**: `npm run dev`
2. **Import Postman collection**
3. **Test Branch A flow** (users 1-25 have TIN)
4. **Test Branch B flow** (users 26-50 need TIN first)
5. **Test error scenarios** in "Error Scenarios" folder

---

## ⚙️ Environment Variables

No additional environment variables needed for mock APIs.

---

## 🎯 Integration Points

These APIs are called from:
- WhatsApp Flow: ToT Registration screen
- WhatsApp Flow: TIN Registration screen  
- WhatsApp Flow: Preview/Confirmation screens

---

## 💡 Tips

**Registration**:
- Mock data persists only while server is running
- First 25 users (index 0-24) have TIN pre-assigned
- Last 25 users (index 25-49) need TIN registration
- TIN format: `TINxxxxxxxx` (auto-generated)

**Filing**:
- ToT tax rate is fixed at 3%
- Daily periods: Last 30 days from today
- Monthly periods: Last 12 months from current month
- PRN format: `GRA-XXXXXX` (6-digit sequential)
- Can file only once per period (duplicate prevention)
- Must be registered for ToT to file returns

**Security**:
- All endpoints use POST for security

---

## 🚨 Common Errors

### Registration Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 404 Not Found | Invalid National ID/Year | Use test data provided |
| 400 Bad Request | Missing required fields | Include all required fields |
| "Must have TIN" | ToT registration before TIN | Register TIN first (Branch B) |
| "Already has TIN" | Duplicate TIN registration | User already in Branch A |

### Filing Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Not registered for ToT" | Filing before ToT registration | Complete ToT registration first |
| "Already filed" | Duplicate filing | Period already filed, choose another |
| "Invalid filing type" | Wrong type value | Use "DAILY" or "MONTHLY" |
| "Gross sales must be positive" | Negative/zero amount | Enter valid positive amount |

---

## 📊 Test Coverage

**Registration**:
✅ Happy path - Branch A  
✅ Happy path - Branch B  
✅ Validation errors  
✅ Not found errors  
✅ Business logic errors (no TIN, duplicate registration)

**Filing**:
✅ Daily filing flow  
✅ Monthly filing flow  
✅ Duplicate filing prevention  
✅ Tax calculation (3%)  
✅ Period management  
✅ PRN generation  
✅ Filing history retrieval

---

## 📈 Sample Response Data

### File Return Success
```json
{
  "success": true,
  "prn": "GRA-000001",
  "returnDetails": {
    "sellerName": "Kwame Mensah",
    "taxDue": 150,
    "filingPeriod": "24 Nov 2025",
    "paymentStatus": "PENDING"
  }
}
```

### Calculate Tax
```json
{
  "success": true,
  "grossSales": 5000,
  "taxRate": 3,
  "taxDue": 150,
  "currency": "GHS"
}
```

---

## 🔄 Complete Flows

### Registration → Filing (Complete Journey)

1. **Register for ToT** (if not already registered)
2. **Get Available Periods** (choose DAILY or MONTHLY)
3. **Calculate Tax** (preview 3% calculation)
4. **File Return** (submit and get PRN)
5. **View History** (check all filed returns)

---

## 🎯 Integration Points

These APIs are called from:
- WhatsApp Flow: ToT Registration screen
- WhatsApp Flow: TIN Registration screen  
- WhatsApp Flow: Preview/Confirmation screens
- WhatsApp Flow: Filing Type Selection screen
- WhatsApp Flow: Period Selection screen
- WhatsApp Flow: Sales Entry screen
- WhatsApp Flow: Payment screen (shows PRN)

For detailed documentation, see: [docs/TOT_API_DOCUMENTATION.md](file:///home/saruni/projects/ghana/docs/TOT_API_DOCUMENTATION.md)
