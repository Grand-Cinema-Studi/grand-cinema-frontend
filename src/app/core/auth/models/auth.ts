/** Same shape as UserDto of the API. */
export interface User {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'Customer' | 'Cashier' | 'TicketInspector' | 'Manager';
}

/** Same shape as AuthTokenDto of the API, returned by the sign-up and the sign-in. */
export interface AuthToken {
  accessToken: string;
  /** Instant in UTC: "2026-10-28T15:41:07Z". */
  expiresAt: string;
  user: User;
}

/** Body of POST /api/users (RegisterUserCommand of the API). */
export interface RegisterUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  acceptPrivacyPolicy: boolean;
}

/** Body of POST /api/tokens (AuthenticateUserCommand of the API). */
export interface AuthenticateUserRequest {
  email: string;
  password: string;
}
