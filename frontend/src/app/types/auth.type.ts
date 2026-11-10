export interface LoginRequest {
  username: string;
  password: string;
}

export interface UserData {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
}

export interface LoginResponse {
  success: boolean;
  access_token: string;
  refresh_token: string;
  user: UserData;
  error?: string;
}
