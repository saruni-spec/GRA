import { Request, Response } from 'express';
import prisma from '../services/prisma.service';

export const getTransactionsSummary = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate as string);
    }
    
    const whereClause = Object.keys(dateFilter).length > 0 
      ? { createdAt: dateFilter } 
      : {};

    // Fetch all transactions
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' }
    });

    // Calculate totals
    let totalIncome = 0;
    let totalExpenses = 0;
    let totalTaxes = 0;

    transactions.forEach(tx => {
      const amount = Number(tx.amount);
      if (tx.type === 'INCOME') {
        totalIncome += amount;
      } else if (tx.type === 'EXPENSE') {
        totalExpenses += amount;
      } else if (tx.type === 'TAX') {
        totalTaxes += amount;
      }
    });

    // Calculate trends (last 7 days)
    const trends = calculateTrends(transactions);

    const summary = {
      totalIncome: totalIncome.toFixed(2),
      totalExpenses: totalExpenses.toFixed(2),
      totalTaxes: totalTaxes.toFixed(2),
      netProfit: (totalIncome - totalExpenses - totalTaxes).toFixed(2),
      transactionCount: transactions.length,
      currency: "GHS",
      incomeTrend: trends.income,
      expensesTrend: trends.expenses,
      taxesTrend: trends.taxes
    };

    res.status(200).json(summary);
  } catch (error) {
    console.error('Error fetching transactions summary:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getAllTransactions = async (req: Request, res: Response) => {
  try {
    const { 
      type,
      search,
      startDate, 
      endDate, 
      limit = '50', 
      offset = '0',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build where clause
    const whereClause: any = {};
    
    if (type && ['INCOME', 'EXPENSE', 'TAX'].includes(type as string)) {
      whereClause.type = type;
    }
    
    // Search across user fields (name, phone, business name)
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      whereClause.user = {
        OR: [
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { phoneNumber: { contains: searchTerm } },
          { businessName: { contains: searchTerm, mode: 'insensitive' } }
        ]
      };
    }
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        whereClause.createdAt.lte = new Date(endDate as string);
      }
    }

    // Parse pagination
    const limitNum = Math.min(parseInt(limit as string), 100);
    const offsetNum = parseInt(offset as string);

    // Fetch transactions
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
        take: limitNum,
        skip: offsetNum,
        orderBy: { [sortBy as string]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
              businessName: true
            }
          }
        }
      }),
      prisma.transaction.count({ where: whereClause })
    ]);

    res.status(200).json({
      transactions,
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < total
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getTransactionsByUser = async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.params;
    const { type, limit = '50' } = req.query;

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

    // Build where clause
    const whereClause: any = { userId: user.id };
    if (type && ['INCOME', 'EXPENSE', 'TAX'].includes(type as string)) {
      whereClause.type = type;
    }

    // Fetch transactions
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' }
    });

    // Calculate summary
    let totalIncome = 0;
    let totalExpenses = 0;
    let totalTaxes = 0;

    transactions.forEach(tx => {
      const amount = Number(tx.amount);
      if (tx.type === 'INCOME') {
        totalIncome += amount;
      } else if (tx.type === 'EXPENSE') {
        totalExpenses += amount;
      } else if (tx.type === 'TAX') {
        totalTaxes += amount;
      }
    });

    res.status(200).json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        businessName: user.businessName
      },
      transactions,
      summary: {
        totalIncome: totalIncome.toFixed(2),
        totalExpenses: totalExpenses.toFixed(2),
        totalTaxes: totalTaxes.toFixed(2),
        netProfit: (totalIncome - totalExpenses - totalTaxes).toFixed(2),
        transactionCount: transactions.length
      }
    });
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Helper function to calculate daily trends
function calculateTrends(transactions: any[]) {
  const trendsMap = {
    income: new Map<string, number>(),
    expenses: new Map<string, number>(),
    taxes: new Map<string, number>()
  };

  transactions.forEach(tx => {
    const date = tx.createdAt.toISOString().split('T')[0];
    const amount = Number(tx.amount);

    if (tx.type === 'INCOME') {
      trendsMap.income.set(date, (trendsMap.income.get(date) || 0) + amount);
    } else if (tx.type === 'EXPENSE') {
      trendsMap.expenses.set(date, (trendsMap.expenses.get(date) || 0) + amount);
    } else if (tx.type === 'TAX') {
      trendsMap.taxes.set(date, (trendsMap.taxes.get(date) || 0) + amount);
    }
  });

  // Convert maps to arrays and sort by date
  const toArray = (map: Map<string, number>) => 
    Array.from(map.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

  return {
    income: toArray(trendsMap.income),
    expenses: toArray(trendsMap.expenses),
    taxes: toArray(trendsMap.taxes)
  };
}
