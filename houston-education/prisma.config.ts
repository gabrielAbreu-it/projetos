import path from "node:path";
import { config } from "dotenv";
config({ path: ".env" });
config({ path: "config/.env.db" });
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: path.join(import.meta.dirname, "prisma/schema.prisma"),
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
});
