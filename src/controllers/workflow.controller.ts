import { Request, Response } from 'express';
import prisma from '../services/prisma.service';
import { IntentService, ExtractedData } from '../services/workflow/intent.service';
import { InfoService } from '../services/workflow/info.service';
import { TransactionService } from '../services/workflow/transaction.service';

// Initialize Services
const intentService = new IntentService();
const infoService = new InfoService();
const transactionService = new TransactionService();

export const processInput = async (req: Request, res: Response) => {
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

    // 2. Analyze Input (Intent & Data Extraction)
    const { extractedData, transcribedText } = await intentService.analyzeInput(content, audioUrl);
    
    console.log(`Processed ${audioUrl ? 'AUDIO' : 'TEXT'} input for ${phoneNumber}: ${transcribedText} -> ${JSON.stringify(extractedData)}`);

    // 3. Handle Intents
    let replyText = extractedData.reply || "Processed.";
    let requiresConfirmation = false;
    let replyAudioUrl: string | undefined;

    switch (extractedData.intent) {
      case 'TRANSACTION':
        // Format reply for single or multi-item transaction
        replyText = transactionService.formatTransactionReply(extractedData.transactions || []);
        requiresConfirmation = true;
        break;
      
      case 'TAX_FILING':
        // Use the first item for tax filing for now, or adapt for multi-filing
        const taxItem = extractedData.transactions?.[0];
        if (taxItem) {
          replyText = `📋 Tax Filing Initiated: ${taxItem.category} - ${taxItem.amount} ${taxItem.currency}. Shall we proceed?`;
          requiresConfirmation = true;
        } else {
          replyText = "Could not extract tax details. Please try again.";
          requiresConfirmation = false;
        }
        break;

      case 'REGISTER':
        replyText = "📝 To register, please provide your full name and business location.";
        requiresConfirmation = false;
        break;

      case 'INFO':
        // Use InfoService to handle PDF RAG + TTS
        const infoResult = await infoService.handleInfoRequest(transcribedText, !!audioUrl);
        replyText = infoResult.replyText;
        replyAudioUrl = infoResult.replyAudioUrl;
        
        // Add audio URL to extracted data for frontend consistency if needed
        extractedData.replyAudioUrl = replyAudioUrl;
        requiresConfirmation = false;
        break;
        
      default:
        replyText = "I'm not sure I understood. Could you repeat that?";
        requiresConfirmation = false;
    }

    res.status(200).json({
      status: "SUCCESS",
      replyText,
      replyAudioUrl,
      requiresConfirmation,
      extractedData, 
      transcribedText: audioUrl ? transcribedText : undefined
    });

  } catch (error) {
    console.error("Error in processInput:", error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to process input'
    });
  }
};

export const confirmTransaction = async (req: Request, res: Response) => {
  try {

    const { phoneNumber, confirmation, transactionData, extractedData } = req.body;

    // Support both legacy 'transactionData' (single) and new 'extractedData.transactions' (array)
    // If extractedData.transactions exists, use it. Otherwise fallback to transactionData wrapped in array.
    let transactionsToSave = [];
    
    if (extractedData && extractedData.transactions && Array.isArray(extractedData.transactions)) {
      transactionsToSave = extractedData.transactions;
    } else if (transactionData) {
      transactionsToSave = Array.isArray(transactionData) ? transactionData : [transactionData];
    } else {
       return res.status(400).json({ status: "ERROR", message: "No transaction data provided" });
    }

    console.log("DEBUG: transactionsToSave:", JSON.stringify(transactionsToSave, null, 2));

    if (!confirmation) {
      return res.status(200).json({ status: "CANCELLED", replyText: "Transaction cancelled." });
    }

    // Use TransactionService to confirm and save
    const result = await transactionService.confirmTransactions(phoneNumber, transactionsToSave);
    
    res.status(200).json(result);
    
  } catch (error) {
    console.error("Error in confirmTransaction:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};