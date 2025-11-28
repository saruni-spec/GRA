import { GoogleGenerativeAI } from '@google/generative-ai';
import { downloadAudio, audioToBase64, cleanupAudioFile, getMimeType } from '../../services/audio.service';

// Types
export type WorkflowIntent = "TRANSACTION" | "REGISTER" | "INFO" | "TAX_FILING";

export interface TransactionItem {
  type: "INCOME" | "EXPENSE" | "TAX";
  category: string;
  amount: number;
  currency: string;
  item?: string;
  units?: string;
  description?: string;
}

export interface ExtractedData {
  intent: WorkflowIntent;
  transcription?: string;
  transactions?: TransactionItem[]; 
  data?: TransactionItem; 
  reply?: string;
  replyAudioUrl?: string;
}

export class IntentService {
  private model: any;

  constructor() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    this.model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  }

  /**
   * Analyzes user input (Text or Audio) to determine intent and extract data
   */
  async analyzeInput(
    content?: string, 
    audioUrl?: string
  ): Promise<{ extractedData: ExtractedData, transcribedText: string }> {
    
    let audioFilePath: string | null = null;
    let extractedData: ExtractedData = {
      intent: "TRANSACTION",
      transactions: []
    };
    let transcribedText = "";

    try {
      const prompt = `
        You are an assistant for an informal business in Ghana to help them manage their business and taxes.
        Analyze the input and classify the user's INTENT.
        
        Possible Intents:
        1. TRANSACTION: Recording a sale, expense, or payment.
        2. REGISTER: User wants to register their business or update details.
        3. INFO: User is asking for information (e.g., "How do I pay taxes?", "What is my profit?").
        4. TAX_FILING: User wants to file taxes or declares tax-related info.

        Return ONLY a JSON object.
        
        Structure:
        {
          "intent": "TRANSACTION" | "REGISTER" | "INFO" | "TAX_FILING",
          "transcription": "The transcribed text of what the user said (CRITICAL: Must be accurate)",
          "transactions": [
            {
               // For TRANSACTION/TAX_FILING, extract each item mentioned:
               "type": "INCOME" or "EXPENSE" or "TAX",
               "category": "Sales", "Transport", "Food", "Income Tax", etc.,
               "amount": number (0 if not found),
               "currency": "GHS",
               "item": "What item/service (e.g., 'rice', 'transport', 'airtime')",
               "units": "Quantity with unit (e.g., '5 bags', '1 trip', '2 pieces')",
               "description": "Short summary of the transaction"
            }
          ],
          "reply": "A short, friendly response to the user describing what was done (max 1 sentence)."
        }
        
        Input to analyze:
      `;

      // Handle AUDIO input
      if (audioUrl) {
        console.log(`Processing audio input from: ${audioUrl}`);
        audioFilePath = await downloadAudio(audioUrl);
        const audioBase64 = audioToBase64(audioFilePath);
        const mimeType = getMimeType(audioFilePath);
        
        const result = await this.model.generateContent([
          { inlineData: { data: audioBase64, mimeType: mimeType } },
          { text: prompt }
        ]);
        
        const response = await result.response;
        const text = response.text();
        console.log(`Gemini response: ${text}`);
        
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        extractedData = JSON.parse(jsonString);
        
        transcribedText = extractedData.transcription || 
                          (extractedData.transactions && extractedData.transactions[0]?.description) || 
                          "[Audio processed]";

      } 
      // Handle TEXT input
      else if (content) {
        const fullPrompt = prompt + `\n"${content}"`;
        const result = await this.model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();
        
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        extractedData = JSON.parse(jsonString);
        
        transcribedText = content;
      } 
      else {
        throw new Error('Invalid input: must provide either content (TEXT) or audioUrl (AUDIO)');
      }

      // Normalize: If 'transactions' array is missing but 'data' exists (legacy prompt behavior fallback), map it
      if (!extractedData.transactions && extractedData.data) {
        extractedData.transactions = [extractedData.data];
      }
      // If neither exists, initialize empty array
      if (!extractedData.transactions) {
        extractedData.transactions = [];
      }

      return { extractedData, transcribedText };

    } catch (error) {
      console.error("Gemini AI Error:", error);
      // Fallback logic could go here, but for now re-throw
      throw error;
    } finally {
      if (audioFilePath) {
        await cleanupAudioFile(audioFilePath);
      }
    }
  }
}
