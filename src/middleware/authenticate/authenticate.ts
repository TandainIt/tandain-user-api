import { NextFunction, Request, Response } from 'express';

import Auth from '@/auth/service';
import { AuthenticatedRequest } from '@/auth/service/service.types';
import TandainError from '@/utils/TandainError';

const authenticate = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const idToken = req.cookies['id_token'];

		if (!idToken) {
			throw TandainError;
		}

		const user = Auth.verify(idToken);

		req.user = user;

		return next();
	} catch (err) {
		res.status(401).json({ ...err, message: 'Unauthorized' });
	}
};

export default authenticate