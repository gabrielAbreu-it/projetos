import cron from "node-cron";
import MonitoriaPrismaRepository from "../../repositories/Prisma/MonitoriaPrismaRepository.js";

export function monitoriasCron() {
  // roda a cada 10 minutos
  cron.schedule("*/10 * * * *", async () => {
    try {
      const repo = new MonitoriaPrismaRepository();
      await repo.marcarExpiradas();
      console.log("[CRON] Monitorias expiradas verificadas");
    } catch (err) {
      console.error("[CRON] Erro ao marcar expiradas:", err);
    }
  });
}
