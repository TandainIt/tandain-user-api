export interface JWTPayload {
  iss?: string;
  sub: number;
  exp?: number | null;
  aud?: string;
  name: string;
  email: string;
}