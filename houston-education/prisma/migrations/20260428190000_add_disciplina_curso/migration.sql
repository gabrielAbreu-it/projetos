-- CreateTable
CREATE TABLE "disciplina_curso" (
    "disciplinaId" INTEGER NOT NULL,
    "cursoId" INTEGER NOT NULL,

    CONSTRAINT "disciplina_curso_pkey" PRIMARY KEY ("disciplinaId","cursoId")
);

-- AddForeignKey
ALTER TABLE "disciplina_curso" ADD CONSTRAINT "disciplina_curso_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "disciplina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disciplina_curso" ADD CONSTRAINT "disciplina_curso_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing data
INSERT INTO "disciplina_curso" ("disciplinaId", "cursoId")
SELECT "id", "cursoId" FROM "disciplina";

-- DropForeignKey
ALTER TABLE "disciplina" DROP CONSTRAINT "disciplina_cursoId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "disciplina_nome_key";

-- AlterTable
ALTER TABLE "disciplina" DROP COLUMN "cursoId";
