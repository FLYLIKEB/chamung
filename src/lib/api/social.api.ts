import { PopularTagItem, TagDetail, TagNoteList, Comment, NotificationListResponse } from '../../types';
import { apiClient } from './client';

const tagNameParam = (name: string) => new URLSearchParams({ name }).toString();

export const tagsApi = {
  getPopularTags: (limit = 20, category?: string) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (category) params.append('category', category);
    return apiClient.get<PopularTagItem[]>(`/tags/popular?${params.toString()}`);
  },
  getRecentTags: (limit = 20) =>
    apiClient.get<PopularTagItem[]>(`/tags/recent?limit=${limit}`),
  getFollowedTags: () =>
    apiClient.get<PopularTagItem[]>('/tags/followed'),
  getTagDetail: (name: string) =>
    apiClient.get<TagDetail>(`/tags/lookup?${tagNameParam(name)}`),
  getTagNotes: (name: string, page = 1, limit = 20) =>
    apiClient.get<TagNoteList>(`/tags/lookup/notes?${tagNameParam(name)}&page=${page}&limit=${limit}`),
  createTag: (name: string, category: 'general' | 'flavor' = 'general') =>
    apiClient.post<PopularTagItem>('/tags', { name, category }),
  followTag: (name: string) =>
    apiClient.post<void>(`/tags/lookup/follow?${tagNameParam(name)}`),
  unfollowTag: (name: string) =>
    apiClient.delete(`/tags/lookup/follow?${tagNameParam(name)}`),
};

export const commentsApi = {
  getByPost: (postId: number) =>
    apiClient.get<Comment[]>(`/posts/${postId}/comments`),
  create: (postId: number, content: string) =>
    apiClient.post<Comment>(`/posts/${postId}/comments`, { content }),
  update: (commentId: number, content: string) =>
    apiClient.patch<Comment>(`/comments/${commentId}`, { content }),
  delete: (commentId: number) => apiClient.delete(`/comments/${commentId}`),
};

export const notificationsApi = {
  getAll: (page = 1, limit = 20) =>
    apiClient.get<NotificationListResponse>(
      `/notifications?page=${page}&limit=${limit}`,
    ),
  getUnreadCount: () =>
    apiClient.get<{ count: number }>('/notifications/unread-count'),
  markAsRead: (id: number) =>
    apiClient.patch<{ success: boolean }>(`/notifications/${id}/read`, {}),
  markAllAsRead: () =>
    apiClient.patch<{ success: boolean }>('/notifications/read-all', {}),
};
