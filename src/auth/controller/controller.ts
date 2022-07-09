import { validateBody } from '@/middleware/validate';
import { Router } from 'express';

import Auth from '../service';

const router = Router();

router.post(
	'/auth/login',
	validateBody(['code', 'redirectUri']),
	async (req, res) => {
		try {
			const { code, redirectUri } = req.body;

			const { idToken, message, refreshToken } = await Auth.loginWithGoogle(
				code,
				redirectUri,
				req.ip
			);

			res
				.cookie('id_token', idToken, {
					httpOnly: true,
					secure: process.env.NODE_ENV === 'production',
				})
				.send({ message, refresh_token: refreshToken });
		} catch (err) {
			res.status(err.code).json({ ...err, message: err.message });
		}
	}
);

router.post(
	'/auth/refresh',
	validateBody(['refresh_token']),
	async (req, res) => {
		try {
			const oldRefreshToken = req.body.refresh_token;

			const { idToken, refreshToken, idTokenExpMs, message } =
				await Auth.refreshToken(oldRefreshToken, req.ip);

			res
				.cookie('id_token', idToken, {
					httpOnly: true,
					secure: process.env.NODE_ENV === 'production',
				})
				.send({
					id_token: idToken,
					expiry_date: idTokenExpMs,
					refresh_token: refreshToken,
					message,
				});
		} catch (err) {
			res.status(err.code).json({ ...err, message: err.message });
		}
	}
);

export default router;
