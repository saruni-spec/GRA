# Phone Number Extraction - Important Notes

## Issue Identified
Google Maps search results **do not display phone numbers** in the listing view. Phone numbers are only visible when you click into individual business details.

## Solution Implemented
The scraper now:
1. Gets all business listings from search results
2. **Clicks into each business** to open the details panel
3. Extracts phone number from the details view
4. Goes back to search results
5. Repeats for next business

## Performance Impact
⚠️ **This is significantly slower** than the original implementation:
- **Original**: ~5-10 seconds for 20 businesses
- **Enhanced**: ~60-90 seconds for 20 businesses (3-4 seconds per business)

## Why This Happens
- Each business requires:
  - Click action (500ms)
  - Wait for details to load (2000ms)
  - Extract data (500ms)
  - Navigate back (1500ms)
  - Total: ~4.5 seconds per business

## Recommendations

### For POC (Current Approach)
✅ **Use the enhanced scraper** - It's slower but gets phone numbers
- Limit results to 10-15 businesses per query
- Run scraping jobs during off-peak hours
- Consider it a background task

### For Production
Consider these alternatives:

1. **Use Google Places API** (Paid)
   - Official API with phone numbers included
   - Much faster and more reliable
   - Cost: ~$0.017 per request
   - Recommended for production

2. **Use Apify Google Maps Scraper** (Paid)
   - Pre-built scraper with phone extraction
   - Handles anti-bot measures
   - Cost: ~$0.50 per 1000 results

3. **Implement Job Queue**
   - Run scraping as background jobs
   - Process results asynchronously
   - Show progress to users

## Testing Tips

### Start Small
Test with small result sets first:
```bash
curl -X POST http://localhost:3000/api/v1/osint/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Madina, Accra",
    "businessType": "hair salon",
    "source": "GOOGLE_MAPS"
  }'
```

### Monitor Progress
Watch the server logs to see scraping progress:
```
Found 20 business listings to process
Processing 1/20: Ama's Beauty Salon
Processing 2/20: Grace Hair Studio
...
```

### Expected Results
With the enhanced scraper, you should now see:
- ✅ Phone numbers in most results (70-80% success rate)
- ✅ Valid Ghana phone numbers
- ✅ Proper carrier detection (MTN, Vodafone, AirtelTigo)

## Troubleshooting

### No Phone Numbers Still?
Some businesses genuinely don't have phone numbers listed on Google Maps. This is normal.

### Scraper Times Out?
- Reduce the number of results (default is 30, try 10-15)
- Increase timeout in Puppeteer settings
- Check your internet connection

### Google Blocking?
If you see CAPTCHA or blocking:
- Add delays between requests
- Use residential proxies (production)
- Rotate user agents

## Alternative: Manual Data Entry
For POC, you could also:
1. Scrape business names and locations only (fast)
2. Manually add phone numbers for 20-30 businesses
3. Focus on demonstrating the workflow rather than automation
