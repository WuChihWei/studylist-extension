import { ENDPOINTS } from '../config/endpoints';

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
const AUTH_BASE_URL = `${ENDPOINTS.AUTH_BASE}/accounts`;

export interface AuthResponse {
  idToken: string;
  email: string;
  localId: string;
  refreshToken: string;
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(
    `${AUTH_BASE_URL}:signInWithPassword?key=${FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true
      })
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error.message);
  }

  return data;
}

export async function signUpWithEmail(email: string, password: string) {
  const response = await fetch(`${AUTH_BASE_URL}:signUp?key=${FIREBASE_API_KEY}`, {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error.message);
  }
  
  return data;
}