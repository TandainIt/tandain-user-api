// export interface GenerateIdTokenArgs {
// 	iss?: string;
// 	exp?: number | null;
// 	aud?: string;
// 	userId: number;
// 	userName: string;
// 	userEmail: string;
// }

export interface JWTPayload {
  iss?: string;
  sub: number;
  exp?: number | null;
  aud?: string;
  name: string;
  email: string;
}

export interface GenerateCredentialsArgs extends Pick<JWTPayload, 'name' | 'email'> {
  id: number;
}

export interface GetTokenError {
	error: 'invalid_grant' | 'invalid_request';
	error_description: string;
}