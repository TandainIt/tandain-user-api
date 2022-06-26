import { validateBody } from '@/middleware/validate';
import { Router } from 'express';

import UserService from '../service';

const router = Router();

router.post(
	'/user/login',
	validateBody(['code', 'redirectUri']),
	async (req, res) => {
		try {
			const { code, redirectUri } = req.body;

			const { idToken, message } = await UserService.loginWithGoogle(
				code,
				redirectUri
			);

			res
				.cookie('id_token', idToken, {
					httpOnly: true,
					secure: true,
				})
				.send({ message });
		} catch (err) {
			res.status(err.code).json({ ...err, message: err.message });
		}
	}
);

export default router;
