import { JoinParams } from './model.types';

export const joinQuery = (obj: JoinParams, joinedBy: string = ', ') => {
	return Object.keys(obj)
		.map((key) => {
			const value = obj[key];

			if (value === null) {
				return `${key} IS NULL`;
			}

			return `${key}='${value}'`;
		})
		.join(joinedBy);
};
