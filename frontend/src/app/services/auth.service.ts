import apiPublic from "@/app/lib/axios-public";
import type { AxiosError } from "axios";
import { LoginRequest, LoginResponse } from "../types/auth.type";
import Cookies from "js-cookie";

export const loginRequest = async (
  username: string,
  password: string
): Promise<LoginResponse> => {
  try {
    const payload: LoginRequest = { username, password };

    const response = await apiPublic.post<LoginResponse>(
      "/api/users/login/",
      payload
    );

    return response.data;
  } catch (err: unknown) {
    const error = err as AxiosError<{ error: string }>;

    console.error("Error en login:", error);

    if (error.response?.data) {
      throw error.response.data;
    }

    throw { error: "Error de conexión" };
  }
};

export const saveAuthData = (response: LoginResponse) => {
  const role = response.user?.role?.toString().trim().toLowerCase();
  
  let prefix = "user_";
  if (role === "administrador") {
    prefix = "admin_";
  } else if (role === "soporte") {
    prefix = "support_";
  }
  
  Cookies.set(`${prefix}accessToken`, response.access_token, { 
    expires: 7,
    path: "/",
    sameSite: "strict"
  });
  Cookies.set(`${prefix}refreshToken`, response.refresh_token, { 
    expires: 7,
    path: "/",
    sameSite: "strict"
  });
  Cookies.set(`${prefix}user`, JSON.stringify(response.user), { 
    expires: 7,
    path: "/",
    sameSite: "strict"
  });
  
  Cookies.set("currentRole", role || "", {
    expires: 7,
    path: "/",
    sameSite: "strict"
  });
};

export const getAccessToken = (role?: string): string | undefined => {
  const currentRole = role || Cookies.get("currentRole");
  let prefix = "user_";
  if (currentRole === "administrador") {
    prefix = "admin_";
  } else if (currentRole === "soporte") {
    prefix = "support_";
  }
  return Cookies.get(`${prefix}accessToken`);
};

export const getUser = (role?: string): ReturnType<typeof JSON.parse> | null => {
  const currentRole = role || Cookies.get("currentRole");
  let prefix = "user_";
  if (currentRole === "administrador") {
    prefix = "admin_";
  } else if (currentRole === "soporte") {
    prefix = "support_";
  }
  const userCookie = Cookies.get(`${prefix}user`);
  return userCookie ? JSON.parse(userCookie) : null;
};

export const clearAuthData = (role?: string) => {
  if (role) {
    let prefix = "user_";
    if (role === "administrador") {
      prefix = "admin_";
    } else if (role === "soporte") {
      prefix = "support_";
    }
    Cookies.remove(`${prefix}accessToken`, { path: "/" });
    Cookies.remove(`${prefix}refreshToken`, { path: "/" });
    Cookies.remove(`${prefix}user`, { path: "/" });
  } else {
    ["admin_", "user_", "support_"].forEach(prefix => {
      Cookies.remove(`${prefix}accessToken`, { path: "/" });
      Cookies.remove(`${prefix}refreshToken`, { path: "/" });
      Cookies.remove(`${prefix}user`, { path: "/" });
    });
    Cookies.remove("currentRole", { path: "/" });
  }
};