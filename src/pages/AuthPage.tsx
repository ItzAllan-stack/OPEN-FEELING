import React, { useState } from 'react';
import { BrandLogo } from '../components/BrandLogo.tsx';
import { useApp } from '../context/AppContext.tsx';
import { checkUsernameAvailable } from '../services/firestoreService.ts';

interface AuthPageProps {
  initialMode: 'login' | 'signup' | 'forgot' | 'onboarding';
}

export function AuthPage({ initialMode }: AuthPageProps) {
  const {
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    completeOnboarding,
    requestPasswordReset,
    navigate,
    showToast,
  } = useApp();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'onboarding'>(initialMode);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [guidelinesAccepted, setGuidelinesAccepted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleUsernameBlur = async () => {
    const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(clean);
    if (clean.length < 3) {
      setUsernameStatus('idle');
      return;
    }
    setUsernameStatus('checking');
    try {
      const ok = await checkUsernameAvailable(clean);
      setUsernameStatus(ok ? 'available' : 'taken');
    } catch {
      setUsernameStatus('idle');
    }
  };

  const handleGoogle = async () => {
    setErrorMsg('');
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in could not complete.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setSubmitting(true);

    try {
      if (mode === 'forgot') {
        if (!email.trim()) throw new Error('Please enter your email address.');
        await requestPasswordReset(email.trim());
        setInfoMsg('Password reset instructions have been sent if an account exists for that email.');
        showToast('Password reset email sent.', 'success');
      } else if (mode === 'login') {
        await signInWithEmail(email.trim(), password);
      } else if (mode === 'signup') {
        if (!displayName.trim()) throw new Error('Please enter a display name.');
        if (username.length < 3) throw new Error('Username must be at least 3 characters.');
        if (!ageConfirmed) throw new Error('Please confirm you meet the minimum age requirement (16+).');
        if (!guidelinesAccepted) throw new Error('Please accept the Community Guidelines and Privacy Policy.');
        await signUpWithEmail({
          email: email.trim(),
          password,
          displayName: displayName.trim(),
          username,
        });
      } else if (mode === 'onboarding') {
        if (!displayName.trim()) throw new Error('Please enter a display name.');
        if (username.length < 3) throw new Error('Username must be at least 3 characters.');
        if (!ageConfirmed) throw new Error('Please confirm you meet the minimum age requirement (16+).');
        if (!guidelinesAccepted) throw new Error('Please accept the Community Guidelines and Privacy Policy.');
        await completeOnboarding(displayName.trim(), username);
      }
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'Authentication could not be completed.';
      if (raw.includes('auth/operation-not-allowed')) {
        setErrorMsg(
          'Email/Password sign-in is not yet enabled in the Firebase Console for this project. Please enable Email/Password under Authentication → Sign-in method, or use Continue with Google below.'
        );
      } else {
        setErrorMsg(raw);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8F6F3] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-[#FCFBFA] border border-[#EAE4DD] rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="space-y-2 text-center">
          <div className="flex justify-center">
            <BrandLogo onClick={() => navigate('/')} />
          </div>
          <h1 className="text-2xl font-display font-medium text-[#29272B] pt-2">
            {mode === 'signup'
              ? 'Join OPEN FELLING'
              : mode === 'forgot'
                ? 'Reset Your Password'
                : mode === 'onboarding'
                  ? 'Finish Your Profile'
                  : 'Welcome Back'}
          </h1>
          <p className="text-sm text-[#77727A]">
            {mode === 'signup'
              ? 'Create a safe space to share what is on your mind.'
              : mode === 'forgot'
                ? 'Enter your email and we will send a password reset link.'
                : mode === 'onboarding'
                  ? 'Choose a unique username and confirm community care standards.'
                  : 'Express Freely. Feel Lighter.'}
          </p>
        </div>

        {(mode === 'login' || mode === 'signup') && (
          <>
            <button
              type="button"
              disabled={submitting}
              onClick={handleGoogle}
              className="w-full py-2.5 px-4 rounded-xl bg-[#FCFBFA] border border-[#EAE4DD] hover:bg-[#F8F6F3] text-sm font-medium text-[#29272B] transition-colors flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-[#EAE4DD]" />
              <span className="shrink mx-3 text-xs text-[#77727A]">or with email</span>
              <div className="flex-grow border-t border-[#EAE4DD]" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {(mode === 'signup' || mode === 'onboarding') && (
            <>
              <div>
                <label className="block text-xs font-medium text-[#29272B] mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  maxLength={80}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How you'd like to be known"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-sm text-[#29272B] focus:outline-none focus:border-[#E9A9B8]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#29272B] mb-1">
                  Unique Username
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={32}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                    setUsernameStatus('idle');
                  }}
                  onBlur={handleUsernameBlur}
                  placeholder="e.g. quiet_morning"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-sm text-[#29272B] focus:outline-none focus:border-[#E9A9B8]"
                />
                {usernameStatus === 'available' && (
                  <p className="mt-1 text-xs text-[#38593C]">Username is available.</p>
                )}
                {usernameStatus === 'taken' && (
                  <p className="mt-1 text-xs text-[#A84848]">That username is already taken.</p>
                )}
              </div>
            </>
          )}

          {mode !== 'onboarding' && (
            <div>
              <label className="block text-xs font-medium text-[#29272B] mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-sm text-[#29272B] focus:outline-none focus:border-[#E9A9B8]"
              />
            </div>
          )}

          {(mode === 'login' || mode === 'signup') && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-[#29272B]">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMsg('');
                    }}
                    className="text-xs text-[#9F4E65] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-sm text-[#29272B] focus:outline-none focus:border-[#E9A9B8]"
              />
            </div>
          )}

          {(mode === 'signup' || mode === 'onboarding') && (
            <div className="space-y-2.5 pt-1 text-xs text-[#77727A]">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ageConfirmed}
                  onChange={(e) => setAgeConfirmed(e.target.checked)}
                  className="mt-0.5 rounded border-[#D5CCC3]"
                />
                <span>I confirm that I am at least 16 years old.</span>
              </label>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={guidelinesAccepted}
                  onChange={(e) => setGuidelinesAccepted(e.target.checked)}
                  className="mt-0.5 rounded border-[#D5CCC3]"
                />
                <span>
                  I accept the{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/guidelines')}
                    className="text-[#9F4E65] underline cursor-pointer"
                  >
                    Community Guidelines
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/privacy')}
                    className="text-[#9F4E65] underline cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                  .
                </span>
              </label>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-[#FDF5F5] border border-[#E5B8B8] text-xs text-[#8C3737] leading-relaxed">
              {errorMsg}
            </div>
          )}

          {infoMsg && (
            <div className="p-3 rounded-xl bg-[#F2F8F3] border border-[#C5DAC7] text-xs text-[#38593C] leading-relaxed">
              {infoMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 rounded-xl bg-[#29272B] text-[#FCFBFA] text-sm font-medium hover:bg-[#3E3B41] disabled:opacity-50 transition-colors cursor-pointer"
          >
            {submitting
              ? 'Please wait...'
              : mode === 'signup'
                ? 'Create My Account'
                : mode === 'forgot'
                  ? 'Send Reset Link'
                  : mode === 'onboarding'
                    ? 'Enter OPEN FELLING'
                    : 'Sign In'}
          </button>
        </form>

        <div className="text-center text-xs text-[#77727A] pt-2 border-t border-[#EAE4DD]">
          {mode === 'login' && (
            <p>
              New to OPEN FELLING?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  navigate('/signup');
                }}
                className="text-[#9F4E65] font-medium hover:underline cursor-pointer"
              >
                Create an account
              </button>
            </p>
          )}
          {(mode === 'signup' || mode === 'forgot') && (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  navigate('/login');
                }}
                className="text-[#9F4E65] font-medium hover:underline cursor-pointer"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
