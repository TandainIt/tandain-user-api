import { NextFunction, Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';

import { generateRandomString } from '@/utils/utils';
import authenticate from './authenticate';

const mockJwtVerify = jest.spyOn(jwt, 'verify');

describe('middleware/authenticate', () => {
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

	it('should authenticate user and add user property in Express request', () => {
		mockRequest = {
			headers: {
				authorization: `Bearer ${generateRandomString(128)}`,
			},
		};

		const mockJwtReturnValue = {
			sub: 1,
			name: 'test',
			email: 'test@test.com',
		};

		mockJwtVerify.mockImplementation(() => mockJwtReturnValue);

		authenticate(
			mockRequest as Request,
			mockResponse as Response,
			nextFunction
		);

		expect(nextFunction).toHaveBeenCalled();
		expect(mockRequest.user).toEqual({
			id: mockJwtReturnValue.sub,
			name: mockJwtReturnValue.name,
			email: mockJwtReturnValue.email,
		});
	});

	it('should send "Authentication token is not exist" message if token is not exist', () => {
		mockRequest = {
			headers: {},
		};

		authenticate(
			mockRequest as Request,
			mockResponse as Response,
			nextFunction
		);

		expect(mockResponse.status).toHaveBeenCalledWith(401);
		expect(mockResponse.json).toHaveBeenCalledWith({
			code: 401,
			name: 'INVALID_TOKEN',
			message: 'Authentication token is not exist',
		});
	});

	it('should send "Authentication is expired" message if token is expired', () => {
		mockJwtVerify.mockImplementation(() => {
			throw new TokenExpiredError('jwt expired', new Date());
		});

		mockRequest = {
			headers: {
				authorization: `Bearer ${generateRandomString(128)}`,
			},
		};

		authenticate(
			mockRequest as Request,
			mockResponse as Response,
			nextFunction
		);

	  expect(mockResponse.status).toHaveBeenCalledWith(401);
		expect(mockResponse.json).toHaveBeenCalledWith({
			code: 401,
			name: 'TOKEN_EXPIRED',
			message: 'Authentication is expired',
		});
	});
});
