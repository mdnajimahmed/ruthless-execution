import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login }    = useAuth();
  const navigate     = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">

      {/* Brand header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[10px] bg-teal-700">
          <span className="text-lg font-bold text-white">Rx</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-[0.02em] text-teal-900">
          Ruthless Execution
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Your personal productivity platform
        </p>
      </div>

      {/* Login card */}
      <div className="w-full max-w-sm rounded-[10px] border border-teal-100 border-l-4 border-l-teal-500 bg-white p-8 shadow-sm">

        <h2 className="mb-6 text-xl font-bold text-teal-900">Sign in</h2>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Error alert */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-[#fca5a5] bg-[#fef2f2] px-4 py-3 text-sm text-[#991b1b]"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#ef4444]" />
              <span>{error}</span>
            </div>
          )}

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="th-form-label"
            >
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              placeholder="you@example.com"
              aria-invalid={!!error}
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="th-form-label"
            >
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-invalid={!!error}
            />
          </div>

          <Button
            type="submit"
            className="mt-2 w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>
      </div>

      <p className="mt-8 text-xs text-gray-400">
        The Best Way to Learn Is to Build.
      </p>
    </div>
  );
}
