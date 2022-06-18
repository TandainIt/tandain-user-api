export interface GetTokenError {
	error: 'invalid_grant' | 'invalid_request';
	error_description: string;
}
