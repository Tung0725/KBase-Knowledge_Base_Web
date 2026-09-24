import apiClient from './apiClient';

export interface AdminDashboardStats {
  totalUsers: number;
  totalProjects: number;
  totalStorageUsedBytes: number;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  phoneNumber?: string;
  authProvider: string;
  isVerified: boolean;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProject {
  id: string;
  name: string;
  description: string;
  ownerEmail: string;
  membersCount: number;
  usedStorageBytes: number;
  storageQuotaBytes: number;
  isPublic: boolean;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export const adminService = {
  getStats: async (): Promise<AdminDashboardStats> => {
    const response = await apiClient.get<any>('/admin/stats');
    return response.data.data;
  },
  
  getUsers: async (search?: string, role?: string, status?: string, page: number = 0, size: number = 20, sortBy: string = 'createdAt'): Promise<PageResponse<AdminUser>> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (role) params.append('role', role);
    if (status) params.append('status', status);
    params.append('page', page.toString());
    params.append('size', size.toString());
    params.append('sortBy', sortBy);
    const response = await apiClient.get<any>(`/admin/users?${params.toString()}`);
    return response.data.data;
  },
  
  createUser: async (data: any): Promise<AdminUser> => {
    const response = await apiClient.post<any>('/admin/users', data);
    return response.data.data;
  },

  updateUser: async (id: string, data: any): Promise<AdminUser> => {
    const response = await apiClient.put<any>(`/admin/users/${id}`, data);
    return response.data.data;
  },

  deleteUser: async (id: string, transferToUserId?: string, deleteSharedProjects?: boolean): Promise<void> => {
    let url = `/admin/users/${id}`;
    const params = new URLSearchParams();
    if (transferToUserId) params.append('transferToUserId', transferToUserId);
    if (deleteSharedProjects) params.append('deleteSharedProjects', 'true');
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    await apiClient.delete<any>(url);
  },

  getSharedProjects: async (userId: string): Promise<AdminProject[]> => {
    const response = await apiClient.get<any>(`/admin/users/${userId}/shared-projects`);
    return response.data.data;
  },

  transferProjectOwner: async (projectId: string, newOwnerEmail: string): Promise<void> => {
    await apiClient.put<any>(`/admin/projects/${projectId}/transfer-owner`, { newOwnerEmail });
  },
  
  toggleUserStatus: async (userId: string): Promise<void> => {
    await apiClient.put<any>(`/admin/users/${userId}/status`);
  },
  
  getProjects: async (search?: string, isPublic?: boolean, page: number = 0, size: number = 30, sortBy: string = 'createdAt'): Promise<PageResponse<AdminProject>> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (isPublic !== undefined) params.append('isPublic', isPublic.toString());
    params.append('page', page.toString());
    params.append('size', size.toString());
    params.append('sortBy', sortBy);
    const response = await apiClient.get<any>(`/admin/projects?${params.toString()}`);
    return response.data.data;
  },

  updateProjectStatus: async (projectId: string, isPublic: boolean): Promise<void> => {
    const params = new URLSearchParams({ isPublic: isPublic.toString() });
    await apiClient.put<any>(`/admin/projects/${projectId}/status?${params.toString()}`);
  },

  updateProjectQuota: async (projectId: string, quotaBytes: number): Promise<void> => {
    const params = new URLSearchParams({ quotaBytes: quotaBytes.toString() });
    await apiClient.put<any>(`/admin/projects/${projectId}/quota?${params.toString()}`);
  }
};
