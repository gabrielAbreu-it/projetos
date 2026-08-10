import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 1,
  duration: "10s",
  thresholds: {
    http_req_duration: ["p(95)<300"],
    http_req_failed: ["rate<0.01"],
    checks: ["rate==1.0"], // todos os 5 checks devem passar para o teste não dar erro e quebrar no ci 
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export default function () {
  const loginRes = http.post(
    `${BASE_URL}/login`,
    JSON.stringify({ //user do seed
      email: "joao@email.com",
      senha: "J414!",
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );

  check(loginRes, {
    "login status": (r) => r.status === 200,
    "login retorna token": (r) => r.json("token") !== undefined,
  });

  const token = loginRes.json("token");

  const monitoriasRes = http.get(`${BASE_URL}/monitorias`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  check(monitoriasRes, {
    "getAll status é 200": (r) => r.status === 200,
    "retorna array": (r) => Array.isArray(r.json()),
    "tempo de resposta < 500ms": (r) => r.timings.duration < 500,
  });

  sleep(1);
}