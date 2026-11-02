import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BrandLogo } from '../common/BrandLogo';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, UserCheck, AlertCircle } from 'lucide-react';

interface SignInPageProps {
  onForgotPassword: () => void;
}

export const SignInPage: React.FC<SignInPageProps> = ({ onForgotPassword }) => {
  const { login, navigate, switchUser, users } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please provide both email address and password.');
      return;
    }

    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Invalid credentials.');
    }
  };

  const handleQuickDemoLogin = (targetUser: any) => {
    switchUser(targetUser);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F7F5F0]">
      {/* Left Branding Panel */}
      <div className="lg:w-1/2 bg-[#101C2C] text-white p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C6A76A]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-700/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 cursor-pointer" onClick={() => navigate('home')}>
          <BrandLogo variant="dark" size="lg" />
        </div>

        <div className="relative z-10 my-12 max-w-md">
          <span className="text-xs uppercase font-semibold tracking-widest text-[#C6A76A]">Enterprise Wealth Access</span>
          <h2 className="font-serif-display text-3xl sm:text-4xl font-bold mt-2 leading-tight">
            Institutional Command for Modern Advisors & Families
          </h2>
          <p className="mt-4 text-sm text-slate-300 leading-relaxed">
            Consolidated portfolio intelligence, mathematical goal tracking, and live spreadsheet synchronization protected by enterprise role-based security.
          </p>

          <div className="mt-8 space-y-3 text-xs text-slate-400">
            <div className="flex items-center space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-[#147D64]" />
              <span>Full compliance with Indian Financial Conventions (INR ₹)</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-[#147D64]" />
              <span>Client-level data partition & cryptographic audit trails</span>
            </div>
          </div>
        </div>

        {/* Quick Demo Switcher on Left */}
        <div className="relative z-10 pt-6 border-t border-slate-700/70">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#C6A76A] uppercase tracking-wider">
              Quick Demo Personas (1-Click Test)
            </span>
            <span className="text-[10px] text-slate-400">Illustrative Data</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin(users[0])}
              className="p-2.5 rounded bg-[#172B46] hover:bg-[#1e395d] text-left border border-slate-700 transition-colors cursor-pointer"
            >
              <div className="font-bold text-white truncate">Tanaisha Udwadia</div>
              <div className="text-[10px] text-[#C6A76A]">Lead Advisor</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin(users[1])}
              className="p-2.5 rounded bg-[#172B46] hover:bg-[#1e395d] text-left border border-slate-700 transition-colors cursor-pointer"
            >
              <div className="font-bold text-white truncate">Karan Malhotra</div>
              <div className="text-[10px] text-emerald-400">Administrator</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin(users[4])}
              className="p-2.5 rounded bg-[#172B46] hover:bg-[#1e395d] text-left border border-slate-700 transition-colors cursor-pointer"
            >
              <div className="font-bold text-white truncate">Ananya Shah</div>
              <div className="text-[10px] text-sky-400">Client Portal (HNW)</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin(users[2])}
              className="p-2.5 rounded bg-[#172B46] hover:bg-[#1e395d] text-left border border-slate-700 transition-colors cursor-pointer"
            >
              <div className="font-bold text-white truncate">Rajesh Kulkarni</div>
              <div className="text-[10px] text-amber-400">Operations</div>
            </button>
          </div>
        </div>
      </div>

      {/* Right Sign-in Form Panel */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h3 className="font-serif-display text-2xl font-bold text-[#101C2C]">Welcome Back</h3>
            <p className="text-xs text-slate-500 mt-1">Sign in to your CapitalVest wealth management account</p>
          </div>

          {errorMessage && (
            <div className="mt-5 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSignIn} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="advisor@capitalvest.in"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#C6A76A]"
                  required
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-[11px] font-medium text-[#147D64] hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#C6A76A]"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-[#147D64] focus:ring-[#C6A76A]"
                />
                <span className="text-slate-600">Remember this workstation</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#101C2C] hover:bg-[#172B46] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center cursor-pointer"
            >
              {isLoading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </form>

          {/* Google Sign-in */}
          <div className="mt-5">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200" />
              <span className="flex-shrink mx-3 text-[10px] uppercase tracking-wider text-slate-400">or</span>
              <div className="flex-grow border-t border-slate-200" />
            </div>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin(users[0])}
              className="w-full mt-2 py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Continue with Google (Demo Authorized)
            </button>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('signup')}
              className="font-bold text-[#147D64] hover:underline cursor-pointer"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
