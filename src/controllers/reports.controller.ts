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

    // Build formatted summary text for WhatsApp
    let summaryText = `📊 *Daily Summary : ${startOfDay.toISOString().split('T')[0]}*\n\n`;
    
    // Income section
    summaryText += `💰 *Total Income : ${totalIncome.toFixed(2)} GHS*\n`;
    if (incomeItems.length > 0) {
      incomeItems.forEach(item => {
        summaryText += `   • ${item.item}${item.units ? ` (${item.units})` : ''} - ${item.amount} GHS\n`;
      });
    } else {
      summaryText += `   No income recorded\n`;
    }
    
    summaryText += `\n`;
    
    // Expenses section
    summaryText += `💸 *Total Expenses : ${totalExpense.toFixed(2)} GHS*\n`;
    if (expenseItems.length > 0) {
      expenseItems.forEach(item => {
        summaryText += `   • ${item.item}${item.units ? ` (${item.units})` : ''} - ${item.amount} GHS\n`;
      });
    } else {
      summaryText += `   No expenses recorded\n`;
    }
    
    summaryText += `\n`;
    
    // Net profit
    const profit = totalIncome - totalExpense;
    const profitEmoji = profit >= 0 ? '✅' : '⚠️';
    summaryText += `${profitEmoji} *Net Profit : ${profit.toFixed(2)} GHS*\n\n`;
    summaryText += `📝 *Number of Recorded Transactions : ${transactions.length}*`;

    const summary = {
      date: startOfDay.toISOString().split('T')[0],
      currency: "GHS",
      totalIncome: totalIncome.toFixed(2),
      incomeItems: incomeItems,
      totalExpense: totalExpense.toFixed(2),
      expenseItems: expenseItems,
      netProfit: (totalIncome - totalExpense).toFixed(2),
      transactionCount: transactions.length,
      summaryText: summaryText
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
