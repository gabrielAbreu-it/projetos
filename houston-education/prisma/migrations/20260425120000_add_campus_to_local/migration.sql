-- CreateTable
CREATE TABLE "campus" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "campus_pkey" PRIMARY KEY ("id")
);

-- Insert default campuses
INSERT INTO "campus" ("nome", "descricao") VALUES
('Asa Norte', 'Campus da Asa Norte da instituição'),
('Taguatinga', 'Campus de Taguatinga da instituição');

-- Add campusId to local with default 1
ALTER TABLE "local" ADD COLUMN "campusId" INTEGER NOT NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE "local" ADD CONSTRAINT "local_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex (unique constraint nome + campusId)
CREATE UNIQUE INDEX "local_nome_campusId_key" ON "local"("nome", "campusId");

-- DropDefault
ALTER TABLE "local" ALTER COLUMN "campusId" DROP DEFAULT;
