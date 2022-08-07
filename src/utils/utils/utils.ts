import crypto from 'crypto';

import TandainError from '../TandainError';

export const generateRandomString = (length?: number): string => {
	length = length || Math.random();

	let result = '';
	const characters =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

	for (var i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * characters.length));
	}
	return result;
};

export const generateRandomCryptoString = async (length: number) => {
	try {
		const buffer = crypto.randomBytes(length);

		return buffer.toString('base64');
	} catch (err) {
		throw new TandainError(err.message);
	}
};
