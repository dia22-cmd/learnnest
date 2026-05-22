import type { RegisterPayload, UserOut, TokenData } from "../types/auth";

const BASE = "/api/v1/auth";

export async function register(payload: RegisterPayload): Promise<UserOut> {
  const res = await fetch(`${BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) {
    const detail = Array.isArray(json.detail) ? json.detail[0]?.msg : json.detail;
    throw new Error(detail ?? "Registration failed");
  }
  return json.data as UserOut;
}

export async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!res.ok) {
    const detail = Array.isArray(json.detail) ? json.detail[0]?.msg : json.detail;
    throw new Error(detail ?? "Login failed");
  }
  const token = (json.data as TokenData).token;
  localStorage.setItem("token", token);
  return token;
}

export async function getMe(): Promise<UserOut> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) {
    if (res.status === 401) localStorage.removeItem("token");
    throw new Error(json.detail ?? "Unauthorized");
  }
  return json.data as UserOut;
}

export function logout() {
  localStorage.removeItem("token");
}
