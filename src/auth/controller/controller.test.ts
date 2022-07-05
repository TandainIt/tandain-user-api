import { generateRandomString, parseCookies } from '@/utils/utils';
import request from 'supertest';

import { app, server } from '@/app';
import Auth from '../service';

const mockLoginWithGoogle = jest.spyOn(Auth, 'loginWithGoogle');
const mockRefreshToken = jest.spyOn(Auth, 'refreshToken')

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
		it('should send refresh_token and success message and set cookie correctly', async () => {
			const mockLoginWithGoogleResult = {
				idToken: generateRandomString(),
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

			const rawCookies = res.headers['set-cookie'][0];
			const parsedCookies = parseCookies(rawCookies);

			expect(typeof parsedCookies['id_token']).toBe('string');
			expect(res.body).toEqual({
        refresh_token: mockLoginWithGoogleResult.refreshToken,
				message: mockLoginWithGoogleResult.message,
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
      const mockNewIdTokenExpMs = Date.now() + 3600000
      
      mockRefreshToken.mockResolvedValue({
				idToken: mockNewIdToken,
				idTokenExpMs: mockNewIdTokenExpMs,
				refreshToken: mockNewRefreshToken,
				message: 'Refresh token successfully',
			})

			const res = await request(app)
				.post(`${BASE_URL}/auth/refresh`)
				.send({
					refresh_token:
						'0fzsXBUxEusm0y8LtB70eoELRHol+LoPlGp4rriObd9dB/QAsdMf7sHPWP3EfWM5',
				})
				.expect(200);

      const rawCookies = res.headers['set-cookie'][0];
      const parsedCookies = parseCookies(rawCookies);

      expect(typeof parsedCookies['id_token']).toBe('string');
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
});
