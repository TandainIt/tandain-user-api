import { QueryResult } from 'pg';

import pool from '@/postgresql/postgresql';
import TandainError from '@/utils/TandainError';
import Auth from '../service';
import { joinQuery } from '@/utils/model';
import { updateOneAuthParams, whereAuthQueries } from './model.types';

class AuthModel {
	static async insertOneAuth(
		refreshToken: string,
		userId: number,
		expiryDateMs: number,
		createdByIp: string
	) {
		try {
			const result = await pool.query(
				`INSERT INTO auth (refresh_token, user_id, expiry_date, created_by_ip) VALUES ('${refreshToken}', '${userId}', to_timestamp(${expiryDateMs} / 1000.0), '${createdByIp}') RETURNING *`
			);

			return result.rows[0];
		} catch (err) {
			throw new TandainError(err.message, { location: 'insertOneAuth' });
		}
	}

	static async findOne(wheres: whereAuthQueries): Promise<Auth | null> {
		const whereQuery = joinQuery(wheres);

		try {
			const result: QueryResult<Auth> = await pool.query(
				`SELECT * FROM auth WHERE ${whereQuery}`
			);

			const auth = result.rows[0] || null;

			return auth;
		} catch (err) {
			throw new TandainError(err.message, { location: 'auth/findOne' });
		}
	}

	static async updateOne({ updates, wheres }: updateOneAuthParams) {
		const updateQuery = joinQuery(updates);
		const whereQuery = joinQuery(wheres, ' AND ');

		try {
			const result: QueryResult<Auth> = await pool.query(
				`UPDATE auth SET ${updateQuery} WHERE ${whereQuery} RETURNING *`
			);

			const auth = result.rows[result.rows.length - 1] || null;

			return auth;
		} catch (err) {
			throw new TandainError(err.message, { location: 'auth/updateOne' });
		}
	}
}

export default AuthModel;
