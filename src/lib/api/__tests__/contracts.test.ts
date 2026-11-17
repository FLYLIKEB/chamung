import { describe, expect, it, vi, afterEach } from 'vitest';
import { apiClient } from '../client';
import { authApi } from '../auth.api';
import { adminApi } from '../admin.api';

afterEach(() => vi.restoreAllMocks());

describe('API contracts', () => {
  it('withdrawal sends confirmation body and returns server acknowledgement', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ message: '탈퇴 완료' }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    const result = await authApi.withdraw({ confirmText: '탈퇴' });
    expect(fetch.mock.calls[0][1]).toMatchObject({ method: 'DELETE', body: JSON.stringify({ confirmText: '탈퇴' }) });
    expect(result).toEqual({ message: '탈퇴 완료' });
  });
  it('bodyless delete still accepts a 204 response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));
    await expect(apiClient.delete('/notes/1')).resolves.toBeUndefined();
  });
  it('admin previews and registers use the existing backend body contracts', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue([]);
    const config = { nameSelector: '.name' };
    await adminApi.crawlPreview('https://example.com', config);
    expect(post).toHaveBeenLastCalledWith('/admin/crawl/preview', { url: 'https://example.com', config });
    const items = [{ name: '녹차', type: '녹차' }];
    await adminApi.crawlRegister(items);
    expect(post).toHaveBeenLastCalledWith('/admin/crawl/register', { items, sellerId: undefined });
  });
  it('admin CSV upload uses multipart upload helper', async () => {
    const upload = vi.spyOn(apiClient, 'uploadFile').mockResolvedValue({ total: 1, success: 1, skipped: 0, errors: [] });
    const file = new File(['name,type\n녹차,녹차'], 'tea.csv');
    await adminApi.bulkUploadTeas(file);
    expect(upload).toHaveBeenCalledWith('/admin/teas/bulk-upload', file);
  });
});
