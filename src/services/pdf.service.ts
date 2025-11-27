import fs from 'fs';
import path from 'path';

let cachedPdfContent: string | null = null;

/**
 * Extract and cache text content from the TOT Bookkeeping PDF guide
 * Note: PDF text has been pre-extracted to tot_guide_text.txt for reliability
 */
export async function getTOTBookkeepingContent(): Promise<string> {
  // Return cached content if available
  if (cachedPdfContent !== null) {
    return cachedPdfContent;
  }

  try {
    const textPath = path.join(__dirname, '../../public/tot_guide_text.txt');
    
    // Read pre-extracted text file
    cachedPdfContent = fs.readFileSync(textPath, 'utf-8');
    
    if (cachedPdfContent) {
      console.log(`✅ TOT Guide loaded: ${cachedPdfContent.length} characters`);
    }
    
    return cachedPdfContent || '';
  } catch (error) {
    console.error('Error reading TOT Bookkeeping guide:', error);
    throw new Error('Failed to load TOT Bookkeeping guide');
  }
}

/**
 * Get a formatted version of the PDF content for LLM context
 */
export async function getTOTBookkeepingContext(): Promise<string> {
  const content = await getTOTBookkeepingContent();
  
  if (!content) {
    throw new Error('TOT guide content is empty');
  }
  
  return `
# TOT Bookkeeping Guide (Official Reference)

${content}

---
Use the information above to answer user questions accurately. Reference specific sections when relevant.
Keep your answers concise (2-3 sentences maximum).
  `.trim();
}
