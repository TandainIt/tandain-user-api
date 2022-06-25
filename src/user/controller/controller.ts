import { RequestHandler } from 'express';

import User from '../model';
import { exchangeOAuthCode, getUserProfile } from '../utils';
import TandainError from '@/utils/TandainError';
import { PARAM_CODE_NOT_EXIST, PARAM_REDIRECT_URI_NOT_EXIST } from '../errors';

export const loginWithGoogle: RequestHandler = async (req, res) => {
	const { code, redirectUri } = req.body;

	try {
		if (!code) {
			throw new TandainError(PARAM_CODE_NOT_EXIST, {
				code: 400,
				location: 'loginWithGoogle',
			});
		}

		if (!redirectUri) {
			throw new TandainError(PARAM_REDIRECT_URI_NOT_EXIST, {
				code: 400,
				location: 'loginWithGoogle',
			});
		}

		const { access_token, expiry_date } = await exchangeOAuthCode(
			code,
			redirectUri
		);

		const userProfile = await getUserProfile(access_token as string);
		const { name, email, photoURL } = userProfile;

		let user = await User.findByEmail(email);

		if (!user) {
			user = await User.create(name, email, photoURL);
		}

		const idToken = user.generateJWT({
			iss: process.env.HOST,
			exp: expiry_date,
			aud: process.env.HOST,
		});

		res
			.cookie('id_token', idToken, {
				httpOnly: true,
				secure: true,
			})
			.send({ message: 'Logged in successfully' });
	} catch (err) {
		res.status(err.code).json({ ...err, message: err.message });
	}
};

export default {
	loginWithGoogle,
};
