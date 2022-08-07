import { Auth as GoogleAuth, google } from 'googleapis';
import axios from 'axios';
import jwt from 'jsonwebtoken';

import AuthModel from '../model';
import User from '@/user/service';
import TandainError from '@/utils/TandainError';
import {
	GOOGLE_EXHANGE_TOKEN_ERROR,
	PARAM_CODE_INVALID,
	PARAM_REDIRECT_URI_INVALID,
} from '../errors';
import { GenerateCredentialsArgs } from './service.types';
import { generateRandomCryptoString } from '@/utils/utils';

class Auth {
	id: number;
	refresh_token: string;
	user_id: number;
	created_by_ip: string;
	replaced_by: string | null;
	revoked_by_ip: string | null;
	expiry_date: string;
	created_at: string;
	revoked_at: string | null;

	private static async exchangeOAuthCode(code: string, redirectUri: string) {
		try {
			const oauth2Client: GoogleAuth.OAuth2Client = new google.auth.OAuth2(
				process.env.GOOGLE_CLIENT_ID,
				process.env.GOOGLE_CLIENT_SECRET,
				redirectUri
			);

			const { tokens } = await oauth2Client.getToken(code);

			oauth2Client.setCredentials(tokens);

			return tokens;
		} catch (err) {
			const errors = {
				invalid_grant: {
					name: 'Invalid Grant',
					code: 400,
					message: PARAM_CODE_INVALID,
				},
				invalid_request: {
					name: 'Invalid Request',
					code: 400,
					message: PARAM_REDIRECT_URI_INVALID,
				},
				exhange_token_error: {
					name: 'Exchange Token Error',
					code: 500,
					message: GOOGLE_EXHANGE_TOKEN_ERROR,
				},
			};

			const error: keyof typeof errors = err.response
				? err.response.data.error
				: 'exhange_token_error';

			throw new TandainError(errors[error].message, {
				name: errors[error].name,
				code: errors[error].code,
			});
		}
	}

	private static async getUserProfile(accessToken: string) {
		const url = 'https://people.googleapis.com/v1/people/me';
		const params = {
			personFields: encodeURI('names,photos,emailAddresses'),
		};

		try {
			const { data } = await axios.get(url, {
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
				params,
			});

			const userProfile = {
				name: data.names[0].displayName,
				email: data.emailAddresses[0].value,
				photoURL: data.photos[0].url,
			};

			return userProfile;
		} catch (err) {
			const error = err.response.data.error;

			throw new TandainError(error.message, {
				code: error.code,
				location: 'getUserProfile',
			});
		}
	}

	private static async generateCredentials({
		id,
		name,
		email,
	}: GenerateCredentialsArgs) {
		const idTokenExpMs = Date.now() + 3600000;

		const idTokenPayload = {
			iss: process.env.HOST, // Issuer of the token
			sub: id, // Subject
			exp: idTokenExpMs, // Expiry date
			aud: process.env.HOST, // Recipient of the token
			name,
			email,
		}; // Reference: https://datatracker.ietf.org/doc/html/rfc7519#section-4.1

		const secret = process.env.JWT_SECRET as string;
		const idToken = jwt.sign(idTokenPayload, secret);

		const refreshToken = await generateRandomCryptoString(48);
		const refreshTokenExpMs = Date.now() + 5259600000; // NOTE: Expired in 2 Months

		return {
			idToken,
			idTokenExpMs,
			refreshToken,
			refreshTokenExpMs,
		};
	}

	static async loginWithGoogle(
		code: string,
		redirectUri: string,
		clientIp: string
	) {
		try {
			const { access_token } = await this.exchangeOAuthCode(code, redirectUri);

			const userProfile = await this.getUserProfile(access_token as string);
			const { name, email, photoURL } = userProfile;

			let user = await User.findByEmail(email);

			if (!user) {
				user = await User.create(name, email, photoURL);
			}

			const { idToken, refreshToken, refreshTokenExpMs } =
				await this.generateCredentials({
					id: user.id,
					name: user.name,
					email: user.email,
				});

			await AuthModel.insertOneAuth(
				refreshToken,
				user.id,
				refreshTokenExpMs,
				clientIp
			);

			return {
				idToken,
				refreshToken,
				message: 'Logged in successfully',
			};
		} catch (err) {
			throw new TandainError(err.message, {
				name: err.name,
				code: err.code,
				location: err.location,
			});
		}
	}

	static async refreshToken(oldRefreshToken: string, clientIp: string) {
		try {
			const oldAuth = await AuthModel.findOne({
				refresh_token: oldRefreshToken,
			});

			if (!oldAuth) {
				throw new TandainError(
					'Required parameter "refresh_token" is invalid',
					{ code: 400 }
				);
			}

			const isAuthExpired = new Date(oldAuth.expiry_date) < new Date();

			if (oldAuth.revoked_by_ip || isAuthExpired) {
				throw new TandainError(
					'Required parameter "refresh_token" is expired',
					{ code: 400 }
				);
			}

			const user = await User.findOne({ id: oldAuth.user_id });

			if (!user) {
				throw new TandainError('User is not found', { code: 400 });
			}

			const newCredentials = await this.generateCredentials({
				id: oldAuth.user_id,
				name: user.name,
				email: user.email,
			});

			await AuthModel.updateOne({
				updates: {
					revoked_by_ip: clientIp,
					revoked_at: new Date().toISOString(),
					replaced_by: newCredentials.refreshToken,
				},
				wheres: { refresh_token: oldRefreshToken },
			});

			await AuthModel.insertOneAuth(
				newCredentials.refreshToken,
				user.id,
				newCredentials.refreshTokenExpMs,
				clientIp
			);

			return {
				idToken: newCredentials.idToken,
				idTokenExpMs: newCredentials.idTokenExpMs,
				refreshToken: newCredentials.refreshToken,
				message: 'Refresh token successfully',
			};
		} catch (err) {
			if (err.code === 500) {
				throw new TandainError('Something went wrong', {
					...err,
				});
			}

			throw new TandainError(err.message, {
				...err,
			});
		}
	}

	static async revoke(clientIp: string, userId: number) {
		try {
			const auths = await AuthModel.updateMany({
				updates: {
					revoked_by_ip: clientIp,
					revoked_at: new Date().toISOString(),
				},
				wheres: {
					created_by_ip: clientIp,
					user_id: userId,
					revoked_at: null,
				},
			});

			return auths;
		} catch (err) {
			throw new TandainError('Something went wrong', {
				...err,
			});
		}
	}
}

export default Auth;
