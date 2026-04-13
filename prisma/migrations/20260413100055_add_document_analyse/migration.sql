-- CreateTable
CREATE TABLE "document_analyses" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "typeDocument" TEXT,
    "bcEntity" TEXT,
    "categorie" TEXT,
    "langue" TEXT,
    "pays" TEXT,
    "resume" TEXT,
    "bcFields" JSONB,
    "bcLines" JSONB,
    "scoreOcr" DOUBLE PRECISION,
    "scoreClassification" DOUBLE PRECISION,
    "scoreExtraction" DOUBLE PRECISION,
    "scoreGlobal" DOUBLE PRECISION,
    "statutValidation" TEXT,
    "actionRecommandee" TEXT,
    "texteExtrait" TEXT,
    "methodeOcr" TEXT,
    "nbMots" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "document_analyses_documentId_key" ON "document_analyses"("documentId");

-- AddForeignKey
ALTER TABLE "document_analyses" ADD CONSTRAINT "document_analyses_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
