import { Router } from 'express';

import authenticate from '@/middleware/authenticate';
import User from '../service';
import TandainError from '@/utils/TandainError';

const router = Router();

router.get('/user', authenticate, async (req, res) => {
	try {
		const user = await User.findOne({ id: req.user.id });

		if (!user) {
			throw new TandainError('User is not found', {
				code: 404,
				name: 'USER_NOT_FOUND',
			});
		}

		res.send(user);
	} catch (err) {
		res.status(err.code).json({ ...err, message: err.message });
	}
});

export default router;
