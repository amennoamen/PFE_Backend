/*
  Warnings:

  - The values [TRANSMIT,LOGOUT] on the enum `ActionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ActionType_new" AS ENUM ('UPLOAD', 'VALIDATE', 'REJECT', 'DOWNLOAD', 'LOGIN', 'UPDATE_USER', 'DEACTIVATE_USER', 'CREATE_USER', 'SEND_TO_BC');
ALTER TABLE "audit_logs" ALTER COLUMN "action" TYPE "ActionType_new" USING ("action"::text::"ActionType_new");
ALTER TYPE "ActionType" RENAME TO "ActionType_old";
ALTER TYPE "ActionType_new" RENAME TO "ActionType";
DROP TYPE "ActionType_old";
COMMIT;
