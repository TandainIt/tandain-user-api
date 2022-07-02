import { generateRandomString, parseCookies } from '@/utils/utils';
import request from 'supertest';

import { app, server } from '@/app';
import Auth from '../service';

const mockLoginWithGoogle = jest.spyOn(Auth, 'loginWithGoogle');

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
		it('should send success message and set cookie correctly', async () => {
			const mockLoginWithGoogleResult = {
				idToken: generateRandomString(),
				message: 'Logged in successfully',
				refreshToken: generateRandomString(64),
			};

			mockLoginWithGoogle.mockResolvedValue({
				idToken: mockLoginWithGoogleResult.idToken,
				message: mockLoginWithGoogleResult.message,
				refreshToken: mockLoginWithGoogleResult.refreshToken,
			});

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
			expect(res.body).toMatchObject({
				message: mockLoginWithGoogleResult.message,
			});
		});

		it('should send error when Google OAuth code is invalid', async () => {
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

			expect(res.body).toMatchObject(mockError);
		});
	});
});
