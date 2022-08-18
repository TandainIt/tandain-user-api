import authenticate from '@/middleware/authenticate';
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

			const credentials = await Auth.loginWithGoogle(code, redirectUri, req.ip);
			const { idToken, idTokenExpMs, refreshToken, message } = credentials;

			res.send({
				message,
				id_token: idToken,
				expiry_date: idTokenExpMs,
				refresh_token: refreshToken,
			});
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

			res.send({
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

router.post('/auth/logout', authenticate, async (req, res) => {
	try {
		await Auth.revoke(req.ip, req.user.id);

		res.redirect('/');
	} catch (err) {
		res.status(err.code).json({ ...err, message: err.message });
	}
});

export default router;
