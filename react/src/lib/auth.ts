import { useContext } from "react";
import { api } from "./api";
import { AuthContext } from "../pages/AuthContext";

export type LoginPayload = { username: string; password: string };
export type RegisterPayload = {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  birthDate?: string;
};

export type UserFromApi = {
  _id: string;
  id?: string;
  username?: string;
  role?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  birthDate?: string | null;
  profilePicture?: string | null;
  banned?: boolean;
};

export type LoginResponse = { success: boolean; token: string; user: UserFromApi };

export async function login(data: LoginPayload): Promise<LoginResponse> {
  const res = await api.post("/api/login", data);
  return res.data as LoginResponse;
}

export async function getMe(): Promise<UserFromApi> {
  const res = await api.get("/api/me");
  return res.data.user as UserFromApi;
}

export async function register(payload: RegisterPayload): Promise<{ success: boolean }> {
  const res = await api.post("/api/register", payload);
  return res.data as { success: boolean };
}

export const registerUser = register;

export async function sendForgot(email: string) {
  const res = await api.post("/api/forgotpasssender", { email });
  return res.data;
}

export async function resetWithToken(id: string, token: string, password: string) {
  const res = await api.post(`/api/resetpass/${id}/${token}`, { password });
  return res.data;
}

export async function changePassword(username: string, oldPassword: string, newPassword: string) {
  const res = await api.post("/api/resetpass", { username, oldPassword, newPassword });
  return res.data;
}

export async function updateMe(payload: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  birthDate?: string | null;
  email?: string;
}) {
  const res = await api.patch("/api/me", payload);
  return res.data.user as UserFromApi;
}

export function useAuth() {
  return useContext(AuthContext);
}
