import { Auth, google } from 'googleapis';
import TandainError from '../utils/TandainError';

import { GOOGLE_EXHANGE_TOKEN_ERROR, PARAM_CODE_INVALID } from './errors';

export const exchangeOAuthCode = (code: string, redirectUri: string) => {
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
					const { response, code } = err;
					const errorName = response?.data.error;
					const errorCode = parseInt(code as string);

					const error = new TandainError(
						errorName,
						PARAM_CODE_INVALID,
						errorCode
					);

					reject(error);
				}

				oauth2Client.setCredentials(credentials as Auth.Credentials);

				resolve(credentials as Auth.Credentials);
			});
		}
	});
};
