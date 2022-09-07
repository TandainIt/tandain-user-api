import User from './service';
import UserModel from '../model';
import TandainError from '@/utils/TandainError';

const mockCreate = jest.spyOn(UserModel, 'create');
const mockFindOne = jest.spyOn(UserModel, 'findOne');

describe('user/service', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('create', () => {
		it('should success create a user with name, email, and photo_url ', async () => {
			const mockUser = {
				name: 'test',
				email: 'test@test.com',
				photo_url: 'test.jpg',
			};

			mockCreate.mockResolvedValue({
				id: 1,
				...mockUser,
			});

			const user = await User.create(
				mockUser.name,
				mockUser.email,
				mockUser.photo_url
			);

			expect(user).toMatchObject({
				id: 1,
				...mockUser,
			});
		});

		it('should success create a user with name and email ', async () => {
			const mockUser = {
				name: 'test',
				email: 'test@test.com',
			};

			mockCreate.mockResolvedValue({
				id: 1,
				...mockUser,
				photo_url: undefined,
			});

			const user = await User.create(mockUser.name, mockUser.email);

			expect(user).toMatchObject({
				id: 1,
				...mockUser,
				photo_url: undefined,
			});
		});

		it('should throw an error when create duplicate user', async () => {
			const mockUser = {
				name: 'test',
				email: 'test@test.com',
				photo_url: 'test.jpg',
			};

			mockCreate.mockRejectedValue({
				message: 'Key (email)=(test@test.com) already exists',
			});

			await expect(
				User.create(mockUser.name, mockUser.email, mockUser.photo_url)
			).rejects.toThrowError(
				new TandainError('Key (email)=(test@test.com) already exists')
			);
		});
	});

	describe('findOne', () => {
		it('should return user by id', async () => {
			const mockUser = {
				id: 1,
				name: 'test',
				email: 'test@test.com',
				photo_url: 'test.jpg',
			};

			mockFindOne.mockResolvedValue(mockUser);

			const user = await User.findOne({ id: mockUser.id });

			expect(user).toEqual(mockUser);
		});

		it('should return user by email', async () => {
			const mockUser = {
				id: 1,
				name: 'test',
				email: 'test@test.com',
				photo_url: 'test.jpg',
			};

			mockFindOne.mockResolvedValue(mockUser);

			const user = await User.findOne({ email: mockUser.email });

			expect(user).toEqual(mockUser);
		});

		it('should return null if user is not exists', async () => {
			mockFindOne.mockResolvedValue(null);

			const user = await User.findOne({ id: 2 });

			expect(user).toEqual(null);
		});

		it('should throw "Something went wrong" to handle unexpected Internal Error', async () => {
			mockFindOne.mockRejectedValue({
				code: 500,
				message: 'Unexpected Internal Error',
				location: 'user/findOne',
			});

			await expect(User.findOne({ id: 2 })).rejects.toThrowError(
				'Something went wrong'
			);
		});
	});
});
