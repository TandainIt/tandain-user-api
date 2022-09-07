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
			const mockResult = { id, name, email, photo_url };

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
			const mockResult = { id, name, email, photo_url };

			pool.query.mockResolvedValueOnce(mockRows);

			const user = await UserModel.create('test', 'test@test.com');

			expect(user).toEqual(mockResult);
		});

		it('should throw an error when posgresql went wrong', async () => {
			const posgresqlError = {
				name: 'error',
				code: '23505',
        message: 'Failed to retrieve memory usage at process exit'
			};

			pool.query.mockRejectedValue(posgresqlError);

			await expect(
				UserModel.create('test', 'test@test.com', 'test.jpg')
			).rejects.toThrowError(
				new TandainError('Failed to retrieve memory usage at process exit')
			);
		});
	});

	describe('findOne', () => {
		it('should return user by id', async () => {
			const mockId = 1;
			const mockRows = {
				rows: [
					{
						id: mockId,
						name: 'test',
						email: 'test@test.com',
						photo_url: 'test.jpg',
					},
				],
			};

			const mockResult = mockRows.rows[0];

			pool.query.mockResolvedValue(mockRows);

			const user = await UserModel.findOne({ id: mockId });

			expect(user).toEqual(mockResult);
		});

		it('should return user by email', async () => {
			const mockEmail = 'test@test.com';
			const mockRows = {
				rows: [
					{
						id: 1,
						name: 'test',
						email: mockEmail,
						photo_url: 'test.jpg',
					},
				],
			};

			const mockResult = mockRows.rows[0];

			pool.query.mockResolvedValue(mockRows);

			const user = await UserModel.findOne({ email: mockEmail });

			expect(user).toEqual(mockResult);
		});

		it('should return null if user is not exists', async () => {
			const mockRows = {
				rows: [],
			};

			pool.query.mockResolvedValue(mockRows);

			const user = await UserModel.findOne({ id: 2 });

			expect(user).toEqual(null);
		});

		it('should throw an error when something went wrong', async () => {
			const posgresqlError = {
				name: 'system_error',
				code: '58000',
				message: 'Failed to retrieve memory usage at process exit',
			};

			pool.query.mockRejectedValue(posgresqlError);

			await expect(UserModel.findOne({ id: 2 })).rejects.toThrowError(
				new TandainError('Failed to retrieve memory usage at process exit')
			);
		});
	});
});
