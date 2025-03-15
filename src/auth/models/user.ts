export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user'
}

export interface User {
  _id?: string;
  email: string;
  username: string;
  displayName?: string;
  password?: string; // Optional for SSO users
  departmentId?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
