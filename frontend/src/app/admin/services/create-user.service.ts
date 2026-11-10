import apiAdmin from "@/app/lib/axios";
import { CreateUserRequest, CreateUserResponse, ListUsersResponse, User, UpdateUserResponse, DeleteUserResponse } from "../types/type";
import { AxiosError } from "axios";

export const createUserService = {
  async createUser(userData: CreateUserRequest): Promise<CreateUserResponse> {
    try {
      const response = await apiAdmin.post<CreateUserResponse>("/api/users/create/", userData);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ success: boolean; error: string }>;
      return {
        success: false,
        error: axiosError.response?.data?.error || axiosError.message || "Error al crear usuario",
      };
    }
  },

  async listUsers(role: 'usuario' | 'soporte' = 'usuario', includeInactive: boolean = true): Promise<ListUsersResponse> {
    try {
      const endpoint = role === 'soporte' ? "/api/users/list-support/" : "/api/users/list/";
      const response = await apiAdmin.get<{ success: boolean; users: User[]; count: number }>(endpoint, {
        params: {
          include_inactive: includeInactive,
        },
      });
      return {
        success: true,
        users: response.data.users,
        count: response.data.count,
      };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ success: boolean; error: string }>;
      return {
        success: false,
        error: axiosError.response?.data?.error || axiosError.message || "Error al listar usuarios",
      };
    }
  },

  async listSupportUsers(includeInactive: boolean = true): Promise<ListUsersResponse> {
    try {
      const response = await apiAdmin.get<{ success: boolean; users: User[]; count: number }>("/api/users/list-support/", {
        params: {
          include_inactive: includeInactive,
        },
      });
      return {
        success: true,
        users: response.data.users,
        count: response.data.count,
      };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ success: boolean; error: string }>;
      return {
        success: false,
        error: axiosError.response?.data?.error || axiosError.message || "Error al listar usuarios de soporte",
      };
    }
  },

  async toggleUserStatus(userId: string): Promise<UpdateUserResponse> {
    try {
      const response = await apiAdmin.patch<UpdateUserResponse>(`/api/users/${userId}/toggle-status/`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ success: boolean; error: string }>;
      return {
        success: false,
        error: axiosError.response?.data?.error || axiosError.message || "Error al actualizar estado",
      };
    }
  },

  async editUser(
    userId: string,
    data: {
      username?: string;
      email?: string;
      full_name?: string;
      role?: string;
    }
  ): Promise<UpdateUserResponse> {
    try {
      const response = await apiAdmin.patch<UpdateUserResponse>(`/api/users/${userId}/edit/`, data);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ success: boolean; error: string }>;
      return {
        success: false,
        error: axiosError.response?.data?.error || axiosError.message || "Error al editar usuario",
      };
    }
  },

  async deleteUser(userId: string): Promise<DeleteUserResponse> {
    try {
      const response = await apiAdmin.delete<DeleteUserResponse>(`/api/users/${userId}/delete/`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ success: boolean; error: string }>;
      return {
        success: false,
        error: axiosError.response?.data?.error || axiosError.message || "Error al eliminar usuario",
      };
    }
  },

  async getUser(userId: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await apiAdmin.get<User>(`/api/users/${userId}/`);
      return {
        success: true,
        user: response.data,
      };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ success: boolean; error: string }>;
      return {
        success: false,
        error: axiosError.response?.data?.error || axiosError.message || "Error al obtener usuario",
      };
    }
  },
};
