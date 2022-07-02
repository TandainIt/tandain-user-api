import { Pool } from 'pg';

import AuthModel from './model';
import { generateRandomCryptoString } from '@/utils/utils';

jest.mock('pg', () => {
	const mPool = {
		query: jest.fn(),
		end: jest.fn(),
		on: jest.fn(),
	};
	return { Pool: jest.fn(() => mPool) };
});

describe('auth/model', () => {
	let pool: any; // TODO: Change type to be more specific

	beforeEach(async () => {
		pool = new Pool();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('insertOneAuth', () => {
		it('should success create an authentication', async () => {
			const refreshToken = await generateRandomCryptoString(48);
			const params = {
				refreshToken,
				userId: 1234,
				clientIp: '127.0.0.1',
				expiryDateMs: Date.now() + 5259600000,
			};

			const mockRows = {
				rows: [
					{
						id: 1,
						refresh_token: params.refreshToken,
						user_id: params.userId,
						created_by_ip: params.clientIp,
						replaced_by: null,
						revoked_by_ip: null,
						expiry_date: '2022-08-31T09:34:51.535Z',
						created_at: '2022-07-01T12:34:51.536Z',
						revoked_at: null,
					},
				],
			};

			pool.query.mockResolvedValueOnce(mockRows);

			const result = await AuthModel.insertOneAuth(
				params.refreshToken,
				params.userId,
				params.expiryDateMs,
				params.clientIp
			);

			expect(result).toEqual({
				id: 1,
				refresh_token: params.refreshToken,
				user_id: params.userId,
				created_by_ip: params.clientIp,
				replaced_by: null,
				revoked_by_ip: null,
				expiry_date: expect.any(String),
				created_at: expect.any(String),
				revoked_at: null,
			});
		});

		it('should throw an error when insert duplicated refresh token', async () => {
			const refreshToken = await generateRandomCryptoString(48);
			const params = {
				refreshToken,
				userId: 1234,
				clientIp: '127.0.0.1',
				expiryDateMs: Date.now() + 5259600000,
			};

			const posgresqlError = {
				name: 'error',
				code: '23505',
				message:
					'duplicate key value violates unique constraint "auth_refresh_token_key"',
			};

			pool.query.mockRejectedValue(posgresqlError);

			await expect(
				AuthModel.insertOneAuth(
					params.refreshToken,
					params.userId,
					params.expiryDateMs,
					params.clientIp
				)
			).rejects.toThrowError(posgresqlError.message);
		});
	});
});
