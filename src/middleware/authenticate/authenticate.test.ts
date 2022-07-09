import { generateRandomString } from '@/utils/utils';
import { NextFunction, Request, Response } from 'express';

import Auth from '@/auth/service';
import authenticate from './authenticate';
import { AuthenticatedRequest } from '@/auth/service/service.types';
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

		const { user } = mockRequest as AuthenticatedRequest;

		expect(nextFunction).toHaveBeenCalled();
		expect(user).toEqual(mockUser);
	});

	it('should send "Unauthenticated" message if id_token is not provided', () => {
		authenticate(
			mockRequest as Request,
			mockResponse as Response,
			nextFunction
		);

		expect(mockResponse.status).toHaveBeenCalledWith(401);
		expect(mockResponse.json).toHaveBeenCalledWith({
			message: 'Unauthorized',
		});
	});

	it('should send "Unauthenticated" message if user in id_token is fail to verify', () => {
    authenticate(
			mockRequest as Request,
			mockResponse as Response,
			nextFunction
		);

    verifyMock.mockImplementation(() => {
      throw new TandainError('Fail to verify jwt token', { code: 401 });
    });

		expect(mockResponse.status).toHaveBeenCalledWith(401);
		expect(mockResponse.json).toHaveBeenCalledWith({
			message: 'Unauthorized',
		});
  })
});
