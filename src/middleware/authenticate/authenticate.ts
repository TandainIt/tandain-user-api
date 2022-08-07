import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import TandainError from '@/utils/TandainError';
import { JWTPayload } from './authenticate.types';

const authenticate = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const jwtSecret = process.env.JWT_SECRET as string;

	try {
		const idToken = req.headers.authorization?.split(' ')[1];

		if (!idToken) {
			throw new TandainError('Authentication token is not exist', {
				code: 401,
				name: 'INVALID_TOKEN',
			});
		}

		const { sub, name, email } = jwt.verify(
			idToken,
			jwtSecret
		) as unknown as JWTPayload;

		const user = {
			id: sub,
			name: name,
			email: email,
		};

		req.user = user;

		return next();
	} catch (err) {
		if (err.name === 'TokenExpiredError') {
			res.status(401).json({
				code: 401,
				name: 'TOKEN_EXPIRED',
				message: 'Authentication is expired',
			});

			return;
		}

		res.status(401).json({ ...err, message: err.message });
	}
};

export default authenticate;
