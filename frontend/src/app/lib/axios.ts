import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const getRolePrefix = (): string => {
  const currentRole = Cookies.get("currentRole");
  return currentRole === "administrador" ? "admin_" : "user_";
};

api.interceptors.request.use((config) => {
  const prefix = getRolePrefix();
  const token = Cookies.get(`${prefix}accessToken`);
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const prefix = getRolePrefix();
        const refreshToken = Cookies.get(`${prefix}refreshToken`);
        
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/refresh/`,
          { refresh_token: refreshToken }
        );

        if (response.data.success) {
          Cookies.set(`${prefix}accessToken`, response.data.access_token, { 
            expires: 7,
            path: "/",
            sameSite: "strict"
          });
          originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;
          return api(originalRequest);
        }
      } catch {
        const prefix = getRolePrefix();
        
        Cookies.remove(`${prefix}accessToken`, { path: "/" });
        Cookies.remove(`${prefix}refreshToken`, { path: "/" });
        Cookies.remove(`${prefix}user`, { path: "/" });
        
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;