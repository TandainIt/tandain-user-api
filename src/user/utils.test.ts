import { generateRandomString } from '../utils/globals';
import { PARAM_CODE_INVALID } from './errors';
import { exchangeOAuthCode } from './utils';

const mockAuthCode =
	'4/0AX4XfWir9vd_2qLAage1Ti57r-UMSZN8hngC_CoJpTVTApp1ByoecQi0q6TX5Uf1dJ6p-A';

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
        error: 'invalid_request', // invalid_grant
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

	const mockGetToken = jest.fn((code, cb) => {
		if (code === mockAuthCode) {
			cb(undefined, mockGetTokenSuccess);
		} else if (code.length === 73) {
			cb(mockGetTokenInvalidGrant, undefined);
		} else {
			cb(mockGetTokenInvalidRequest, undefined);
		}
	});

	return {
		google: {
			auth: {
				OAuth2: function () {
					return {
						getToken: mockGetToken,
						setCredentials: jest.fn(),
					};
				},
			},
		},
	};
});

describe('exchangeOAuthCode', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should return credential object', async () => {
		const mockRedirectUri = 'http://localhost:3000/auth/google-oauth';

		const credentials = await exchangeOAuthCode(mockAuthCode, mockRedirectUri);

		expect(credentials).toHaveProperty('access_token');
		expect(credentials).toHaveProperty('id_token');
		expect(credentials).toHaveProperty('expiry_date');
	});

	it('should return error if code is invalid', async () => {
		const mockCode = generateRandomString();
		const mockRedirectUri = 'http://localhost:3000/auth/google-oauth';

		exchangeOAuthCode(mockCode, mockRedirectUri).catch((err) => {
			expect(err.message).toBe(PARAM_CODE_INVALID);
		});
	});
});
