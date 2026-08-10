import path from "path";
import { Router, Request, Response } from "express";
import LoginController from "../../controllers/Login/LoginController.js";

const loginController = new LoginController();
const router = Router();

// servir a página para não dar err no render
router.get("/", (req: Request, res: Response) => {
    res.sendFile("login.html", {root : "public/pages"}) // olhar o servimento de arquivo estático no server
    // res.sendFile(path.join(process.cwd(), "public", "login.html"));
});


// processar o login
router.post("/", loginController.login);

export default router;
