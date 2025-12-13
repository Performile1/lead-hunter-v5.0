import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { scrapeWebsite } from '../services/websiteScraperService.js';

const router = express.Router();

/**
 * POST /api/scrape/website
 * Scrape a website for e-commerce and logistics data
 * Public endpoint (no auth required for now, can add later)
 */
router.post('/website', asyncHandler(async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Validate URL format
  try {
    new URL(url);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  console.log(`🕷️ Scraping request for: ${url}`);

  try {
    const websiteData = await scrapeWebsite(url);
    res.json(websiteData);
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({ 
      error: 'Scraping failed',
      message: error.message 
    });
  }
}));

export default router;
