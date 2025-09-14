import { useContext } from "react";
import { api } from "./api";
import { AuthContext } from "../pages/AuthContext";

// ===== Types =====

/** Payload for login request */
export type LoginPayload = { username: string; password: string };

/** Payload for registering a new user */
export type RegisterPayload = {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  birthDate?: string;
};

/** User object as returned from the API */
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

/** Response returned from login endpoint */
export type LoginResponse = {
  success: boolean;
  token: string;
  user: UserFromApi;
};

// ===== API Calls =====

/**
 * Login with username/password.
 * @returns token + user info
 */
export async function login(data: LoginPayload): Promise<LoginResponse> {
  const res = await api.post("/api/login", data);
  return res.data as LoginResponse;
}

/**
 * Get current authenticated user.
 * @returns user object
 */
export async function getMe(): Promise<UserFromApi> {
  const res = await api.get("/api/me");
  return res.data.user as UserFromApi;
}

/**
 * Register a new user.
 * @returns { success: true } if registration worked
 */
export async function register(payload: RegisterPayload): Promise<{ success: boolean }> {
  const res = await api.post("/api/register", payload);
  return res.data as { success: boolean };
}

/** Alias for register (if you prefer a more descriptive name) */
export const registerUser = register;

/**
 * Send a forgot-password email.
 */
export async function sendForgot(email: string) {
  const res = await api.post("/api/forgotpasssender", { email });
  return res.data;
}

/**
 * Reset password using token sent to email.
 * @param id user id from link
 * @param token reset token from link
 * @param password new password
 */
export async function resetWithToken(id: string, token: string, password: string) {
  const res = await api.post(`/api/resetpass/${id}/${token}`, { password });
  return res.data;
}

/**
 * Change password when logged in (requires oldPassword).
 */
export async function changePassword(username: string, oldPassword: string, newPassword: string) {
  const res = await api.post("/api/resetpass", { username, oldPassword, newPassword });
  return res.data;
}

/**
 * Update profile fields for the logged-in user.
 */
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

// ===== Hook =====

/**
 * React hook shortcut for accessing AuthContext
 */
export function useAuth() {
  return useContext(AuthContext);
}
