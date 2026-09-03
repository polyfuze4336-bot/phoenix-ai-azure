'use client';

import { useLanguage } from '@/components/language-provider';
import { LanguageToggle } from '@/components/language-toggle';
import { PhoenixLogo } from '@/components/phoenix-logo';
import { Stethoscope, Lock, User, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { trackClientEvent } from '@/lib/telemetry/client';

type AuthMode = 'demo' | 'entra';
type LoginErrorCode = 'unauthorized' | 'forbidden' | 'unavailable' | null;

function entraErrorKey(code: LoginErrorCode): string {
  if (code === 'forbidden') return 'login.entra_forbidden';
  if (code === 'unavailable') return 'login.entra_unavailable';
  return 'login.entra_unauthorized';
}

export function LoginClient({ mode, initialError }: { mode: AuthMode; initialError: LoginErrorCode }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const startSession = useCallback((user: { name: string; role: string; email: string }, mode: 'manual' | 'quick') => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('hcp_auth', JSON.stringify(user));
    }
    // Privacy-safe: record the login mode + role only. Never the email or name.
    trackClientEvent('demo_login_completed', { mode, role: user.role });
    router.push('/hcp');
  }, [router]);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId.toLowerCase().trim(), password }),
      });
      if (!res.ok) {
        setError(t('login.invalid_credentials'));
        setLoading(false);
        return;
      }
      const data = await res.json();
      startSession(data.user, 'manual');
    } catch {
      setError(t('login.connection_error'));
      setLoading(false);
    }
  }, [userId, password, startSession, t]);

  const isEntra = mode === 'entra';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/30 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 phoenix-gradient safe-area-top">
        <div className="max-w-[1200px] mx-auto px-4 py-2.5 md:py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 md:gap-3">
            <PhoenixLogo className="w-8 h-8 md:w-10 md:h-10" alt="Phoenix AI Logo" />
            <span className="font-display text-lg md:text-xl font-bold text-white tracking-tight">Phoenix AI</span>
          </Link>
          <LanguageToggle />
        </div>
      </header>

      {/* Login Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-[#8B0000] to-[#a01010] p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center mx-auto mb-3">
                <Stethoscope className="w-8 h-8 text-white" />
              </div>
              <h1 className="font-display text-xl font-bold text-white">
                {t('login.portal_title')}
              </h1>
              <p className="text-white/70 text-sm mt-1">
                {t('login.subtitle')}
              </p>
            </div>

            {isEntra ? (
              /* Entra ID sign-in — the real sign-in action redirects to Entra */
              <div className="p-6 space-y-4">
                {initialError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-600">
                    {t(entraErrorKey(initialError))}
                  </div>
                )}
                <p className="text-sm text-gray-600 text-center">
                  {t('login.entra_description')}
                </p>
                <a
                  href="/api/auth/entra/login"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#8B0000] text-white rounded-xl font-semibold text-sm hover:bg-[#7a0000] transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {t('login.entra_action')}
                </a>
                <p className="text-xs text-gray-400 text-center">
                  {t('login.entra_roles')}
                </p>
              </div>
            ) : (
              <>
                {/* Form */}
                <form onSubmit={handleLogin} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t('login.email')}
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        name="username"
                        autoComplete="username"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#8B0000]/20 focus:border-[#8B0000] outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t('login.password')}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                         name="password"
                         autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-11 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#8B0000]/20 focus:border-[#8B0000] outline-none transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-600"
                    >
                      {error}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#8B0000] text-white rounded-xl font-semibold text-sm hover:bg-[#7a0000] transition-colors disabled:opacity-60"
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> {t('login.signing_in')}</>
                    ) : (
                      t('login.sign_in')
                    )}
                  </button>
                </form>

              </>
            )}
          </div>

          <div className="text-center mt-6">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              {t('login.back_home')}
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
