import { GaxiosError } from 'gaxios';
import { Auth, google } from 'googleapis';

import TandainError from '../utils/TandainError';
import {
	GOOGLE_EXHANGE_TOKEN_ERROR,
	PARAM_CODE_INVALID,
	PARAM_REDIRECT_URI_INVALID,
} from './errors';
import { GetTokenError } from './utils.types';

export const exchangeOAuthCode = (code: string, redirectUri: string) => {
	const generateGetTokenError = (error: GaxiosError<GetTokenError>) => {
		const { response, code } = error;
		const messages = {
			invalid_request: PARAM_REDIRECT_URI_INVALID,
			invalid_grant: PARAM_CODE_INVALID,
			exhange_token_error: GOOGLE_EXHANGE_TOKEN_ERROR,
		};

		const errorName = response?.data.error || 'exhange_token_error';
		const errorMessage = messages[errorName];
		const errorCode = parseInt(code as string);

		return { errorName, errorMessage, errorCode };
	};

	return new Promise<Auth.Credentials>((resolve, reject) => {
		{
			const credentials = {
				clientId: process.env.GOOGLE_CLIENT_ID,
				clientSecret: process.env.GOOGLE_CLIENT_SECRET,
				redirectUri,
			};

			const oauth2Client: Auth.OAuth2Client = new google.auth.OAuth2(
				credentials.clientId,
				credentials.clientSecret,
				credentials.redirectUri
			);

			oauth2Client.getToken(code, (err, credentials) => {
				if (err) {
					const { errorName, errorMessage, errorCode } =
						generateGetTokenError(err);

					const error = new TandainError(errorName, errorMessage, errorCode);

					reject(error);
				}

				oauth2Client.setCredentials(credentials as Auth.Credentials);

				resolve(credentials as Auth.Credentials);
			});
		}
	});
};
