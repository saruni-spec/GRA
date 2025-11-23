import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../services/prisma.service';
import { downloadAudio, audioToBase64, cleanupAudioFile, getMimeType } from '../services/audio.service';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export const processInput = async (req: Request, res: Response) => {
  let audioFilePath: string | null = null;
  
  try {
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

    // 2. AI Logic (Gemini 2.0 Flash)
    let extractedData = {
      type: "EXPENSE" as "INCOME" | "EXPENSE",
      category: "Uncategorized",
      amount: 0,
      currency: "GHS"
    };

    let transcribedText = "";

    try {
      const prompt = `
        You are a bookkeeping assistant for an informal business in Ghana.
        Analyze the following input and extract the transaction details.
        Return ONLY a JSON object with the following keys:
        - type: "INCOME" or "EXPENSE"
        - category: A short category name (e.g., "Sales", "Transport", "Food", "Inventory")
        - amount: The numeric amount (number only)
        - currency: The currency code (default "GHS")
        
        JSON Response:
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
        
        transcribedText = `[Audio transcribed and processed]`;
        
      } 
      // Handle TEXT input
      else if (inputType === 'TEXT' && content) {
        const fullPrompt = prompt + `\nInput Text: "${content}"`;
        
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
        if (text.match(/(sold|sale|sell|received|income)/)) extractedData.type = "INCOME";
        const amountMatch = text.match(/(\d+(\.\d{1,2})?)/);
        if (amountMatch) extractedData.amount = parseFloat(amountMatch[0]);
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

    res.status(200).json({
      status: "SUCCESS",
      replyText: `✅ Recorded: ${extractedData.type} ${extractedData.category} - ${extractedData.amount} ${extractedData.currency}. Is this correct?`,
      requiresConfirmation: true,
      extractedData,
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
      const user = await prisma.user.findUnique({ where: { phoneNumber } });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // 2. Save Transaction
      const transaction = await prisma.transaction.create({
        data: {
          userId: user.id,
          type: transactionData.type,
          category: transactionData.category,
          amount: transactionData.amount,
          currency: transactionData.currency || "GHS",
          rawText: "Workflow Entry",
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