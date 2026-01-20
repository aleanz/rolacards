-- AlterTable
ALTER TABLE "EventRegistration" ADD COLUMN     "paymentProof" TEXT,
ADD COLUMN     "paymentProofType" TEXT,
ADD COLUMN     "paymentVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "transferReference" TEXT,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedBy" TEXT;

-- CreateIndex
CREATE INDEX "EventRegistration_status_idx" ON "EventRegistration"("status");
