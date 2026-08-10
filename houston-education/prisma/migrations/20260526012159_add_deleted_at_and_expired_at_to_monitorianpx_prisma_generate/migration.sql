-- AlterTable
ALTER TABLE "public"."monitoria" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "expiredAt" TIMESTAMP(3);
