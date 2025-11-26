import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../services/prisma.service';
import { downloadAudio, audioToBase64, cleanupAudioFile, getMimeType } from '../services/audio.service';

// 2. AI Logic (Gemini 2.0 Flash)
type WorkflowIntent = "TRANSACTION" | "REGISTER" | "INFO" | "TAX_FILING";

interface TransactionData {
      type: "INCOME" | "EXPENSE" | "TAX";
      category: string;
      amount: number;
      currency: string;
      item?: string;
      units?: string;
      description?: string;
}

interface ExtractedData {
      intent: WorkflowIntent;
      data: TransactionData;
      reply?: string;
}

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export const processInput = async (req: Request, res: Response) => {
  let audioFilePath: string | null = null;
  
  try {
    console.log(req.body);
    const { phoneNumber, inputType, content, audioUrl, workflowSessionId } = req.body;
    
    // 1. Find or Create User
    let user = await prisma.user.findUnique({ where: { phoneNumber } });
    if (!user) {
      user = await prisma.user.create({
        data: { 
          phoneNumber,
          firstName: 'User',
          lastName: phoneNumber.slice(-4)
        }
      });
      console.log(`Created new user: ${phoneNumber}`);
    }

    

    let extractedData: ExtractedData = {
      intent: "TRANSACTION",
      data: {
        type: "EXPENSE",
        category: "Uncategorized",
        amount: 0,
        currency: "GHS"
      }
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
          "data": {
             // For TRANSACTION, extract:
             "type": "INCOME" or "EXPENSE" (default EXPENSE),
             "category": "Sales", "Transport", "Food", etc.,
             "amount": number (0 if not found),
             "currency": "GHS",
             "item": "What item/service (e.g., 'rice', 'transport', 'airtime')",
             "units": "Quantity with unit (e.g., '5 bags', '1 trip', '2 pieces')",
             "description": "Short summary of the transaction"
             
             // For TAX_FILING, extract:
             "type": "TAX",
             "category": "Type of tax (e.g., 'Income Tax', 'VAT', 'Property Tax')",
             "amount": number,
             "currency": "GHS",
             "description": "Short summary"
          },
          "reply": "A short, friendly response to the user based on their intent (max 1 sentence)."
        }
        
        Input to analyze:
      `;

      // Handle AUDIO input
      if (inputType === 'AUDIO' && audioUrl) {
        console.log(`Processing audio input from: ${audioUrl}`);
        
        // Download audio file
        audioFilePath = await downloadAudio(audioUrl);
        
        // Convert to base64
        const audioBase64 = audioToBase64(audioFilePath);
        const mimeType = getMimeType(audioFilePath);
        
        console.log(`Audio file size: ${audioBase64.length} bytes (base64)`);
        console.log(`MIME type: ${mimeType}`);
        
        // FIXED: Proper structure for multimodal request with audio + text
        const result = await model.generateContent([
          {
            inlineData: {
              data: audioBase64,
              mimeType: mimeType
            }
          },
          {
            text: prompt
          }
        ]);
        
        const response = await result.response;
        const text = response.text();
        
        console.log(`Gemini response: ${text}`);
        
        // Clean up markdown code blocks if present
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        extractedData = JSON.parse(jsonString);
        
        transcribedText = `[Audio processed]`;
        
      } 
      // Handle TEXT input
      else if (inputType === 'TEXT' && content) {
        const fullPrompt = prompt + `\n"${content}"`;
        
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();
        
        // Clean up markdown code blocks if present
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        extractedData = JSON.parse(jsonString);
        
        transcribedText = content;
      } 
      else {
        throw new Error('Invalid input: must provide either content (TEXT) or audioUrl (AUDIO)');
      }

    } catch (aiError) {
      console.error("Gemini AI Error:", aiError);
      
      // Fallback to basic regex if AI fails (only works for text)
      if (inputType === 'TEXT' && content) {
        const text = content.toLowerCase();
        extractedData.intent = "TRANSACTION"; // Default fallback
        if (text.match(/(sold|sale|sell|received|income)/)) extractedData.data.type = "INCOME";
        else extractedData.data.type = "EXPENSE";
        
        const amountMatch = text.match(/(\d+(\.\d{1,2})?)/);
        if (amountMatch) extractedData.data.amount = parseFloat(amountMatch[0]);
        transcribedText = content;
      } else {
        // For audio, we can't fallback - re-throw the error
        throw aiError;
      }
    } finally {
      // Clean up audio file if it was downloaded
      if (audioFilePath) {
        await cleanupAudioFile(audioFilePath);
      }
    }
    
    console.log(`Processed ${inputType} input for ${phoneNumber}: ${transcribedText} -> ${JSON.stringify(extractedData)}`);

    // 3. Handle Intents
    let replyText = extractedData.reply || "Processed.";
    let requiresConfirmation = false;

    switch (extractedData.intent) {
      case 'TRANSACTION':
        const itemInfo = extractedData.data.item && extractedData.data.units 
          ? `${extractedData.data.units} of ${extractedData.data.item} - ` 
          : '';
        replyText = `✅ Recorded: ${extractedData.data.type} ${extractedData.data.category} - ${itemInfo}${extractedData.data.amount} ${extractedData.data.currency}. Is this correct?`;
        requiresConfirmation = true;
        break;
      
      case 'TAX_FILING':
        replyText = `📋 Tax Filing Initiated: ${extractedData.data.category} - ${extractedData.data.amount} ${extractedData.data.currency}. Shall we proceed?`;
        requiresConfirmation = true;
        break;

      case 'REGISTER':
        replyText = "📝 To register, please provide your full name and business location.";
        requiresConfirmation = false;
        break;

      case 'INFO':
        // Use the AI generated reply or a default
        if (!replyText) replyText = "Here is the information you requested.";
        requiresConfirmation = false;
        break;
        
      default:
        replyText = "I'm not sure I understood. Could you repeat that?";
        requiresConfirmation = false;
    }

    res.status(200).json({
      status: "SUCCESS",
      replyText,
      requiresConfirmation,
      extractedData, // Return full structure including intent and data
      transcribedText: inputType === 'AUDIO' ? transcribedText : undefined
    });
  } catch (error) {
    console.error("Error in processInput:", error);
    
    // Clean up audio file in case of error
    if (audioFilePath) {
      await cleanupAudioFile(audioFilePath);
    }
    
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to process input'
    });
  }
};

export const confirmTransaction = async (req: Request, res: Response) => {
  try {
    const { phoneNumber, confirmation, transactionData } = req.body;

    if (confirmation === 'YES' || confirmation === 'Yes') {
      // 1. Get User
      let user = await prisma.user.findUnique({ where: { phoneNumber } });
      if (!user) {
        //Create User
        user = await prisma.user.create({
          data: {
            phoneNumber,
            totRegistered: false,
            firstName:"",
            lastName:"",
            nationalId:""
            
          }
        });
      }

      // Handle new structure where data is nested in 'data' property
      const dataToSave: TransactionData = transactionData;

      // 2. Save Transaction
      const transaction = await prisma.transaction.create({
        data: {
          userId: user.id,
          type: dataToSave.type,
          category: dataToSave.category,
          amount: dataToSave.amount,
          currency: dataToSave.currency || "GHS",
          item: dataToSave.item,
          units: dataToSave.units,
          rawText: dataToSave.description,
          confidenceScore: 1.0
        }
      });

      console.log(`Saved transaction ${transaction.id} for ${phoneNumber}`);
      
      res.status(200).json({
        status: "SAVED",
        replyText: "Transaction saved successfully! 🎉"
      });
    } else {
      res.status(200).json({
        status: "CANCELLED",
        replyText: "Transaction cancelled."
      });
    }
  } catch (error) {
    console.error("Error in confirmTransaction:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};