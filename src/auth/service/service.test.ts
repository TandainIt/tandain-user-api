import axios from 'axios';

import Auth from './service';
import AuthModel from '../model';
import User from '@/user/service';
import { server } from '@/app';
import { generateRandomString } from '@/utils/utils';
import { PARAM_CODE_INVALID, PARAM_REDIRECT_URI_INVALID } from '../errors';
import TandainError from '@/utils/TandainError';

jest.mock('axios');

const createUserMock = jest.spyOn(User, 'create');
const findByEmailUserMock = jest.spyOn(User, 'findByEmail');
const findOneUserMock = jest.spyOn(User, 'findOne');

const exchangeOAuthCodeMock = jest.spyOn(Auth as any, 'exchangeOAuthCode');
const getUserProfileMock = jest.spyOn(Auth as any, 'getUserProfile');
const generateCredentialsMock = jest.spyOn(Auth as any, 'generateCredentials');

const findOneAuthMock = jest.spyOn(AuthModel, 'findOne');
const insertOneAuthMock = jest.spyOn(AuthModel, 'insertOneAuth');
const updateManyAuthMock = jest.spyOn(AuthModel, 'updateMany');
const updateOneAuthMock = jest.spyOn(AuthModel, 'updateOne');

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

describe('auth/service', () => {
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
			const credentials = await Auth['exchangeOAuthCode'](
				mockAuthCode,
				mockRedirectUri
			);

			expect(credentials).toHaveProperty('access_token');
			expect(credentials).toHaveProperty('id_token');
			expect(credentials).toHaveProperty('expiry_date');
		});

		it('should return error if code is invalid', async () => {
			const mockFalseCode = generateRandomString();

			Auth['exchangeOAuthCode'](mockFalseCode, mockRedirectUri).catch((err) => {
				expect(err.message).toBe(PARAM_CODE_INVALID);
			});
		});

		it('should return error if redirectUri is invalid', async () => {
			const mockFalseRedirectUri = generateRandomString();

			Auth['exchangeOAuthCode'](mockAuthCode, mockFalseRedirectUri).catch(
				(err) => {
					expect(err.message).toBe(PARAM_REDIRECT_URI_INVALID);
				}
			);
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

			const user = await Auth['getUserProfile'](mockAccessToken);

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

			await expect(Auth['getUserProfile'](mockAccessToken)).rejects.toThrow(
				mockErrorMessage
			);
		});
	});

	describe('generateCredentials', () => {
		it('should success generate idToken, refreshToken, and their expiry date', async () => {
			const generateCredentials = Auth['generateCredentials'];

			const credentials = await generateCredentials({
				id: 1,
				name: 'Test',
				email: 'test@test.com',
			});

			expect(credentials).toMatchObject({
				idToken: expect.any(String),
				idTokenExpMs: expect.any(Number),
				refreshToken: expect.any(String),
				refreshTokenExpMs: expect.any(Number),
			});

			expect(credentials.refreshToken.length).toEqual(64);
		});
	});

	describe('loginWithGoogle', () => {
		const mockUser = new User(1, 'test', 'test@test.com', 'https://test.com');

		it('should return idToken, refreshToken, and a success message with the new user email', async () => {
			const { name, email, photoURL } = mockUser;

      const mockCredentials = {
				idToken: generateRandomString(128),
				idTokenExpMs: Date.now() + 3600000,
				refreshToken: generateRandomString(64),
				refreshTokenExpMs: Date.now() + 5259600000,
			};

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
      generateCredentialsMock.mockResolvedValue(mockCredentials);
			insertOneAuthMock.mockResolvedValue({});

			const body = {
				code: '4/0AX4XfWg6sVYpxftUy07gDC7G6kiNUwtd5a1nejak4QCg_bKifR6tD6B2hu_KjVv_mKszng',
				redirectUri: 'http://localhost:3000/auth/google-oauth',
			};

			const result = await Auth.loginWithGoogle(
				body.code,
				body.redirectUri,
				'127.0.0.1'
			);

			expect(result.idToken).toEqual(mockCredentials.idToken);
			expect(result.refreshToken).toEqual(mockCredentials.refreshToken);
			expect(result.message).toEqual('Logged in successfully');
		});

		it('should return idToken and success message with the existing user email', async () => {
			const { name, email, photoURL } = mockUser;

      const mockCredentials = {
				idToken: generateRandomString(128),
				idTokenExpMs: Date.now() + 3600000,
				refreshToken: generateRandomString(64),
				refreshTokenExpMs: Date.now() + 5259600000,
			};

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
      generateCredentialsMock.mockResolvedValue(mockCredentials);
			insertOneAuthMock.mockResolvedValue({});

			const body = {
				code: '4/0AX4XfWg6sVYpxftUy07gDC7G6kiNUwtd5a1nejak4QCg_bKifR6tD6B2hu_KjVv_mKszng',
				redirectUri: 'http://localhost:3000/auth/google-oauth',
			};

			const result = await Auth.loginWithGoogle(
				body.code,
				body.redirectUri,
				'127.0.0.1'
			);

			expect(result.idToken).toEqual(mockCredentials.idToken);
			expect(result.refreshToken).toEqual(mockCredentials.refreshToken);
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
				Auth.loginWithGoogle(body.code, body.redirectUri, '127.0.0.1')
			).rejects.toThrow(mockError.message);
		});
	});

	describe('refreshToken', () => {
		it('should return a new idToken, a expires date, a new refreshToken, and a success message', async () => {
			const mockOldRefreshToken = generateRandomString(64);
			const mockNewRefreshToken = generateRandomString(64);
			const mockNewIdToken = generateRandomString(128);
			const mockClientIp = '127.0.0.1';

			const mockOldAuth = {
				id: 1,
				refresh_token: mockOldRefreshToken,
				user_id: 15,
				created_by_ip: mockClientIp,
				replaced_by: null,
				revoked_by_ip: null,
				expiry_date: new Date(Date.now() + 1800000).toISOString(),
				created_at: new Date(Date.now() + 2700000).toISOString(),
				revoked_at: null,
			};

			const mockUser = {
				id: 15,
				name: 'test',
				email: 'test@test.com',
				photoURL: 'test.com',
			};

			const mockCredentials = {
				idToken: mockNewIdToken,
				idTokenExpMs: Date.now() + 3600000,
				refreshToken: mockNewRefreshToken,
				refreshTokenExpMs: Date.now() + 5259600000,
			};

			findOneAuthMock.mockResolvedValue(mockOldAuth);
			findOneUserMock.mockResolvedValue(mockUser);
			generateCredentialsMock.mockResolvedValue(mockCredentials);
			updateOneAuthMock.mockResolvedValue({
				...mockOldAuth,
				replaced_by: generateRandomString(64),
				revoked_by_ip: mockClientIp,
				revoked_at: new Date().toISOString(),
			});
			insertOneAuthMock.mockResolvedValue({
				...mockOldAuth,
				id: 2,
				refresh_token: generateRandomString(64),
				created_at: new Date().toISOString(),
			});

			const result = await Auth.refreshToken(mockOldRefreshToken, mockClientIp);

			expect(result).toMatchObject({
				idToken: mockNewIdToken,
				idTokenExpMs: expect.any(Number),
				refreshToken: mockNewRefreshToken,
				message: 'Refresh token successfully',
			});
		});

		it('should throw "Required parameter refresh_token is invalid" if refresh_token is not exists', async () => {
			const mockOldRefreshToken = generateRandomString(64);
			const mockClientIp = '127.0.0.1';

			findOneAuthMock.mockResolvedValue(null);

			await expect(
				Auth.refreshToken(mockOldRefreshToken, mockClientIp)
			).rejects.toThrow('Required parameter "refresh_token" is invalid');
		});

		it('should throw "Required parameter refresh_token is expired" if refresh_token has been revoked', async () => {
			const mockOldRefreshToken = generateRandomString(64);
			const mockClientIp = '127.0.0.1';

			const mockOldAuth = {
				id: 1,
				refresh_token: mockOldRefreshToken,
				user_id: 15,
				created_by_ip: mockClientIp,
				replaced_by: null,
				revoked_by_ip: mockClientIp,
				expiry_date: new Date(Date.now() + 1800000).toISOString(),
				created_at: new Date(Date.now() + 2700000).toISOString(),
				revoked_at: null,
			};

			findOneAuthMock.mockResolvedValue(mockOldAuth);

			await expect(
				Auth.refreshToken(mockOldRefreshToken, mockClientIp)
			).rejects.toThrow('Required parameter "refresh_token" is expired');
		});

		it('should throw "Required parameter refresh_token is expired" if refresh_token is expired', async () => {
			const mockOldRefreshToken = generateRandomString(64);
			const mockClientIp = '127.0.0.1';

			const mockOldAuth = {
				id: 1,
				refresh_token: mockOldRefreshToken,
				user_id: 15,
				created_by_ip: mockClientIp,
				replaced_by: null,
				revoked_by_ip: null,
				expiry_date: new Date(Date.now() - 600000).toISOString(),
				created_at: new Date(Date.now() - 2700000).toISOString(),
				revoked_at: null,
			};

			findOneAuthMock.mockResolvedValue(mockOldAuth);

			await expect(
				Auth.refreshToken(mockOldRefreshToken, mockClientIp)
			).rejects.toThrow('Required parameter "refresh_token" is expired');
		});

		it('should throw "User is not found" if user_id is invalid', async () => {
			const mockOldRefreshToken = generateRandomString(64);
			const mockClientIp = '127.0.0.1';

			const mockOldAuth = {
				id: 1,
				refresh_token: mockOldRefreshToken,
				user_id: 15,
				created_by_ip: mockClientIp,
				replaced_by: null,
				revoked_by_ip: null,
				expiry_date: new Date(Date.now() + 1800000).toISOString(),
				created_at: new Date(Date.now() + 2700000).toISOString(),
				revoked_at: null,
			};

			findOneAuthMock.mockResolvedValue(mockOldAuth);
			findOneUserMock.mockResolvedValue(null);

			await expect(
				Auth.refreshToken(mockOldRefreshToken, mockClientIp)
			).rejects.toThrow('User is not found');
		});

		it('should throw "Something went wrong" if user is already not exists', async () => {
			const mockOldRefreshToken = generateRandomString(64);
			const mockClientIp = '127.0.0.1';

			const mockOldAuth = {
				id: 1,
				refresh_token: mockOldRefreshToken,
				user_id: 15,
				created_by_ip: mockClientIp,
				replaced_by: null,
				revoked_by_ip: null,
				expiry_date: new Date(Date.now() + 1800000).toISOString(),
				created_at: new Date(Date.now() + 2700000).toISOString(),
				revoked_at: null,
			};

			const mockUser = {
				id: 15,
				name: 'test',
				email: 'test@test.com',
				photoURL: 'test.com',
			};

			const mockCredentials = {
				idToken: generateRandomString(128),
				idTokenExpMs: Date.now() + 3600000,
				refreshToken: generateRandomString(64),
				refreshTokenExpMs: Date.now() + 5259600000,
			};

			findOneAuthMock.mockResolvedValue(mockOldAuth);
			findOneUserMock.mockResolvedValue(mockUser);
			generateCredentialsMock.mockResolvedValue(mockCredentials);
			updateOneAuthMock.mockRejectedValue({
				code: 500,
				message:
					'insert or update on table "auth" violates foreign key constraint "fk_user"',
				location: 'auth/updateOne',
			});

			await expect(
				Auth.refreshToken(mockOldRefreshToken, mockClientIp)
			).rejects.toThrow('Something went wrong');
		});
	});

	describe('revoke', () => {
		it('should return revoked authentication', async () => {
			const clientIp = '127.0.0.1';
			const userId = 1;
			const updatesMock = {
				revoked_by_ip: clientIp,
				revoked_at: new Date().toISOString(),
			};

			const updateManyReturn: Auth[] = [
				{
					id: 1,
					refresh_token: generateRandomString(128),
					user_id: 15,
					created_by_ip: '127.0.0.1',
					replaced_by: null,
					revoked_by_ip: updatesMock.revoked_by_ip,
					expiry_date: new Date().toISOString(),
					created_at: new Date().toISOString(),
					revoked_at: updatesMock.revoked_at,
				},
				{
					id: 2,
					refresh_token: generateRandomString(128),
					user_id: 15,
					created_by_ip: '127.0.0.1',
					replaced_by: null,
					revoked_by_ip: updatesMock.revoked_by_ip,
					expiry_date: new Date().toISOString(),
					created_at: new Date().toISOString(),
					revoked_at: updatesMock.revoked_at,
				},
			];

			updateManyAuthMock.mockResolvedValue(updateManyReturn);

			const result = await Auth.revoke(clientIp, userId);

			expect(result).toEqual(updateManyReturn);
		});

		it('should return empty array if ip of the client is not found', async () => {
			const clientIp = '127.0.0.1';
			const userId = 1;
			updateManyAuthMock.mockResolvedValue([]);

			const result = await Auth.revoke(clientIp, userId);

			expect(result).toEqual([]);
		});

		it('should throw "Something went wrong" if there is error in updating authentication', async () => {
			const clientIp = '127.0.0.1';
			const userId = 1;
			const updateManyRejected = {
				code: 500,
				message: 'Something went wrong',
			};

			updateManyAuthMock.mockRejectedValue(updateManyRejected);

			await expect(Auth.revoke(clientIp, userId)).rejects.toThrowError(
				new TandainError(updateManyRejected.message)
			);
		});
	});
});
