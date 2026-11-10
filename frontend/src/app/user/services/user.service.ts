import api from "@/app/lib/axios";
import { UserMeResponse } from "../types/types";

export const userService = {
  async getMe(): Promise<UserMeResponse> {
    const response = await api.get("/api/users/me/");
    return response.data;
  }
};