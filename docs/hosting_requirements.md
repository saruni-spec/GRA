# Hosting Requirements


## Option 1: Serverless Stack (Recommended for POC)
**Best for**: Speed, low maintenance, and scaling from zero.

### 1. Frontend & Backend Hosting: **Vercel**
*   **Requirements**:
    *   [ ] **Vercel Account**

*   **Cost Breakdown**:
    *   **Free Tier**:
        *   100 GB bandwidth/month
        *   100 GB-hours serverless function execution
        *   Unlimited deployments
        *   **Cost**: $0/month
        *   **Suitable for**: POC and initial testing
    
    *   **Pro Tier**:
        *   1 TB bandwidth/month
        *   1000 GB-hours serverless function execution
        *   Advanced analytics
        *   **Cost**: $20/month per user
        *   **Suitable for**: Production deployment
    
    *   **Estimated POC Cost**: **$0/month** (Free tier sufficient)
    *   **Estimated Production Cost**: **$20-40/month** (1-2 users)

### 2. Database: **Neon (Serverless Postgres)**
*   **Requirements**:
    *   [ ] **Neon Account**

*   **Cost Breakdown**:
    *   **Free Tier**:
        *   0.5 GB storage
        *   Unlimited compute hours (with limits on active time)
        *   1 project
        *   **Cost**: $0/month
        *   **Suitable for**: POC and development
    
    *   **Launch Tier**:
        *   10 GB storage
        *   300 compute hours/month
        *   Unlimited projects
        *   **Cost**: $19/month
        *   **Suitable for**: Small production deployments
    
    *   **Scale Tier**:
        *   50 GB storage (additional storage: $0.16/GB)
        *   750 compute hours/month
        *   Autoscaling
        *   **Cost**: $69/month
        *   **Suitable for**: Growing production deployments
    
    *   **Estimated POC Cost**: **$0/month** (Free tier sufficient)
    *   **Estimated Production Cost**: **$19-69/month** (depending on usage)

### 3. AI Services: **Gemini (Google) / OpenAI**
*   **Why**: We are using Multimodal LLMs (Gemini 2.0 Flash or GPT-4o) for direct Audio-to-Data extraction. 
*   **Requirements**:
    *   [ ] **API Key**:
        *   **Option A**: Google AI Studio Key
        *   **Option B**: OpenAI API Key

*   **Cost Breakdown**:
    
    #### **Option A: Google Gemini**
    *   **Gemini 2.0 Flash**:
        *   Input: $0.075 per 1M tokens
        *   Output: $0.30 per 1M tokens
        *   Audio input: $0.075 per 1M tokens (~1 hour audio = ~300K tokens)
        *   Image input: $0.075 per 1M tokens (~1 image = ~258 tokens)
    
    *   **Estimated Usage (POC)**:
        *   ~100 requests/day (OSINT lookups, bookkeeping, WhatsApp)
        *   ~50K tokens/day average
        *   **Estimated Cost**: **$0/month** 
    
    *   **Estimated Usage (Production - 100 users)**:
        *   ~1,000 requests/day
        *   ~500K tokens/day (15M tokens/month)
        *   Input: 10M tokens × $0.075/1M = $0.75
        *   Output: 5M tokens × $0.30/1M = $1.50
        *   **Estimated Cost**: **$2-5/month**
    
    #### **Option B: OpenAI GPT-4o**
    *   **GPT-4o**:
        *   Input: $2.50 per 1M tokens
        *   Output: $10.00 per 1M tokens
        *   Audio input: $100.00 per 1M tokens
        *   Image input: varies by resolution
    
    *   **No Free Tier**
    
    *   **Estimated Usage (POC)**:
        *   ~100 requests/day
        *   ~50K tokens/day average
        *   Input: 1M tokens × $2.50/1M = $2.50
        *   Output: 0.5M tokens × $10/1M = $5.00
        *   **Estimated Cost**: **$7-10/month**
    
    *   **Estimated Usage (Production - 100 users)**:
        *   ~1,000 requests/day
        *   ~500K tokens/day (15M tokens/month)
        *   Input: 10M tokens × $2.50/1M = $25.00
        *   Output: 5M tokens × $10/1M = $50.00
        *   **Estimated Cost**: **$75-100/month**

---




