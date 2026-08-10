-- CreateTable
CREATE TABLE "public"."tb_aluno" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "matricula" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_aluno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tb_monitor" (
    "id" TEXT NOT NULL,

    CONSTRAINT "tb_monitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tb_disciplina" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "tb_disciplina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tb_monitoria" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "nome_monitoria" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "hora_inicio" TIMESTAMP(3) NOT NULL,
    "hora_fim" TIMESTAMP(3) NOT NULL,
    "local" TEXT,
    "monitorId" TEXT NOT NULL,
    "disciplinaId" TEXT NOT NULL,

    CONSTRAINT "tb_monitoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tb_inscricoes" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "alunoId" TEXT NOT NULL,
    "monitoriaId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tb_inscricoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tb_aluno_email_key" ON "public"."tb_aluno"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tb_aluno_matricula_key" ON "public"."tb_aluno"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "tb_inscricoes_alunoId_monitoriaId_key" ON "public"."tb_inscricoes"("alunoId", "monitoriaId");

-- AddForeignKey
ALTER TABLE "public"."tb_monitor" ADD CONSTRAINT "tb_monitor_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."tb_aluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tb_monitoria" ADD CONSTRAINT "tb_monitoria_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "public"."tb_monitor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tb_monitoria" ADD CONSTRAINT "tb_monitoria_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "public"."tb_disciplina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tb_inscricoes" ADD CONSTRAINT "tb_inscricoes_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "public"."tb_aluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tb_inscricoes" ADD CONSTRAINT "tb_inscricoes_monitoriaId_fkey" FOREIGN KEY ("monitoriaId") REFERENCES "public"."tb_monitoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
