/*
  Warnings:

  - You are about to alter the column `nome_monitoria` on the `monitoria` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(200)`.

*/
-- AlterTable
ALTER TABLE "public"."monitoria" ADD COLUMN     "descricao" VARCHAR(200),
ALTER COLUMN "nome_monitoria" SET DATA TYPE VARCHAR(200);
