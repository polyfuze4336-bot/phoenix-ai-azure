'use client';

import { useLanguage } from '@/components/language-provider';
import { LanguageToggleDark } from '@/components/language-toggle';
import { PhoenixLogo } from '@/components/phoenix-logo';
import { DemoEnvironmentBadge } from '@/components/demo-environment-badge';
import { LayoutDashboard, Brain, Calculator, Droplets, BookOpen, MessageSquare, History, ArrowLeft, Menu, X, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, ReactNode, useCallback } from 'react';

const navItems = [
  { href: '/hcp', icon: LayoutDashboard, labelKey: 'hcp.dashboard', shortKey: 'hcp.dashboard' },
  { href: '/hcp/analysis', icon: Brain, labelKey: 'hcp.analysis', shortKey: 'hcp.analysis' },
  { href: '/hcp/tbsa', icon: Calculator, labelKey: 'hcp.tbsa', shortKey: 'hcp.tbsa' },
  { href: '/hcp/parkland', icon: Droplets, labelKey: 'hcp.parkland', shortKey: 'hcp.parkland' },
  { href: '/hcp/guidelines', icon: BookOpen, labelKey: 'hcp.guidelines', shortKey: 'hcp.guidelines' },
  { href: '/hcp/chat', icon: MessageSquare, labelKey: 'hcp.chat', shortKey: 'hcp.chat' },
  { href: '/hcp/history', icon: History, labelKey: 'hcp.history', shortKey: 'hcp.history' },
];

interface HcpUser {
  name: string;
  role: string;
  email: string;
}

export function HcpLayoutClient({ children }: { children: ReactNode }) {
  const { t, lang } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<HcpUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [serverSession, setServerSession] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function resolveSession() {
      // Demo mode (parity): session identity is held client-side.
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('hcp_auth');
        if (stored) {
          try {
            if (!cancelled) {
              setUser(JSON.parse(stored));
              setAuthChecked(true);
            }
            return;
          } catch {
            /* fall through to server session check */
          }
        }
      }

      // Entra mode: identity comes from the server-validated session cookie.
      // (Access is already enforced by middleware; this only fetches display info.)
      try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data?.authenticated && data?.user && !cancelled) {
            setUser({ name: data.user.name, role: data.user.role, email: data.user.email });
            setServerSession(true);
            setAuthChecked(true);
            return;
          }
        }
      } catch {
        /* no server session */
      }

      if (!cancelled) {
        setAuthChecked(true);
      }
    }

    void resolveSession();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (authChecked && !user) {
      router.replace('/hcp-login');
    }
  }, [authChecked, user, router]);

  const handleLogout = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('hcp_auth');
    }
    // Entra mode: end the server session (and federated sign-out) via the route.
    if (serverSession) {
      window.location.href = '/api/auth/logout';
      return;
    }
    setUser(null);
    router.replace('/hcp-login');
  }, [router, serverSession]);

  // Show nothing while checking auth
  if (!authChecked || !user) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <PhoenixLogo className="w-12 h-12" />
          <p className="text-sm text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 fixed top-0 left-0 h-full z-40">
        <div className="p-4 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-3">
            <PhoenixLogo className="w-9 h-9" />
            <div>
              <span className="font-display text-base font-bold text-gray-900">Phoenix AI</span>
              <p className="text-[10px] text-[#8B0000] font-medium">{t('hcp.portal')}</p>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems?.map((item: any) => {
            const active = pathname === item?.href;
            return (
              <Link
                key={item?.href}
                href={item?.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-[#8B0000]/10 text-[#8B0000]'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {t(item?.labelKey)}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <Link href="/" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-4 h-4" /> {t('common.back')}
          </Link>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar (for less common pages) */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white z-50 transform transition-transform lg:hidden ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4 border-b flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <PhoenixLogo className="w-8 h-8" />
            <span className="font-display text-sm font-bold">Phoenix AI</span>
          </Link>
          <button onClick={() => setMobileOpen(false)}><X className="w-5 h-5" /></button>
        </div>
        <nav className="p-3 space-y-1">
          {navItems?.map((item: any) => {
            const active = pathname === item?.href;
            return (
              <Link
                key={item?.href}
                href={item?.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active ? 'bg-[#8B0000]/10 text-[#8B0000]' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {t(item?.labelKey)}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t">
          <Link href="/" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
            <ArrowLeft className="w-4 h-4" /> {t('common.back')}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="min-w-0 flex-1 lg:ml-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200 safe-area-top">
          <div className="px-4 lg:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="lg:hidden" onClick={() => setMobileOpen(true)}>
                <Menu className="w-6 h-6 text-gray-600" />
              </button>
              <div className="lg:hidden flex items-center gap-2">
                <PhoenixLogo className="w-7 h-7" />
                <span className="font-display text-sm font-bold text-gray-800">Phoenix AI</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DemoEnvironmentBadge />
              <LanguageToggleDark />
              {/* User Profile */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[#8B0000]/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-[#8B0000]">{user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[120px] truncate">{user.name}</span>
                </button>
                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                      <div className="p-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.role}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        {t('hcp.sign_out')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content with bottom padding for mobile nav */}
        <main className="mx-auto w-full min-w-0 max-w-[1200px] p-4 pb-24 lg:p-8 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-gray-200 safe-area-bottom">
        <div className="flex items-center justify-around px-1 py-1">
          {navItems?.map((item: any) => {
            const active = pathname === item?.href;
            return (
              <Link
                key={item?.href}
                href={item?.href}
                aria-label={t(item?.labelKey)}
                className={`flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl px-1 py-2 transition-all sm:px-2 ${
                  active
                    ? 'text-[#8B0000]'
                    : 'text-gray-400 active:text-gray-600'
                }`}
              >
                <item.icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : ''}`} />
                <span className={`mt-0.5 w-full truncate text-center text-[10px] font-medium leading-tight ${
                  active ? 'text-[#8B0000]' : 'text-gray-400'
                }`}>
                  {t(item?.shortKey)?.split(' ')?.[0]}
                </span>
                {active && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#8B0000]" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
