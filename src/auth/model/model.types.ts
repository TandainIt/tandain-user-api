import { AtLeastOne } from '@/types/AtLeastOne.types';
import Auth from '../service';

export type AuthUniqueColumn = {
	id: Pick<Auth, 'id'>;
	refresh_token: Pick<Auth, 'refresh_token'>;
	replaced_by: Pick<Auth, 'replaced_by'>;
};

export type whereAuthQueries = AtLeastOne<Auth, AuthUniqueColumn>;

export interface updateOneAuthParams {
	updates: Partial<Auth>;
	wheres: whereAuthQueries;
}
