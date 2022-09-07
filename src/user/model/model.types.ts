import { AtLeastOne } from '@/types/AtLeastOne.types';
import User from '../service';

export type UserUniqueColumn = {
	id: Pick<User, 'id'>;
	email: Pick<User, 'email'>;
};

export type WhereUserOne = AtLeastOne<User, UserUniqueColumn>;
