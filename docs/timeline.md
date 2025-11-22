# POC Execution Timeline: GRA Informal Sector Tax System

**Status**: In Progress
**Current Focus**: Bookkeeping & Workflow Integration

---

## 📅 Immediate Schedule (2-Day Sprint)

| Day | Theme | Key Objective |
| :--- | :--- | :--- |
| **Day 1 (Today)** | 📒 **Core Logic** | Bookkeeping Module, DB Setup, & WhatsApp Workflow Integration. |
| **Day 1** | 🗣️ **Voice & AI** | Implement Multimodal LLM (Gemini/GPT) for Audio processing. |
| **Day 2 (Tomorrow)** | ️ **Discovery** | OSINT Scraper (Google Maps) & Lead Generation. |


---

## 📝 Detailed Daily Schedule

### Day 1: Foundation, Bookkeeping & Workflows
**Focus**: Getting the system running and recording transactions.

*   **Morning**
    *    [Foundation] Project setup, Node.js, PostgreSQL, Prisma Schema.
    *    [API] Implement Backend Endpoints (`/workflow`, `/osint`, `/reports`).
    *    [DB] Run Migrations & Setup User/Transaction tables.
    *    [AI] Integrate Multimodal LLM (Gemini/GPT) for Audio -> JSON extraction.
    *    [AI] Implement Audio-to-Data extraction logic.

*   **Evening**
    *   [Deployment] Deploy if requirements have been provided.
    *   [Workflow] Connect WABA Workflow to Backend (Text Flow).


### Day 2: OSINT & Scraping
**Focus**: Identifying businesses to onboard.

*   **Morning**
    *   [Scraper] Build Puppeteer script for Google Maps.
    *   [Data] Extract Name, Phone, Location from target area (e.g., Madina).
    *   [Leads] Save scraped data to `Leads` table in DB.
    *   [Integration] Test end-to-end flow: Scrape -> Lead -> Onboard -> Transaction.


