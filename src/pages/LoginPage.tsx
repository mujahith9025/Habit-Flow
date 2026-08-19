import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '../components/auth/AuthLayout';
import { signInWithEmail, signInWithGoogle, getAuthErrorMessage } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInDemo } = useAuth();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return false;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return false;
    }
    return true;
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!validate()) return;

    try {
      setLoading(true);
      await signInWithEmail(email, password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      setErrorMsg(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    try {
      setLoading(true);
      await signInWithGoogle();
      navigate(from, { replace: true });
    } catch (err: unknown) {
      setErrorMsg(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = () => {
    signInDemo('Alex River', 'alex@example.com');
    navigate(from, { replace: true });
  };

  return (
    <AuthLayout
      iconName="energy_savings_leaf"
      title="HabitFlow"
      subtitle="Build better habits, one day at a time"
    >
      <form onSubmit={handleEmailSignIn} className="space-y-4">
        {/* Email Input */}
        <div>
          <label className="sr-only" htmlFor="email">
            Email address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
              <span className="material-symbols-outlined text-[20px]">mail</span>
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="email@example.com"
              className={`block w-full pl-11 pr-4 py-3 border rounded-xl bg-surface-container-low dark:bg-surface-container-high/40 text-on-surface placeholder:text-outline-variant font-body-text text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${
                errorMsg && !email ? 'border-error ring-1 ring-error' : 'border-outline-variant/30'
              }`}
            />
          </div>
        </div>

        {/* Password Input */}
        <div>
          <label className="sr-only" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
              <span className="material-symbols-outlined text-[20px]">lock</span>
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="••••••••"
              className={`block w-full pl-11 pr-11 py-3 border rounded-xl bg-surface-container-low dark:bg-surface-container-high/40 text-on-surface placeholder:text-outline-variant font-body-text text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${
                errorMsg && !password ? 'border-error ring-1 ring-error' : 'border-outline-variant/30'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-outline hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">
                {showPassword ? 'visibility' : 'visibility_off'}
              </span>
            </button>
          </div>

          <div className="flex justify-end mt-2">
            <Link
              to="/forgot-password"
              className="font-body-text text-xs text-primary dark:text-primary-fixed-dim font-medium hover:underline transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {/* Inline Error Message */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-error-container/30 border border-error/30 text-error flex flex-col gap-2 animate-fadeIn">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
              <p className="font-body-text text-xs leading-relaxed">{errorMsg}</p>
            </div>
            <button
              type="button"
              onClick={handleDemoSignIn}
              className="mt-1 text-xs font-bold text-primary dark:text-primary-fixed underline text-left hover:opacity-80"
            >
              &rarr; Click here to enter with Demo Mode
            </button>
          </div>
        )}

        {/* Primary Action Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-full shadow-soft font-habit-name text-sm font-semibold text-on-primary bg-primary hover:bg-on-primary-fixed-variant hover:shadow-glow-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all active:scale-98 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Signing in...
            </span>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="my-4 relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-outline-variant/30" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-3 bg-surface-container-lowest dark:bg-surface-container text-outline font-stat-label uppercase tracking-wider">
            or
          </span>
        </div>
      </div>

      {/* Google Sign-In */}
      <div className="space-y-2.5">
        <button
          type="button"
          disabled={loading}
          onClick={handleGoogleSignIn}
          className="w-full flex justify-center items-center py-3 px-4 border border-outline-variant/40 rounded-full shadow-sm font-habit-name text-sm font-medium text-on-surface bg-surface-container-lowest dark:bg-surface-container-low hover:bg-surface-container-low dark:hover:bg-surface-container-high focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-outline transition-all active:scale-98 min-h-[44px] gap-3 disabled:opacity-50"
        >
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Quick Demo Mode */}
        <button
          type="button"
          onClick={handleDemoSignIn}
          className="w-full flex justify-center items-center py-2.5 px-4 rounded-full font-stat-label text-xs font-semibold text-primary dark:text-primary-fixed bg-primary-fixed/20 dark:bg-primary-fixed-dim/10 hover:bg-primary-fixed/30 border border-primary/20 transition-all active:scale-98 gap-2"
        >
          <span className="material-symbols-outlined text-[16px]">bolt</span>
          <span>Explore with Demo Account</span>
        </button>
      </div>

      {/* Navigation Footer */}
      <div className="mt-6 text-center">
        <p className="font-body-text text-sm text-on-surface-variant">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="font-semibold text-primary dark:text-primary-fixed-dim hover:underline underline-offset-4 decoration-primary/30 transition-all"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};
