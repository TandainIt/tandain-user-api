import { JoinParams } from './model.types';

export const joinQuery = (obj: JoinParams, joinedBy: string = ', ') => {
	return Object.keys(obj)
		.map((key) => `${key}='${obj[key]}'`)
		.join(joinedBy);
};
