import { Pool } from 'pg';

import TandainError from '@/utils/TandainError';
import User from './model';

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

			pool.query.mockResolvedValueOnce(mockRows);

			const user = await User.create('test', 'test@test.com', 'test.jpg');

			expect(user).toEqual(mockRows.rows[0]);
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

			pool.query.mockResolvedValueOnce(mockRows);

			const user = await User.create('test', 'test@test.com');

			expect(user).toEqual(mockRows.rows[0]);
		});

		it('should throw an error when create duplicate user', async () => {
			const posgresqlError = {
				name: 'error',
				code: '23505',
			};

			pool.query.mockRejectedValue(posgresqlError);

			await expect(
				User.create('test', 'test@test.com', 'test.jpg')
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

			pool.query.mockResolvedValueOnce(mockRows);

			const user = await User.findByEmail('test@test.com');

			expect(user).toEqual(mockRows.rows[0]);
		});

		it('should return null if email does not exists', async () => {
			const mockRows = {
				rows: [],
			};

			pool.query.mockResolvedValueOnce(mockRows);

			const user = await User.findByEmail('test@test.com');

			expect(user).toEqual(null);
		});

		it('should throw an error when PostgreSQL system is error', async () => {
			const posgresqlError = {
				name: 'system_error',
				code: '58000',
			};

			pool.query.mockRejectedValue(posgresqlError);

			await expect(User.findByEmail('test@test.com')).rejects.toThrowError(
				TandainError
			);
		});
	});

	describe('generateJWT', () => {
		it('should generate jwt token', () => {
			const user = new User(1, 'test', 'test@gmail.com', 'test.com');

			const idToken = user.generateJWT({
				iss: process.env.HOST,
				exp: 1,
				aud: process.env.HOST,
			});

			expect(typeof idToken).toBe('string');
		});
	});
});
