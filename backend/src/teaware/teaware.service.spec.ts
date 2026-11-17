import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { TeawareService } from './teaware.service';
import { Teaware } from './entities/teaware.entity';

const imageUrl = 'https://tea-bucket.s3.ap-northeast-2.amazonaws.com/notes/photo.png';
const own = { id: 7, userId: 1, kind: 'gaiwan' as const, name: '백자 개완', imageUrl };

describe('TeawareService', () => {
  const repository = { find: jest.fn(), findOne: jest.fn(), create: jest.fn(value => value), save: jest.fn(value => value), softRemove: jest.fn() };
  let service: TeawareService;
  beforeEach(() => {
    jest.clearAllMocks();
    repository.find.mockResolvedValue([]);
    service = new TeawareService(repository as unknown as Repository<Teaware>, new ConfigService({ AWS_S3_BUCKET_NAME: 'tea-bucket' }));
  });

  it('lists only current user tools', async () => {
    await service.findAll(1);
    expect(repository.find).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 1 } }));
  });

  it('registers uploaded photos with ownership supplied by auth', async () => {
    await expect(service.create(1, { name: own.name, kind: own.kind, imageUrl })).resolves.toEqual(expect.objectContaining({ userId: 1, imageUrl }));
    await expect(service.create(1, { name: own.name, kind: own.kind, imageUrl: 'https://untrusted.example/photo.png' })).rejects.toThrow(BadRequestException);
    await expect(service.create(1, { name: own.name, kind: own.kind, imageUrl: imageUrl.replace('photo.png', '../private.png') })).rejects.toThrow(BadRequestException);
  });

  it('cannot update or delete another user tool', async () => {
    repository.findOne.mockResolvedValue(null);
    await expect(service.update(7, 2, { name: '도용' })).rejects.toThrow(NotFoundException);
    await expect(service.remove(7, 2)).rejects.toThrow(NotFoundException);
    expect(repository.findOne).toHaveBeenLastCalledWith({ where: { id: 7, userId: 2 } });
    expect(repository.save).not.toHaveBeenCalled();
    expect(repository.softRemove).not.toHaveBeenCalled();
  });

  it('soft-deletes library records without deleting historical photos', async () => {
    repository.findOne.mockResolvedValue(own);
    await service.remove(7, 1);
    expect(repository.softRemove).toHaveBeenCalledWith(own);
  });

  it('canonicalizes presets and custom names/photos instead of trusting client content', async () => {
    repository.find.mockResolvedValue([own]);
    await expect(service.snapshots(1, [
      { kind: 'cup', name: '변조된 이름' },
      { id: 7, kind: 'cup', name: '변조된 이름', imageUrl: 'https://bad.example/img.png' },
    ])).resolves.toEqual([{ kind: 'cup', name: '찻잔' }, { id: 7, kind: 'gaiwan', name: own.name, imageUrl }]);
    expect(repository.find).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ userId: 1 }) }));
  });

  it('rejects foreign IDs and unregistered custom images', async () => {
    await expect(service.snapshots(1, [{ ...own, id: 99 }])).rejects.toThrow(BadRequestException);
    await expect(service.snapshots(1, [{ kind: 'cup', name: '잔', imageUrl }])).rejects.toThrow(BadRequestException);
    await expect(service.snapshots(1, [{ kind: 'cup', name: '잔' }, { kind: 'cup', name: '잔' }])).rejects.toThrow(BadRequestException);
  });

  it('preserves exact prior snapshots after library removal but rejects altered stale data', async () => {
    const snapshot = { id: own.id, kind: own.kind, name: own.name, imageUrl };
    await expect(service.snapshots(1, [snapshot], [snapshot])).resolves.toEqual([snapshot]);
    await expect(service.snapshots(1, [{ ...snapshot, name: '변경' }], [snapshot])).rejects.toThrow(BadRequestException);
    await expect(service.snapshots(1, [])).resolves.toEqual([]);
  });
});

describe('Teaware public image export', () => {
  const service = new TeawareService({} as Repository<Teaware>, new ConfigService({ AWS_S3_BUCKET_NAME: 'tea-bucket' }));
  afterEach(() => jest.restoreAllMocks());
  it.each(['http://127.0.0.1/private', 'https://tea-bucket.s3.ap-northeast-2.amazonaws.com/private/file.png', 'https://tea-bucket.s3.ap-northeast-2.amazonaws.com/notes/../../secret', imageUrl + '?token=secret', imageUrl.replace('tea-bucket.', 'other-bucket.'), 'file:///etc/passwd'])('rejects non-public upload targets before fetch: %s', async url => {
    const request = jest.spyOn(global, 'fetch');
    await expect(service.imageData(url)).rejects.toThrow(BadRequestException);
    expect(request).not.toHaveBeenCalled();
  });
  it('resizes a public image into bounded data without forwarding credentials or redirects', async () => {
    const sharp = (await import('sharp')).default;
    const png = await sharp({ create: { width: 1024, height: 768, channels: 3, background: '#ffffff' } }).png().toBuffer();
    const request = jest.spyOn(global, 'fetch').mockResolvedValue(new Response(new Uint8Array(png).buffer, { headers: { 'Content-Type': 'image/png' } }));
    const { dataUrl } = await service.imageData(imageUrl);
    expect(request).toHaveBeenCalledWith(imageUrl, expect.objectContaining({ redirect: 'error', credentials: 'omit' }));
    const output = Buffer.from(dataUrl.split(',')[1], 'base64');
    expect(output.length).toBeLessThanOrEqual(1024 * 1024);
    const metadata = await sharp(output).metadata();
    expect(metadata.width).toBe(512);
    expect(metadata.height).toBe(384);
  });
  it('rejects oversize responses and non-images', async () => {
    const request = jest.spyOn(global, 'fetch').mockResolvedValue(new Response('bad', { headers: { 'Content-Type': 'image/png', 'Content-Length': String(11 * 1024 * 1024) } }));
    await expect(service.imageData(imageUrl)).rejects.toThrow(BadRequestException);
    request.mockResolvedValue(new Response('html', { headers: { 'Content-Type': 'text/html' } }));
    await expect(service.imageData(imageUrl)).rejects.toThrow(BadRequestException);
  });
});
