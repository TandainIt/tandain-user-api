export interface GenerateIdTokenArgs {
	iss?: string;
	exp?: number | null;
	aud?: string;
	userId: number;
	userName: string;
	userEmail: string;
}

export interface JWTPayload {
  iss?: string;
  sub: number;
  exp?: number | null;
  aud?: string;
  name: string;
  email: string;
} // TODO: Refactor with merge it with GenerateIdTokenArgs

export interface UserJWTPayload extends Pick<JWTPayload, 'name' | 'email'>  {
  id: number;
}

export type AuthJwtPayload = UserJWTPayload & JWTPayload

export interface GetTokenError {
	error: 'invalid_grant' | 'invalid_request';
	error_description: string;
}

export interface GenerateCredentialsArgs {
  userId: number;
	userName: string;
	userEmail: string;
}
