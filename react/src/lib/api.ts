import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:4000", // server base
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    // Ensure headers object exists before assigning
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config; // IMPORTANT: do not forget to return config
});