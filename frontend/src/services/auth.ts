import api from "./api";
import type { RegisterPayload, UserOut, TokenData } from "../types/auth";

const BASE = "/api/v1/auth";

export async function register(payload: RegisterPayload): Promise<UserOut> {
  const res = await api.post(`${BASE}/register`, payload);
  return res.data.data as UserOut;
}

export async function login(email: string, password: string): Promise<string> {
  const res = await api.post(`${BASE}/login`, { email, password });
  const token = (res.data.data as TokenData).token;
  localStorage.setItem("token", token);
  return token;
}

export async function getMe(): Promise<UserOut> {
  const res = await api.get(`${BASE}/me`);
  return res.data.data as UserOut;
}

export function logout() {
  localStorage.removeItem("token");
}
