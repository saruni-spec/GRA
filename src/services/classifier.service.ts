export interface BusinessCategory {
  type: string;
  keywords: string[];
  priority: number;
}

export interface ClassificationResult {
  type: string;
  confidence: number;
  matchedKeyword?: string;
}

export interface ConfidenceScoreInput {
  source: string;
  hasValidPhone: boolean;
  hasGPS: boolean;
  businessName: string;
  isVerified?: boolean;
}

// Business category definitions with keywords
const BUSINESS_CATEGORIES: Record<string, BusinessCategory> = {
  'hairdressing': {
    type: 'hairdressing',
    keywords: ['hair', 'salon', 'beauty', 'barber', 'braiding', 'weave', 'stylist'],
    priority: 1
  },
  'food_services': {
    type: 'food_services',
    keywords: ['chop bar', 'restaurant', 'food', 'catering', 'eatery', 'kitchen', 'canteen'],
    priority: 1
  },
  'tailoring': {
    type: 'tailoring',
    keywords: ['tailor', 'sewing', 'fashion', 'dressmaking', 'seamstress', 'boutique'],
    priority: 1
  },
  'electronics_repair': {
    type: 'electronics_repair',
    keywords: ['phone repair', 'electronics', 'laptop', 'computer', 'technician', 'mobile'],
    priority: 2
  },
  'transport': {
    type: 'transport',
    keywords: ['taxi', 'driver', 'transport', 'delivery', 'uber', 'bolt', 'car hire'],
    priority: 2
  },
  'retail': {
    type: 'retail',
    keywords: ['shop', 'store', 'provisions', 'supermarket', 'mart', 'trading'],
    priority: 3
  },
  'mechanics': {
    type: 'mechanics',
    keywords: ['mechanic', 'auto', 'garage', 'car repair', 'workshop'],
    priority: 2
  }
};

/**
 * Classify business based on name and category using keyword matching
 * @param businessName - Name of the business
 * @param category - Category or description from source
 * @returns Classification result with type and confidence
 */
export function classifyBusiness(
  businessName: string = '',
  category: string = ''
): ClassificationResult {
  // Combine and normalize text
  const text = (businessName + ' ' + category).toLowerCase();
  
  const matches: Array<{ type: string; priority: number; keyword: string }> = [];
  
  // Search for keyword matches
  for (const [key, config] of Object.entries(BUSINESS_CATEGORIES)) {
    for (const keyword of config.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        matches.push({
          type: config.type,
          priority: config.priority,
          keyword
        });
        break; // Only count one match per category
      }
    }
  }
  
  // No matches found
  if (matches.length === 0) {
    return {
      type: 'other',
      confidence: 0.3
    };
  }
  
  // Sort by priority (lower number = higher priority)
  matches.sort((a, b) => a.priority - b.priority);
  
  return {
    type: matches[0].type,
    confidence: 0.85,
    matchedKeyword: matches[0].keyword
  };
}

/**
 * Calculate confidence score for a business lead
 * Score is based on data completeness and quality
 * @param input - Business data for scoring
 * @returns Confidence score between 0.0 and 1.0
 */
export function calculateConfidenceScore(input: ConfidenceScoreInput): number {
  let score = 0;
  
  // Source quality weight
  const sourceWeights: Record<string, number> = {
    'GOOGLE_MAPS': 0.40,
    'FACEBOOK_MARKETPLACE': 0.30,
    'TONATON': 0.25,
    'JIJI': 0.25,
    'WHATSAPP_BUSINESS': 0.45
  };
  
  score += sourceWeights[input.source] || 0.20;
  
  // Phone validation
  if (input.hasValidPhone) {
    score += 0.20;
  }
  
  // GPS coordinates present
  if (input.hasGPS) {
    score += 0.10;
  }
  
  // WhatsApp verification (if applicable)
  if (input.isVerified) {
    score += 0.30;
  }
  
  // Business name quality (not generic or empty)
  if (input.businessName && 
      input.businessName.length > 5 && 
      !input.businessName.toLowerCase().includes('n/a') &&
      !input.businessName.toLowerCase().includes('unknown')) {
    score += 0.05;
  }
  
  // Cap at 1.0
  return Math.min(score, 1.0);
}

/**
 * Determine business status based on confidence score
 * @param confidenceScore - Score between 0.0 and 1.0
 * @returns Status string
 */
export function getBusinessStatus(confidenceScore: number): string {
  if (confidenceScore >= 0.80) return 'auto_approved';
  if (confidenceScore >= 0.60) return 'manual_review';
  return 'rejected';
}

/**
 * Get all available business categories
 * @returns Array of category types
 */
export function getAvailableCategories(): string[] {
  return Object.keys(BUSINESS_CATEGORIES);
}
