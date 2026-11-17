import type { TeawareItem, TeawareKind } from '../../types';
import { apiClient } from './client';

export interface CreateTeawareRequest {
  kind: TeawareKind;
  name: string;
  imageUrl: string;
}

export const teawareApi = {
  getAll: () => apiClient.get<TeawareItem[]>('/teaware'),
  getImageData: (url: string) => apiClient.get<{ dataUrl: string }>(`/teaware/image-data?url=${encodeURIComponent(url)}`),
  create: (data: CreateTeawareRequest) => apiClient.post<TeawareItem>('/teaware', data),
  update: (id: number, data: Partial<CreateTeawareRequest>) => apiClient.patch<TeawareItem>(`/teaware/${id}`, data),
  delete: (id: number) => apiClient.delete(`/teaware/${id}`),
};
