import pool from '@/postgresql/postgresql';
import TandainError from '@/utils/TandainError';

class AuthModel {
	public static async insertOneAuth(
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
}

export default AuthModel;
