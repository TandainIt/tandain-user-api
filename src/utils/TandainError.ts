class TandainError extends Error {
	public name: string;
	public displayMessage: string;
	public code: number;

	constructor(name: string, message: string, code: number) {
		super(message);

		this.name = name.toUpperCase();
		this.displayMessage = message;
		this.code = code;
	}
}

export default TandainError;
