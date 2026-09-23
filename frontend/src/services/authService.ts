import apiClient from './apiClient';

export interface AuthResponse {
  token: string | null;
  email: string;
  role: string;
  userId: string;
}

export const authService = {
  login: async (data: any): Promise<AuthResponse> => {
    const response = await apiClient.post<any>('/auth/login', data);
    return response.data.data;
  },
  
  register: async (data: any): Promise<{ data: AuthResponse, message: string }> => {
    const response = await apiClient.post<any>('/auth/register', data);
    return { data: response.data.data, message: response.data.message };
  },
  
  verifyEmail: async (token: string): Promise<any> => {
    const response = await apiClient.get<any>(`/auth/verify?token=${token}`);
    return response.data;
  },
  
  getCurrentUser: async (): Promise<AuthResponse> => {
    const response = await apiClient.get<any>('/auth/me');
    return response.data.data;
  },
  
  googleLogin: async (data: { token: string }): Promise<AuthResponse> => {
    const response = await apiClient.post<any>('/auth/google', data);
    return response.data.data;
  }
};
