import sharp from 'sharp';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Teaware } from './entities/teaware.entity';
import { CreateTeawareDto, TeawareSelectionDto, UpdateTeawareDto } from './dto/teaware.dto';
import { TEAWARE_NAMES, TeawareSnapshot } from './teaware.types';

@Injectable()
export class TeawareService {
  constructor(
    @InjectRepository(Teaware) private readonly repository: Repository<Teaware>,
    private readonly config: ConfigService,
  ) {}

  findAll(userId: number) {
    return this.repository.find({ where: { userId }, order: { createdAt: 'DESC', id: 'DESC' } });
  }

  private async findOwn(id: number, userId: number) {
    const item = await this.repository.findOne({ where: { id, userId } });
    if (!item) throw new NotFoundException('다구를 찾을 수 없습니다.');
    return item;
  }

  private validateImageUrl(value: string) {
    const bucket = this.config.get<string>('AWS_S3_BUCKET_NAME');
    const region = this.config.get<string>('AWS_REGION') || 'ap-northeast-2';
    const endpoint = this.config.get<string>('AWS_S3_ENDPOINT');
    const prefix = endpoint
      ? `${endpoint.replace(/\/$/, '')}/${bucket}/notes/`
      : `https://${bucket}.s3.${region}.amazonaws.com/notes/`;
    if (!bucket || typeof value !== 'string' || !value.startsWith(prefix)) {
      throw new BadRequestException('업로드한 다구 사진을 선택해주세요.');
    }
    const url = new URL(value);
    if (!url.href.startsWith(prefix) || url.username || url.password || url.search || url.hash || url.pathname.includes('..')) {
      throw new BadRequestException('올바른 다구 사진 주소가 아닙니다.');
    }
  }

  async imageData(value: string): Promise<{ dataUrl: string }> {
    const bucket = this.config.get<string>('AWS_S3_BUCKET_NAME');
    const region = this.config.get<string>('AWS_REGION') || 'ap-northeast-2';
    const origin = `https://${bucket}.s3.${region}.amazonaws.com`;
    let url: URL;
    try { url = new URL(value); } catch { throw new BadRequestException('올바른 다구 사진 주소가 아닙니다.'); }
    // Only already-public app uploads on the standard S3 endpoint are fetched.
    // Custom endpoints, credentials, query strings and redirects are forbidden.
    if (!bucket || url.origin !== origin || !url.pathname.startsWith('/notes/') || url.username || url.password || url.search || url.hash) {
      throw new BadRequestException('업로드한 다구 사진만 공유할 수 있습니다.');
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const maxBytes = 10 * 1024 * 1024;
    try {
      const response = await fetch(url.href, { redirect: 'error', credentials: 'omit', signal: controller.signal });
      if (!response.ok || !response.body || !/^image\/(?:png|jpeg|webp)$/.test(response.headers.get('content-type')?.split(';')[0] ?? '') || Number(response.headers.get('content-length') ?? 0) > maxBytes) {
        throw new Error('Invalid image response');
      }
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      try {
        while (true) {
          const { done, value: chunk } = await reader.read();
          if (done) break;
          size += chunk.byteLength;
          if (size > maxBytes) throw new Error('Image too large');
          chunks.push(chunk);
        }
      } finally { await reader.cancel(); }
      const image = sharp(Buffer.concat(chunks), { limitInputPixels: 40_000_000 }).rotate().resize({ width: 512, height: 512, fit: 'inside', withoutEnlargement: true });
      let buffer = await image.clone().png().toBuffer();
      let mime = 'image/png';
      if (buffer.length > 1024 * 1024) { buffer = await image.jpeg({ quality: 85 }).toBuffer(); mime = 'image/jpeg'; }
      if (buffer.length > 1024 * 1024) throw new Error('Image too large');
      return { dataUrl: `data:${mime};base64,${buffer.toString('base64')}` };
    } catch {
      throw new BadRequestException('다구 사진을 불러오지 못했습니다.');
    } finally { clearTimeout(timeout); controller.abort(); }
  }

  async create(userId: number, dto: CreateTeawareDto) {
    this.validateImageUrl(dto.imageUrl);
    return this.repository.save(this.repository.create({ userId, name: dto.name, kind: dto.kind, imageUrl: dto.imageUrl }));
  }

  async update(id: number, userId: number, dto: UpdateTeawareDto) {
    const item = await this.findOwn(id, userId);
    if (dto.imageUrl !== undefined) this.validateImageUrl(dto.imageUrl);
    // Only validated fields can be assigned; ownership never comes from the body.
    if (dto.name !== undefined) item.name = dto.name;
    if (dto.kind !== undefined) item.kind = dto.kind;
    if (dto.imageUrl !== undefined) item.imageUrl = dto.imageUrl;
    return this.repository.save(item);
  }

  async remove(id: number, userId: number) {
    const item = await this.findOwn(id, userId);
    await this.repository.softRemove(item);
    // Photos remain available to immutable snapshots in old notes.
    return { message: '다구를 삭제했습니다.' };
  }

  async snapshots(userId: number, selections: TeawareSelectionDto[], existing: TeawareSnapshot[] = []): Promise<TeawareSnapshot[]> {
    const ids = selections.flatMap(item => item.id ? [item.id] : []);
    const owned = ids.length ? await this.repository.find({ where: { userId, id: In(ids) } }) : [];
    const seen = new Set<string>();
    return selections.map(selection => {
      const key = selection.id ? `own:${selection.id}` : `preset:${selection.kind}`;
      if (seen.has(key)) throw new BadRequestException('같은 다구를 중복 선택할 수 없습니다.');
      seen.add(key);
      if (!selection.id) {
        if (selection.imageUrl) throw new BadRequestException('내 다구를 먼저 등록해주세요.');
        return { kind: selection.kind, name: TEAWARE_NAMES[selection.kind] };
      }
      // Resubmitting an existing snapshot cannot silently rewrite history after a
      // library rename/removal. New selections must still belong to this user.
      const previous = existing.find(item => item.id === selection.id);
      if (previous && previous.kind === selection.kind && previous.name === selection.name && previous.imageUrl === selection.imageUrl) return { ...previous };
      const item = owned.find(tool => tool.id === selection.id);
      if (!item) throw new BadRequestException('선택한 내 다구를 찾을 수 없습니다.');
      return { id: item.id, kind: item.kind, name: item.name, imageUrl: item.imageUrl };
    });
  }
}
