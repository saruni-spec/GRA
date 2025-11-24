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
      }
    });

    // Calculate totals
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(tx => {
      if (tx.type === 'INCOME') {
        totalIncome += Number(tx.amount);
      } else {
        totalExpense += Number(tx.amount);
      }
    });

    const summary = {
      date: startOfDay.toISOString().split('T')[0],
      currency: "GHS",
      totalIncome: totalIncome.toFixed(2),
      totalExpense: totalExpense.toFixed(2),
      netProfit: (totalIncome - totalExpense).toFixed(2),
      transactionCount: transactions.length
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
