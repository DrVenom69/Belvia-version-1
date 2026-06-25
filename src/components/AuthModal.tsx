import React, { useState } from 'react';
import { X, Mail, Sparkles, Loader2, Chrome } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  if (!isOpen) return null;

  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      const res = await signIn(email.trim());
      if (res.success) {
        setInfoMsg(res.message);
        if (res.message.includes('(dev mode)')) {
          // Dev mode signs in instantly
          setTimeout(() => {
            if (onSuccess) onSuccess();
            onClose();
          }, 800);
        }
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSubmit = async () => {
    setIsLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      const res = await signInWithGoogle();
      if (res.success) {
        setInfoMsg(res.message);
        if (res.message.includes('(dev mode)')) {
          // Dev mode signs in instantly
          setTimeout(() => {
            if (onSuccess) onSuccess();
            onClose();
          }, 800);
        }
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Google Auth failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevQuickSignIn = async () => {
    setIsLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      const res = await signIn('dev-admin@belvia.app');
      if (res.success) {
        setInfoMsg('Dev Auth Success! Logging in...');
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 800);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="auth-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-surface/85 backdrop-blur-sm overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="auth-modal-container"
        className="relative w-full max-w-md bg-bg-base border border-border-premium dark:border-accent/30 rounded-2xl shadow-2xl dark:shadow-[0_0_50px_rgba(245,175,25,0.15)] p-6 sm:p-8 overflow-hidden transition-all duration-300"
      >
        {/* Decorative ambient top glow in dark mode */}
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-accent/10 rounded-full blur-2xl pointer-events-none hidden dark:block" />

        {/* Close Button */}
        <button
          id="close-auth-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-bg-surface hover:bg-bg-elevated border border-border-premium text-text-secondary hover:text-text-primary cursor-pointer transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-full bg-accent-glow border border-accent/20 text-accent mb-3 animate-pulse">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold font-display text-text-primary tracking-tight">
            Welcome to Belvia
          </h2>
          <p className="text-xs font-mono text-text-secondary mt-1">
            Access secure checkouts, orders & wishlists
          </p>
        </div>

        {/* Messaging */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-mono rounded-lg">
            {errorMsg}
          </div>
        )}
        {infoMsg && (
          <div className="mb-4 p-3 bg-accent-glow border border-accent/20 text-accent text-xs font-mono rounded-lg flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            {infoMsg}
          </div>
        )}

        {/* Login Forms */}
        <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="email"
                required
                disabled={isLoading}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-bg-surface border border-border-premium rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent transition font-sans"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-accent hover:bg-accent-hover text-text-on-accent font-display font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-md cursor-pointer disabled:opacity-55"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Send Magic Link'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center my-6">
          <div className="flex-grow border-t border-border-premium"></div>
          <span className="flex-shrink mx-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest">
            Or Continue With
          </span>
          <div className="flex-grow border-t border-border-premium"></div>
        </div>

        {/* Google OAuth Button */}
        <button
          onClick={handleGoogleSubmit}
          disabled={isLoading}
          className="w-full bg-bg-surface hover:bg-bg-elevated border border-border-premium rounded-xl py-2.5 text-sm text-text-primary transition flex items-center justify-center gap-2 font-display font-medium cursor-pointer disabled:opacity-55"
        >
          <Chrome className="w-4 h-4 text-red-500" />
          <span>Google Account</span>
        </button>

        {/* Environment-gated Developer Bypass */}
        {!import.meta.env.PROD && (
          <div className="mt-6 pt-4 border-t border-border-premium/50 text-center">
            <button
              onClick={handleDevQuickSignIn}
              disabled={isLoading}
              className="w-full bg-red-500/10 hover:bg-red-500/20 border border-dashed border-red-500/40 text-red-500 rounded-xl py-2 text-xs font-mono transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>⚡ [DEV] Bypass Auth / Sign-In</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
