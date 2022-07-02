export interface GetTokenError {
	error: 'invalid_grant' | 'invalid_request';
	error_description: string;
}

export interface GenerateIdTokenArgs {
	iss?: string;
	exp?: number | null;
	aud?: string;
	userId: number;
	userName: string;
	userEmail: string;
}
