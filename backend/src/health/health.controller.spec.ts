import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { HttpExceptionFilter } from '../common/http-exception.filter';
import type { Response } from 'express';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  const query = jest.fn();
  const config = { get: jest.fn() };
  const response = { status: jest.fn() };
  let controller: HealthController;

  beforeEach(() => {
    query.mockReset();
    config.get.mockReset();
    response.status.mockReset();
    controller = new HealthController(
      { query } as unknown as Repository<User>,
      config as unknown as ConfigService,
    );
  });

  it('reports healthy only after the database query succeeds', async () => {
    config.get.mockImplementation((key: string) => key === 'NODE_ENV' ? 'production' : undefined);
    query.mockResolvedValue([{ '1': 1 }]);
    await expect(controller.check(response as unknown as Response)).resolves.toEqual({
      status: 'healthy', timestamp: expect.any(String),
    });
    expect(query).toHaveBeenCalledWith('SELECT 1');
  });

  it('returns HTTP 503 without database details when production database is unavailable', async () => {
    config.get.mockImplementation((key: string) => key === 'NODE_ENV' ? 'production' : undefined);
    query.mockRejectedValue(new Error('private database connection details'));
    const result = await controller.check(response as unknown as Response);
    expect(response.status).toHaveBeenCalledWith(503);
    expect(result).toEqual({ status: 'unhealthy', timestamp: expect.any(String) });
  });

  it('preserves the unhealthy JSON contract and HTTP 503 through the real Nest response pipeline', async () => {
    query.mockRejectedValue(new Error('private database details'));
    config.get.mockImplementation((key: string) => key === 'NODE_ENV' ? 'production' : undefined);
    const module = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: getRepositoryToken(User), useValue: { query } },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();
    const app = module.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
    try {
      const result = await request(app.getHttpServer()).get('/health').expect(503);
      expect(result.body).toEqual({ status: 'unhealthy', timestamp: expect.any(String) });
    } finally {
      await app.close();
    }
  });

  it('keeps diagnostic failure details in development while returning HTTP 503', async () => {
    query.mockRejectedValue(new Error('connection refused'));
    const result = await controller.check(response as unknown as Response);
    expect(response.status).toHaveBeenCalledWith(503);
    expect(result).toMatchObject({
      status: 'unhealthy', database: { status: 'disconnected', error: 'connection refused' },
    });
  });
});
