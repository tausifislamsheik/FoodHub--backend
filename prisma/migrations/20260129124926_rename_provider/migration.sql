/*
  Warnings:

  - The values [VENDOR] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `vendorId` on the `menus` table. All the data in the column will be lost.
  - You are about to drop the column `vendorId` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `vendorId` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the `vendors` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `providerId` to the `menus` table without a default value. This is not possible if the table is not empty.
  - Added the required column `providerId` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `providerId` to the `reviews` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('CUSTOMER', 'PROVIDER', 'ADMIN');
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'CUSTOMER';
COMMIT;

-- DropForeignKey
ALTER TABLE "menus" DROP CONSTRAINT "menus_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "vendors" DROP CONSTRAINT "vendors_userId_fkey";

-- DropIndex
DROP INDEX "menus_vendorId_category_idx";

-- DropIndex
DROP INDEX "menus_vendorId_idx";

-- DropIndex
DROP INDEX "menus_vendorId_isAvailable_idx";

-- DropIndex
DROP INDEX "orders_vendorId_createdAt_idx";

-- DropIndex
DROP INDEX "orders_vendorId_idx";

-- DropIndex
DROP INDEX "orders_vendorId_status_idx";

-- DropIndex
DROP INDEX "reviews_vendorId_createdAt_idx";

-- DropIndex
DROP INDEX "reviews_vendorId_idx";

-- DropIndex
DROP INDEX "reviews_vendorId_rating_idx";

-- AlterTable
ALTER TABLE "menus" DROP COLUMN "vendorId",
ADD COLUMN     "providerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "vendorId",
ADD COLUMN     "providerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "reviews" DROP COLUMN "vendorId",
ADD COLUMN     "providerId" TEXT NOT NULL;

-- DropTable
DROP TABLE "vendors";

-- CreateTable
CREATE TABLE "providers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shopName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "providers_userId_key" ON "providers"("userId");

-- CreateIndex
CREATE INDEX "providers_userId_idx" ON "providers"("userId");

-- CreateIndex
CREATE INDEX "providers_isApproved_idx" ON "providers"("isApproved");

-- CreateIndex
CREATE INDEX "providers_shopName_idx" ON "providers"("shopName");

-- CreateIndex
CREATE INDEX "menus_providerId_idx" ON "menus"("providerId");

-- CreateIndex
CREATE INDEX "menus_providerId_isAvailable_idx" ON "menus"("providerId", "isAvailable");

-- CreateIndex
CREATE INDEX "menus_providerId_category_idx" ON "menus"("providerId", "category");

-- CreateIndex
CREATE INDEX "orders_providerId_idx" ON "orders"("providerId");

-- CreateIndex
CREATE INDEX "orders_providerId_status_idx" ON "orders"("providerId", "status");

-- CreateIndex
CREATE INDEX "orders_providerId_createdAt_idx" ON "orders"("providerId", "createdAt");

-- CreateIndex
CREATE INDEX "reviews_providerId_idx" ON "reviews"("providerId");

-- CreateIndex
CREATE INDEX "reviews_providerId_rating_idx" ON "reviews"("providerId", "rating");

-- CreateIndex
CREATE INDEX "reviews_providerId_createdAt_idx" ON "reviews"("providerId", "createdAt");

-- AddForeignKey
ALTER TABLE "providers" ADD CONSTRAINT "providers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menus" ADD CONSTRAINT "menus_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
