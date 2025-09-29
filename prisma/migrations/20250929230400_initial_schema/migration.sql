-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'TENANT');

-- CreateEnum
CREATE TYPE "public"."TaskFrequency" AS ENUM ('ONCE', 'DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'SKIPPED');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'PARTIAL');

-- CreateEnum
CREATE TYPE "public"."RequestStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'TENANT',
    "phoneNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TenantProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "roomId" TEXT,
    "monthlyRent" DECIMAL(10,2) NOT NULL,
    "rentDueDay" INTEGER NOT NULL,
    "depositAmount" DECIMAL(10,2),
    "securityDeposit" DECIMAL(10,2),
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "moveInDate" TIMESTAMP(3),
    "leaseStartDate" TIMESTAMP(3),
    "leaseEndDate" TIMESTAMP(3),
    "remarks" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Property" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "description" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Room" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "description" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "propertyId" TEXT NOT NULL,
    "roomId" TEXT,
    "frequency" "public"."TaskFrequency" NOT NULL DEFAULT 'ONCE',
    "intervalDays" INTEGER,
    "estimatedDuration" INTEGER,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "assignToAll" BOOLEAN NOT NULL DEFAULT false,
    "maxAssignments" INTEGER,
    "createdById" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TaskAssignment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedById" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "public"."TaskStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "recurrenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TaskCompletion" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "status" "public"."TaskStatus" NOT NULL DEFAULT 'COMPLETED',
    "completionNotes" TEXT,
    "photos" TEXT[],
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentType" TEXT NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidDate" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TenantRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "status" "public"."RequestStatus" NOT NULL DEFAULT 'OPEN',
    "priority" INTEGER NOT NULL DEFAULT 1,
    "response" TEXT,
    "respondedBy" TEXT,
    "respondedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TaskRecurrence" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "baseTaskId" TEXT NOT NULL,
    "nextDueDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskRecurrence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "refresh_token_expires_in" INTEGER,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "public"."User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "TenantProfile_userId_key" ON "public"."TenantProfile"("userId");

-- CreateIndex
CREATE INDEX "TenantProfile_propertyId_idx" ON "public"."TenantProfile"("propertyId");

-- CreateIndex
CREATE INDEX "TenantProfile_roomId_idx" ON "public"."TenantProfile"("roomId");

-- CreateIndex
CREATE INDEX "Property_name_idx" ON "public"."Property"("name");

-- CreateIndex
CREATE INDEX "Room_propertyId_idx" ON "public"."Room"("propertyId");

-- CreateIndex
CREATE INDEX "Room_name_idx" ON "public"."Room"("name");

-- CreateIndex
CREATE INDEX "Task_propertyId_idx" ON "public"."Task"("propertyId");

-- CreateIndex
CREATE INDEX "Task_roomId_idx" ON "public"."Task"("roomId");

-- CreateIndex
CREATE INDEX "Task_frequency_idx" ON "public"."Task"("frequency");

-- CreateIndex
CREATE INDEX "Task_isActive_idx" ON "public"."Task"("isActive");

-- CreateIndex
CREATE INDEX "TaskAssignment_taskId_idx" ON "public"."TaskAssignment"("taskId");

-- CreateIndex
CREATE INDEX "TaskAssignment_userId_idx" ON "public"."TaskAssignment"("userId");

-- CreateIndex
CREATE INDEX "TaskAssignment_dueDate_idx" ON "public"."TaskAssignment"("dueDate");

-- CreateIndex
CREATE INDEX "TaskAssignment_status_idx" ON "public"."TaskAssignment"("status");

-- CreateIndex
CREATE INDEX "TaskCompletion_taskId_idx" ON "public"."TaskCompletion"("taskId");

-- CreateIndex
CREATE INDEX "TaskCompletion_userId_idx" ON "public"."TaskCompletion"("userId");

-- CreateIndex
CREATE INDEX "TaskCompletion_completedAt_idx" ON "public"."TaskCompletion"("completedAt");

-- CreateIndex
CREATE INDEX "TaskCompletion_status_idx" ON "public"."TaskCompletion"("status");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "public"."Payment"("userId");

-- CreateIndex
CREATE INDEX "Payment_dueDate_idx" ON "public"."Payment"("dueDate");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "public"."Payment"("status");

-- CreateIndex
CREATE INDEX "TenantRequest_userId_idx" ON "public"."TenantRequest"("userId");

-- CreateIndex
CREATE INDEX "TenantRequest_status_idx" ON "public"."TenantRequest"("status");

-- CreateIndex
CREATE INDEX "TenantRequest_requestType_idx" ON "public"."TenantRequest"("requestType");

-- CreateIndex
CREATE INDEX "TaskRecurrence_taskId_idx" ON "public"."TaskRecurrence"("taskId");

-- CreateIndex
CREATE INDEX "TaskRecurrence_nextDueDate_idx" ON "public"."TaskRecurrence"("nextDueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "public"."Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "public"."Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "public"."VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "public"."VerificationToken"("identifier", "token");

-- AddForeignKey
ALTER TABLE "public"."TenantProfile" ADD CONSTRAINT "TenantProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TenantProfile" ADD CONSTRAINT "TenantProfile_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TenantProfile" ADD CONSTRAINT "TenantProfile_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Property" ADD CONSTRAINT "Property_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Room" ADD CONSTRAINT "Room_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Room" ADD CONSTRAINT "Room_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskAssignment" ADD CONSTRAINT "TaskAssignment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskAssignment" ADD CONSTRAINT "TaskAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskAssignment" ADD CONSTRAINT "TaskAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskCompletion" ADD CONSTRAINT "TaskCompletion_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskCompletion" ADD CONSTRAINT "TaskCompletion_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "public"."TaskAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskCompletion" ADD CONSTRAINT "TaskCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskCompletion" ADD CONSTRAINT "TaskCompletion_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TenantRequest" ADD CONSTRAINT "TenantRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TenantRequest" ADD CONSTRAINT "TenantRequest_respondedBy_fkey" FOREIGN KEY ("respondedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskRecurrence" ADD CONSTRAINT "TaskRecurrence_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
