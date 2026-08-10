-- AddForeignKey
ALTER TABLE "public"."auditoria" ADD CONSTRAINT "auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."aluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
