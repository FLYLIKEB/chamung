import { Response } from 'express';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    loginWithKakao: jest.fn(),
    loginWithGoogle: jest.fn(),
    validateAndRotateRefreshToken: jest.fn(),
    revokeAllRefreshTokens: jest.fn(),
    getMe: jest.fn(),
    linkKakao: jest.fn(),
    linkGoogle: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    findEmail: jest.fn(),
    changePassword: jest.fn(),
    verifyEmail: jest.fn(),
    resendVerification: jest.fn(),
    requestEmailChange: jest.fn(),
    confirmEmailChange: jest.fn(),
    withdraw: jest.fn(),
  };

  let controller: AuthController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AuthController(mockAuthService as never);
  });

  it('login은 refresh_token 쿠키를 30일로 설정해야 한다', async () => {
    const req = { user: { id: 1 } };
    const res = {
      cookie: jest.fn(),
    } as unknown as Response;

    mockAuthService.login.mockResolvedValue({
      access_token: 'access',
      refresh_token: 'refresh',
      user: { id: 1, email: 'test@example.com', name: 'User' },
    });

    await controller.login(req as never, {} as never, res);

    expect(mockAuthService.login).toHaveBeenCalledWith(req.user);
    expect((res.cookie as jest.Mock).mock.calls).toEqual(
      expect.arrayContaining([
        [
          'refresh_token',
          'refresh',
          expect.objectContaining({
            httpOnly: true,
            path: '/',
            maxAge: 30 * 24 * 60 * 60 * 1000,
          }),
        ],
      ]),
    );
  });

  it('refresh는 refresh_token 쿠키를 30일로 다시 설정해야 한다', async () => {
    const req = {
      cookies: { refresh_token: 'old-refresh' },
    };
    const res = {
      cookie: jest.fn(),
    } as unknown as Response;

    mockAuthService.validateAndRotateRefreshToken.mockResolvedValue({
      access_token: 'new-access',
      refresh_token: 'new-refresh',
      userId: 1,
    });

    await controller.refresh(req as never, res);

    expect(mockAuthService.validateAndRotateRefreshToken).toHaveBeenCalledWith('old-refresh');
    expect((res.cookie as jest.Mock).mock.calls).toEqual(
      expect.arrayContaining([
        [
          'refresh_token',
          'new-refresh',
          expect.objectContaining({
            httpOnly: true,
            path: '/',
            maxAge: 30 * 24 * 60 * 60 * 1000,
          }),
        ],
      ]),
    );
  });
});
