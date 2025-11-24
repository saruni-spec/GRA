/*
  Warnings:

  - A unique constraint covering the columns `[nationalId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "nationalId" TEXT,
ADD COLUMN     "totRegistered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "totRegistrationDate" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "users_nationalId_key" ON "users"("nationalId");
