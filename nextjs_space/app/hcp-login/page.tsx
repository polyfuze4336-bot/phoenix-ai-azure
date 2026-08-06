'use client';

import { useLanguage } from '@/components/language-provider';
import { LanguageToggle } from '@/components/language-toggle';
import { PhoenixLogo } from '@/components/phoenix-logo';
import { Stethoscope, Lock, Mail, Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Public demo directory — display only. NO passwords live in browser source;
// credentials are verified server-side via POST /api/auth/login.
const DEMO_USERS = [
  { email: 'doctor@phoenix.my', name: 'Dr. Ahmad Faizal', role: 'Pakar Perubatan Kecemasan' },
  { email: 'nurse@phoenix.my', name: 'Nurse Siti Aminah', role: 'Jururawat Kanan' },
  { email: 'admin@phoenix.my', name: 'Admin Phoenix', role: 'Pentadbir Sistem' },
];

export default function HcpLoginPage() {
  const { lang } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const startSession = useCallback((user: { name: string; role: string; email: string }) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('hcp_auth', JSON.stringify(user));
    }
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
        body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
      });
      if (!res.ok) {
        setError(lang === 'bm' ? 'E-mel atau kata laluan tidak sah' : 'Invalid email or password');
        setLoading(false);
        return;
      }
      const data = await res.json();
      startSession(data.user);
    } catch {
      setError(lang === 'bm' ? 'Ralat sambungan. Sila cuba lagi.' : 'Connection error. Please try again.');
      setLoading(false);
    }
  }, [email, password, lang, startSession]);

  const quickLogin = useCallback(async (demoUser: typeof DEMO_USERS[0]) => {
    setEmail(demoUser.email);
    setPassword('');
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoUser.email, quick: true }),
      });
      if (!res.ok) {
        setError(lang === 'bm' ? 'Log masuk demo gagal' : 'Demo login failed');
        setLoading(false);
        return;
      }
      const data = await res.json();
      startSession(data.user);
    } catch {
      setError(lang === 'bm' ? 'Ralat sambungan. Sila cuba lagi.' : 'Connection error. Please try again.');
      setLoading(false);
    }
  }, [lang, startSession]);

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
                {lang === 'bm' ? 'Portal Profesional Kesihatan' : 'Healthcare Professional Portal'}
              </h1>
              <p className="text-white/70 text-sm mt-1">
                {lang === 'bm' ? 'Sila log masuk untuk meneruskan' : 'Please log in to continue'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {lang === 'bm' ? 'E-mel' : 'Email'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@phoenix.my"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#8B0000]/20 focus:border-[#8B0000] outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {lang === 'bm' ? 'Kata Laluan' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
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
                  <><Loader2 className="w-4 h-4 animate-spin" /> {lang === 'bm' ? 'Sedang log masuk...' : 'Signing in...'}</>
                ) : (
                  lang === 'bm' ? 'Log Masuk' : 'Sign In'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="px-6">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">{lang === 'bm' ? 'atau log masuk pantas' : 'or quick login as'}</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            </div>

            {/* Quick Login */}
            <div className="p-6 pt-4 space-y-2">
              {DEMO_USERS.map((user) => (
                <button
                  key={user.email}
                  onClick={() => quickLogin(user)}
                  disabled={loading}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left disabled:opacity-50 group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#8B0000]/10 flex items-center justify-center shrink-0 group-hover:bg-[#8B0000]/15 transition-colors">
                    <span className="text-sm font-bold text-[#8B0000]">{user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.role}</p>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-gray-300 rotate-180 group-hover:text-[#8B0000] transition-colors" />
                </button>
              ))}
            </div>

            {/* Demo Notice */}
            <div className="px-6 pb-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700 text-center">
                <strong>{lang === 'bm' ? 'Mod Demo' : 'Demo Mode'}:</strong>{' '}
                {lang === 'bm'
                  ? 'Gunakan butang log masuk pantas atau masukkan e-mel & kata laluan di atas'
                  : 'Use quick login buttons above or enter email & password'}
              </div>
            </div>
          </div>

          <div className="text-center mt-6">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              {lang === 'bm' ? 'Kembali ke halaman utama' : 'Back to home'}
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
