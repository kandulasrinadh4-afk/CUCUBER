import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Send,
  ArrowLeft,
  Sparkles,
  Flame,
  Radio,
  Bell,
  Loader2,
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { AuthScreenType } from '../types';
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  sendPasswordReset,
  resendVerificationEmail,
  checkEmailVerified,
} from '../services/authService';

interface AuthModalProps {
  screen: AuthScreenType;
  onClose: () => void;
  onNavigate: (screen: AuthScreenType) => void;
  isDark: boolean;
  onAuthSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  screen,
  onClose,
  onNavigate,
  isDark,
  onAuthSuccess,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [simulatedDebugError, setSimulatedDebugError] = useState<string | null>(null);

  useEffect(() => {
    // Clear notifications and inputs on screen change
    setAuthError(null);
    setAuthSuccess(null);
    setSimulatedDebugError(null);
  }, [screen]);

  if (screen === 'none') return null;

  // GOOGLE SIGN IN
  const handleGoogleSignIn = async () => {
    if (loading || googleLoading) return;
    setAuthError(null);
    setAuthSuccess(null);
    setSimulatedDebugError(null);
    setGoogleLoading(true);

    try {
      const result = await signInWithGoogle();
      if (!result) {
        // User closed popup or redirect flow initiated
        setGoogleLoading(false);
        return;
      }

      setAuthSuccess('Signed in with Google successfully!');
      setTimeout(() => {
        setAuthSuccess(null);
        if (onAuthSuccess) onAuthSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setAuthError(err.message || 'Failed to sign in with Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Password Strength Math
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  let strengthScore = 0;
  if (hasLength) strengthScore += 1;
  if (hasUpper) strengthScore += 1;
  if (hasNumber) strengthScore += 1;
  if (hasSpecial) strengthScore += 1;

  // SIGN IN
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!email.trim() || !password) {
      setAuthError('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
      setAuthSuccess('Signed in successfully! Loading profile...');
      setTimeout(() => {
        setAuthSuccess(null);
        if (onAuthSuccess) onAuthSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setAuthError(err.message || 'Failed to sign in.');
    } finally {
      setLoading(false);
    }
  };

  // SIGN UP
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!fullName.trim()) {
      setAuthError('Please enter your full name.');
      return;
    }

    if (!email.trim()) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    if (password !== confirmPassword) {
      setAuthError('Passwords do not match. Please verify your password entry.');
      return;
    }

    if (strengthScore < 3) {
      setAuthError('Password must meet at least 3 security requirements (length, uppercase, number, symbol).');
      return;
    }

    setLoading(true);
    try {
      await signUpWithEmail(fullName.trim(), email.trim(), password);
      setAuthSuccess('Account created! A verification email has been sent.');
      setTimeout(() => {
        setAuthSuccess(null);
        onNavigate('otp');
      }, 1200);
    } catch (err: any) {
      setAuthError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  // CHECK VERIFICATION STATUS
  const handleCheckVerification = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setAuthError('No active user session. Please sign in again.');
      return;
    }

    setVerifying(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      const isVerified = await checkEmailVerified(currentUser);
      if (isVerified) {
        setAuthSuccess('Email verified successfully! Welcome to Cucuber Apex Cricket.');
        setTimeout(() => {
          setAuthSuccess(null);
          if (onAuthSuccess) onAuthSuccess();
          onClose();
        }, 1500);
      } else {
        setAuthError('Email is not verified yet. Please check your inbox or click "Resend Email".');
      }
    } catch (err: any) {
      setAuthError('Unable to check verification status. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  // RESEND VERIFICATION EMAIL
  const handleResendVerification = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setAuthError('No user session found. Please sign in first.');
      return;
    }

    setLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      await resendVerificationEmail(currentUser);
      setAuthSuccess('Verification email resent! Please check your inbox and spam folder.');
    } catch (err: any) {
      setAuthError(err.message || 'Failed to resend verification email.');
    } finally {
      setLoading(false);
    }
  };

  // FORGOT PASSWORD / PASSWORD RESET
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    const targetEmail = resetEmail.trim() || email.trim();
    if (!targetEmail) {
      setAuthError('Please enter your account email address.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordReset(targetEmail);
      setAuthSuccess('If an account exists for this email address, password reset instructions have been sent.');
    } catch (err: any) {
      // Show generic message or friendly message to prevent email enumeration
      setAuthSuccess('If an account exists for this email address, password reset instructions have been sent.');
    } finally {
      setLoading(false);
    }
  };

  const currentUserEmail = auth.currentUser?.email || email || 'your email';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div
        className={`relative w-full max-w-lg overflow-hidden rounded-3xl border shadow-2xl transition-all ${
          isDark
            ? 'bg-[#091b2e] border-slate-700 text-white shadow-cyan-950/40'
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-300'
        }`}
      >
        {/* Top Header Bar */}
        <div className="p-4 flex items-center justify-between border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <span className="font-mono font-black text-cyan-400 text-sm tracking-wider">CUCUBER AUTH</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full border border-slate-700 hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Toast / Error Banner */}
          {(authError || simulatedDebugError) && (
            <div className="mb-4 p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{simulatedDebugError || authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{authSuccess}</span>
            </div>
          )}

          {/* SCREEN 1: SIGN IN */}
          {screen === 'signin' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="text-center space-y-1">
                <h2 className="text-xl font-extrabold">Welcome back</h2>
                <p className="text-xs text-slate-400">Sign in to sync your match alerts, settings, and profile</p>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-400 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-mono font-bold text-slate-400">Password</label>
                    <button
                      type="button"
                      onClick={() => onNavigate('reset-password')}
                      className="text-[11px] text-cyan-400 hover:underline"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-3 text-slate-400"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-cyan-500 text-slate-950 font-bold text-xs rounded-2xl shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                </button>
              </form>

              {/* Social Login Providers */}
              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                <div className="relative text-center my-1">
                  <span className="bg-[#091b2e] px-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                    Or continue with
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading || googleLoading}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {googleLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
                    ) : (
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#EA4335"
                          d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                        />
                        <path
                          fill="#4285F4"
                          d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9c-.3-.8-.5-1.7-.5-2.6z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                        />
                      </svg>
                    )}
                    <span>{googleLoading ? 'Connecting...' : 'Google'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthError('Apple Sign-In will be configured in the upcoming step.')}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-all"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0 text-white" viewBox="0 0 24 24">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.67-.82 1.13-1.96.99-3.1-.98.04-2.18.66-2.88 1.48-.62.72-1.17 1.88-1.02 3 1.1.09 2.24-.56 2.91-1.38z" />
                    </svg>
                    <span>Apple</span>
                  </button>
                </div>
              </div>

              <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                Don't have an account?{' '}
                <button
                  onClick={() => onNavigate('signup')}
                  className="text-cyan-400 font-bold hover:underline"
                >
                  Create Account
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 2: CREATE ACCOUNT (SIGN UP) */}
          {screen === 'signup' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="text-center space-y-1">
                <h2 className="text-xl font-extrabold">Create your account</h2>
                <p className="text-xs text-slate-400">Join Cucuber for live cricket tracking and custom alerts</p>
              </div>

              <form onSubmit={handleSignUp} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-400 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Alex Morgan"
                      className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-400 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-400 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a strong password"
                      className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-3 text-slate-400"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-400 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                </div>

                {/* Password Strength Meter */}
                {password && (
                  <div className="space-y-2 p-3 rounded-2xl bg-slate-800/40 border border-slate-700/60">
                    <div className="flex justify-between text-[10px] font-mono font-bold">
                      <span className="text-slate-400">Password Strength:</span>
                      <span
                        className={
                          strengthScore <= 1
                            ? 'text-red-400'
                            : strengthScore <= 3
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }
                      >
                        {strengthScore <= 1 ? 'WEAK' : strengthScore <= 3 ? 'FAIR' : 'STRONG'}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden flex gap-1">
                      <div
                        className={`h-full flex-1 transition-colors ${
                          strengthScore >= 1 ? 'bg-red-500' : 'bg-slate-700'
                        }`}
                      />
                      <div
                        className={`h-full flex-1 transition-colors ${
                          strengthScore >= 2 ? 'bg-amber-500' : 'bg-slate-700'
                        }`}
                      />
                      <div
                        className={`h-full flex-1 transition-colors ${
                          strengthScore >= 3 ? 'bg-emerald-400' : 'bg-slate-700'
                        }`}
                      />
                      <div
                        className={`h-full flex-1 transition-colors ${
                          strengthScore >= 4 ? 'bg-cyan-400' : 'bg-slate-700'
                        }`}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-cyan-500 text-slate-950 font-bold text-xs rounded-2xl hover:bg-cyan-400 flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{loading ? 'Creating account...' : 'Create Account'}</span>
                </button>
              </form>

              {/* Social Login Providers */}
              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                <div className="relative text-center my-1">
                  <span className="bg-[#091b2e] px-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                    Or continue with
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading || googleLoading}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {googleLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
                    ) : (
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#EA4335"
                          d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                        />
                        <path
                          fill="#4285F4"
                          d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9c-.3-.8-.5-1.7-.5-2.6z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                        />
                      </svg>
                    )}
                    <span>{googleLoading ? 'Connecting...' : 'Google'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthError('Apple Sign-In will be configured in the upcoming step.')}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-all"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0 text-white" viewBox="0 0 24 24">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.67-.82 1.13-1.96.99-3.1-.98.04-2.18.66-2.88 1.48-.62.72-1.17 1.88-1.02 3 1.1.09 2.24-.56 2.91-1.38z" />
                    </svg>
                    <span>Apple</span>
                  </button>
                </div>
              </div>

              <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                Already have an account?{' '}
                <button
                  onClick={() => onNavigate('signin')}
                  className="text-cyan-400 font-bold hover:underline"
                >
                  Sign In
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 3: EMAIL VERIFICATION */}
          {screen === 'otp' && (
            <div className="space-y-5 animate-fadeIn text-center">
              <div className="p-3.5 rounded-2xl bg-cyan-500/10 text-cyan-400 w-14 h-14 mx-auto flex items-center justify-center border border-cyan-500/20">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold">Verify your email address</h2>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  We've sent an email verification link to <strong className="text-white font-mono">{currentUserEmail}</strong>.
                  Please click the link in your email to verify your account.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleCheckVerification}
                  disabled={verifying}
                  className="w-full py-3 bg-cyan-500 text-slate-950 font-bold text-xs rounded-2xl hover:bg-cyan-400 flex items-center justify-center gap-2 transition-all"
                >
                  {verifying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>{verifying ? 'Checking status...' : "I've Verified My Email"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={loading}
                  className="w-full py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs hover:bg-slate-700 flex items-center justify-center gap-2 transition-all"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  <span>Resend Verification Email</span>
                </button>
              </div>

              <div className="pt-2 text-xs text-slate-400">
                Need to use a different email?{' '}
                <button
                  onClick={() => onNavigate('signup')}
                  className="text-cyan-400 font-bold hover:underline"
                >
                  Back to Sign Up
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 4: RESET PASSWORD */}
          {screen === 'reset-password' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="text-center space-y-1">
                <h2 className="text-xl font-extrabold">Reset your password</h2>
                <p className="text-xs text-slate-400">
                  Enter your account email and we'll send password reset instructions.
                </p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-400 mb-1">
                    Account Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={resetEmail || email}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-cyan-500 text-slate-950 font-bold text-xs rounded-2xl hover:bg-cyan-400 flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>{loading ? 'Sending link...' : 'Send Reset Link'}</span>
                </button>
              </form>

              <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                Remember your password?{' '}
                <button
                  onClick={() => onNavigate('signin')}
                  className="text-cyan-400 font-bold hover:underline inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" /> Back to Sign In
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 5: AUTH DEBUG MATRIX */}
          {screen === 'auth-debug' && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="font-bold text-sm text-cyan-400 font-mono uppercase">
                Auth States Reference Matrix
              </h3>
              <p className="text-xs text-slate-400">
                Test and inspect authentication feedback states and errors:
              </p>

              <div className="grid grid-cols-1 gap-2">
                {[
                  {
                    title: 'Invalid Credentials Error',
                    action: () => setSimulatedDebugError('Invalid email or password. Please check your credentials.'),
                  },
                  {
                    title: 'Email Already Registered',
                    action: () => setSimulatedDebugError('An account with this email address already exists.'),
                  },
                  {
                    title: 'Password Strength Error',
                    action: () => setSimulatedDebugError('Password must meet at least 3 security requirements.'),
                  },
                  {
                    title: 'Network Timeout / Server Error',
                    action: () => setSimulatedDebugError('Network connection lost. Please check internet telemetry.'),
                  },
                  {
                    title: 'Clear All Errors',
                    action: () => setSimulatedDebugError(null),
                  },
                ].map((st, i) => (
                  <button
                    key={i}
                    onClick={st.action}
                    className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-left hover:border-cyan-400 transition-colors"
                  >
                    {st.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
