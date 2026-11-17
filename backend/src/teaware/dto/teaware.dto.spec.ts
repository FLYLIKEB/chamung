import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateTeawareDto, TeawareSelectionDto, UpdateTeawareDto } from './teaware.dto';
import { CreateNoteDto } from '../../notes/dto/create-note.dto';
import { PublishSessionToNoteDto } from '../../tea-sessions/dto/publish-session-to-note.dto';

const valid = { name: '내 개완', kind: 'gaiwan', imageUrl: 'https://example.com/photo.png' };
describe('teaware DTO validation', () => {
  it.each([{ name: ' ' }, { name: '가'.repeat(61) }, { kind: 'unknown' }, { imageUrl: 'javascript:alert(1)' }, { imageUrl: null }])('rejects invalid registration %j', async patch => {
    expect(await validate(plainToInstance(CreateTeawareDto, { ...valid, ...patch }))).not.toHaveLength(0);
  });
  it('trims names and rejects null updates', async () => {
    const dto = plainToInstance(CreateTeawareDto, { ...valid, name: ' 내 개완 ' });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto.name).toBe('내 개완');
    expect(await validate(plainToInstance(UpdateTeawareDto, { name: null }))).not.toHaveLength(0);
  });
  it.each(['teapot', 'accessory', 'tray'])('accepts the source catalog category %s without changing old kinds', async kind => {
    expect(await validate(plainToInstance(TeawareSelectionDto, { kind, name: '다구' }))).toHaveLength(0);
    expect(await validate(plainToInstance(CreateTeawareDto, { ...valid, kind }))).toHaveLength(0);
  });
  it('accepts optional catalog variants while rejecting malformed identifiers', async () => {
    const base = { kind: 'cup', name: '찻잔' };
    expect(await validate(plainToInstance(TeawareSelectionDto, base))).toHaveLength(0);
    expect(await validate(plainToInstance(TeawareSelectionDto, { ...base, variantId: 'dc-celadon_cup-2' }))).toHaveLength(0);
    for (const variantId of ['', 12, '../cup', 'cup image', 'x'.repeat(97)]) {
      expect(await validate(plainToInstance(TeawareSelectionDto, { ...base, variantId }))).not.toHaveLength(0);
    }
  });
  it.each([CreateNoteDto, PublishSessionToNoteDto])('validates nested selections and maximum 12 items in %p', async Dto => {
    const base = { teaId: 1, schemaId: 1, axisValues: [], isPublic: false };
    expect(await validate(plainToInstance<object, object>(Dto, { ...base, teaware: [{ kind: 'cup', name: '찻잔' }] }))).toHaveLength(0);
    expect(await validate(plainToInstance<object, object>(Dto, { ...base, teaware: [{ kind: 'unknown', name: '잔' }] }))).not.toHaveLength(0);
    expect(await validate(plainToInstance<object, object>(Dto, { ...base, teaware: Array.from({ length: 13 }, () => ({ kind: 'cup', name: '잔' })) }))).not.toHaveLength(0);
  });
});
