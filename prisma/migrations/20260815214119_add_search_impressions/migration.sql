-- CreateTable
CREATE TABLE "SearchImpression" (
    "id" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "SearchImpression_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SearchImpression" ADD CONSTRAINT "SearchImpression_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
