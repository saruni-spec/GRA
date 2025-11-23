import { Request, Response } from 'express';
import prisma from '../services/prisma.service';
import { scrapeGoogleMaps, ScrapedBusiness } from '../services/scraper.service';
import { validateGhanaPhone, checkDuplicate } from '../services/phone-validator.service';
import { classifyBusiness, calculateConfidenceScore } from '../services/classifier.service';

/**
 * Trigger a scraping job to find businesses
 * POST /api/v1/osint/scrape
 * Body: { location, businessType, source }
 */
export const triggerScrape = async (req: Request, res: Response) => {
  try {
    const { location, businessType, source = 'GOOGLE_MAPS' } = req.body;
    
    // Validate input
    if (!location || !businessType) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'location and businessType are required'
      });
    }
    
    console.log(`Triggering scrape for "${businessType}" in "${location}"`);
    
    // Only Google Maps is implemented for POC
    if (source !== 'GOOGLE_MAPS') {
      return res.status(400).json({
        error: 'Invalid Source',
        message: 'Only GOOGLE_MAPS is supported in POC'
      });
    }

    // Scrape Google Maps
    const scrapedBusinesses = await scrapeGoogleMaps(businessType, location, 30);
    
    if (scrapedBusinesses.length === 0) {
      return res.status(200).json({
        jobId: `job_${Date.now()}`,
        status: 'COMPLETED',
        leadsFound: 0,
        message: 'No businesses found for the given query'
      });
    }

    // Process and save each business
    const savedLeads: any[] = [];
    let duplicateCount = 0;
    let invalidPhoneCount = 0;
    let noPhoneCount = 0;

    console.log(`Processing ${scrapedBusinesses.length} scraped businesses...`);

    for (const business of scrapedBusinesses) {
      try {
        console.log(`\nProcessing: ${business.businessName}`);
        console.log(`  - Phone: ${business.phoneRaw || 'NONE'}`);
        console.log(`  - Address: ${business.address || 'NONE'}`);
        console.log(`  - GPS: ${business.gpsLat ? `${business.gpsLat},${business.gpsLng}` : 'NONE'}`);
        
        // Validate phone number
        let validatedPhone = null;
        let normalizedPhone = null;
        
        if (business.phoneRaw) {
          validatedPhone = validateGhanaPhone(business.phoneRaw);
          
          if (validatedPhone) {
            normalizedPhone = validatedPhone.international;
            console.log(`  - Validated phone: ${normalizedPhone} (${validatedPhone.carrier})`);
            
            // Check for duplicates
            const isDuplicate = await checkDuplicate(normalizedPhone);
            if (isDuplicate) {
              console.log(`  - SKIPPED: Duplicate phone number`);
              duplicateCount++;
              continue; // Skip duplicate
            }
          } else {
            console.log(`  - Invalid phone format`);
            invalidPhoneCount++;
          }
        } else {
          console.log(`  - No phone number provided`);
          noPhoneCount++;
        }

        // Classify business
        const classification = classifyBusiness(
          business.businessName,
          business.category || ''
        );
        console.log(`  - Category: ${classification.type} (confidence: ${classification.confidence})`);

        // Calculate confidence score
        const confidenceScore = calculateConfidenceScore({
          source: source,
          hasValidPhone: !!validatedPhone,
          hasGPS: !!(business.gpsLat && business.gpsLng),
          businessName: business.businessName,
          isVerified: false
        });
        console.log(`  - Overall confidence: ${confidenceScore.toFixed(2)}`);

        // Save to database
        const lead = await prisma.lead.create({
          data: {
            source: source,
            businessName: business.businessName,
            phoneNumber: business.phoneRaw || null,
            normalizedPhone: normalizedPhone,
            location: business.address || location,
            gpsLat: business.gpsLat || null,
            gpsLng: business.gpsLng || null,
            category: classification.type,
            confidenceScore: confidenceScore,
            isOnboarded: false
          }
        });

        console.log(`  - ✅ SAVED to database (ID: ${lead.id})`);

        savedLeads.push({
          id: lead.id,
          businessName: lead.businessName,
          phone: normalizedPhone,
          category: classification.type,
          confidence: confidenceScore
        });

      } catch (error) {
        console.error(`  - ❌ ERROR processing business "${business.businessName}":`, error);
        // Continue with next business
      }
    }

    console.log(`\n=== SCRAPING SUMMARY ===`);
    console.log(`Total scraped: ${scrapedBusinesses.length}`);
    console.log(`Saved to DB: ${savedLeads.length}`);
    console.log(`Duplicates: ${duplicateCount}`);
    console.log(`Invalid phones: ${invalidPhoneCount}`);
    console.log(`No phone: ${noPhoneCount}`);

    res.status(200).json({
      jobId: `job_${Date.now()}`,
      status: 'COMPLETED',
      leadsFound: savedLeads.length,
      duplicatesSkipped: duplicateCount,
      invalidPhonesSkipped: invalidPhoneCount,
      totalScraped: scrapedBusinesses.length,
      leads: savedLeads.slice(0, 5) // Return first 5 as preview
    });

  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to scrape businesses'
    });
  }
};

/**
 * Get all leads from database
 * GET /api/v1/osint/leads
 * Query params: minConfidence, limit, offset
 */
export const getLeads = async (req: Request, res: Response) => {
  try {
    const minConfidence = parseFloat(req.query.minConfidence as string) || 0.60;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const leads = await prisma.lead.findMany({
      where: {
        confidenceScore: {
          gte: minConfidence
        }
      },
      orderBy: [
        { confidenceScore: 'desc' },
        { scrapedAt: 'desc' }
      ],
      take: limit,
      skip: offset
    });

    // Get total count
    const totalCount = await prisma.lead.count({
      where: {
        confidenceScore: {
          gte: minConfidence
        }
      }
    });

    res.status(200).json({
      leads,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });

  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to retrieve leads'
    });
  }
};
