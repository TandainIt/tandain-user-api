import { Pool } from 'pg';

import AuthModel from './model';
import {
	generateRandomCryptoString,
	generateRandomString,
} from '@/utils/utils';
import TandainError from '@/utils/TandainError';

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

	describe('findOne', () => {
		it('should return auth with id parameter', async () => {
			const mockRows = {
				rows: [
					{
						id: 1,
						refresh_token: generateRandomString(64),
						user_id: 15,
						created_by_ip: '127.0.0.1',
						replaced_by: generateRandomString(64),
						revoked_by_ip: '127.0.0.1',
						expiry_date: new Date().toISOString,
						created_at: new Date().toISOString,
						revoked_at: new Date().toISOString,
					},
				],
			};

			const mockResult = mockRows.rows[0];

			pool.query.mockResolvedValue(mockRows);

			const auth = await AuthModel.findOne({ id: 1 });

			expect(auth).toEqual(mockResult);
		});

		it('should return auth with refresh_token parameter', async () => {
			const mockRefreshToken = generateRandomString(64);
			const mockRows = {
				rows: [
					{
						id: 1,
						refresh_token: mockRefreshToken,
						user_id: 15,
						created_by_ip: '127.0.0.1',
						replaced_by: generateRandomString(64),
						revoked_by_ip: '127.0.0.1',
						expiry_date: new Date().toISOString,
						created_at: new Date().toISOString,
						revoked_at: new Date().toISOString,
					},
				],
			};

			const mockResult = mockRows.rows[0];

			pool.query.mockResolvedValue(mockRows);

			const auth = await AuthModel.findOne({ refresh_token: mockRefreshToken });

			expect(auth).toEqual(mockResult);
		});

		it('should return auth with replaced_by parameter', async () => {
			const mockReplacedBy = generateRandomString(64);
			const mockRows = {
				rows: [
					{
						id: 1,
						refresh_token: generateRandomString(64),
						user_id: 15,
						created_by_ip: '127.0.0.1',
						replaced_by: mockReplacedBy,
						revoked_by_ip: '127.0.0.1',
						expiry_date: new Date().toISOString,
						created_at: new Date().toISOString,
						revoked_at: new Date().toISOString,
					},
				],
			};

			const mockResult = mockRows.rows[0];

			pool.query.mockResolvedValue(mockRows);

			const auth = await AuthModel.findOne({ replaced_by: mockReplacedBy });

			expect(auth).toEqual(mockResult);
		});

		it('should return null if auth is not exists', async () => {
			const mockRows = {
				rows: [],
			};

			pool.query.mockResolvedValue(mockRows);

			const auth = await AuthModel.findOne({ id: 2 });

			expect(auth).toEqual(null);
		});

		it('should throw an error when something went wrong', async () => {
			const posgresqlError = {
				name: 'system_error',
				code: '58000',
			};

			pool.query.mockRejectedValue(posgresqlError);

			await expect(AuthModel.findOne({ id: 2 })).rejects.toThrowError(
				TandainError
			);
		});
	});

	describe('updateOne', () => {
		it('should return new auth with id in where clause', async () => {
			const mockId = 1;
			const mockUpdates = {
				revoked_by_ip: '127.0.0.1',
				revoked_at: new Date().toISOString(),
				replaced_by: generateRandomString(64),
			};

			const mockRows = {
				rows: [
					{
						id: mockId,
						refresh_token: generateRandomString(64),
						user_id: 15,
						created_by_ip: '127.0.0.1',
						replaced_by: mockUpdates.replaced_by,
						revoked_by_ip: mockUpdates.revoked_by_ip,
						expiry_date: new Date().toISOString,
						created_at: new Date().toISOString,
						revoked_at: mockUpdates.revoked_at,
					},
				],
			};

			pool.query.mockResolvedValue(mockRows);

			const result = await AuthModel.updateOne({
				updates: { ...mockUpdates },
				wheres: { id: mockId },
			});

			expect(result).toMatchObject(mockUpdates);
			expect(result.id).toEqual(mockId);
		});

		it('should return new auth with refresh_token in where clause', async () => {
			const mockRefreshToken = generateRandomString(64);
			const mockUpdates = {
				revoked_by_ip: '127.0.0.1',
				revoked_at: new Date().toISOString(),
				replaced_by: generateRandomString(64),
			};

			const mockRows = {
				rows: [
					{
						id: 1,
						refresh_token: mockRefreshToken,
						user_id: 15,
						created_by_ip: '127.0.0.1',
						replaced_by: mockUpdates.replaced_by,
						revoked_by_ip: mockUpdates.revoked_by_ip,
						expiry_date: new Date().toISOString,
						created_at: new Date().toISOString,
						revoked_at: mockUpdates.revoked_at,
					},
				],
			};

			pool.query.mockResolvedValue(mockRows);

			const result = await AuthModel.updateOne({
				updates: { ...mockUpdates },
				wheres: { refresh_token: mockRefreshToken },
			});

			expect(result).toMatchObject(mockUpdates);
			expect(result.refresh_token).toEqual(mockRefreshToken);
		});

		it('should return new auth with replaced_by in where clause', async () => {
			const mockReplacedBy = generateRandomString(64);
			const mockUpdates = {
				revoked_by_ip: '127.0.0.1',
				revoked_at: new Date().toISOString(),
			};

			const mockRows = {
				rows: [
					{
						id: 1,
						refresh_token: generateRandomString(64),
						user_id: 15,
						created_by_ip: '127.0.0.1',
						replaced_by: mockReplacedBy,
						revoked_by_ip: mockUpdates.revoked_by_ip,
						expiry_date: new Date().toISOString,
						created_at: new Date().toISOString,
						revoked_at: mockUpdates.revoked_at,
					},
				],
			};

			pool.query.mockResolvedValue(mockRows);

			const result = await AuthModel.updateOne({
				updates: { ...mockUpdates },
				wheres: { replaced_by: mockReplacedBy },
			});

			expect(result).toMatchObject(mockUpdates);
			expect(result.replaced_by).toEqual(mockReplacedBy);
		});

		it('should return null if auth is not exists', async () => {
			const mockUpdates = {
				revoked_by_ip: '127.0.0.1',
				revoked_at: new Date().toISOString(),
				replaced_by: generateRandomString(64),
			};

			const mockRows = {
				rows: [],
			};

			pool.query.mockResolvedValue(mockRows);

			const result = await AuthModel.updateOne({
				updates: { ...mockUpdates },
				wheres: { id: 1 },
			});

			expect(result).toEqual(null);
		});

		it('should throw error when updating user_id and user is not found', async () => {
			const posgresqlError = {
				name: 'foreign_key_violation',
				code: '23503',
				message:
					'insert or update on table "auth" violates foreign key constraint "fk_user"',
			};

			pool.query.mockRejectedValue(posgresqlError);

			await expect(AuthModel.findOne({ id: 2 })).rejects.toThrowError(
				posgresqlError.message
			);
		});
	});
});
