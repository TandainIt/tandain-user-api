export const generateRandomString = (): string => {
	return Math.random().toString(36).replace('0.', '');
};

export const parseCookies = (rawCookie: string): Record<string, string> => {
	const cookies: Record<string, string> = {};
	rawCookie &&
		rawCookie.split(';').forEach(function (cookie: string) {
			const parts: RegExpMatchArray | null = cookie.match(/(.*?)=(.*)$/);
			if (parts && parts.length) {
				cookies[parts[1].trim()] = parts[2].trim();
			}
		});

	return cookies;
};
