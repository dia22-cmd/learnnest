const BASE = "/api/v1/auth";

export interface RegisterPayload {
  email: string;
  password: string;
  full_name?: string;
}

export interface UserOut {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
}

export async function register(payload: RegisterPayload): Promise<UserOut> {
  const res = await fetch(`${BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail ?? "Registration failed");
  return json.data as UserOut;
}

export async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail ?? "Login failed");
  const token = json.data?.token as string;
  localStorage.setItem("token", token);
  return token;
}

export async function getMe(): Promise<UserOut> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail ?? "Unauthorized");
  return json.data as UserOut;
}

export function logout() {
  localStorage.removeItem("token");
}
