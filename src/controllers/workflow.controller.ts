import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../services/prisma.service';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

export const processInput = async (req: Request, res: Response) => {
  try {
    const { phoneNumber, inputType, content, workflowSessionId } = req.body;
    
    // 1. Find or Create User
    let user = await prisma.user.findUnique({ where: { phoneNumber } });
    if (!user) {
      // For workflow auto-creation, use placeholder names
      // Users should register properly via /auth/register for complete profile
      user = await prisma.user.create({
        data: { 
          phoneNumber,
          firstName: 'User',
          lastName: phoneNumber.slice(-4) // Use last 4 digits as temporary last name
        }
      });
      console.log(`Created new user: ${phoneNumber}`);
    }

    // 2. AI Logic (Gemini 1.5 Flash)
    let extractedData = {
      type: "EXPENSE" as "INCOME" | "EXPENSE",
      category: "Uncategorized",
      amount: 0,
      currency: "GHS"
    };

    try {
      const prompt = `
        You are a bookkeeping assistant for an informal business in Ghana.
        Analyze the following text and extract the transaction details.
        Return ONLY a JSON object with the following keys:
        - type: "INCOME" or "EXPENSE"
        - category: A short category name (e.g., "Sales", "Transport", "Food", "Inventory")
        - amount: The numeric amount (number only)
        - currency: The currency code (default "GHS")
        
        Input Text: "${content}"
        
        JSON Response:
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Clean up markdown code blocks if present
      const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
      extractedData = JSON.parse(jsonString);

    } catch (aiError) {
      console.error("Gemini AI Error:", aiError);
      // Fallback to basic regex if AI fails (or API key missing)
      const text = content.toLowerCase();
      if (text.match(/(sold|sale|sell|received|income)/)) extractedData.type = "INCOME";
      const amountMatch = text.match(/(\d+(\.\d{1,2})?)/);
      if (amountMatch) extractedData.amount = parseFloat(amountMatch[0]);
    }
    
    console.log(`Processed input for ${phoneNumber}: ${content} -> ${JSON.stringify(extractedData)}`);

    res.status(200).json({
      status: "SUCCESS",
      replyText: `✅ Recorded:${extractedData.type} ${extractedData.category} - ${extractedData.amount} ${extractedData.currency}. Is this correct?`,
      requiresConfirmation: true,
      extractedData
    });
  } catch (error) {
    console.error("Error in processInput:", error);
    res.status(500).json({ error: 'Internal Server Error' });
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
          rawText: "Workflow Entry", // Could be passed from workflow if needed
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
