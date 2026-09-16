export type Role = 'USER' | 'ADMIN';

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  user: User;
  accessToken: string;
};

export type ApiError = {
  statusCode: number;
  message: string;
  errors?: unknown;
};
