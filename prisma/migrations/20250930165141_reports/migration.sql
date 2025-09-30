/*
  Warnings:

  - The values [TASK_COMPLETION,TENANT_PERFORMANCE,PROPERTY_OVERVIEW,OVERDUE_TASKS] on the enum `ReportType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `archivedAt` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `charts` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `data` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `dateRange` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `generatedAt` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Report` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."ReportType_new" AS ENUM ('TASKS', 'PAYMENTS', 'TENANTS', 'CUSTOM');
ALTER TABLE "public"."Report" ALTER COLUMN "type" TYPE "public"."ReportType_new" USING ("type"::text::"public"."ReportType_new");
ALTER TYPE "public"."ReportType" RENAME TO "ReportType_old";
ALTER TYPE "public"."ReportType_new" RENAME TO "ReportType";
DROP TYPE "public"."ReportType_old";
COMMIT;

-- DropIndex
DROP INDEX "public"."Report_createdAt_idx";

-- DropIndex
DROP INDEX "public"."Report_status_idx";

-- AlterTable
ALTER TABLE "public"."Report" DROP COLUMN "archivedAt",
DROP COLUMN "charts",
DROP COLUMN "data",
DROP COLUMN "dateRange",
DROP COLUMN "generatedAt",
DROP COLUMN "status",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- DropEnum
DROP TYPE "public"."ReportStatus";

-- CreateIndex
CREATE INDEX "Report_isActive_idx" ON "public"."Report"("isActive");
