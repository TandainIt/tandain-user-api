export const generateRandomString = (): string => {
	return Math.random().toString(36).replace('0.', '');
};