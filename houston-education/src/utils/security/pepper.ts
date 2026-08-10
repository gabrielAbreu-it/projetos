export function getPepper(): string { 
    // função para pegar o pepper do .env - exclusivamente para o admin 
    const pepperB64Admin = process.env.ADMIN_PASSWORD_PEPPER;
    if (!pepperB64Admin) return "SEM_PEPPER_DEFINIDO";
    return Buffer.from(pepperB64Admin, "base64").toString("utf-8");

}