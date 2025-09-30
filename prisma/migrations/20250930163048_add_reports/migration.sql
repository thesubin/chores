-- CreateEnum
CREATE TYPE "public"."ReportType" AS ENUM ('TASK_COMPLETION', 'TENANT_PERFORMANCE', 'PROPERTY_OVERVIEW', 'OVERDUE_TASKS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."ReportStatus" AS ENUM ('DRAFT', 'GENERATED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "public"."Report" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."ReportType" NOT NULL,
    "status" "public"."ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "filters" JSONB,
    "dateRange" JSONB,
    "data" JSONB,
    "charts" JSONB,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "generatedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Report_type_idx" ON "public"."Report"("type");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "public"."Report"("status");

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "public"."Report"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
