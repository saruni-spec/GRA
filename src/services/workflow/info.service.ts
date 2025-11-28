import { GoogleGenerativeAI } from '@google/generative-ai';
import { getTOTBookkeepingContext } from '../../services/pdf.service';
import { generateAudioResponse } from '../../services/tts.service';

export class InfoService {
  private model: any;

  constructor() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    this.model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  }

  /**
   * Handles INFO intent: Queries PDF knowledge base and optionally generates audio
   */
  async handleInfoRequest(
    userQuestion: string, 
    isAudioInput: boolean
  ): Promise<{ replyText: string, replyAudioUrl?: string }> {
    
    let replyText = "";
    let replyAudioUrl: string | undefined;

    try {
      // 1. Get PDF Context
      const pdfContext = await getTOTBookkeepingContext();
      
      // 2. Generate Answer using LLM
      const infoPrompt = `
        You are an assistant helping informal businesses in Ghana with tax and bookkeeping questions.
        
        Use the following official TOT Bookkeeping Guide to answer the user's question accurately:
        
        ${pdfContext}
        
        User's question: "${userQuestion}"
        
        Provide a clear, helpful answer based on the official guide. Keep it concise (2-3 sentences max). 
        If the guide doesn't cover the topic, say so politely and suggest contacting GRA directly.
      `;
      
      const infoResult = await this.model.generateContent(infoPrompt);
      const infoResponse = await infoResult.response;
      replyText = infoResponse.text();

      // 3. Generate Audio Response if input was audio
      if (isAudioInput) {
        try {
          replyAudioUrl = await generateAudioResponse(replyText);
        } catch (ttsError) {
          console.error("TTS Generation failed:", ttsError);
          // Continue without audio
        }
      }

    } catch (error) {
      console.error('Error handling INFO request:', error);
      replyText = "I can help with that. Please contact GRA for detailed information.";
    }

    return { replyText, replyAudioUrl };
  }
}
