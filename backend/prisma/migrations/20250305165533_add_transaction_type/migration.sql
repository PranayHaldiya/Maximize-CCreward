/*
  Warnings:

  - A unique constraint covering the columns `[creditCardId,categoryId,subCategoryId,transactionType]` on the table `reward_rules` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('ONLINE', 'OFFLINE', 'BOTH');

-- DropIndex
DROP INDEX "reward_rules_creditCardId_categoryId_subCategoryId_key";

-- AlterTable
ALTER TABLE "reward_rules" ADD COLUMN     "transactionType" "TransactionType" NOT NULL DEFAULT 'BOTH';

-- CreateIndex
CREATE UNIQUE INDEX "reward_rules_creditCardId_categoryId_subCategoryId_transact_key" ON "reward_rules"("creditCardId", "categoryId", "subCategoryId", "transactionType");
