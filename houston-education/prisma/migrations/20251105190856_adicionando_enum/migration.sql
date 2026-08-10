-- CreateEnum
CREATE TYPE "public"."Perfil" AS ENUM ('ALUNO', 'MONITOR', 'ADMIN');

-- AlterTable
ALTER TABLE "public"."tb_aluno" ADD COLUMN     "perfil" "public"."Perfil" NOT NULL DEFAULT 'ALUNO';
