import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { LogIn, Mail, Lock, Shield } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { login, verifyOtp } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

type Step = 'credentials' | 'otp';

export default function RoleSelection() {
  const navigate = useNavigate();
  const { user, signIn } = useAuth();

  useEffect(() => {
    if (user) {
      if (user.role === 'manager') navigate('/manager');
      else navigate(`/developer/${user.developerId}`);
    }
  }, [user, navigate]);

  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const response = await login({ email: email.trim(), password });
      setSessionToken(response.sessionToken);
      setOtpMessage(response.message);
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const response = await verifyOtp({ sessionToken, otp: otp.trim() });
      signIn({
        role: response.role as 'manager' | 'developer',
        userId: response.userId,
        developerId: response.developerId ?? undefined,
        managerId: response.managerId ?? undefined,
        name: response.name,
      });
      if (response.role === 'manager') {
        navigate('/manager');
      } else {
        navigate(`/developer/${response.developerId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setStep('credentials');
    setOtp('');
    setSessionToken('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-red-500/10 via-rose-500/5 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-red-600/10 via-red-500/5 to-transparent rounded-full blur-3xl"></div>

      <div className="relative min-h-screen flex">
        <div className="w-full lg:w-1/2 flex flex-col justify-between p-8 lg:py-16 lg:pl-16 lg:pr-6">
          <div>
            <div className="mb-12">
              <div className="flex items-baseline gap-3 mb-4">
                <h1 className="text-7xl lg:text-8xl tracking-tight">
                  <span className="bg-gradient-to-r from-red-700 via-red-600 to-rose-600 bg-clip-text text-transparent">
                    Synkra
                  </span>
                </h1>
                <div className="w-3 h-3 rounded-full bg-red-600 mb-4"></div>
              </div>
              <div className="ml-1 space-y-2">
                <p className="text-2xl text-gray-800">
                  Where productivity meets collaboration
                </p>
                <p className="text-base text-red-700 italic">
                  Sync smarter. Work faster. Achieve more.
                </p>
              </div>
            </div>

            <div className="w-32 h-1 bg-gradient-to-r from-red-600 to-transparent rounded-full"></div>
          </div>

          <div className="text-sm text-gray-500">
            <p>Software Requirements Project - Spring 2026</p>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-6">
          <div className="w-full max-w-2xl">
            <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-16">

              {step === 'credentials' ? (
                <>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                      <LogIn className="w-7 h-7 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900">Welcome back</h2>
                      <p className="text-base text-gray-500">Sign in to your Synkra account</p>
                    </div>
                  </div>

                  {error && (
                    <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-gray-700">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 border-gray-200 focus:border-red-500 focus:ring-red-500"
                          required
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-gray-700">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 border-gray-200 focus:border-red-500 focus:ring-red-500"
                          required
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 mt-2"
                      size="lg"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Signing in…' : 'Log In to Synkra'}
                    </Button>
                  </form>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                      <Shield className="w-7 h-7 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900">Two-factor verification</h2>
                      <p className="text-base text-gray-500">{otpMessage}</p>
                    </div>
                  </div>

                  {error && (
                    <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleVerifyOtp} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="otp-code" className="text-gray-700">Verification Code</Label>
                      <Input
                        id="otp-code"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        placeholder="000000"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        className="text-center text-2xl tracking-widest border-gray-200 focus:border-red-500 focus:ring-red-500"
                        required
                        autoFocus
                      />
                      <p className="text-xs text-gray-500 text-center">
                        Enter the 6-digit code sent to your email. It expires in 5&nbsp;minutes.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20"
                      size="lg"
                      disabled={isLoading || otp.length !== 6}
                    >
                      {isLoading ? 'Verifying…' : 'Verify & Sign In'}
                    </Button>

                    <button
                      type="button"
                      onClick={handleBackToLogin}
                      className="w-full text-sm text-gray-500 hover:text-red-600 transition-colors"
                    >
                      ← Back to login
                    </button>
                  </form>
                </>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
