import { Pool } from 'pg';

import TandainError from '@/utils/TandainError';
import UserModel from './model';

jest.mock('pg', () => {
	const mPool = {
		query: jest.fn(),
		end: jest.fn(),
		on: jest.fn(),
	};
	return { Pool: jest.fn(() => mPool) };
});

describe('user/model', () => {
	let pool: any; // TODO: Change type to be more specific

	beforeEach(async () => {
		pool = new Pool();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('create', () => {
		it('should success create a user with name, email, and photoURL ', async () => {
			const mockRows = {
				rows: [
					{
						id: 1,
						name: 'test',
						email: 'test@test.com',
						photo_url: 'test.jpg',
					},
				],
			};

			const { id, name, email, photo_url } = mockRows.rows[0];
			const mockResult = { id, name, email, photoURL: photo_url };

			pool.query.mockResolvedValueOnce(mockRows);

			const user = await UserModel.create('test', 'test@test.com', 'test.jpg');

			expect(user).toEqual(mockResult);
		});

		it('should success create a user with name and email ', async () => {
			const mockRows = {
				rows: [
					{
						id: 1,
						name: 'test',
						email: 'test@test.com',
						photo_url: undefined,
					},
				],
			};

      const { id, name, email, photo_url } = mockRows.rows[0];
			const mockResult = { id, name, email, photoURL: photo_url };

			pool.query.mockResolvedValueOnce(mockRows);

			const user = await UserModel.create('test', 'test@test.com');

			expect(user).toEqual(mockResult);
		});

		it('should throw an error when create duplicate user', async () => {
			const posgresqlError = {
				name: 'error',
				code: '23505',
			};

			pool.query.mockRejectedValue(posgresqlError);

			await expect(
				UserModel.create('test', 'test@test.com', 'test.jpg')
			).rejects.toThrowError(TandainError);
		});
	});

	describe('findByEmail', () => {
		it('should return user if email exists', async () => {
			const mockRows = {
				rows: [
					{
						id: 1,
						name: 'test',
						email: 'test@test.com',
						photo_url: 'test.jpg',
					},
				],
			};

      const { id, name, email, photo_url } = mockRows.rows[0];
			const mockResult = { id, name, email, photoURL: photo_url };

			pool.query.mockResolvedValueOnce(mockRows);

			const user = await UserModel.findByEmail('test@test.com');

			expect(user).toEqual(mockResult);
		});

		it('should return null if email does not exists', async () => {
			const mockRows = {
				rows: [],
			};

			pool.query.mockResolvedValueOnce(mockRows);

			const user = await UserModel.findByEmail('test@test.com');

			expect(user).toEqual(null);
		});

		it('should throw an error when PostgreSQL system is error', async () => {
			const posgresqlError = {
				name: 'system_error',
				code: '58000',
			};

			pool.query.mockRejectedValue(posgresqlError);

			await expect(UserModel.findByEmail('test@test.com')).rejects.toThrowError(
				TandainError
			);
		});
	});
});
