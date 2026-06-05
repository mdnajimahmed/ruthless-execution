export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
  };
}

// Backend returns { user: { id, email } }
export interface VerifyResponse {
  user: {
    id: string;
    email: string;
  };
}
