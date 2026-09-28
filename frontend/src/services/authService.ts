import apiClient from './apiClient';

export interface AuthResponse {
  token: string | null;
  email: string;
  role: string;
  userId: string;
  fullName?: string;
  phoneNumber?: string;
  hasPassword?: boolean;
}

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface RegisterRequest {
  email: string;
  password?: string;
  fullName?: string;
}

export interface ChangePasswordRequest {
  oldPassword?: string;
  newPassword?: string;
}

export interface BaseApiResponse<T = any> {
  message: string;
  data: T;
  status?: number;
}

export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<BaseApiResponse<AuthResponse>>('/auth/login', data);
    return response.data.data;
  },
  
  register: async (data: RegisterRequest): Promise<{ data: AuthResponse, message: string }> => {
    const response = await apiClient.post<BaseApiResponse<AuthResponse>>('/auth/register', data);
    return { data: response.data.data, message: response.data.message };
  },
  
  verifyEmail: async (token: string): Promise<BaseApiResponse> => {
    const response = await apiClient.get<BaseApiResponse>(`/auth/verify?token=${token}`);
    return response.data;
  },
  
  getCurrentUser: async (): Promise<AuthResponse> => {
    const response = await apiClient.get<BaseApiResponse<AuthResponse>>('/auth/me');
    return response.data.data;
  },
  
  googleLogin: async (data: { token: string }): Promise<AuthResponse> => {
    const response = await apiClient.post<BaseApiResponse<AuthResponse>>('/auth/google', data);
    return response.data.data;
  },

  updateProfile: async (data: { fullName: string; phoneNumber?: string }): Promise<AuthResponse> => {
    const response = await apiClient.put<BaseApiResponse<AuthResponse>>('/users/profile', data);
    return response.data.data;
  },

  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    const response = await apiClient.put<BaseApiResponse<void>>('/users/password', data);
    return response.data.data;
  }
};
