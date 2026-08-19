import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/auth/AuthLayout';
import { signUpWithEmail, signInWithGoogle, getAuthErrorMessage } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { signInDemo } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      return false;
    }
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return false;
    }
    if (!password || password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return false;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify.');
      return false;
    }
    return true;
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!validate()) return;

    try {
      setLoading(true);
      await signUpWithEmail(name, email, password);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      setErrorMsg(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setErrorMsg(null);
    try {
      setLoading(true);
      await signInWithGoogle();
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      setErrorMsg(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignUp = () => {
    signInDemo(name.trim() || 'Alex River', email.trim() || 'alex@example.com');
    navigate('/dashboard', { replace: true });
  };

  return (
    <AuthLayout
      iconName="calendar_today"
      title="Create Account"
      subtitle="Join HabitFlow to start your journey."
    >
      <form onSubmit={handleEmailSignUp} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="sr-only" htmlFor="name">
            Full name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
              <span className="material-symbols-outlined text-[20px]">person</span>
            </div>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Full Name"
              className="block w-full pl-11 pr-4 py-3 border border-outline-variant/30 rounded-xl bg-surface-container-low dark:bg-surface-container-high/40 text-on-surface placeholder:text-outline-variant font-body-text text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="sr-only" htmlFor="signup-email">
            Email address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
              <span className="material-symbols-outlined text-[20px]">mail</span>
            </div>
            <input
              id="signup-email"
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
              className="block w-full pl-11 pr-4 py-3 border border-outline-variant/30 rounded-xl bg-surface-container-low dark:bg-surface-container-high/40 text-on-surface placeholder:text-outline-variant font-body-text text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="sr-only" htmlFor="signup-password">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
              <span className="material-symbols-outlined text-[20px]">lock</span>
            </div>
            <input
              id="signup-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Password (min. 8 chars)"
              className="block w-full pl-11 pr-11 py-3 border border-outline-variant/30 rounded-xl bg-surface-container-low dark:bg-surface-container-high/40 text-on-surface placeholder:text-outline-variant font-body-text text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
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
        </div>

        {/* Confirm Password */}
        <div>
          <label className="sr-only" htmlFor="confirm-password">
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
              <span className="material-symbols-outlined text-[20px]">lock_reset</span>
            </div>
            <input
              id="confirm-password"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Confirm password"
              className={`block w-full pl-11 pr-4 py-3 border rounded-xl bg-surface-container-low dark:bg-surface-container-high/40 text-on-surface placeholder:text-outline-variant font-body-text text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${
                confirmPassword && password !== confirmPassword
                  ? 'border-error ring-1 ring-error bg-error-container/10'
                  : 'border-outline-variant/30'
              }`}
            />
          </div>
          {confirmPassword && password !== confirmPassword && (
            <p className="text-[11px] text-error mt-1 pl-1">Passwords do not match.</p>
          )}
        </div>

        {/* Inline Error */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-error-container/30 border border-error/30 text-error flex flex-col gap-2 animate-fadeIn">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
              <p className="font-body-text text-xs leading-relaxed">{errorMsg}</p>
            </div>
            <button
              type="button"
              onClick={handleDemoSignUp}
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
              Creating account...
            </span>
          ) : (
            'Create Account'
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

      {/* Google Sign-In & Demo */}
      <div className="space-y-2.5">
        <button
          type="button"
          disabled={loading}
          onClick={handleGoogleSignUp}
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
          onClick={handleDemoSignUp}
          className="w-full flex justify-center items-center py-2.5 px-4 rounded-full font-stat-label text-xs font-semibold text-primary dark:text-primary-fixed bg-primary-fixed/20 dark:bg-primary-fixed-dim/10 hover:bg-primary-fixed/30 border border-primary/20 transition-all active:scale-98 gap-2"
        >
          <span className="material-symbols-outlined text-[16px]">bolt</span>
          <span>Explore with Demo Account</span>
        </button>
      </div>

      {/* Navigation Footer */}
      <div className="mt-6 text-center">
        <p className="font-body-text text-sm text-on-surface-variant">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-primary dark:text-primary-fixed-dim hover:underline underline-offset-4 decoration-primary/30 transition-all"
          >
            Sign In
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};
