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

---

## 📋 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/tot/check-tin` | POST | Check if user has TIN |
| `/api/v1/tot/get-user-details` | POST | Get complete user info |
| `/api/v1/tot/register-tin` | POST | Register new TIN |
| `/api/v1/tot/register-tot` | POST | Register for ToT |
| `/api/v1/tot/status` | POST | Get ToT status |

---

## 🧪 Sample Test Users

### Users WITH TIN (Branch A)
```json
{ "nationalId": "22957832", "yearOfBirth": "1980" }
{ "nationalId": "26256450", "yearOfBirth": "1989" }
{ "nationalId": "20720990", "yearOfBirth": "1977" }
```

### Users WITHOUT TIN (Branch B)
```json
{ "nationalId": "27750418", "yearOfBirth": "1989" }
{ "nationalId": "27607871", "yearOfBirth": "1988" }
{ "nationalId": "25758371", "yearOfBirth": "1988" }
```

---

## 📝 cURL Examples

### Check TIN
```bash
curl -X POST http://localhost:3000/api/v1/tot/check-tin \
  -H "Content-Type: application/json" \
  -d '{"nationalId": "22957832", "yearOfBirth": "1980"}'
```

### Register TIN
```bash
curl -X POST http://localhost:3000/api/v1/tot/register-tin \
  -H "Content-Type: application/json" \
  -d '{"nationalId": "27750418", "firstName": "Kwame", "yearOfBirth": "1989"}'
```

### Register ToT
```bash
curl -X POST http://localhost:3000/api/v1/tot/register-tot \
  -H "Content-Type: application/json" \
  -d '{"nationalId": "22957832", "yearOfBirth": "1980"}'
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

- Mock data persists only while server is running
- First 25 users (index 0-24) have TIN pre-assigned
- Last 25 users (index 25-49) need TIN registration
- TIN format: `TINxxxxxxxx` (auto-generated)
- All endpoints use POST for security

---

## 🚨 Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 404 Not Found | Invalid National ID/Year | Use test data provided |
| 400 Bad Request | Missing required fields | Include all required fields |
| "Must have TIN" | ToT registration before TIN | Register TIN first (Branch B) |
| "Already has TIN" | Duplicate TIN registration | User already in Branch A |

---

## 📊 Test Coverage

✅ Happy path - Branch A  
✅ Happy path - Branch B  
✅ Validation errors  
✅ Not found errors  
✅ Business logic errors (no TIN, duplicate registration)

For detailed documentation, see: [docs/TOT_API_DOCUMENTATION.md](file:///home/saruni/projects/ghana/docs/TOT_API_DOCUMENTATION.md)
