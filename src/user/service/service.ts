import TandainError from '@/utils/TandainError';
import UserModel from '../model';

class User {
	public id: number;
	public name: string;
	public email: string;
	public photoURL: string | undefined;

	constructor(id: number, name: string, email: string, photoURL?: string) {
		this.id = id;
		this.name = name;
		this.email = email;
		this.photoURL = photoURL;
	}

	static async create(
		name: string,
		email: string,
		photoURL: string | null = null
	) {
		try {
			const user = await UserModel.create(name, email, photoURL);

			return new User(user.id, user.name, user.email, user.photoURL);
		} catch (err) {
			throw new TandainError(err.message, { name: err.name, code: err.code });
		}
	}

	static async findByEmail(email: string) {
		try {
			const user = await UserModel.findByEmail(email);

			if (!user) {
				return null;
			}

			return new User(user.id, user.name, user.email, user.photoURL);
		} catch (err) {
			throw new TandainError(err.message, { name: err.name, code: err.code });
		}
	}
}

export default User;
