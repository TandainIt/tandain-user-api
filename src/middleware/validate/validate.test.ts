import { NextFunction, Request, Response } from 'express';

import { validateBody } from './validate';

describe('middleware', () => {
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let nextFunction: NextFunction = jest.fn();

	beforeEach(() => {
		mockRequest = {};
		mockResponse = {
			status: jest.fn().mockReturnThis(), // NOTE: Chain methods mocking
			send: jest.fn(),
		};
	});

	describe('validate', () => {
		it('should call next function when the body fulfill required params', () => {
			const middlewareFn = validateBody(['code', 'redirectUri']);

			mockRequest = {
				body: {
					code: '',
					redirectUri: '',
				},
			};

			middlewareFn(
				mockRequest as Request,
				mockResponse as Response,
				nextFunction
			);

			expect(nextFunction).toHaveBeenCalled();
		});

		it('should call next function when there is duplication in validateBody params', () => {
			const middlewareFn = validateBody(['code', 'redirectUri', 'code']);

			mockRequest = {
				body: {
					code: '',
					redirectUri: '',
				},
			};

			middlewareFn(
				mockRequest as Request,
				mockResponse as Response,
				nextFunction
			);

			expect(nextFunction).toHaveBeenCalled();
		});

		it('should call next function when validateBody param array is empty', () => {
			const middlewareFn = validateBody([]);

			mockRequest = {
				body: {
					code: '',
					redirectUri: '',
				},
			};

			middlewareFn(
				mockRequest as Request,
				mockResponse as Response,
				nextFunction
			);

			expect(nextFunction).toHaveBeenCalled();
		});

		it('should return single required parameter error', () => {
			const middlewareFn = validateBody(['code', 'redirectUri']);

			mockRequest = {
				body: {
					redirectUri: '',
				},
			};

			middlewareFn(
				mockRequest as Request,
				mockResponse as Response,
				nextFunction
			);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.send).toHaveBeenCalledWith({
				code: 400,
				name: 'Bad Request',
				message: "Required parameter 'code' is required",
			});
		});

		it('should return multi required parameters error', () => {
			const middlewareFn = validateBody(['code', 'redirectUri']);

			mockRequest = {
				body: {},
			};

			middlewareFn(
				mockRequest as Request,
				mockResponse as Response,
				nextFunction
			);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.send).toHaveBeenCalledWith({
				code: 400,
				name: 'Bad Request',
				message: "Required parameter 'code, redirectUri' are required",
			});
		});
	});
});
