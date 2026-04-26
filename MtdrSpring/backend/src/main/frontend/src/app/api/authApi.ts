export interface LoginResponse {
  sessionToken: string;
  message: string;
}

export interface VerifyOtpResponse {
  role: 'manager' | 'developer';
  userId: number;
  developerId: number | null;
  managerId: number | null;
  name: string;
}

export async function login(credentials: {
  email: string;
  password: string;
}): Promise<LoginResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? 'Login failed. Please try again.');
  }

  return data as LoginResponse;
}

export async function verifyOtp(payload: {
  sessionToken: string;
  otp: string;
}): Promise<VerifyOtpResponse> {
  const res = await fetch('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? 'Verification failed. Please try again.');
  }

  return data as VerifyOtpResponse;
}
