import { generateRandomString } from '@/utils/utils';
import request from 'supertest';

import { app, server } from '@/app';
import Auth from '../service';
import TandainError from '@/utils/TandainError';

const mockLoginWithGoogle = jest.spyOn(Auth, 'loginWithGoogle');
const mockRefreshToken = jest.spyOn(Auth, 'refreshToken');
const mockRevoke = jest.spyOn(Auth, 'revoke');

jest.mock('@/middleware/authenticate', () =>
	jest.fn((req, _2, next) => {
		req.user = {
			id: 1,
			name: 'test',
			email: 'test@test.com',
		};

		next();
	})
);

const BASE_URL = '/api/v1';

describe('auth/controller', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	afterAll((done) => {
		server.close();
		done();
	});

	describe('POST /auth/login', () => {
		it('should send id_token, refresh_token, expiry_date and success message', async () => {
			const mockLoginWithGoogleResult = {
				idToken: generateRandomString(),
				idTokenExpMs: Date.now() + 3600000,
				message: 'Logged in successfully',
				refreshToken: generateRandomString(64),
			};

			mockLoginWithGoogle.mockResolvedValue(mockLoginWithGoogleResult);

			const res = await request(app)
				.post(`${BASE_URL}/auth/login`)
				.send({
					code: '4/0AX4XfWg6sVYpxftUy07gDC7G6kiNUwtd5a1nejak4QCg_bKifR6tD6B2hu_KjVv_mKszng',
					redirectUri: 'http://localhost:3000/auth/google-oauth',
				})
				.expect(200);

			expect(res.body).toEqual({
				id_token: mockLoginWithGoogleResult.idToken,
				expiry_date: mockLoginWithGoogleResult.idTokenExpMs,
				message: 'Logged in successfully',
				refresh_token: mockLoginWithGoogleResult.refreshToken,
			});
		});

		it('should send "Required parameter code is invalid" error when parameter "code" is invalid', async () => {
			const mockError = {
				name: 'Bad Request',
				code: 400,
				message: "Required parameter 'code' is invalid",
			};

			mockLoginWithGoogle.mockRejectedValue(mockError);

			const res = await request(app)
				.post(`${BASE_URL}/auth/login`)
				.send({
					code: '4/0AX4XfWg6sVYpxftUy07gDC7G6kiNUwtd5a1nejak4QCg_bKifR6tD6B2hu_KjVv_mKszng',
					redirectUri: 'http://localhost:3000/auth/google-oauth',
				})
				.expect(400);

			expect(res.body).toEqual(mockError);
		});
	});

	describe('POST /auth/refresh', () => {
		it('should send new id_token, expiry_date, refresh_token, and success message', async () => {
			const mockNewRefreshToken = generateRandomString(64);
			const mockNewIdToken = generateRandomString(128);
			const mockNewIdTokenExpMs = Date.now() + 3600000;

			mockRefreshToken.mockResolvedValue({
				idToken: mockNewIdToken,
				idTokenExpMs: mockNewIdTokenExpMs,
				refreshToken: mockNewRefreshToken,
				message: 'Refresh token successfully',
			});

			const res = await request(app)
				.post(`${BASE_URL}/auth/refresh`)
				.send({
					refresh_token:
						'0fzsXBUxEusm0y8LtB70eoELRHol+LoPlGp4rriObd9dB/QAsdMf7sHPWP3EfWM5',
				})
				.expect(200);

			expect(res.body).toEqual({
				id_token: mockNewIdToken,
				expiry_date: mockNewIdTokenExpMs,
				refresh_token: mockNewRefreshToken,
				message: 'Refresh token successfully',
			});
		});

		it('should send "Required parameter refresh_token is expired" error if refresh_token has been revoked', async () => {
			const mockError = {
				name: 'Bad Request',
				code: 400,
				message: "Required parameter 'refresh_token' is expired",
			};

			mockRefreshToken.mockRejectedValue(mockError);

			const res = await request(app)
				.post(`${BASE_URL}/auth/refresh`)
				.send({
					refresh_token:
						'0fzsXBUxEusm0y8LtB70eoELRHol+LoPlGp4rriObd9dB/QAsdMf7sHPWP3EfWM5',
				})
				.expect(400);

			expect(res.body).toEqual(mockError);
		});
	});

	describe('POST /auth/logout', () => {
		it('should revoke authentication and clear id_token cookie', async () => {
			const mockIdToken = generateRandomString(128);

			mockRevoke.mockResolvedValue([
				{
					id: 1,
					refresh_token: generateRandomString(128),
					user_id: 15,
					created_by_ip: '127.0.0.1',
					replaced_by: null,
					revoked_by_ip: '127.0.0.1',
					expiry_date: new Date().toISOString(),
					created_at: new Date().toISOString(),
					revoked_at: new Date().toISOString(),
				},
			]);

			const res = await request(app)
				.post(`${BASE_URL}/auth/logout`)
				.set('Cookie', `id_token=${mockIdToken};`)
				.send()
				.expect(302)
				.expect('Location', '/');
		});

		it('should throw "Something went wrong" if there is error in revoking authentication', async () => {
			const mockIdToken = generateRandomString(128);
			const mockError = {
				name: 'Internal Server Error',
				code: 500,
				message: 'Something went wrong',
			};

			mockRevoke.mockImplementation(() => {
				throw new TandainError(mockError.message, {
					code: mockError.code,
				});
			});

			const res = await request(app)
				.post(`${BASE_URL}/auth/logout`)
				.set('Cookie', `id_token=${mockIdToken};`)
				.send()
				.expect(mockError.code);

			expect(res.body).toEqual(mockError);
		});
	});
});
