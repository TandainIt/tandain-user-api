import pool from '../../postgresql/postgresql';
import jwt from 'jsonwebtoken';

import { GenerateJWTArgs } from './model.types';
import { QueryResult } from 'pg';
import TandainError from '@/utils/TandainError';

class User {
	public id: number;
	public name: string;
	public email: string;
	public photo_url: string | undefined;

	constructor(id: number, name: string, email: string, photoURL?: string) {
		this.id = id;
		this.name = name;
		this.email = email;
		this.photo_url = photoURL;
	}

	static async create(
		name: string,
		email: string,
		photoURL: string | null = null
	) {
		try {
			const result: QueryResult<User> = await pool.query(
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

	public generateJWT({ iss, exp, aud }: GenerateJWTArgs) {
		const payload = {
			iss, // Issuer of the token
			sub: this.id, // Subject
			exp, // Expiry date
			aud, // Recipient of the token
			name: this.name,
			email: this.email,
		}; // Reference: https://datatracker.ietf.org/doc/html/rfc7519#section-4.1

		const secret = process.env.JWT_SECRET as string;

		return jwt.sign(payload, secret);
	}
}

export default User;
