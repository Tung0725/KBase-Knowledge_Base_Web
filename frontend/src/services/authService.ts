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
  
  register: async (data: any): Promise<AuthResponse> => {
    const response = await apiClient.post<any>('/auth/register', data);
    return response.data.data;
  },
  
  getCurrentUser: async (): Promise<AuthResponse> => {
    const response = await apiClient.get<any>('/auth/me');
    return response.data.data;
  }
};
