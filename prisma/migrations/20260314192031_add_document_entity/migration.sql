-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('EN_COURS', 'VALIDE', 'REJETE', 'DANS_BC');

-- CreateTable
CREATE TABLE "documents" (
    "id" SERIAL NOT NULL,
    "originalName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'EN_COURS',
    "extractedData" JSONB,
    "confidenceScore" DOUBLE PRECISION,
    "commentaire" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);
