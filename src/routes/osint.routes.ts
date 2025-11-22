import express from 'express';
import * as osintController from '../controllers/osint.controller';

const router = express.Router();

// Trigger scraping job
router.post('/scrape', osintController.triggerScrape);

// Get leads
router.get('/leads', osintController.getLeads);

export default router;
