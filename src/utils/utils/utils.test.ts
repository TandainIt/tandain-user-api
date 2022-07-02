import { generateRandomCryptoString } from './utils';

describe('utils/utils', () => {
	describe('generateRandomCryptoString', () => {
		it('should generate random string with certaing length', async () => {
			const result = await generateRandomCryptoString(36);

			expect(result.length).toEqual(48);
			expect(typeof result).toEqual('string');
		});

		it('should throw an error when params is invalid', async () => {
			await expect(generateRandomCryptoString(-1)).rejects.toThrowError(
				'The value of "size" is out of range. It must be >= 0 && <= 2147483647. Received -1'
			);
		});
	});
});
