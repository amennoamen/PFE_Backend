-- AlterTable
ALTER TABLE "document_analyses" ADD COLUMN     "commentaireRejet" TEXT,
ADD COLUMN     "flags" TEXT[],
ADD COLUMN     "warnings" TEXT[];
