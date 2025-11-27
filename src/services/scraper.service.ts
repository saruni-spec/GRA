import puppeteer, { Page } from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

// Utility function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface ScrapedBusiness {
  businessName: string;
  phoneRaw?: string;
  address?: string;
  gpsLat?: number;
  gpsLng?: number;
  category?: string;
  url?: string;
  reviewCount?: number;
}

/**
 * Scrape Google Maps for businesses matching the query
 * @param businessType - Type of business (e.g., "hair salon", "chop bar")
 * @param location - Location to search in (e.g., "Madina, Accra")
 * @param maxResults - Maximum number of results to return (default: 20)
 * @returns Array of scraped business data
 */
export async function scrapeGoogleMaps(
  businessType: string,
  location: string,
  maxResults: number = 20
): Promise<ScrapedBusiness[]> {
  let browser: any = null;
  
  try {
    console.log(`Starting Google Maps scrape: "${businessType}" in "${location}"`);
    
    // Determine executable path based on environment
    let executablePath = await chromium.executablePath();
    
    // If running locally (executablePath is null), try to find local Chrome or use puppeteer's default
    if (!executablePath) {
      // Try standard Linux path or fallback to a known location if needed
      // For local dev with full puppeteer installed, we might need to import it dynamically
      // or just rely on the user having Chrome installed.
      // A common fallback for local dev:
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const puppeteerFull = require('puppeteer');
        executablePath = puppeteerFull.executablePath();
      } catch (e) {
        console.warn('Full puppeteer not found, falling back to default paths');
        executablePath = '/usr/bin/google-chrome-stable'; // Common Linux path
      }
    }

    console.log(`Using executable path: ${executablePath}`);

    // Launch headless browser
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1920, height: 1080 },
      executablePath: executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    
    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Build search URL
    const searchQuery = `${businessType} in ${location}`;
    const encodedQuery = encodeURIComponent(searchQuery);
    const searchUrl = `https://www.google.com/maps/search/${encodedQuery}`;
    
    console.log(`Navigating to: ${searchUrl}`);
    
    // Navigate to Google Maps
    await page.goto(searchUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for results to load
    await delay(3000);

    // Scroll to load more results
    await scrollToLoadResults(page, maxResults);

    // Extract business data with phone numbers
    const businesses = await extractBusinessDataWithPhones(page, maxResults);
    
    console.log(`Scraped ${businesses.length} businesses from Google Maps`);
    
    return businesses;
    
  } catch (error) {
    console.error('Google Maps scraping error:', error);
    throw new Error(`Failed to scrape Google Maps: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Scroll the results panel to load lazy-loaded businesses
 */
async function scrollToLoadResults(page: Page, targetCount: number): Promise<void> {
  try {
    // Find the scrollable results container
    const scrollableSelector = 'div[role="feed"]';
    
    await page.waitForSelector(scrollableSelector, { timeout: 10000 });
    
    // Scroll multiple times to load more results
    for (let i = 0; i < 5; i++) {
      await page.evaluate((selector) => {
        const element = document.querySelector(selector);
        if (element) {
          element.scrollTop = element.scrollHeight;
        }
      }, scrollableSelector);
      
      await delay(1500); // Wait for lazy loading
    }
  } catch (error) {
    console.warn('Scroll loading warning:', error);
    // Continue even if scrolling fails
  }
}

/**
 * Extract business data from search results
 * Note: Phone numbers are rarely visible in search results, but we'll get what we can
 */
async function extractBusinessDataWithPhones(page: Page, maxResults: number): Promise<ScrapedBusiness[]> {
  const businesses: ScrapedBusiness[] = [];
  
  try {
    console.log('Extracting business data from search results...');
    
    // Extract data from the search results page
    const extractedData = await page.evaluate((max) => {
      const results: ScrapedBusiness[] = [];
      
      // Find all business listing elements
      const listings = document.querySelectorAll('div[role="article"]');
      console.log(`Found ${listings.length} article elements`);
      
      for (let i = 0; i < Math.min(listings.length, max); i++) {
        const listing = listings[i];
        
        try {
          // Extract business name - try multiple selectors
          let businessName = '';
          const nameSelectors = [
            'div.fontHeadlineSmall',
            'div.fontHeadlineLarge', 
            'h3',
            'h2',
            'a[aria-label]'
          ];
          
          for (const selector of nameSelectors) {
            const nameEl = listing.querySelector(selector);
            if (nameEl) {
              businessName = nameEl.textContent?.trim() || nameEl.getAttribute('aria-label')?.trim() || '';
              if (businessName) break;
            }
          }
          
          if (!businessName || businessName.length < 2) continue;
          
          // Extract address
          let address = '';
          const addressEl = listing.querySelector('div.fontBodyMedium');
          if (addressEl) {
            // Get all text content, filter out ratings
            const text = addressEl.textContent?.trim() || '';
            // Address usually doesn't contain numbers like "4.5" or "stars"
            if (text && !text.match(/^\d+\.\d+/) && !text.includes('stars')) {
              address = text;
            }
          }
          
          // Try to extract phone - look for phone patterns
          let phoneRaw = '';
          const allText = listing.textContent || '';
          // Ghana phone pattern: 0XX XXX XXXX or +233 XX XXX XXXX
          const phoneMatch = allText.match(/(\+?233|0)\s*\d{2,3}\s*\d{3}\s*\d{4}/);
          if (phoneMatch) {
            phoneRaw = phoneMatch[0];
          }
          
          // Extract category - usually in smaller text
          let category = '';
          const categoryEls = listing.querySelectorAll('span.fontBodyMedium');
          for (const el of categoryEls) {
            const text = el.textContent?.trim() || '';
            if (text && text.length < 50 && !text.match(/\d+\.\d+/) && !text.includes('·')) {
              category = text;
              break;
            }
          }
          
          // Try to get link for GPS extraction
          let gpsLat: number | undefined;
          let gpsLng: number | undefined;
          const link = listing.querySelector('a[href*="maps/place"]');
          if (link) {
            const href = link.getAttribute('href') || '';
            const gpsMatch = href.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (gpsMatch) {
              gpsLat = parseFloat(gpsMatch[1]);
              gpsLng = parseFloat(gpsMatch[2]);
            }
          }
          
          results.push({
            businessName,
            phoneRaw: phoneRaw || undefined,
            address: address || undefined,
            gpsLat,
            gpsLng,
            category: category || undefined
          });
          
        } catch (err) {
          console.error('Error extracting business:', err);
        }
      }
      
      return results;
    }, maxResults);
    
    console.log(`Extracted ${extractedData.length} businesses from search results`);
    
    // For POC: Since phones are hard to get from search results, 
    // let's try clicking into a few listings to get phone numbers
    if (extractedData.length > 0) {
      await tryExtractPhonesFromDetails(page, extractedData, Math.min(5, extractedData.length));
    }
    
    return extractedData.filter(b => b.businessName && b.businessName.length > 2);
    
  } catch (error) {
    console.error('Data extraction error:', error);
    return businesses;
  }
}

/**
 * Try to extract phone numbers by clicking into first few listings
 * This is a best-effort approach - if it fails, we still have the basic data
 */
async function tryExtractPhonesFromDetails(page: Page, businesses: ScrapedBusiness[], count: number): Promise<void> {
  console.log(`Attempting to extract phone numbers from ${count} listings...`);
  
  for (let i = 0; i < count; i++) {
    try {
      // Find the listing link
      const links = await page.$$('a[href*="maps/place"]');
      if (i >= links.length) break;
      
      const link = links[i];
      
      // Click and wait
      await link.click();
      await delay(2000);
      
      // Try to extract phone
      const phoneData = await page.evaluate(() => {
        // Look for phone button
        const phoneBtn = document.querySelector('button[data-item-id^="phone:"]');
        if (phoneBtn) {
          const dataId = phoneBtn.getAttribute('data-item-id');
          if (dataId) {
            const match = dataId.match(/phone:tel:(.+)/);
            if (match) {
              return match[1].replace(/\+233/, '0');
            }
          }
        }
        
        // Alternative: look in aria-labels
        const phoneEls = document.querySelectorAll('[aria-label*="Phone"], [aria-label*="phone"]');
        for (const el of phoneEls) {
          const label = el.getAttribute('aria-label') || '';
          const match = label.match(/(\+?233|0)\s*\d{2,3}\s*\d{3}\s*\d{4}/);
          if (match) {
            return match[0];
          }
        }
        
        return null;
      });
      
      if (phoneData && businesses[i]) {
        businesses[i].phoneRaw = phoneData;
        console.log(`  ✓ Got phone for ${businesses[i].businessName}: ${phoneData}`);
      }
      
      // Go back
      await page.goBack();
      await delay(1000);
      
    } catch (error) {
      console.error(`Error getting phone for business ${i}:`, error);
      // Try to recover
      try {
        await page.goBack();
        await delay(500);
      } catch (e) {
        // If we can't go back, break the loop
        break;
      }
    }
  }
}

/**
 * Build search query for specific business types
 */
export function buildSearchQuery(businessType: string, location: string): string {
  return `${businessType} in ${location}`;
}

/**
 * Get suggested business types for Ghana
 */
export function getSuggestedBusinessTypes(): string[] {
  return [
    'hair salon',
    'barber shop',
    'chop bar',
    'restaurant',
    'tailor shop',
    'phone repair',
    'mechanic',
    'provisions store',
    'boutique',
    'beauty salon'
  ];
}

/**
 * Get suggested locations in Ghana
 */
export function getSuggestedLocations(): string[] {
  return [
    'Madina, Accra',
    'Kaneshie, Accra',
    'Osu, Accra',
    'Tema',
    'Kumasi Central',
    'Takoradi',
    'Cape Coast'
  ];
}
