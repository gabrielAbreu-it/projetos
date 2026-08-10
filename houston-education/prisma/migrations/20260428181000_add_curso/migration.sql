-- CreateTable
CREATE TABLE "curso" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "curso_pkey" PRIMARY KEY ("id")
);

-- Insert default cursos
INSERT INTO "curso" ("nome", "descricao") VALUES
('Ciência da Computação', 'Curso de Ciência da Computação'),
('Arquitetura', 'Curso de Arquitetura e Urbanismo'),
('Direito', 'Curso de Direito');

-- Add cursoId to disciplina with default 1
ALTER TABLE "disciplina" ADD COLUMN "cursoId" INTEGER NOT NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE "disciplina" ADD CONSTRAINT "disciplina_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "curso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DropDefault
ALTER TABLE "disciplina" ALTER COLUMN "cursoId" DROP DEFAULT;
