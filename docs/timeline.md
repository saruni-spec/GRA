# POC Execution Timeline: GRA Informal Sector Tax System

**Status**: In Progress  
**Current Focus**: ToT Registration & Filing APIs Complete - WhatsApp Integration Next  
**POC Progress**: ~25% Complete (Infrastructure + ToT APIs)

---

## ✅ Completed Milestones (As of Nov 24, 2025)

### Week 1: Foundation & ToT Tax System
**Completed**: Nov 22-24, 2025

#### Day 1-2: Database & Infrastructure ✅
- ✅ Node.js + TypeScript project setup
- ✅ PostgreSQL database configuration
- ✅ Prisma ORM schema design
- ✅ User, Transaction, and Lead models
- ✅ Express.js REST API framework
- ✅ Environment configuration & CORS

#### Day 3: ToT Registration APIs ✅
- ✅ Mock data service (50 test users)
- ✅ TIN checking endpoint
- ✅ TIN registration endpoint (Branch B flow)
- ✅ ToT registration endpoint
- ✅ User details & status endpoints
- ✅ Complete API documentation

#### Day 4: ToT Filing & Payment APIs ✅
- ✅ Available periods endpoint (daily/monthly)
- ✅ Tax calculation endpoint (3%)
- ✅ File return endpoint with PRN generation
- ✅ Filing history endpoint
- ✅ Return details by PRN endpoint
- ✅ Duplicate filing prevention
- ✅ Postman collection for all flows

**Deliverables**:
- 11 fully functional ToT API endpoints
- Complete documentation (`TOT_API_DOCUMENTATION.md`, `TOT_API_QUICK_REFERENCE.md`)
- Postman collection with test scenarios
- Mock data with 50 test users

---

## 🚧 Remaining Work for POC

### Phase 1: WhatsApp Integration (Priority: HIGH)
**Estimated Duration**: 2-3 days

#### Tasks:
1. **WhatsApp Webhook Setup**
   - Configure webhook endpoint to receive messages
   - Implement message type handling (text, button, flow_response)
   - Set up message sending functions
   - Test webhook with WhatsApp Business API

2. **WhatsApp Flow Creation - ToT Registration**
   - Create Flow JSON for TIN check screen
   - Create Flow JSON for TIN registration screen (Branch B)
   - Create Flow JSON for ToT registration preview
   - Configure flow submission to call backend APIs
   - Test complete registration flow

3. **WhatsApp Flow Creation - ToT Filing**
   - Create Flow JSON for taxpayer validation
   - Create Flow JSON for filing type selection (Daily/Monthly)
   - Create Flow JSON for period selection
   - Create Flow JSON for sales entry
   - Create Flow JSON for tax preview (3% calculation)
   - Configure submission to file return API
   - Test complete filing flow

4. **Integration Testing**
   - Test end-to-end registration (Branch A & B)
   - Test end-to-end filing (Daily & Monthly)
   - Test error scenarios (duplicate filing, etc.)
   - Verify PRN generation and display

**Blockers**: Need WhatsApp Business API credentials and Flow access

---

### Phase 2: Transaction Recording & Bookkeeping (Priority: HIGH)
**Estimated Duration**: 2-3 days

#### Backend Tasks:
1. **NLP Engine**
   - Implement regex-based keyword matcher
   - Build intent classifier (INCOME/EXPENSE/TAX)
   - Create entity extractor (amount, item, category)
   - Handle edge cases and ambiguous input

2. **Workflow Endpoints**
   - `POST /api/v1/workflow/process-input` - Process and classify input
   - `POST /api/v1/workflow/confirm-transaction` - Save to database
   - Implement transaction state management
   - Add validation and error handling

3. **Reporting Endpoints**
   - `POST /api/v1/reports/daily-summary` - Calculate profit/loss
   - `GET /api/v1/reports/transactions` - List user transactions
   - `GET /api/v1/reports/summary/:period` - Period-based reports

#### WhatsApp Tasks:
4. **Message Flow**
   - Handle free-text transaction messages
   - Send confirmation with extracted data
   - Handle Yes/No confirmations
   - Send daily summaries

---

### Phase 3: Voice Processing Pipeline (Priority: MEDIUM)
**Estimated Duration**: 2-3 days

#### Tasks:
1. **Audio Processing**
   - Download audio from WhatsApp Media API
   - Convert OGG/AAC to WAV/MP3 using ffmpeg
   - Handle audio format compatibility

2. **Speech-to-Text Integration**
   - Set up Google Cloud Speech-to-Text API
   - OR integrate OpenAI Whisper API
   - Handle Ghanaian accent optimization
   - Add error handling for poor audio quality

3. **Multimodal LLM (Optional)**
   - Integrate Gemini for audio → JSON extraction
   - Test accuracy with Ghanaian English
   - Compare with STT + NLP pipeline

4. **WhatsApp Voice Flow**
   - Handle voice message type
   - Show "Processing..." status
   - Send transcription + confirmation
   - Save to ledger after confirmation

---

### Phase 4: OSINT & Lead Generation (Priority: LOW)
**Estimated Duration**: 2 days

#### Tasks:
1. **Google Maps Scraper**
   - Build Puppeteer script for target area (e.g., Madina, Accra)
   - Extract: Name, Phone, Location, Category
   - Handle pagination and lazy loading
   - Save to Leads table

2. **Data Processing**
   - Phone number normalization (E.164 format)
   - Deduplication across sources
   - Confidence scoring algorithm
   - Lead quality metrics

3. **OSINT Endpoints**
   - `POST /api/v1/osint/scrape` - Trigger scraping
   - `GET /api/v1/osint/leads` - List leads
   - `POST /api/v1/osint/onboard` - Convert lead to user
   - Lead filtering and search

4. **Target**: Generate 20+ quality leads for demo

---

## 📅 Revised POC Timeline

### Week 2: WhatsApp & Transaction Recording
| Day | Focus | Key Deliverables |
|-----|-------|------------------|
| **Day 5** | WhatsApp Webhook | Webhook receiving messages, ToT Flow JSONs created |
| **Day 6** | ToT Flow Testing | End-to-end registration & filing via WhatsApp |
| **Day 7** | NLP Engine | Transaction processing endpoints working |
| **Day 8** | Transaction Flow | Bookkeeping flow tested via WhatsApp |

### Week 3: Voice & OSINT
| Day | Focus | Key Deliverables |
|-----|-------|------------------|
| **Day 9** | Voice Processing | Audio download & STT integration |
| **Day 10** | Voice Flow | Voice transactions working |
| **Day 11** | OSINT Scraper | Google Maps scraper, 20+ leads |
| **Day 12** | Polish & Demo | Bug fixes, demo preparation |

---

## 📊 Updated POC Completion Checklist

### Core Features
- [x] Database schema & models
- [x] ToT registration APIs (5 endpoints)
- [x] ToT filing APIs (5 endpoints)
- [ ] WhatsApp webhook integration
- [ ] WhatsApp Flow JSONs (Registration)
- [ ] WhatsApp Flow JSONs (Filing)
- [ ] Transaction NLP engine
- [ ] Transaction recording endpoints
- [ ] Reporting endpoints
- [ ] Voice-to-text integration
- [ ] Google Maps OSINT scraper
- [ ] Lead management

### Documentation
- [x] ToT API documentation
- [x] Postman collection
- [ ] WhatsApp Flow documentation
- [ ] NLP logic documentation
- [ ] Deployment guide
- [ ] Demo script

### Testing
- [x] ToT registration flow (via Postman)
- [x] ToT filing flow (via Postman)
- [ ] End-to-end via WhatsApp (Registration)
- [ ] End-to-end via WhatsApp (Filing)
- [ ] End-to-end via WhatsApp (Transactions)
- [ ] Voice message processing
- [ ] OSINT lead generation

---

## 🎯 Demo Preparation Checklist

### Data Preparation
- [x] 50 mock users for ToT testing
- [ ] 5-10 test users for transaction demo
- [ ] 20+ OSINT leads
- [ ] Sample transactions for reporting

### Flow Testing
- [ ] ToT registration (Both branches)
- [ ] ToT filing (Daily & Monthly)
- [ ] Transaction recording (Text)
- [ ] Transaction recording (Voice)
- [ ] Daily summary report

### Demo Script
- [ ] Introduction & problem statement
- [ ] OSINT demonstration (lead discovery)
- [ ] ToT registration walkthrough
- [ ] ToT filing demonstration
- [ ] Transaction recording (voice)
- [ ] Daily report generation
- [ ] Q&A preparation

---

## 🚀 Quick Wins for Next Session

1. **Configure WhatsApp Webhook** (30 mins)
   - Set up ngrok or deploy to server
   - Configure webhook URL in WhatsApp Business dashboard
   - Test message reception

2. **Create First WhatsApp Flow** (1-2 hours)
   - Start with simple ToT TIN check flow
   - Test with real WhatsApp account
   - Iterate based on results

3. **Test End-to-End** (30 mins)
   - Send message from phone
   - Verify backend receives it
   - Confirm API response returns to WhatsApp

---

## 📝 Notes

- **Backend APIs**: Ready for integration (11 endpoints documented & tested)
- **Critical Path**: WhatsApp integration is the blocker for demo
- **Risk**: WhatsApp Flow JSON configuration complexity
- **Mitigation**: Start with simplest flow first, iterate

**Last Updated**: November 24, 2025
