import { Request, Response } from 'express';
import prisma from '../services/prisma.service';

export const getDailySummary = async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.params;
    
    // Find user by phone number
    const user = await prisma.user.findUnique({
      where: { phoneNumber }
    });

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found with this phone number',
        phoneNumber 
      });
    }
    
    // Get start and end of today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch transactions for today
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate totals and group transactions
    let totalIncome = 0;
    let totalExpense = 0;
    const incomeItems: Array<{item: string, units: string, amount: string}> = [];
    const expenseItems: Array<{item: string, units: string, amount: string}> = [];

    transactions.forEach(tx => {
      const amount = Number(tx.amount);
      const itemName = tx.item || tx.category || 'Unknown';
      const units = tx.units || '';
      
      if (tx.type === 'INCOME') {
        totalIncome += amount;
        incomeItems.push({
          item: itemName,
          units: units,
          amount: amount.toFixed(2)
        });
      } else if (tx.type === 'EXPENSE') {
        totalExpense += amount;
        expenseItems.push({
          item: itemName,
          units: units,
          amount: amount.toFixed(2)
        });
      }
    });

    // Generate PDF Summary
    let pdfUrl = '';
    try {
      // Import dynamically or assume it's available if imported at top. 
      // Since I can't see imports here, I'll rely on the existing import or add it if missing.
      // Assuming PdfGeneratorService is imported from '../services/workflow/pdf-generator.service'
      const { PdfGeneratorService } = require('../services/workflow/pdf-generator.service');
      
      pdfUrl = await PdfGeneratorService.generateDailySummaryPdf(
        user,
        startOfDay.toISOString().split('T')[0],
        incomeItems,
        expenseItems,
        { income: totalIncome, expense: totalExpense, profit: totalIncome - totalExpense }
      );
    } catch (pdfError) {
      console.error('Error generating daily summary PDF:', pdfError);
    }

    // Build formatted summary text for WhatsApp (Simplified)
    let summaryText = `📊 *Daily Summary : ${startOfDay.toISOString().split('T')[0]}*\n\n`;
    summaryText += `💰 *Income:* ${totalIncome.toFixed(2)} GHS\n`;
    summaryText += `💸 *Expenses:* ${totalExpense.toFixed(2)} GHS\n`;
    
    const profit = totalIncome - totalExpense;
    const profitEmoji = profit >= 0 ? '✅' : '⚠️';
    summaryText += `${profitEmoji} *Net Profit:* ${profit.toFixed(2)} GHS\n\n`;
    
    if (pdfUrl) {
      summaryText += `📄 *Download Full Report:* ${pdfUrl}`;
    }

    const summary = {
      date: startOfDay.toISOString().split('T')[0],
      currency: "GHS",
      totalIncome: totalIncome.toFixed(2),
      incomeItems: incomeItems,
      totalExpense: totalExpense.toFixed(2),
      expenseItems: expenseItems,
      netProfit: profit.toFixed(2),
      transactionCount: transactions.length,
      summaryText: summaryText,
      pdfUrl: pdfUrl
    };

    res.status(200).json(summary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.params;

    // Find user by phone number
    const user = await prisma.user.findUnique({
      where: { phoneNumber }
    });

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found with this phone number',
        phoneNumber 
      });
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.status(200).json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getMonthlySummary = async (req: Request, res: Response) => {
  try {
    const { phoneNumber, month } = req.params;
    
    // Find user by phone number
    const user = await prisma.user.findUnique({
      where: { phoneNumber }
    });

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found with this phone number',
        phoneNumber 
      });
    }
    
    // Parse month (format: "November 2025")
    const [monthName, yearStr] = month.split(' ');
    const year = parseInt(yearStr);
    const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();
    
    // Get start and end of month
    const startOfMonth = new Date(year, monthIndex, 1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const endOfMonth = new Date(year, monthIndex + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    // Fetch transactions for the month
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    // Calculate totals
    let salesTotal = 0;
    let costsTotal = 0;

    transactions.forEach(tx => {
      const amount = Number(tx.amount);
      if (tx.type === 'INCOME') {
        salesTotal += amount;
      } else if (tx.type === 'EXPENSE') {
        costsTotal += amount;
      }
    });

    const difference = salesTotal - costsTotal;

    // Build formatted summary text
    const summaryText = `📊 *Monthly Summary: ${month}*\n\n` +
      `💰 *Sales Total: GHS ${salesTotal.toFixed(2)}*\n\n` +
      `💸 *Costs Total: GHS ${costsTotal.toFixed(2)}*\n\n` +
      `${difference >= 0 ? '✅' : '⚠️'} *Difference: GHS ${difference.toFixed(2)}*`;

    const summary = {
      month: month,
      currency: "GHS",
      salesTotal: salesTotal.toFixed(2),
      costsTotal: costsTotal.toFixed(2),
      difference: difference.toFixed(2),
      transactionCount: transactions.length,
      summaryText: summaryText
    };

    res.status(200).json(summary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getMonths = async (req: Request, res: Response) => {
  try {
    const months: string[] = [];
    const today = new Date();
    
    // Generate last 12 months starting from current month
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const month = date.toLocaleString('en-GB', { month: 'long' });
      const year = date.getFullYear();
      months.push(`${month} ${year}`);
    }
    
    res.status(200).json({
      months: months,
      currentMonth: months[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
