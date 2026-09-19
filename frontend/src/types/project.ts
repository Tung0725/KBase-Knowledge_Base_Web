export interface Project {
  id: string;
  name: string;
  description: string;
  storageQuotaBytes: number;
  usedStorageBytes: number;
  isPublic: boolean;
  ownerId: string;
  ownerEmail: string;
  inviteCode?: string;
  isInviteLinkActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type DocumentStatus = 'PENDING' | 'UPLOADED';

export interface Document {
  id: string;
  projectId: string;
  uploadedByUserId: string;
  fileName: string;
  fileSizeBytes: number;
  fileType: string;
  description?: string;
  tag: string;
  status: 'PENDING' | 'UPLOADED';
  createdAt: string;
  updatedAt: string;
}

export interface ProjectOverviewResponse {
  name: string;
  description: string;
  isPublic: boolean;
  totalDocuments: number;
  storageQuotaBytes: number;
  usedStorageBytes: number;
  totalMembers: number;
  documentTypeDistribution: Record<string, number>;
  recentDocuments: Document[];
}

export interface UploadRequest {
  fileName: string;
  fileSizeBytes: number;
  fileType: string;
}

export interface UploadResponse {
  documentId: string;
  uploadUrl: string;
  objectKey: string;
}

export interface CreateProjectRequest {
  name: string;
  description: string;
}

export interface UpdateProjectRequest {
  name: string;
  description: string;
  isPublic: boolean;
}

export type ProjectRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface ProjectMember {
  projectId?: string;
  userId: string;
  email: string;
  role: ProjectRole;
  joinedAt: string;
}

export interface AddMemberRequest {
  email: string;
  role: ProjectRole;
}
