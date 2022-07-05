import pool from '../../postgresql/postgresql';
import { QueryResult } from 'pg';

import User from '../service';
import TandainError from '@/utils/TandainError';
import { joinQuery } from '@/utils/model';

class UserModel {
	static async create(
		name: string,
		email: string,
		photoURL: string | null = null
	) {
		try {
			const result: QueryResult = await pool.query(
				`INSERT INTO users (name, email, photo_url) VALUES ('${name}', '${email}', '${photoURL}') RETURNING *`
			);
			const user = result.rows[0];

			return new User(user.id, user.name, user.email, user.photo_url);
		} catch (err) {
			throw new TandainError(err.detail);
		}
	}

	static async findByEmail(email: string) {
		try {
			const result: QueryResult = await pool.query(
				`SELECT * FROM users WHERE email = '${email}'`
			);

			if (result.rows.length === 0) {
				return null;
			}

			const user = result.rows[0];

			return new User(user.id, user.name, user.email, user.photo_url);
		} catch (err) {
			throw new TandainError(err.detail);
		}
	}

  static async findOne(wheres: any) {
		const whereQuery = joinQuery(wheres);

		try {
			const result: QueryResult = await pool.query(
				`SELECT * FROM users WHERE ${whereQuery}`
			);

      if (result.rows.length === 0) {
				return null;
			}

			const user = result.rows[0];

      return user
		} catch (err) {
			throw new TandainError(err.message, { location: 'findOneAuth' });
		}
	} 
}

export default UserModel;
