import { api } from "./api";

export type LoginPayload = { username: string; password: string };
export type RegisterPayload = { username: string; email: string; password: string };

// Login -> returns { success, token, user }
export async function login(data: LoginPayload) {
  const res = await api.post("/api/login", data);
  return res.data;
}

// Register new user
export async function registerUser(data: RegisterPayload) {
  const res = await api.post("/api/register", data);
  return res.data;
}

// Send forgot-password email with reset link
export async function sendForgot(email: string) {
  const res = await api.post("/api/forgotpasssender", { email });
  return res.data;
}

// Reset password via token link: /forgotpass/:id/:token
export async function resetWithToken(id: string, token: string, password: string) {
  const res = await api.post(`/api/resetpass/${id}/${token}`, { password });
  return res.data;
}

// Change password from profile (requires username, oldPassword, newPassword)
export async function changePassword(username: string, oldPassword: string, newPassword: string) {
  const res = await api.post("/api/resetpass", { username, oldPassword, newPassword });
  return res.data;
}
