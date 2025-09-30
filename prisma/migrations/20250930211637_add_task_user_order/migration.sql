-- CreateTable
CREATE TABLE "public"."TaskUserOrder" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskUserOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskUserOrder_taskId_idx" ON "public"."TaskUserOrder"("taskId");

-- CreateIndex
CREATE INDEX "TaskUserOrder_userId_idx" ON "public"."TaskUserOrder"("userId");

-- CreateIndex
CREATE INDEX "TaskUserOrder_order_idx" ON "public"."TaskUserOrder"("order");

-- CreateIndex
CREATE UNIQUE INDEX "TaskUserOrder_taskId_userId_key" ON "public"."TaskUserOrder"("taskId", "userId");

-- AddForeignKey
ALTER TABLE "public"."TaskUserOrder" ADD CONSTRAINT "TaskUserOrder_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskUserOrder" ADD CONSTRAINT "TaskUserOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
