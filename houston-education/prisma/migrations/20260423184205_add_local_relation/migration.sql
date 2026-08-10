/*
  Warnings:

  - You are about to drop the column `local` on the `monitoria` table. All the data in the column will be lost.
  - Added the required column `localId` to the `monitoria` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."monitoria" DROP COLUMN "local",
ADD COLUMN     "localId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "public"."local" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "local_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."monitoria" ADD CONSTRAINT "monitoria_localId_fkey" FOREIGN KEY ("localId") REFERENCES "public"."local"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
