import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "";

const api = axios.create({
  baseURL: `${API_BASE}/api`,
});

export async function loginService(email, password) {
  const { data } = await api.post("/auth/login", {
    email,
    password,
  });
  return data;
}

export async function registerService(email, password) {
  const { data } = await api.post("/auth/register", {
    email,
    password,
  });

  return data;
}
 