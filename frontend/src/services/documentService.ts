import apiClient from './apiClient';
import axios from 'axios';
import type { Document, UploadRequest, UploadResponse } from '../types/project';

export const documentService = {
  getDocuments: async (projectId: string): Promise<Document[]> => {
    const response = await apiClient.get(`/projects/${projectId}/documents`);
    return response.data.data;
  },

  requestUpload: async (projectId: string, data: UploadRequest): Promise<UploadResponse> => {
    const response = await apiClient.post(`/projects/${projectId}/documents/request-upload`, data);
    return response.data.data;
  },

  uploadToMinio: async (uploadUrl: string, file: File, onProgress?: (percent: number) => void): Promise<void> => {
    await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          if (onProgress) onProgress(percentCompleted);
        }
      },
    });
  },

  confirmUpload: async (projectId: string, documentId: string): Promise<Document> => {
    const response = await apiClient.post(`/projects/${projectId}/documents/${documentId}/confirm-upload`);
    return response.data.data;
  },

  getDownloadUrl: async (projectId: string, documentId: string, preview = false): Promise<string> => {
    const response = await apiClient.get(`/projects/${projectId}/documents/${documentId}/download-url?preview=${preview}`);
    return response.data.data.downloadUrl;
  },

  updateDocument: async (projectId: string, documentId: string, data: { fileName: string, description?: string }): Promise<Document> => {
    const response = await apiClient.put(`/projects/${projectId}/documents/${documentId}`, data);
    return response.data.data;
  },

  deleteDocument: async (projectId: string, documentId: string): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}/documents/${documentId}`);
  }
};
