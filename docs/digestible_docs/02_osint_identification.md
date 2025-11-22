# Part 3: OSINT & Social Media Identification

## What This Does

Finds informal businesses in Ghana by scraping websites, validating their phone numbers, and verifying them via WhatsApp.

## The Big Picture

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│   Scrape    │───▶│   Validate   │───▶│   Verify    │───▶│    Store     │
│  Websites   │    │    Phones    │    │ via WhatsApp│    │  in Database │
└─────────────┘    └──────────────┘    └─────────────┘    └──────────────┘
```

## Step-by-Step Process

### Step 1: Scrape Websites for Business Data

**What we scrape:**
- Google Maps
- Facebook Marketplace
- Tonaton (Ghana classifieds)
- Jiji (Ghana classifieds)

**What we look for:**
- Business name
- Phone number
- Address
- GPS coordinates (if available)
- Business category

**How it works:**

#### Google Maps Scraping
1. **Search URL:** `https://www.google.com/maps/search/hair+salon+in+Madina+Accra`
2. **Tool:** Puppeteer (automated browser)
3. **Extract:** Business cards with name, phone, address, GPS
4. **Rate limit:** 10 searches per minute (to avoid blocking)

**Example search queries:**
- "hair salon in Madina, Accra" → 50-100 results
- "chop bar in Kaneshie, Accra" → 30-60 results
- "tailor shop in Kumasi Central" → 40-80 results

**What we get:**
```json
{
  "source": "google_maps",
  "business_name": "Ama's Beauty Salon",
  "phone_raw": "0244 123 456",
  "address": "Madina Market, Accra",
  "gps_lat": 5.6837,
  "gps_lng": -0.1965,
  "category": "Beauty Salon"
}
```

#### Facebook Marketplace Scraping
1. **Search URL:** `https://www.facebook.com/marketplace/accra/search?query=food`
2. **Tool:** Puppeteer with Facebook login
3. **Extract:** Seller name, product type, location, phone
4. **Challenge:** Facebook blocks scrapers, so we limit to 50 profiles for PoC

#### Tonaton/Jiji Scraping
1. **Search URL:** `https://tonaton.com/en/ads/ghana/services`
2. **Tool:** Axios + Cheerio (simpler than Puppeteer)
3. **Extract:** Business name, phone, location, category
4. **Easier:** These sites don't use heavy JavaScript

### Step 2: Validate Phone Numbers

**Tool:** libphonenumber-js (Google's phone library)

**What we do:**
1. Parse raw phone number (e.g., "0244 123 456")
2. Convert to international format (+233244123456)
3. Check if it's a valid Ghana number
4. Identify carrier (MTN, Vodafone, AirtelTigo)

**Ghana phone prefixes:**
- MTN: 024, 054, 055, 059
- Vodafone: 020, 050
- AirtelTigo: 027, 057, 026

**Example transformation:**
```
Input:  "0244 123 456"
Output: {
  international: "+233244123456",
  national: "0244123456",
  carrier: "MTN",
  valid: true
}
```

**Deduplication:**
- Check database for existing phone numbers
- Skip if already registered

### Step 3: Classify Business Type

**Tool:** Keyword matching (no complex AI needed)

**Categories we identify:**
- Hairdressing (keywords: hair, salon, beauty, barber)
- Food services (keywords: chop bar, restaurant, food, catering)
- Tailoring (keywords: tailor, sewing, fashion)
- Electronics repair (keywords: phone repair, laptop, technician)
- Transport (keywords: taxi, driver, delivery, uber)
- Retail (keywords: shop, store, provisions)

**How it works:**
1. Look at business name + category text
2. Search for matching keywords
3. Assign highest priority match
4. Calculate confidence score (0.85 for good match, 0.3 for "other")

### Step 4: Verify via WhatsApp

**Tool:** WhatsApp Business Cloud API

**The verification message:**
```
Hello [Business Name],

Ghana Revenue Authority is identifying informal businesses 
for simplified tax registration.

Reply YES if you operate a business.
Reply STOP to opt out.

This is confidential and secure.
```

**What happens:**
1. Send message to validated phone number
2. Wait for response
3. If "YES" → Mark as verified in database
4. If "STOP" → Mark as opted out
5. No response → Keep as pending

**Response handling:**
- Business replies "YES" → Update status to "verified"
- Business replies "STOP" → Update status to "opted_out"
- Send confirmation message

### Step 5: Calculate Confidence Score

**Scoring algorithm:**
- Data source quality: 0.20-0.45 (Google Maps = 0.40, Facebook = 0.30)
- Valid phone number: +0.20
- GPS coordinates present: +0.10
- WhatsApp verified: +0.30
- Quality business name: +0.05

**Example scores:**
- Google Maps + valid phone + GPS + WhatsApp verified = 0.40 + 0.20 + 0.10 + 0.30 = **1.00** (auto-approved)
- Tonaton + valid phone + no GPS + not verified = 0.25 + 0.20 = **0.45** (rejected)
- Facebook + valid phone + WhatsApp verified = 0.30 + 0.20 + 0.30 = **0.80** (auto-approved)

**Thresholds:**
- ≥0.80 → Auto-approved
- 0.60-0.79 → Manual review
- <0.60 → Rejected

### Step 6: Store in Database

**Database table:** `businesses`

**What we store:**
```json
{
  "id": 1,
  "source": "google_maps",
  "business_name": "Ama's Beauty Salon",
  "phone_international": "+233244123456",
  "phone_national": "0244123456",
  "carrier": "MTN",
  "location": "Madina Market, Accra",
  "gps_lat": 5.6837,
  "gps_lng": -0.1965,
  "category": "hairdressing",
  "confidence_score": 0.87,
  "verification_status": "verified",
  "scraped_at": "2025-11-19T10:30:00Z",
  "verified_at": "2025-11-19T11:15:00Z"
}
```

## Job Queue System

**Tool:** Bull (Redis-based queue)

**Why we need it:**
- Scraping takes time (rate limits)
- Phone validation is sequential
- WhatsApp messages need delays

**Three queues:**
1. **Scraping queue:** Process search queries
2. **Validation queue:** Validate phone numbers
3. **WhatsApp queue:** Send verification messages

**Flow:**
```
Scraping Job → Finds 50 businesses
    ↓
Validation Job → Validates each phone (50 jobs)
    ↓
WhatsApp Job → Sends verification (50 jobs, 1 min delay each)
```

## Expected Output

**Target:** 20-30 verified businesses

**Success metrics:**
- 50-100 businesses scraped per search
- 70-80% valid phone numbers
- 40-50% WhatsApp verification rate
- Final: 20-30 verified businesses

**Sample dashboard query:**
```sql
SELECT business_name, phone_national, location, 
       confidence_score, verification_status
FROM businesses
WHERE confidence_score >= 0.60
  AND verification_status != 'opted_out'
ORDER BY confidence_score DESC
LIMIT 50;
```

## Tools Summary

| Stage | Tool | What It Does |
|-------|------|--------------|
| Scraping | Puppeteer | Automates Chrome browser to extract data |
| Scraping | Cheerio | Parses HTML to find specific data |
| Validation | libphonenumber-js | Validates and formats phone numbers |
| Verification | WhatsApp Business API | Sends messages and receives replies |
| Storage | PostgreSQL | Stores business data |
| Queue | Bull + Redis | Manages background jobs |

## What You Get

At the end of this process, you have:
- ✅ 20-30 verified businesses
- ✅ Valid phone numbers (international format)
- ✅ Business categories
- ✅ GPS coordinates (where available)
- ✅ WhatsApp verification status
- ✅ Confidence scores for data quality
- ✅ Ready for geospatial mapping (Part 4)
- ✅ Ready for transaction tracking (Part 5)
