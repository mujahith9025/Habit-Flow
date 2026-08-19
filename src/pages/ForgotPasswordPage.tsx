import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { sendPasswordReset, getAuthErrorMessage } from '../lib/firebase';

export const ForgotPasswordPage: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);
      await sendPasswordReset(email);
      setIsSuccess(true);
    } catch (err: unknown) {
      setErrorMsg(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setIsSuccess(false);
    setEmail('');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-pastel-gradient dark:bg-background text-on-surface font-body-text antialiased flex flex-col justify-between items-center p-container-padding relative overflow-hidden transition-colors duration-200">
      {/* Ambient glows */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-container/30 dark:bg-primary-container/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-secondary-container/30 dark:bg-secondary-container/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Floating Theme Switcher */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2.5 rounded-full bg-surface/80 dark:bg-surface-container/80 backdrop-blur-md border border-outline-variant/30 text-on-surface hover:bg-surface-container-low transition-all active:scale-95 shadow-soft"
          aria-label="Toggle Theme"
        >
          <span className="material-symbols-outlined text-[20px]">
            {isDark ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
      </div>

      {/* Main Container */}
      <main className="w-full max-w-md mx-auto my-auto z-10 relative pt-8 pb-4">
        {/* Floating Back to Sign In button */}
        <Link
          to="/login"
          aria-label="Go back to Sign In"
          className="inline-flex items-center text-on-surface-variant hover:text-primary transition-colors py-2 px-3 -ml-3 rounded-full hover:bg-surface-container-low mb-2 group"
        >
          <span className="material-symbols-outlined mr-1 text-[20px] group-hover:-translate-x-0.5 transition-transform">
            arrow_back
          </span>
          <span className="font-stat-label text-xs uppercase tracking-wider">Back</span>
        </Link>

        {/* Content Card with optional success border highlight */}
        <div
          className={`bg-surface-container-lowest dark:bg-surface-container rounded-[24px] shadow-soft p-6 sm:p-8 border transition-all duration-300 ${
            isSuccess
              ? 'border-t-4 border-secondary border-outline-variant/20'
              : 'border-outline-variant/20'
          }`}
        >
          {!isSuccess ? (
            /* Default State: Form */
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-fixed dark:bg-primary-fixed-dim/30 rounded-full flex items-center justify-center mx-auto mb-4 shadow-soft">
                  <span
                    className="material-symbols-outlined text-primary dark:text-primary-fixed-dim text-3xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    lock_reset
                  </span>
                </div>
                <h1 className="font-app-title text-2xl font-bold text-primary dark:text-primary-fixed-dim mb-1">
                  Forgot Password
                </h1>
                <p className="font-body-text text-sm text-on-surface-variant">
                  Enter your email and we'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block font-habit-name text-xs text-on-surface font-medium mb-1" htmlFor="email">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-outline pointer-events-none">
                      <span className="material-symbols-outlined text-[20px]">mail</span>
                    </span>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      placeholder="you@example.com"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-low dark:bg-surface-container-high/40 text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-body-text text-sm"
                    />
                  </div>
                </div>

                {/* Error Message */}
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-error-container/30 border border-error/30 text-error flex items-start gap-2 animate-fadeIn">
                    <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
                    <p className="font-body-text text-xs">{errorMsg}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-on-primary font-habit-name text-sm font-semibold py-3.5 px-4 rounded-full shadow-soft hover:bg-on-primary-fixed-variant hover:shadow-glow-primary transition-colors active:scale-95 duration-200 min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Sending link...
                    </span>
                  ) : (
                    <>
                      <span>Send Reset Link</span>
                      <span className="material-symbols-outlined text-[18px]">send</span>
                    </>
                  )}
                </button>
              </form>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="font-body-text text-xs text-primary dark:text-primary-fixed-dim hover:underline transition-colors font-medium"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            /* Success State */
            <div className="text-center py-4 space-y-4 animate-fadeIn">
              <div className="w-20 h-20 bg-secondary-container dark:bg-on-secondary-container rounded-full flex items-center justify-center mx-auto mb-3 shadow-[0px_4px_20px_rgba(40,107,51,0.15)]">
                <span
                  className="material-symbols-outlined text-on-secondary-container dark:text-secondary-fixed text-4xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  mark_email_read
                </span>
              </div>
              <h2 className="font-app-title text-2xl font-bold text-on-secondary-container dark:text-secondary-fixed">
                Email Sent!
              </h2>
              <p className="font-body-text text-sm text-on-surface-variant max-w-xs mx-auto">
                Check <strong className="text-on-surface font-semibold">{email}</strong> for a reset link. It might take a few moments to arrive.
              </p>

              <div className="space-y-2 pt-4">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="w-full bg-surface-container-high dark:bg-surface-container-highest/60 text-on-surface font-habit-name text-sm font-medium py-3 rounded-full hover:bg-surface-variant transition-colors active:scale-95 duration-200 min-h-[44px]"
                >
                  Try another email
                </button>
                <Link
                  to="/login"
                  className="w-full inline-flex justify-center items-center py-3 rounded-full text-primary dark:text-primary-fixed-dim font-habit-name text-sm font-semibold hover:underline"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* App Footer */}
      <footer className="w-full text-center py-4 z-10">
        <p className="font-body-text text-xs text-outline flex items-center justify-center gap-1.5">
          <span className="material-symbols-outlined text-[15px]">cloud_sync</span>
          <span>Your data syncs automatically across all your devices</span>
        </p>
      </footer>
    </div>
  );
};
