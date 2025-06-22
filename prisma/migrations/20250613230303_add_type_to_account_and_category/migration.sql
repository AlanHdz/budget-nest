/*
  Warnings:

  - The `type` column on the `Account` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `type` column on the `Category` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Type" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "TypeAccount" AS ENUM ('DEBIT', 'CREDIT', 'CASH');

-- AlterTable
ALTER TABLE "Account" DROP COLUMN "type",
ADD COLUMN     "type" "TypeAccount" NOT NULL DEFAULT 'DEBIT';

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "type",
ADD COLUMN     "type" "Type" NOT NULL DEFAULT 'INCOME';
