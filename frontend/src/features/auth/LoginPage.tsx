import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth-context';
import { apiRequest } from '../../lib/api-client';
import { User } from '../../lib/types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Shield, KeyRound, ArrowRight, UserCheck } from 'lucide-react';

interface LoginResponse {
  token: string;
  user: User;
}

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const data = await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick fill test credentials for reviewer convenience
  const fillTestCredentials = (testEmail: string) => {
    setEmail(testEmail);
    setPassword('Password123!');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 p-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-600 text-white font-bold text-xl mb-3 shadow-lg shadow-brand-600/30">
            E
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mini ERP Portal</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in with your operations account</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
            <Shield className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="admin@ops.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            className="w-full mt-2"
            size="lg"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Sign In to Dashboard
          </Button>
        </form>

        {/* Quick Login Helper Pills for Reviewer / Testing */}
        <div className="mt-8 pt-6 border-t border-slate-200/80">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            <UserCheck className="w-3.5 h-3.5 text-brand-600" />
            <span>Quick Test Login (Seeded Roles)</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillTestCredentials('admin@ops.com')}
              className="px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 rounded-lg border border-slate-200 transition-colors text-left"
            >
              <div className="font-bold text-slate-900">Admin</div>
              <div className="text-[10px] text-slate-500">admin@ops.com</div>
            </button>

            <button
              type="button"
              onClick={() => fillTestCredentials('sales@ops.com')}
              className="px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 rounded-lg border border-slate-200 transition-colors text-left"
            >
              <div className="font-bold text-slate-900">Sales</div>
              <div className="text-[10px] text-slate-500">sales@ops.com</div>
            </button>

            <button
              type="button"
              onClick={() => fillTestCredentials('warehouse@ops.com')}
              className="px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 rounded-lg border border-slate-200 transition-colors text-left"
            >
              <div className="font-bold text-slate-900">Warehouse</div>
              <div className="text-[10px] text-slate-500">warehouse@ops.com</div>
            </button>

            <button
              type="button"
              onClick={() => fillTestCredentials('accounts@ops.com')}
              className="px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 rounded-lg border border-slate-200 transition-colors text-left"
            >
              <div className="font-bold text-slate-900">Accounts</div>
              <div className="text-[10px] text-slate-500">accounts@ops.com</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
