import axios from 'axios';

import UserModel from '../model';
import { server } from '@/app';
import { generateRandomString } from '@/utils/globals';
import UserService from './service';
import { PARAM_CODE_INVALID, PARAM_REDIRECT_URI_INVALID } from '../errors';

jest.mock('axios');

const createUserMock = jest.spyOn(UserModel, 'create');
const findByEmailUserMock = jest.spyOn(UserModel, 'findByEmail');
const generateJWTMock = jest.spyOn(UserModel.prototype, 'generateJWT');

const exchangeOAuthCodeMock = jest.spyOn(
	UserService as any,
	'exchangeOAuthCode'
);
const getUserProfileMock = jest.spyOn(UserService as any, 'getUserProfile');

const mockAuthCode = generateRandomString();
const mockRedirectUri = 'http://localhost:3000/auth/google-oauth';

jest.mock('googleapis', () => {
	const mockGetTokenSuccess = {
		tokens: {
			access_token: 'test_access_token',
			id_token: 'test_id_token',
			expiry_date: 1655542503145,
		},
	};

	const mockError = {
		response: {
			data: {
				error: '',
			},
		},
	};

	return {
		google: {
			auth: {
				OAuth2: function (_: unknown, _2: unknown, redirectUri: string) {
					const mockGetToken = jest.fn(
						(code) =>
							new Promise((resolve, reject) => {
								if (code === mockAuthCode) {
									resolve(mockGetTokenSuccess);
								} else if (redirectUri !== mockRedirectUri) {
									mockError.response.data.error = 'invalid_request';
									reject(mockError);
								} else {
									mockError.response.data.error = 'invalid_grant';
									reject(mockError);
								}
							})
					);

					return {
						getToken: mockGetToken,
						setCredentials: jest.fn(),
					};
				},
			},
		},
	};
});

describe('user/service', () => {
	let mockAxios: jest.Mocked<typeof axios>;

	beforeEach(() => {
		mockAxios = axios as jest.Mocked<typeof axios>;
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	afterAll((done) => {
		server.close();
		done();
	});

	describe('exchangeOAuthCode', () => {
		it('should return credential object', async () => {
			const credentials = await UserService['exchangeOAuthCode'](
				mockAuthCode,
				mockRedirectUri
			);

			expect(credentials).toHaveProperty('access_token');
			expect(credentials).toHaveProperty('id_token');
			expect(credentials).toHaveProperty('expiry_date');
		});

		it('should return error if code is invalid', async () => {
			const mockFalseCode = generateRandomString();

			UserService['exchangeOAuthCode'](mockFalseCode, mockRedirectUri).catch(
				(err) => {
					expect(err.message).toBe(PARAM_CODE_INVALID);
				}
			);
		});

		it('should return error if redirectUri is invalid', async () => {
			const mockFalseRedirectUri = generateRandomString();

			UserService['exchangeOAuthCode'](
				mockAuthCode,
				mockFalseRedirectUri
			).catch((err) => {
				expect(err.message).toBe(PARAM_REDIRECT_URI_INVALID);
			});
		});
	});

	describe('getUserProfile', () => {
		it('should return user profile object', async () => {
			const mockAccessToken = generateRandomString();
			mockAxios.get.mockResolvedValue({
				data: {
					names: [{ displayName: 'test' }],
					emailAddresses: [{ value: 'test@test.com' }],
					photos: [{ url: 'test.com' }],
				},
			});

			const user = await UserService['getUserProfile'](mockAccessToken);

			expect(user).toMatchObject({
				name: 'test',
				email: 'test@test.com',
				photoURL: 'test.com',
			});
		});

		it('should return error when access token is invalid', async () => {
			const mockAccessToken = generateRandomString();
			const mockErrorMessage =
				'Request had invalid authentication credentials. ';

			mockAxios.get.mockRejectedValue({
				response: {
					data: {
						error: {
							code: 400,
							message: mockErrorMessage,
						},
					},
				},
			});

			await expect(
				UserService['getUserProfile'](mockAccessToken)
			).rejects.toThrow(mockErrorMessage);
		});
	});

	describe('loginWithGoogle', () => {
		it('should return idToken and success message with the new user email', async () => {
			const mockUser = new UserModel(
				1,
				'test',
				'test@test.com',
				'https://test.com'
			);
			const { name, email, photoURL } = mockUser;
			const mockIdToken = generateRandomString();

			exchangeOAuthCodeMock.mockResolvedValue({
				access_token: 'access_token',
				expiry_date: 1655994454014,
			});

			getUserProfileMock.mockResolvedValue({
				name,
				email,
				photoURL,
			});

			findByEmailUserMock.mockResolvedValue(null);
			createUserMock.mockResolvedValue(mockUser);
			generateJWTMock.mockReturnValue(mockIdToken);

			const body = {
				code: '4/0AX4XfWg6sVYpxftUy07gDC7G6kiNUwtd5a1nejak4QCg_bKifR6tD6B2hu_KjVv_mKszng',
				redirectUri: 'http://localhost:3000/auth/google-oauth',
			};

			const result = await UserService.loginWithGoogle(
				body.code,
				body.redirectUri
			);

			expect(result.idToken).toEqual(mockIdToken);
			expect(result.message).toEqual('Logged in successfully');
		});

		it('should return idToken and success message with the existing user email', async () => {
			const mockUser = new UserModel(
				1,
				'test',
				'test@test.com',
				'https://test.com'
			);
			const { name, email, photoURL } = mockUser;
			const mockIdToken = generateRandomString();

			exchangeOAuthCodeMock.mockResolvedValue({
				access_token: 'access_token',
				expiry_date: 1655994454014,
			});

			getUserProfileMock.mockResolvedValue({
				name,
				email,
				photoURL,
			});

			findByEmailUserMock.mockResolvedValue(mockUser);
			generateJWTMock.mockReturnValue(mockIdToken);

			const body = {
				code: '4/0AX4XfWg6sVYpxftUy07gDC7G6kiNUwtd5a1nejak4QCg_bKifR6tD6B2hu_KjVv_mKszng',
				redirectUri: 'http://localhost:3000/auth/google-oauth',
			};

			const result = await UserService.loginWithGoogle(
				body.code,
				body.redirectUri
			);

			expect(result.idToken).toEqual(mockIdToken);
			expect(result.message).toEqual('Logged in successfully');
		});

		it('should return error when exchanging code for token is error', async () => {
			const mockError = {
				code: 400,
				name: 'Bad Request',
				message: 'Request had invalid authentication credentials. ',
			};

			exchangeOAuthCodeMock.mockRejectedValue(mockError);

			const body = {
				code: '4/0AX4XfWg6sVYpxftUy07gDC7G6kiNUwtd5a1nejak4QCg_bKifR6tD6B2hu_KjVv_mKszng',
				redirectUri: 'http://localhost:3000/auth/google-oauth',
			};

			await expect(
				UserService.loginWithGoogle(body.code, body.redirectUri)
			).rejects.toThrow(mockError.message);
		});
	});
});
