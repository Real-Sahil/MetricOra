-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "focus_modules" TEXT[] DEFAULT ARRAY[]::TEXT[];

