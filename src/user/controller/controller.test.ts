import request from 'supertest';

import User from '../model';
import { app, server } from '@/app';
import * as utils from '../utils';
import { parseCookies } from '@/utils/globals';

jest.mock('../utils');

const createUserMock = jest.spyOn(User, 'create');
const findByEmailUserMock = jest.spyOn(User, 'findByEmail');
const generateJWTMock = jest.spyOn(User.prototype, 'generateJWT');

const BASE_URL = '/api/v1';

describe('user/controller', () => {
	describe('loginWithGoogle', () => {
		let mockUtils: jest.Mocked<typeof utils>;

		beforeAll(() => {
			mockUtils = utils as jest.Mocked<typeof utils>;
		});

		afterEach(() => {
			jest.clearAllMocks();
		});

		afterAll((done) => {
			server.close();
			done();
		});

		it('should send success message and set cookie correctly with new email', async () => {
			const mockUser = new User(1, 'test', 'test@test.com', 'https://test.com');
			const { name, email, photoURL } = mockUser;

			mockUtils.exchangeOAuthCode.mockResolvedValue({
				access_token: 'access_token',
				expiry_date: 1655994454014,
			});

			mockUtils.getUserProfile.mockResolvedValue({
				name,
				email,
				photoURL,
			});

			findByEmailUserMock.mockResolvedValue(null);
			createUserMock.mockResolvedValue(mockUser);
			generateJWTMock.mockReturnValue('id_token');

			const res = await request(app)
				.post(`${BASE_URL}/user/login/google`)
				.send({
					code: '4/0AX4XfWg6sVYpxftUy07gDC7G6kiNUwtd5a1nejak4QCg_bKifR6tD6B2hu_KjVv_mKszng',
					redirectUri: 'http://localhost:3000/auth/google-oauth',
				})
				.expect(200);

			const rawCookies = res.headers['set-cookie'][0];
			const parsedCookies = parseCookies(rawCookies);

			expect(typeof parsedCookies['id_token']).toBe('string');
			expect(res.body).toMatchObject({
				message: 'Logged in successfully',
			});
		});

		it('should send success message and set cookie correctly with existing email', async () => {
			const mockUser = new User(1, 'test', 'test@test.com', 'https://test.com');
			const { name, email, photoURL } = mockUser;

			mockUtils.exchangeOAuthCode.mockResolvedValue({
				access_token: 'access_token',
				expiry_date: 1655994454014,
			});

			mockUtils.getUserProfile.mockResolvedValue({
				name,
				email,
				photoURL,
			});

			findByEmailUserMock.mockResolvedValue(mockUser);
			generateJWTMock.mockReturnValue('id_token');

			const res = await request(app)
				.post(`${BASE_URL}/user/login/google`)
				.send({
					code: '4/0AX4XfWg6sVYpxftUy07gDC7G6kiNUwtd5a1nejak4QCg_bKifR6tD6B2hu_KjVv_mKszng',
					redirectUri: 'http://localhost:3000/auth/google-oauth',
				})
				.expect(200);

			const rawCookies = res.headers['set-cookie'][0];
			const parsedCookies = parseCookies(rawCookies);

			expect(typeof parsedCookies['id_token']).toBe('string');
			expect(res.body).toMatchObject({
				message: 'Logged in successfully',
			});
		});

		it('should send error with the message "Required parameter code is not exists"', async () => {
			const res = await request(app)
				.post(`${BASE_URL}/user/login/google`)
				.send({
					redirectUri: 'http://localhost:3000/auth/google-oauth',
				})
				.expect(400);

			expect(res.body).toMatchObject({
				name: 'Bad Request',
				code: 400,
				location: 'loginWithGoogle',
				message: "Required parameter 'code' is not exist",
			});
		});

		it('should send error with the message "Required parameter redirectUri is not exist"', async () => {
			const res = await request(app)
				.post(`${BASE_URL}/user/login/google`)
				.send({
					code: '4/0AX4XfWg6sVYpxftUy07gDC7G6kiNUwtd5a1nejak4QCg_bKifR6tD6B2hu_KjVv_mKszng',
				})
				.expect(400);

			expect(res.body).toMatchObject({
				name: 'Bad Request',
				code: 400,
				location: 'loginWithGoogle',
				message: "Required parameter 'redirectUri' is not exist",
			});
		});
	});
});
