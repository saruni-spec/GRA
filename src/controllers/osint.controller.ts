import { Request, Response } from 'express';
import prisma from '../services/prisma.service';

export const triggerScrape = async (req: Request, res: Response) => {
  try {
    const { location, businessType, source } = req.body;
    
    // TODO: Trigger Puppeteer script
    console.log(`Triggering scrape for ${businessType} in ${location}`);

    res.status(200).json({
      jobId: "job_" + Date.now(),
      status: "QUEUED"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getLeads = async (req: Request, res: Response) => {
  try {
    // TODO: Fetch from DB
    const leads = [
      {
        id: "mock-uuid",
        businessName: "Ama Seamstress",
        phoneNumber: "+233244123456",
        location: "Madina Market",
        confidenceScore: 0.85,
        source: "GOOGLE_MAPS"
      }
    ];

    res.status(200).json(leads);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
