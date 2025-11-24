-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'TAX';

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "item" TEXT,
ADD COLUMN     "units" TEXT;
