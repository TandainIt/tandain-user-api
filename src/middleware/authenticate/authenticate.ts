import { NextFunction, Request, Response } from 'express';

import Auth from '@/auth/service';
import TandainError from '@/utils/TandainError';

const authenticate = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const idToken = req.cookies['id_token'];

		if (!idToken) {
			throw new TandainError('id_token is not exist', {
				name: 'Unauthorized',
				code: 401,
			});
		}

		const user = Auth.verify(idToken);

		req.user = user;

		return next();
	} catch (err) {
		res.status(401).json({
			...err,
			name: 'Unauthorized',
			location: 'authenticate',
			message: err.message,
		});
	}
};

export default authenticate;
