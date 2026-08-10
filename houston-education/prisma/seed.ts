import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function adminPasswordB64(): Promise<string> {
  const senhaAdmin = process.env.ADMIN_PASSWORD;
  const pepperB64 = process.env.ADMIN_PASSWORD_PEPPER;

  if (!senhaAdmin) {
    throw new Error("ADMIN_PASSWORD não está definida no .env");
  }
  if (!pepperB64) {
    throw new Error("ADMIN_PASSWORD_PEPPER não está definida no .env");
  }

  const password = Buffer.from(senhaAdmin, "base64").toString("utf-8");
  const pepper = Buffer.from(pepperB64, "base64").toString("utf-8");

  // concatena senha + pepper e aplica bcrypt com salt 12
  const senhaComPepper = password + pepper;
  return bcrypt.hash(senhaComPepper, 12);
}

async function main() {
  // 1. Perfis
  const perfis = [
    { id: 1, nome: "ADMIN", descricao: "Administrador do sistema" },
    { id: 2, nome: "MONITOR", descricao: "Usuário que ministra monitorias" },
    { id: 3, nome: "ALUNO", descricao: "Usuário comum" },
  ];

  for (const perfil of perfis) {
    await prisma.perfil.upsert({
      where: { id: perfil.id },
      update: {},
      create: perfil,
    });
  }

  console.log("Seed concluído: 3 perfis inseridos/atualizados.");

  // 2. Alunos
  const adminSenhaHash = await adminPasswordB64();
  const pauloSenhaHash = await bcrypt.hash("P15l4!", 10);
  const joaoSenhaHash = await bcrypt.hash("J414!", 10);

  const alunos = [
    {
      nome: "Houston",
      email: "houston@sempreceub.com",
      senha: adminSenhaHash,
      matricula: "2024001",
      perfilId: 1,
    },
    {
      nome: "Monitor Paulo",
      email: "paulo@email.com",
      senha: pauloSenhaHash,
      matricula: "2024002",
      perfilId: 2,
    },
    {
      nome: "João",
      email: "joao@email.com",
      senha: joaoSenhaHash,
      matricula: "2024003",
      perfilId: 3,
    },
  ];

  for (const aluno of alunos) {
    await prisma.aluno.upsert({
      where: { email: aluno.email },
      update: { senha: aluno.senha },
      create: aluno,
    });
  }
  console.log("Seed concluído: 3 alunos inseridos/atualizados.");

  // 3. Cursos
  const cursos = [
    { nome: "Ciência da Computação" },
    { nome: "Arquitetura" },
    { nome: "Direito" },
  ];

  for (const curso of cursos) {
    const existe = await prisma.curso.findFirst({
      where: { nome: curso.nome },
    });
    if (!existe) {
      await prisma.curso.create({ data: curso });
    }
  }
  console.log("Seed concluído: 3 cursos inseridos/atualizados.");

  // 4. Disciplinas
  const disciplinasNomes = [
    "Banco de dados",
    "Lógica de programação",
    "Desenho Arquitetônico",
    "Teoria da Arquitetura",
    "Direito Constitucional",
    "Direito Penal",
  ];

  for (const nome of disciplinasNomes) {
    const existe = await prisma.disciplina.findFirst({
      where: { nome },
    });
    if (!existe) {
      await prisma.disciplina.create({ data: { nome } });
    }
  }
  console.log("Seed concluído: 6 disciplinas inseridas/atualizadas.");

  // 4.1 Relação Disciplina-Curso (N:M)
  const disciplinaCursoLinks = [
    { disciplinaNome: "Banco de dados", cursoNome: "Ciência da Computação" },
    { disciplinaNome: "Lógica de programação", cursoNome: "Ciência da Computação" },
    { disciplinaNome: "Desenho Arquitetônico", cursoNome: "Arquitetura" },
    { disciplinaNome: "Teoria da Arquitetura", cursoNome: "Arquitetura" },
    { disciplinaNome: "Direito Constitucional", cursoNome: "Direito" },
    { disciplinaNome: "Direito Penal", cursoNome: "Direito" },
  ];

  for (const link of disciplinaCursoLinks) {
    const disciplina = await prisma.disciplina.findFirst({
      where: { nome: link.disciplinaNome },
    });
    const curso = await prisma.curso.findFirst({
      where: { nome: link.cursoNome },
    });
    if (disciplina && curso) {
      const existe = await prisma.disciplinaCurso.findUnique({
        where: {
          disciplinaId_cursoId: {
            disciplinaId: disciplina.id,
            cursoId: curso.id,
          },
        },
      });
      if (!existe) {
        await prisma.disciplinaCurso.create({
          data: {
            disciplinaId: disciplina.id,
            cursoId: curso.id,
          },
        });
      }
    }
  }
  console.log("Seed concluído: vínculos disciplina-curso criados.");

  // 5. Campus
  const campusList = [
    { id: 1, nome: "Asa norte", descricao: "Campus localizado na Asa Norte" },
    { id: 2, nome: "Taguatinga", descricao: "Campus localizado em Taguatinga" },
  ];

  for (const campus of campusList) {
    await prisma.campus.upsert({
      where: { id: campus.id },
      update: {},
      create: campus,
    });
  }

  console.log("Seed concluído: 2 campus inseridos/atualizados.");

  // 6. Locais
  const locais = [
    { id: 1, nome: "Sala 170", campusId: 1 },
    { id: 2, nome: "Sala 160", campusId: 2 },
  ];

  for (const local of locais) {
    await prisma.local.upsert({
      where: { id: local.id },
      update: { campusId: local.campusId },
      create: local,
    });
  }

  console.log("Seed concluído: 2 locais inseridos/atualizados.");

  // 7. Monitorias
  const monitor = await prisma.aluno.findUnique({ where: { email: "paulo@email.com" } });
  const bd = await prisma.disciplina.findFirst({ where: { nome: "Banco de dados" } });
  const logica = await prisma.disciplina.findFirst({ where: { nome: "Lógica de programação" } });
  const sala170 = await prisma.local.findFirst({ where: { nome: "Sala 170" } });
  const sala160 = await prisma.local.findFirst({ where: { nome: "Sala 160" } });

  if (monitor && bd && sala170) {
    const m1 = await prisma.monitoria.findFirst({
      where: { nome_monitoria: "Monitoria de Banco de Dados" },
    });
    if (m1) {
      await prisma.monitoria.update({
        where: { id: m1.id },
        data: {
          inicio: new Date("2026-04-29T14:00:00Z"),
          fim: new Date("2026-04-29T16:00:00Z"),
        },
      });
    } else {
      await prisma.monitoria.create({
        data: {
          nome_monitoria: "Monitoria de Banco de Dados",
          inicio: new Date("2026-04-29T14:00:00Z"),
          fim: new Date("2026-04-29T16:00:00Z"),
          monitorId: monitor.id,
          disciplinaId: bd.id,
          localId: sala170.id,
        },
      });
    }
  }

  if (monitor && logica && sala160) {
    const m2 = await prisma.monitoria.findFirst({
      where: { nome_monitoria: "Monitoria de Lógica de Programação" },
    });
    if (m2) {
      await prisma.monitoria.update({
        where: { id: m2.id },
        data: {
          inicio: new Date("2026-04-30T10:00:00Z"),
          fim: new Date("2026-04-30T12:00:00Z"),
        },
      });
    } else {
      await prisma.monitoria.create({
        data: {
          nome_monitoria: "Monitoria de Lógica de Programação",
          inicio: new Date("2026-04-30T10:00:00Z"),
          fim: new Date("2026-04-30T12:00:00Z"),
          monitorId: monitor.id,
          disciplinaId: logica.id,
          localId: sala160.id,
        },
      });
    }
  }

  console.log("Seed concluído: 2 monitorias inseridas/atualizadas.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

