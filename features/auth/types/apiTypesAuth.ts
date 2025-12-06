/**
 * Types for authentication API requests and responses
 */

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface VerifyEmailResponse {
  success: boolean;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ResendVerificationResponse {
  success: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
}

export interface SetPasswordRequest {
  password: string;
}

export interface SetPasswordResponse {
  success: boolean;
}

export interface DeleteAccountResponse {
  success: boolean;
}

export interface LoginMethodsResponse {
  hasPassword: boolean;
  hasGoogle: boolean;
}
