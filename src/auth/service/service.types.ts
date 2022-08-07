import { JWTPayload } from "@/middleware/authenticate/authenticate.types";

export interface GenerateCredentialsArgs extends Pick<JWTPayload, 'name' | 'email'> {
  id: number;
}

export interface GetTokenError {
	error: 'invalid_grant' | 'invalid_request';
	error_description: string;
}