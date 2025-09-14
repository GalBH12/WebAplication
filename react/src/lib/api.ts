// react/src/lib/api.ts
import axios from "axios";

/**
 * Axios instance preconfigured for the app.
 *
 * - Uses Vite environment variable `VITE_API_BASE` as the API base URL.
 *   If you’re running a dev server with a proxy for `/api`, you can leave it as "".
 * - Adds a request interceptor to automatically attach an Authorization header
 *   if a JWT token exists in `localStorage`.
 */
export const api = axios.create({
  timeout: 10000,                                   // request timeout (10s)
  baseURL: import.meta.env.VITE_API_BASE || "",     // base API URL (from .env or empty for proxy)
});

// ===== Interceptors =====

/**
 * Request interceptor:
 * - Reads `token` from localStorage (if present).
 * - Adds `Authorization: Bearer <token>` header to every outgoing request.
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});