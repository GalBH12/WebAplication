// react/src/lib/api.ts
import axios from "axios";

// Use Vite env for API base. If you have a dev proxy for /api, keep this "".
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "",
});

// Attach Authorization header from localStorage token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});