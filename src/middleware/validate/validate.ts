import { NextFunction, Request, Response } from 'express';

export const validateBody = (keys: string[]) => {
	return (req: Request, res: Response, next: NextFunction) => {
		if (keys.length === 0) {
			return next();
		}

		const bodyOptions = Array.from(new Set(keys)); // NOTE: Make sure body option items are unique
		const requests = new Set(Object.keys(req.body));

		const notExistBodyKeys = bodyOptions.filter((key) => !requests.has(key));

		if (notExistBodyKeys.length === 0) {
			return next();
		}

		const notExistBodyStr = notExistBodyKeys.join(', ');

    // TODO: Change 'parameter' to 'body'
		const message = `Required parameter '${notExistBodyStr}' ${
			notExistBodyKeys.length > 1 ? 'are' : 'is'
		} required`;

		return res.status(400).send({
			code: 400,
			name: 'Bad Request',
			message,
		});
	};
};
