import { generateRandomString } from '@/utils/utils';
import { NextFunction, Request, Response } from 'express';

import Auth from '@/auth/service';
import authenticate from './authenticate';
import TandainError from '@/utils/TandainError';

const verifyMock = jest.spyOn(Auth, 'verify');

describe('authenticate', () => {
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let nextFunction: NextFunction = jest.fn();

	beforeEach(() => {
		mockRequest = {};
		mockResponse = {
			status: jest.fn().mockReturnThis(), // NOTE: Chain methods mocking
			send: jest.fn(),
			json: jest.fn(),
		};
	});

	it('should success authenticate and add user property to Express request', () => {
		mockRequest = {
			cookies: {
				id_token: generateRandomString(128),
			},
		};

		const mockUser = {
			id: 1,
			name: 'test',
			email: 'test@test.com',
		};

		verifyMock.mockReturnValue(mockUser);

		authenticate(
			mockRequest as Request,
			mockResponse as Response,
			nextFunction
		);

		const { user } = mockRequest;

		expect(nextFunction).toHaveBeenCalled();
		expect(user).toEqual(mockUser);
	});

	it('should send "id_token is not exist" message if id_token is not provided', () => {
		mockRequest = {
			cookies: {},
		};

		authenticate(
			mockRequest as Request,
			mockResponse as Response,
			nextFunction
		);

		expect(mockResponse.status).toHaveBeenCalledWith(401);
		expect(mockResponse.json).toHaveBeenCalledWith({
			code: 401,
			location: 'authenticate',
			name: 'Unauthorized',
			message: 'id_token is not exist',
		});
	});

	it('should send "Unauthenticated" message if user in id_token is fail to verify', () => {
		mockRequest = {
			cookies: {
				id_token: generateRandomString(128),
			},
		};

		verifyMock.mockImplementation(() => {
			throw new TandainError('Fail to verify jwt token', { code: 401 });
		});

		authenticate(
			mockRequest as Request,
			mockResponse as Response,
			nextFunction
		);

		expect(mockResponse.status).toHaveBeenCalledWith(401);
		expect(mockResponse.json).toHaveBeenCalledWith({
			code: 401,
			location: 'authenticate',
			message: 'Fail to verify jwt token',
			name: 'Unauthorized',
		});
	});
});
