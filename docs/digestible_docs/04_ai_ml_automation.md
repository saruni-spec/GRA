# Part 5: AI/ML Automation for Transaction Recording

## What This Does

Converts WhatsApp voice notes and text messages into structured transaction records, automatically categorizing them as income or expenses with proper amounts and categories.

## The Big Picture

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Receive    │───▶│   Convert    │───▶│  Categorize  │───▶│    Store     │
│ Voice/Text   │    │  to Text     │    │ Transaction  │    │  in Database │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

## Step-by-Step Process

### Step 1: Receive Transaction from WhatsApp

**Two input methods:**

#### Method 1: Voice Note
Business owner sends voice message:
- 🎤 "Sold five bags of rice for 250 cedis"
- 🎤 "Bought flour 80 cedis"
- 🎤 "Customer paid 120 for haircut"

#### Method 2: Text Message
Business owner types message:
- 📱 "Sold rice 250 GHS"
- 📱 "Paid rent 500"
- 📱 "Received payment 150 cedis"

**What we receive:**
```json
{
  "type": "audio",  // or "text"
  "from": "+233244123456",
  "audio": {
    "id": "wamid.xxx",
    "mime_type": "audio/ogg"
  }
}
```

### Step 2: Convert Voice to Text

**Tool:** Google Cloud Speech-to-Text API

**How it works:**

1. **Download audio** from WhatsApp
   - WhatsApp provides media URL
   - Download audio file (OGG format)
   - Convert to base64 for Google API

2. **Send to Google Speech-to-Text**
   - Language: English (Ghana) - "en-GH"
   - Alternative: Twi - "tw-GH" (local language support)
   - Enhanced model for better accuracy
   - Automatic punctuation

3. **Receive transcription**
   - Input: 🎤 Audio file
   - Output: "Sold five bags of rice for 250 cedis"

**Cost:**
- $0.006 per 15 seconds
- Average voice note: 10 seconds = $0.004
- 1000 transactions = $4 total

**Example:**
```javascript
// Voice note: "Sold rice for 250 cedis"
// Transcription: "Sold rice for 250 cedis"
```

### Step 3: Extract Transaction Amount

**Tool:** Regular expressions (regex)

**What we look for:**

#### Pattern 1: Number with currency
- "250 cedis" → 250
- "1,500 GHS" → 1500
- "80 ghana cedis" → 80

#### Pattern 2: Just numbers
- "Sold rice 250" → 250
- "Paid 100" → 100

#### Pattern 3: Number words
- "two hundred cedis" → 200
- "fifty GHS" → 50
- "one thousand" → 1000

**Examples:**
```
Input: "Sold rice for 250 cedis"     → Amount: 250
Input: "Bought supplies 1,500 GHS"   → Amount: 1500
Input: "Received two hundred cedis"  → Amount: 200
Input: "Customer paid 75"            → Amount: 75
```

### Step 4: Classify Transaction Type

**Tool:** Keyword matching

**Two types:**
1. **Income** (money coming in)
2. **Expense** (money going out)

**Income keywords:**
- sold, sale, customer paid, received, earned
- income, payment received, got paid, collected

**Expense keywords:**
- bought, purchased, paid, spent, cost
- expense, bill, payment made, gave

**How it works:**
1. Convert text to lowercase
2. Count income keyword matches
3. Count expense keyword matches
4. Higher score wins

**Examples:**
```
"Sold rice for 250 cedis"
  → Contains "sold" (income keyword)
  → Type: INCOME, Confidence: 95%

"Bought flour 80 cedis"
  → Contains "bought" (expense keyword)
  → Type: EXPENSE, Confidence: 95%

"Customer paid 120"
  → Contains "paid" (could be either, but "customer paid" is income)
  → Type: INCOME, Confidence: 95%
```

### Step 5: Classify Transaction Category

**Tool:** Keyword matching with priority

**Income categories:**
- **Sales:** sold, sale, customer paid, received payment
- **Service income:** service, work done, job completed

**Expense categories:**
- **Supplies:** bought, purchased, supplies, materials
- **Rent:** rent, rental
- **Utilities:** electricity, water, bills, utilities
- **Transport:** transport, fuel, petrol, taxi
- **Wages:** salary, wages, paid worker, staff

**How it works:**
1. Determine if income or expense (from Step 4)
2. Look for category keywords in text
3. Match to highest priority category
4. If no match → category = "other"

**Examples:**
```
"Sold rice for 250 cedis"
  → Type: Income
  → Contains "sold" → Category: SALES
  → Confidence: 85%

"Bought flour 80 cedis"
  → Type: Expense
  → Contains "bought" → Category: SUPPLIES
  → Confidence: 85%

"Paid rent 500"
  → Type: Expense
  → Contains "rent" → Category: RENT
  → Confidence: 85%

"Spent 150 on electricity bill"
  → Type: Expense
  → Contains "electricity" and "bill" → Category: UTILITIES
  → Confidence: 85%
```

### Step 6: Calculate Confidence Score

**Overall confidence = minimum of:**
- Type confidence (95% if clear income/expense)
- Category confidence (85% if matched)
- Amount confidence (100% if found, 50% if missing)

**Examples:**
```
"Sold rice for 250 cedis"
  → Type: 95%, Category: 85%, Amount: 100%
  → Overall: 85% (minimum)
  → Status: AUTO-APPROVED ✅

"Received payment"
  → Type: 95%, Category: 85%, Amount: 50% (missing!)
  → Overall: 50%
  → Status: NEEDS CLARIFICATION ⚠️
```

**Thresholds:**
- ≥90% → Auto-save to database
- <90% → Request clarification from user

### Step 7: Handle Low Confidence (Clarification)

**When we need clarification:**

#### Missing Amount
```
User: "Sold rice"
Bot: "I detected a sale but couldn't find the amount. 
      Please reply with just the amount in cedis."
User: "250"
Bot: "✅ Recorded: Income - Sales - 250 GHS"
```

#### Unknown Type
```
User: "Transaction 100 cedis"
Bot: "I couldn't determine if this is income or expense.
      Reply with:
      1 for Income
      2 for Expense"
User: "1"
Bot: "✅ Recorded: Income - 100 GHS"
```

**How it works:**
1. Save partial transaction as "pending clarification"
2. Send clarification question via WhatsApp
3. Wait for user response
4. Complete transaction with clarified info
5. Save to database

### Step 8: Store Transaction in Database

**Database table:** `transactions`

**What we store:**
```json
{
  "id": 1,
  "business_id": 5,
  "transaction_type": "income",
  "category": "sales",
  "amount": 250.00,
  "currency": "GHS",
  "description": "Sold rice for 250 cedis",
  "confidence_score": 0.95,
  "source": "voice",
  "raw_input": "Sold rice for 250 cedis",
  "verified": true,
  "created_at": "2025-11-19T14:30:00Z"
}
```

### Step 9: Send Confirmation

**Success message:**
```
✅ Recorded: Income - Sales - 250 GHS
```

**Low confidence message:**
```
⚠️ I recorded this transaction but please verify:

Type: Income
Category: Sales
Amount: 250 GHS

Reply YES to confirm or provide corrections.
```

## Complete Flow Examples

### Example 1: Perfect Voice Note
```
1. User sends voice: 🎤 "Sold five bags of rice for 250 cedis"
2. Google transcribes: "Sold five bags of rice for 250 cedis"
3. Extract amount: 250
4. Classify type: Income (keyword: "sold")
5. Classify category: Sales (keyword: "sold")
6. Confidence: 95%
7. Auto-save to database
8. Send confirmation: "✅ Recorded: Income - Sales - 250 GHS"
```

### Example 2: Text with Clarification
```
1. User types: "Bought supplies"
2. Extract amount: None found
3. Classify type: Expense (keyword: "bought")
4. Classify category: Supplies (keyword: "supplies")
5. Confidence: 50% (missing amount)
6. Request clarification: "Please reply with the amount in cedis"
7. User replies: "100"
8. Complete transaction: Expense - Supplies - 100 GHS
9. Save to database
10. Send confirmation: "✅ Recorded: Expense - Supplies - 100 GHS"
```

### Example 3: Complex Voice Note
```
1. User sends voice: 🎤 "Customer came and paid me two hundred cedis for the haircut I did yesterday"
2. Google transcribes: "Customer came and paid me two hundred cedis for the haircut I did yesterday"
3. Extract amount: 200 (from "two hundred")
4. Classify type: Income (keywords: "customer", "paid")
5. Classify category: Sales (keyword: "paid")
6. Confidence: 85%
7. Auto-save to database
8. Send confirmation: "✅ Recorded: Income - Sales - 200 GHS"
```

## Business Type Classification

**Also used for initial business registration:**

When a business first registers, we ask: "What type of business do you operate?"

**Categories:**
- Hairdressing (keywords: hair, salon, beauty, barber)
- Food services (keywords: chop bar, restaurant, food, catering)
- Tailoring (keywords: tailor, sewing, fashion)
- Electronics repair (keywords: phone repair, laptop, technician)
- Transport (keywords: taxi, driver, delivery, uber)
- Retail (keywords: shop, store, provisions)

**Example:**
```
User: "I run a beauty salon"
  → Contains "beauty" and "salon"
  → Business type: HAIRDRESSING
  → Confidence: 85%
```

## Training Data

**How we improve accuracy:**

### Synthetic Data
Pre-created examples for testing:
```javascript
[
  { text: "Sold 5 bags of rice for 250 cedis", type: "income", amount: 250, category: "sales" },
  { text: "Bought flour 80 cedis", type: "expense", amount: 80, category: "supplies" },
  { text: "Paid rent 500", type: "expense", amount: 500, category: "rent" }
]
```

### Real User Data
- After each verified transaction, optionally add to training data
- Only use high-confidence (≥95%) verified transactions
- Improves keyword matching over time

## Error Handling

### Google API Failure
```
1. Voice transcription fails
2. Fallback: Ask user to type manually
3. Message: "⚠️ Voice processing failed. Please type your transaction instead."
```

### Ambiguous Transaction
```
1. Can't determine type or category
2. Request clarification
3. Message: "I couldn't understand this transaction. Please provide:
   - Type (income or expense)
   - Amount in cedis
   - Brief description"
```

## Privacy & Security

### Voice Data
- **Never stored permanently**
- Audio processed in memory only
- Deleted immediately after transcription
- Only text transcription is kept

### Data Retention
- Transcriptions kept for 90 days
- After 90 days, automatically deleted
- Only verified transactions remain

### Encryption
- Sensitive data encrypted in database
- AES-256 encryption
- Secure key management

## Performance Metrics

**Target accuracy:**
- Transaction categorization: ≥95%
- Voice-to-text: ≥90%
- Processing time: <2 seconds
- Clarification rate: <10%

**Testing:**
```
Test: "Sold 3 bags of rice for 250 cedis"
Expected: { type: "income", amount: 250, category: "sales" }
Result: ✅ PASS

Test: "Bought supplies 100 cedis"
Expected: { type: "expense", amount: 100, category: "supplies" }
Result: ✅ PASS

Test: "Paid rent 500 GHS"
Expected: { type: "expense", amount: 500, category: "rent" }
Result: ✅ PASS
```

## Tools Summary

| Component | Tool | What It Does |
|-----------|------|--------------|
| Voice-to-Text | Google Cloud Speech-to-Text | Converts audio to text |
| Amount Extraction | Regular Expressions (Regex) | Finds numbers in text |
| Type Classification | Keyword Matching | Identifies income vs expense |
| Category Classification | Keyword Matching | Assigns transaction category |
| Database | PostgreSQL | Stores transaction records |
| WhatsApp | WhatsApp Business API | Receives messages and sends confirmations |

## Data Flow Summary

```
1. Business Sends Transaction
   ├─ Voice note (audio file)
   └─ Text message
   
2. Convert to Text
   ├─ Google Speech-to-Text (if voice)
   └─ Direct text (if typed)
   
3. Extract Information
   ├─ Amount (regex patterns)
   ├─ Type (keyword matching)
   └─ Category (keyword matching)
   
4. Validate Confidence
   ├─ ≥90% → Auto-save
   └─ <90% → Request clarification
   
5. Store in Database
   └─ Structured transaction record
   
6. Send Confirmation
   └─ WhatsApp message with details
```

## Integration with Other Parts

### From Part 3 (OSINT)
- Uses verified phone numbers
- Links transactions to businesses
- Business ID from database

### From Part 4 (Geospatial)
- Transactions linked to business locations
- Can analyze revenue by market cluster
- Geographic revenue patterns

### To Tax Calculation
- Structured transaction data
- Income and expense totals
- Category breakdowns
- Ready for MTS (Micro Tax System) calculation

## Expected Output

**Target:** Process 1000+ transactions with 95% accuracy

**Sample transaction record:**
```json
{
  "id": 1,
  "business_id": 5,
  "transaction_type": "income",
  "category": "sales",
  "amount": 250.00,
  "currency": "GHS",
  "description": "Sold rice for 250 cedis",
  "confidence_score": 0.95,
  "source": "voice",
  "verified": true,
  "created_at": "2025-11-19T14:30:00Z"
}
```

**What business owners get:**
- ✅ Easy transaction recording (just speak or type)
- ✅ Automatic categorization
- ✅ Instant confirmation
- ✅ No complex forms or apps
- ✅ Works via WhatsApp (already familiar)

**What tax officers get:**
- ✅ Structured transaction data
- ✅ Automatic income/expense tracking
- ✅ Category breakdowns
- ✅ Ready for tax calculation
- ✅ Audit trail with timestamps
