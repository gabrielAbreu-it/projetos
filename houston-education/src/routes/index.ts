import { Response, Request } from "express";
import fs from "fs";
import path from "path";

import { Router } from "express";
import alunoRoutes from "./Aluno/alunoRoutes.js"
import loginRoutes from "./Paginas/loginRoutes.js"
import homeRoutes from "./Paginas/homeRoutes.js";
import monitoriaRoutes from "./Monitoria/monitoriaRoutes.js"
import disciplinaRoutes from "./Disciplina/disciplinaRoutes.js"
import localRoutes from "./Local/localRoutes.js"
import campusRoutes from "./Campus/campusRoutes.js"
import cursoRoutes from "./Curso/cursoRoutes.js"
import inscriacaoRoutes from "./Inscricao/inscricaoRoutes.js"
import auditoriaRoutes from "./Auditoria/auditoriaRoutes.js";
import { autenticadoCookie } from "../middlewares/autenticadoMiddleware.js";
const router = Router();


router.get("/", (_req: Request, res: Response) => {
  res.redirect("pages/login.html");
}); // funciona apenas localmente

// rotas de servir as páginas

router.get("/dashboard-admin", autenticadoCookie, (req: any, res: Response, next: any) => {
  if (req.user?.perfil !== "ADMIN") {
    return res.redirect("/pages/naoAutorizado.html");
  }
  next();
}, (_req: Request, res: Response) => {
  res.sendFile("dashboardAdmin.html", { root: "public/pages" });
});

router.get("/dashboard-usuarios", autenticadoCookie, (req: any, res: Response, next: any) => {
  if (req.user?.perfil !== "ADMIN") {
    return res.redirect("/pages/naoAutorizado.html");
  }
  next();
}, (_req: Request, res: Response) => {
  res.sendFile("dashboardUsuarios.html", { root: "public/pages" });
});

router.get("/dashboard-locais", autenticadoCookie, (req: any, res: Response, next: any) => {
  if (req.user?.perfil !== "ADMIN") {
    return res.redirect("/pages/naoAutorizado.html");
  }
  next();
}, (_req: Request, res: Response) => {
  res.sendFile("dashboardLocais.html", { root: "public/pages" });
});

router.get("/dashboard-disciplinas", autenticadoCookie, (req: any, res: Response, next: any) => {
  if (req.user?.perfil !== "ADMIN") {
    return res.redirect("/pages/naoAutorizado.html");
  }
  next();
}, (_req: Request, res: Response) => {
  res.sendFile("dashboardDisciplinas.html", { root: "public/pages" });
});

router.get("/dashboard-cursos", autenticadoCookie, (req: any, res: Response, next: any) => {
  if (req.user?.perfil !== "ADMIN") {
    return res.redirect("/pages/naoAutorizado.html");
  }
  next();
}, (_req: Request, res: Response) => {
  res.sendFile("dashboardCursos.html", { root: "public/pages" });
});

router.get("/dashboard-auditoria", autenticadoCookie, (req: any, res: Response, next: any) => {
  if (req.user?.perfil !== "ADMIN") {
    return res.redirect("/pages/naoAutorizado.html");
  }
  next();
}, (_req: Request, res: Response) => {
  res.sendFile("dashboardAuditoria.html", { root: "public/pages" });
});

router.get("/gerenciar-monitorias", autenticadoCookie, (req: any, res: Response, next: any) => {
  if (req.user?.perfil !== "ADMIN" && req.user?.perfil !== "MONITOR") {
    return res.redirect("/pages/naoAutorizado.html");
  }
  next();
}, (_req: Request, res: Response) => {
  res.sendFile("gerenciarMonitorias.html", { root: "public/pages" });
});

router.get("/perfil", autenticadoCookie, (_req: Request, res: Response) => {
  res.sendFile("perfil.html", { root: "public/pages" });
});

router.get("/api/versao", (_req: Request, res: Response) => {
  const packageJsonPath = path.join(process.cwd(), "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  res.json({ versao: packageJson.version });
});

// rotas do backend

router.use("/alunos", alunoRoutes);
router.use("/disciplinas" , disciplinaRoutes )
router.use("/locais" , localRoutes )
router.use("/campus" , campusRoutes )
router.use("/cursos" , cursoRoutes )
router.use("/monitorias" , monitoriaRoutes )
router.use("/inscricoes" , inscriacaoRoutes)
router.use("/auditorias", auditoriaRoutes)

router.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logout realizado com sucesso" });
});

router.use("/login", loginRoutes);
router.use("/home" , homeRoutes )

export default router;
