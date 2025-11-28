import prisma from '../../services/prisma.service';
import { TransactionItem } from './intent.service';
import { PdfGeneratorService } from './pdf-generator.service';

export class TransactionService {
  
  /**
   * Formats the reply message for a list of transactions
   */
  formatTransactionReply(transactions: TransactionItem[]): string {
    if (transactions.length === 0) return "No transactions found.";
    
    if (transactions.length === 1) {
      const tx = transactions[0];
      const itemInfo = tx.item && tx.units ? `${tx.units} of ${tx.item} - ` : '';
      return `✅ Recorded: ${tx.type} ${tx.category} - ${itemInfo}${tx.amount} ${tx.currency}. Is this correct?`;
    } else {
      // Multi-item summary
      const itemsList = transactions.map(tx => 
        `- ${tx.item || 'Item'} (${tx.amount} ${tx.currency})`
      ).join('\n');
      const total = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
      
      return `✅ Recorded ${transactions.length} items:\n${itemsList}\n\nTotal: ${total} GHS. Is this correct?`;
    }
  }

  /**
   * Confirms and saves a batch of transactions
   */
  async confirmTransactions(
    phoneNumber: string, 
    transactions: TransactionItem[]
  ): Promise<{ status: string, replyText: string, pdfUrl?: string }> {


    
    try {
      // 1. Find or Create User
      let user = await prisma.user.findUnique({ where: { phoneNumber } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            phoneNumber,
            totRegistered: false,
            firstName: "User",
            lastName: phoneNumber.slice(-4),
            nationalId: ""
          }
        });
      }

      // 2. Validate Transactions
      const validTransactions = transactions.filter(tx => {
        console.log(tx);
        if (!tx.type) return false;
        const type = tx.type.toUpperCase();
        return type === "INCOME" || type === "EXPENSE" || type === "TAX";
      });

      if (validTransactions.length === 0) {
        return {
          status: "ERROR",
          replyText: "No valid transactions to save."
        };
      }

      // 3. Save Transactions (Batch)
      // Prisma createMany doesn't return the created records with IDs easily in all DBs, 
      // but we might need them. For now, createMany is fine as we just need to save them.
      // However, to generate a receipt with IDs or timestamps, we might want to fetch them back or loop.
      // Let's loop for now to be safe and get full objects if needed, or just use createMany for efficiency.
      // Given the likely small number (1-5 items), looping is fine.
      
      const savedTransactions = [];
      for (const tx of validTransactions) {
        console.log("2,",tx);
        const type = (tx.type ? tx.type.toUpperCase() : "EXPENSE") as "INCOME" | "EXPENSE" | "TAX";
        
        const savedTx = await prisma.transaction.create({
          data: {
            userId: user.id,
            type: type,
            category: tx.category || "Unspecified",
            amount: tx.amount || 0,
            currency: tx.currency || "GHS",
            item: tx.item || "Unspecified",
            units: tx.units || "Unspecified",
            rawText: tx.description || "Unspecified",
            confidenceScore: 1.0
          }
        });
        savedTransactions.push(savedTx);
      }

      console.log(`Saved ${savedTransactions.length} transactions for ${phoneNumber}`);

      // 4. Generate PDF Receipt
      let pdfUrl: string | undefined;
      try {
        pdfUrl = await PdfGeneratorService.generateTransactionReceipt(savedTransactions, user);
      } catch (pdfError) {
        console.error("Error generating PDF receipt:", pdfError);
        // Continue without PDF
      }

      // 5. Format Reply
      const itemsList = savedTransactions.map(tx => 
        `- ${tx.item || 'Item'} (${tx.amount} ${tx.currency})`
      ).join('\n');
      const totalAmount = savedTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
      
      let replyText = `✅ Saved ${savedTransactions.length} transactions successfully:\n${itemsList}\n\nTotal: ${totalAmount} GHS`;

      return {
        status: "SAVED",
        replyText,
        pdfUrl
      };

    } catch (error) {
      console.error("Error in confirmTransactions:", error);
      throw error;
    }
  }
}
