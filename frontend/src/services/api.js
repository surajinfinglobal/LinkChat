import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
});

export function resolveServerUrl(path) {
  const serverOrigin = new URL(api.defaults.baseURL).origin;
  return new URL(path, `${serverOrigin}/`).toString();
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;