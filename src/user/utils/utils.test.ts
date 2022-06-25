import axios from 'axios';
import { generateRandomString } from '../../utils/globals';
import { PARAM_CODE_INVALID, PARAM_REDIRECT_URI_INVALID } from '../errors';
import { exchangeOAuthCode, getUserProfile } from './utils';

const mockAuthCode =
	'4/0AX4XfWir9vd_2qLAage1Ti57r-UMSZN8hngC_CoJpTVTApp1ByoecQi0q6TX5Uf1dJ6p-A';
const mockRedirectUri = 'http://localhost:3000/auth/google-oauth';

jest.mock('googleapis', () => {
	const mockGetTokenSuccess = {
		access_token: generateRandomString(),
		scope: generateRandomString(),
		token_type: 'Bearer',
		id_token: generateRandomString(),
		expiry_date: 1655542503145,
	};

	const mockGetTokenInvalidRequest = {
		response: {
			data: {
				error: 'invalid_request',
			},
		},
		code: '400',
	};

	const mockGetTokenInvalidGrant = {
		response: {
			data: {
				error: 'invalid_grant',
			},
		},
		code: '400',
	};

	return {
		google: {
			auth: {
				OAuth2: function (_: unknown, _2: unknown, redirectUri: string) {
					const mockGetToken = jest.fn((code, cb) => {
						if (code === mockAuthCode) {
							cb(undefined, mockGetTokenSuccess);
						} else if (redirectUri !== mockRedirectUri)
							cb(mockGetTokenInvalidRequest, undefined);
						else {
							cb(mockGetTokenInvalidGrant, undefined);
						}
					});

					return {
						getToken: mockGetToken,
						setCredentials: jest.fn(),
					};
				},
			},
		},
	};
});

jest.mock('axios');

let mockAxios: jest.Mocked<typeof axios>;

beforeEach(() => {
	mockAxios = axios as jest.Mocked<typeof axios>;
});

describe('exchangeOAuthCode', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should return credential object', async () => {
		const credentials = await exchangeOAuthCode(mockAuthCode, mockRedirectUri);

		expect(credentials).toHaveProperty('access_token');
		expect(credentials).toHaveProperty('id_token');
		expect(credentials).toHaveProperty('expiry_date');
	});

	it('should return error if code is invalid', async () => {
		const mockFalseCode = generateRandomString();

		exchangeOAuthCode(mockFalseCode, mockRedirectUri).catch((err) => {
			expect(err.message).toBe(PARAM_CODE_INVALID);
		});
	});

	it('should return error if redirectUri is invalid', async () => {
		const mockFalseRedirectUri = generateRandomString();

		exchangeOAuthCode(mockAuthCode, mockFalseRedirectUri).catch((err) => {
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

		const user = await getUserProfile(mockAccessToken);

		expect(user).toMatchObject({
			name: 'test',
			email: 'test@test.com',
			photoURL: 'test.com',
		});
	});

	it('should return error when access token is invalid', async () => {
		const mockAccessToken = generateRandomString();
		const mockErrorMessage = 'Request had invalid authentication credentials. ';

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

		await expect(getUserProfile(mockAccessToken)).rejects.toThrow(
			mockErrorMessage
		);
	});
});
