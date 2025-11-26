import { Request, Response } from 'express';
import prisma from '../services/prisma.service';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // 1. Total Users
    const totalUsers = await prisma.user.count();

    // 2. Total Taxes (Sum of INCOME transactions categorized as Tax or type TAX)
    // Adjust logic based on your specific schema usage. 
    // Assuming TransactionType.TAX or category "Tax"
    const totalTaxesResult = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        OR: [
          { type: 'TAX' },
          { category: { contains: 'Tax', mode: 'insensitive' } }
        ]
      }
    });
    const totalTaxes = totalTaxesResult._sum.amount || 0;

    // 3. Total Sales (Sum of INCOME transactions, excluding Tax)
    const totalSalesResult = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        type: 'INCOME',
        NOT: {
          category: { contains: 'Tax', mode: 'insensitive' }
        }
      }
    });
    const totalSales = totalSalesResult._sum.amount || 0;

    // 4. Total Expenses
    const totalExpensesResult = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { type: 'EXPENSE' }
    });
    const totalExpenses = totalExpensesResult._sum.amount || 0;

    // 5. Sales Trend (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const salesTrendRaw = await prisma.transaction.groupBy({
      by: ['createdAt'],
      where: {
        type: 'INCOME',
        createdAt: { gte: sevenDaysAgo }
      },
      _sum: { amount: true }
    });

    // Process raw trend data to group by day
    const salesTrendMap = new Map<string, number>();
    salesTrendRaw.forEach(item => {
      const dateStr = item.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
      const current = salesTrendMap.get(dateStr) || 0;
      salesTrendMap.set(dateStr, current + (Number(item._sum.amount) || 0));
    });

    // Format for frontend (Day name)
    const salesTrend = Array.from(salesTrendMap.entries()).map(([date, amount]) => {
      const d = new Date(date);
      return {
        date: d.toLocaleDateString('en-US', { weekday: 'short' }),
        amount
      };
    });

    // 6. Expenses Trend (Last 7 days)
    const expensesTrendRaw = await prisma.transaction.groupBy({
      by: ['createdAt'],
      where: {
        type: 'EXPENSE',
        createdAt: { gte: sevenDaysAgo }
      },
      _sum: { amount: true }
    });

    const expensesTrendMap = new Map<string, number>();
    expensesTrendRaw.forEach(item => {
      const dateStr = item.createdAt.toISOString().split('T')[0];
      const current = expensesTrendMap.get(dateStr) || 0;
      expensesTrendMap.set(dateStr, current + (Number(item._sum.amount) || 0));
    });

    const expensesTrend = Array.from(expensesTrendMap.entries()).map(([date, amount]) => {
      const d = new Date(date);
      return {
        date: d.toLocaleDateString('en-US', { weekday: 'short' }),
        amount
      };
    });

    res.json({
      totalUsers,
      totalTaxes,
      totalSales,
      totalExpenses,
      salesTrend,
      expensesTrend
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

export const getUserSummaries = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        transactions: true
      }
    });

    const userSummaries = users.map(user => {
      // Calculate totals in memory for now (or use raw SQL for performance on large datasets)
      const totalSales = user.transactions
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const taxesPaid = user.transactions
        .filter(t => t.type === 'TAX' || t.category.toLowerCase().includes('tax'))
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        id: user.id,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A',
        businessName: user.businessName || 'N/A',
        phoneNumber: user.phoneNumber,
        tin: user.tinNumber || 'N/A',
        totalSales,
        taxesPaid,
        status: 'Active' // Placeholder logic
      };
    });

    res.json(userSummaries);
  } catch (error) {
    console.error('Error fetching user summaries:', error);
    res.status(500).json({ error: 'Failed to fetch user summaries' });
  }
};
