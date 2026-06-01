import { describe, expect, it, vi, beforeEach } from 'vitest';
import { tagsApi } from './social.api';
import { apiClient } from './client';

vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('tagsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('slash가 포함된 태그 이름을 path가 아니라 query parameter로 조회해야 함', () => {
    tagsApi.getTagDetail('감귤/시트러스');
    tagsApi.getTagNotes('자두/말린 자두', 2, 10);
    tagsApi.followTag('생잎/찻잎 향');
    tagsApi.unfollowTag('건과일/건포도');

    expect(apiClient.get).toHaveBeenNthCalledWith(1, '/tags/lookup?name=%EA%B0%90%EA%B7%A4%2F%EC%8B%9C%ED%8A%B8%EB%9F%AC%EC%8A%A4');
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/tags/lookup/notes?name=%EC%9E%90%EB%91%90%2F%EB%A7%90%EB%A6%B0+%EC%9E%90%EB%91%90&page=2&limit=10');
    expect(apiClient.post).toHaveBeenCalledWith('/tags/lookup/follow?name=%EC%83%9D%EC%9E%8E%2F%EC%B0%BB%EC%9E%8E+%ED%96%A5');
    expect(apiClient.delete).toHaveBeenCalledWith('/tags/lookup/follow?name=%EA%B1%B4%EA%B3%BC%EC%9D%BC%2F%EA%B1%B4%ED%8F%AC%EB%8F%84');
  });
});
