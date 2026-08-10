import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 1,
  duration: "10s",
  thresholds: { //definindo os tresholds para aplicação no ci/cd
    http_req_duration: ["p(95)<300"],
    http_req_failed: ["rate<0.01"],
    checks: ["rate==1.0"],
  },
};


const BASE_URL = __ENV.BASE_URL || "http://localhost:3000"; // esse env é do próprio k6

export default function () {
  const res = http.get(`${BASE_URL}/login`);

  check(res,
    {
    "status é 200": (r) => r.status === 200,
    "body contém 'login'": (r) => r.body.includes("login"),
    "tempo de resposta < 500ms": (r) => r.timings.duration < 500,
  }
);

  sleep(1);
}