import { Test, TestingModule } from '@nestjs/testing';
import { ImageProcessorService } from './image-processor.service';
import sharp from 'sharp';

describe('ImageProcessorService', () => {
  let service: ImageProcessorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageProcessorService],
    }).compile();

    service = module.get<ImageProcessorService>(ImageProcessorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateThumbnail', () => {
    it('should generate thumbnail buffer for valid jpeg', async () => {
      const jpegBuffer = await sharp({ create: {
        width: 640, height: 480, channels: 3, background: { r: 80, g: 120, b: 40 },
      } }).jpeg().toBuffer();
      const result = await service.generateThumbnail(jpegBuffer, 'image/jpeg');
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
      const metadata = await sharp(result).metadata();
      expect(metadata).toMatchObject({ format: 'jpeg', width: 300, height: 300 });
    });

    it('should reject corrupt image data rather than fabricate a thumbnail', async () => {
      await expect(service.generateThumbnail(Buffer.from('not a jpeg'), 'image/jpeg')).rejects.toThrow();
    });

    it('should return original buffer for unsupported mime type', async () => {
      const buffer = Buffer.from('test');
      const result = await service.generateThumbnail(buffer, 'image/gif');
      expect(result).toBe(buffer);
    });

    it('should validate image type', () => {
      expect(service.validateImageType('image/jpeg')).toBe(true);
      expect(service.validateImageType('image/png')).toBe(true);
      expect(service.validateImageType('image/webp')).toBe(true);
      expect(service.validateImageType('image/gif')).toBe(false);
    });
  });
});
