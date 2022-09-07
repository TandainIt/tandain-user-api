import request from 'supertest';

import User from '../service';
import { app, server } from '@/app';

jest.mock('@/middleware/authenticate', () =>
	jest.fn((req, _2, next) => {
		req.user = {
			id: 1,
			name: 'test',
			email: 'test@test.com',
		};

		next();
	})
);

jest.mock('../service');

const BASE_URL = '/api/v1';

describe('user/controller', () => {
	let mockUserService: any;

	beforeEach(() => {
		mockUserService = User;
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	afterAll((done) => {
		server.close();
		done();
	});

	describe('GET /user', () => {
		it('should send id, name, and email of user', async () => {
			const mockUser = {
				id: 1,
				name: 'test',
				photo_url: 'test_url',
			};

			mockUserService.findOne = jest.fn().mockResolvedValue(mockUser);

			const res = await request(app).get(`${BASE_URL}/user`);

			expect(res.body).toEqual(mockUser);
		});

		it('should send "User is not found" error if user is null', async () => {
			mockUserService.findOne = jest.fn().mockResolvedValue(null);

			const res = await request(app).get(`${BASE_URL}/user`);

			expect(res.body).toEqual({
				name: 'USER_NOT_FOUND',
				code: 404,
				message: 'User is not found',
			});
		});
	});
});
