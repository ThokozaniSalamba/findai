-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "proposedBy" TEXT NOT NULL DEFAULT 'customer';

-- CreateTable
CREATE TABLE "MessageRead" (
    "id" TEXT NOT NULL,
    "jobRequestId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageRead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MessageRead_jobRequestId_businessId_userId_key" ON "MessageRead"("jobRequestId", "businessId", "userId");
