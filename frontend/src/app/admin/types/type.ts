export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  role: 'usuario' | 'soporte';
}

export interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  is_admin: boolean;
  is_active: boolean;
  profile_picture_url?: string;
  role: string;
  created_at?: string;
  last_login?: string;
}

export interface CreateUserResponse {
  success: boolean;
  user?: User;
  error?: string;
}

export interface ListUsersResponse {
  success: boolean;
  users?: User[];
  count?: number;
  error?: string;
}

export interface UpdateUserResponse {
  success: boolean;
  user?: User;
  message?: string;
  error?: string;
}

export interface DeleteUserResponse {
  success: boolean;
  message?: string;
  error?: string;
}
