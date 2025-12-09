-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "applicationDeadline" TIMESTAMP(3),
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT;

-- CreateTable
CREATE TABLE "ApplicationLog" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "changedBy" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApplicationLog_applicationId_idx" ON "ApplicationLog"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationLog_changedBy_idx" ON "ApplicationLog"("changedBy");

-- AddForeignKey
ALTER TABLE "ApplicationLog" ADD CONSTRAINT "ApplicationLog_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
