import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth-context';
import { apiRequest } from '../../lib/api-client';
import { User } from '../../lib/types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ShieldAlert, ArrowRight, Server, Lock } from 'lucide-react';

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

  // Quick fill test credentials for reviewer/developer convenience
  const fillTestCredentials = (testEmail: string) => {
    setEmail(testEmail);
    setPassword('Password123!');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F4F5F2] flex flex-col md:flex-row font-sans text-slate-900 antialiased selection:bg-enterprise-600 selection:text-white">
      {/* LEFT PANEL: Enterprise Product & Brand Area (Desktop / Tablet) */}
      <div className="hidden md:flex md:w-1/2 lg:w-5/12 bg-slate-900 text-slate-100 flex-col justify-between p-10 lg:p-14 relative border-r border-slate-800 select-none">
        {/* Subtle Architectural Fine Rule Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-25 pointer-events-none" />

        {/* Top Product Identity Mark */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-enterprise-500 font-bold text-xs tracking-wider shadow-xs">
            OP
          </div>
          <div>
            <span className="font-bold text-white text-sm tracking-tight block leading-none">Operations Portal</span>
            <span className="text-[10px] text-slate-400 font-mono tracking-wide uppercase">Enterprise Suite</span>
          </div>
        </div>

        {/* Center Operational Narrative Statement */}
        <div className="relative z-10 my-auto py-12 max-w-sm">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-slate-800/90 border border-slate-700/80 text-[11px] font-semibold text-enterprise-500 uppercase tracking-widest mb-4">
            <Server className="w-3.5 h-3.5 text-enterprise-500" />
            <span>Operations Platform</span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white leading-[1.2]">
            One system for sales, inventory and finance.
          </h1>

          <p className="text-sm text-slate-400 leading-relaxed font-normal mt-4">
            Built for teams that need operational clarity, real-time stock control, and strict role compliance.
          </p>
        </div>

        {/* Bottom Metadata Status */}
        <div className="relative z-10 pt-6 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            SYSTEM OPERATIONAL
          </span>
          <span>TLS 1.3 ENCRYPTED</span>
        </div>
      </div>

      {/* RIGHT PANEL: Authentication Form Experience */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-[#F4F5F2]">
        <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-md p-8 sm:p-10 shadow-xs relative">
          {/* Header & Product Identity */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-8 h-8 rounded-md bg-slate-900 text-enterprise-500 font-bold text-xs flex items-center justify-center border border-slate-800">
                OP
              </div>
              <span className="text-[11px] font-mono font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                AUTH NODE 01
              </span>
            </div>

            <h2 className="text-xl font-bold text-[#17202A] tracking-tight">Sign in to workspace</h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your operational credentials to access your role dashboard.
            </p>
          </div>

          {/* Validation Error Alert */}
          {error && (
            <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-800 font-medium flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
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
              className="h-11 rounded-md border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-enterprise-600 focus:ring-1 focus:ring-enterprise-600"
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11 rounded-md border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-enterprise-600 focus:ring-1 focus:ring-enterprise-600"
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 h-11 bg-enterprise-600 hover:bg-enterprise-700 text-white font-semibold text-sm rounded-md transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign in to dashboard</span>
                  <ArrowRight className="w-4 h-4 text-enterprise-100" />
                </>
              )}
            </button>
          </form>

          {/* REDESIGNED TEST ACCOUNTS UTILITY SECTION */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-slate-400" />
                TEST ACCOUNTS (SEEDED ROLES)
              </span>
              <span className="text-[10px] font-mono text-slate-400">DEV UTILITY</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillTestCredentials('admin@ops.com')}
                className="px-3 py-2 text-left bg-slate-50 hover:bg-enterprise-50/60 hover:border-enterprise-500/40 text-slate-700 rounded-md border border-slate-200 transition-colors group cursor-pointer"
              >
                <div className="text-[11px] font-bold text-slate-900 group-hover:text-enterprise-700 flex items-center justify-between">
                  <span>Admin</span>
                  <span className="text-[9px] font-mono font-semibold px-1 rounded bg-slate-200/80 text-slate-600">FULL</span>
                </div>
                <div className="text-[10px] font-mono text-slate-500 truncate mt-0.5">admin@ops.com</div>
              </button>

              <button
                type="button"
                onClick={() => fillTestCredentials('sales@ops.com')}
                className="px-3 py-2 text-left bg-slate-50 hover:bg-enterprise-50/60 hover:border-enterprise-500/40 text-slate-700 rounded-md border border-slate-200 transition-colors group cursor-pointer"
              >
                <div className="text-[11px] font-bold text-slate-900 group-hover:text-enterprise-700 flex items-center justify-between">
                  <span>Sales</span>
                  <span className="text-[9px] font-mono font-semibold px-1 rounded bg-slate-200/80 text-slate-600">CRM</span>
                </div>
                <div className="text-[10px] font-mono text-slate-500 truncate mt-0.5">sales@ops.com</div>
              </button>

              <button
                type="button"
                onClick={() => fillTestCredentials('warehouse@ops.com')}
                className="px-3 py-2 text-left bg-slate-50 hover:bg-enterprise-50/60 hover:border-enterprise-500/40 text-slate-700 rounded-md border border-slate-200 transition-colors group cursor-pointer"
              >
                <div className="text-[11px] font-bold text-slate-900 group-hover:text-enterprise-700 flex items-center justify-between">
                  <span>Warehouse</span>
                  <span className="text-[9px] font-mono font-semibold px-1 rounded bg-slate-200/80 text-slate-600">STOCK</span>
                </div>
                <div className="text-[10px] font-mono text-slate-500 truncate mt-0.5">warehouse@ops.com</div>
              </button>

              <button
                type="button"
                onClick={() => fillTestCredentials('accounts@ops.com')}
                className="px-3 py-2 text-left bg-slate-50 hover:bg-enterprise-50/60 hover:border-enterprise-500/40 text-slate-700 rounded-md border border-slate-200 transition-colors group cursor-pointer"
              >
                <div className="text-[11px] font-bold text-slate-900 group-hover:text-enterprise-700 flex items-center justify-between">
                  <span>Accounts</span>
                  <span className="text-[9px] font-mono font-semibold px-1 rounded bg-slate-200/80 text-slate-600">READ</span>
                </div>
                <div className="text-[10px] font-mono text-slate-500 truncate mt-0.5">accounts@ops.com</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
