-- AlterTable
ALTER TABLE "User"
ADD COLUMN "googleId" TEXT,
ADD COLUMN "hasLocalPassword" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
