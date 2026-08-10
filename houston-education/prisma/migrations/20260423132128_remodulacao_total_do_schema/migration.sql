/*
  Warnings:

  - You are about to drop the `tb_aluno` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tb_disciplina` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tb_inscricoes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tb_monitor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tb_monitoria` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."tb_inscricoes" DROP CONSTRAINT "tb_inscricoes_alunoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."tb_inscricoes" DROP CONSTRAINT "tb_inscricoes_monitoriaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."tb_monitor" DROP CONSTRAINT "tb_monitor_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."tb_monitoria" DROP CONSTRAINT "tb_monitoria_disciplinaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."tb_monitoria" DROP CONSTRAINT "tb_monitoria_monitorId_fkey";

-- DropTable
DROP TABLE "public"."tb_aluno";

-- DropTable
DROP TABLE "public"."tb_disciplina";

-- DropTable
DROP TABLE "public"."tb_inscricoes";

-- DropTable
DROP TABLE "public"."tb_monitor";

-- DropTable
DROP TABLE "public"."tb_monitoria";

-- DropEnum
DROP TYPE "public"."Perfil";

-- CreateTable
CREATE TABLE "public"."perfil" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "perfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."aluno" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "matricula" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "perfilId" INTEGER NOT NULL,

    CONSTRAINT "aluno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."disciplina" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "disciplina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."monitoria" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "nome_monitoria" TEXT NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3) NOT NULL,
    "local" TEXT,
    "monitorId" TEXT NOT NULL,
    "disciplinaId" INTEGER NOT NULL,

    CONSTRAINT "monitoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."inscricao" (
    "id" SERIAL NOT NULL,
    "alunoId" TEXT NOT NULL,
    "monitoriaId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inscricao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "perfil_nome_key" ON "public"."perfil"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "aluno_email_key" ON "public"."aluno"("email");

-- CreateIndex
CREATE UNIQUE INDEX "aluno_matricula_key" ON "public"."aluno"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "inscricao_alunoId_monitoriaId_key" ON "public"."inscricao"("alunoId", "monitoriaId");

-- AddForeignKey
ALTER TABLE "public"."aluno" ADD CONSTRAINT "aluno_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "public"."perfil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."monitoria" ADD CONSTRAINT "monitoria_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "public"."aluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."monitoria" ADD CONSTRAINT "monitoria_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "public"."disciplina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inscricao" ADD CONSTRAINT "inscricao_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "public"."aluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inscricao" ADD CONSTRAINT "inscricao_monitoriaId_fkey" FOREIGN KEY ("monitoriaId") REFERENCES "public"."monitoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
