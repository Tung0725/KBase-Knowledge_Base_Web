import apiClient from './apiClient';
import type { Project, CreateProjectRequest, UpdateProjectRequest, ProjectMember, AddMemberRequest, ProjectRole } from '../types/project';

export interface InviteLinkInfo {
  isActive: boolean;
  inviteCode: string | null;
  inviteUrl: string | null;
  inviteRole: ProjectRole;
}

export const projectService = {
  getMyProjects: async (): Promise<Project[]> => {
    const response = await apiClient.get('/projects');
    return response.data.data;
  },

  createProject: async (data: CreateProjectRequest): Promise<Project> => {
    const response = await apiClient.post('/projects', data);
    return response.data.data;
  },

  updateProject: async (id: string, data: UpdateProjectRequest): Promise<Project> => {
    const response = await apiClient.put(`/projects/${id}`, data);
    return response.data.data;
  },

  deleteProject: async (id: string): Promise<void> => {
    await apiClient.delete(`/projects/${id}`);
  },

  getProjectOverview: async (id: string): Promise<any> => {
    const response = await apiClient.get(`/projects/${id}/overview`);
    return response.data.data;
  },

  getProjectMembers: async (projectId: string): Promise<ProjectMember[]> => {
    const response = await apiClient.get(`/projects/${projectId}/members`);
    return response.data.data;
  },

  addMember: async (projectId: string, data: AddMemberRequest): Promise<ProjectMember> => {
    const response = await apiClient.post(`/projects/${projectId}/members`, data);
    return response.data.data;
  },

  removeMember: async (projectId: string, userId: string): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}/members/${userId}`);
  },

  getInviteLink: async (projectId: string): Promise<InviteLinkInfo> => {
    const response = await apiClient.get(`/projects/${projectId}/invite-link`);
    const data = response.data.data;
    if (data.inviteCode) data.inviteUrl = `${window.location.origin}/join/${data.inviteCode}`;
    return data;
  },

  regenerateInviteCode: async (projectId: string): Promise<InviteLinkInfo> => {
    const response = await apiClient.post(`/projects/${projectId}/invite-link/regenerate`);
    const data = response.data.data;
    if (data.inviteCode) data.inviteUrl = `${window.location.origin}/join/${data.inviteCode}`;
    return data;
  },

  toggleInviteLink: async (projectId: string, active: boolean): Promise<InviteLinkInfo> => {
    const response = await apiClient.post(`/projects/${projectId}/invite-link/toggle?active=${active}`);
    const data = response.data.data;
    if (data.inviteCode) data.inviteUrl = `${window.location.origin}/join/${data.inviteCode}`;
    return data;
  },

  updateInviteRole: async (projectId: string, role: ProjectRole): Promise<InviteLinkInfo> => {
    const response = await apiClient.put(`/projects/${projectId}/invite-link/role?role=${role}`);
    const data = response.data.data;
    if (data.inviteCode) data.inviteUrl = `${window.location.origin}/join/${data.inviteCode}`;
    return data;
  },

  joinProjectByInviteCode: async (inviteCode: string): Promise<ProjectMember> => {
    const response = await apiClient.post(`/projects/join/${inviteCode}`);
    return response.data.data;
  },

  updateMemberRole: async (projectId: string, userId: string, role: ProjectRole): Promise<ProjectMember> => {
    const response = await apiClient.put(`/projects/${projectId}/members/${userId}/role?role=${role}`);
    return response.data.data;
  },

  updateAllMembersRole: async (projectId: string, role: ProjectRole): Promise<void> => {
    await apiClient.put(`/projects/${projectId}/members/role?role=${role}`);
  }
};
