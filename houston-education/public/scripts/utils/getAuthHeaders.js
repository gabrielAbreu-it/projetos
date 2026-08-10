import { getCookie } from "./getCookie.js";

export function getAuthHeaders() {
    const token = localStorage.getItem("token") || getCookie("token");
    const headers = {};
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
}
