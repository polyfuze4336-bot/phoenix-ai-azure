'use client';

import { useLanguage } from '@/components/language-provider';
import { LanguageToggleDark } from '@/components/language-toggle';
import { PhoenixLogo } from '@/components/phoenix-logo';
import { Home, Heart, ClipboardCheck, BookOpen, MessageCircle, ArrowLeft, Menu, X, PlayCircle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, ReactNode } from 'react';

const navItems = [
  { href: '/community', icon: Home, labelKey: 'community.home' },
  { href: '/community/first-aid', icon: Heart, labelKey: 'community.firstaid' },
  { href: '/community/first-aid-video', icon: PlayCircle, labelKey: 'community.firstaid_video' },
  { href: '/community/burn-prevention', icon: ShieldCheck, labelKey: 'community.burn_prevention' },
  { href: '/community/assessment', icon: ClipboardCheck, labelKey: 'community.assessment' },
  { href: '/community/articles', icon: BookOpen, labelKey: 'community.articles' },
  { href: '/community/chat', icon: MessageCircle, labelKey: 'community.chat' },
];

const mobileBottomNavItems = navItems.filter(({ href }) =>
  ['/community', '/community/first-aid', '/community/assessment', '/community/articles', '/community/chat'].includes(href),
);

export function CommunityLayoutClient({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 fixed top-0 left-0 h-full z-40">
        <div className="p-4 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-3">
            <PhoenixLogo className="w-9 h-9" />
            <div>
              <span className="font-display text-base font-bold text-gray-900">Phoenix AI</span>
              <p className="text-[10px] text-[#0F9B8E] font-medium">{t('community.portal')}</p>
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
                  active ? 'bg-[#0F9B8E]/10 text-[#0F9B8E]' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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

      {mobileOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}

      <aside className={`fixed top-0 left-0 h-full w-64 bg-white z-50 transform transition-transform lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
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
              <Link key={item?.href} href={item?.href} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${active ? 'bg-[#0F9B8E]/10 text-[#0F9B8E]' : 'text-gray-600 hover:bg-gray-100'}`}>
                <item.icon className="w-5 h-5" />{t(item?.labelKey)}
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

      <div className="min-w-0 flex-1 lg:ml-64">
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200 safe-area-top">
          <div className="px-4 lg:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="lg:hidden" onClick={() => setMobileOpen(true)}><Menu className="w-6 h-6 text-gray-600" /></button>
              <div className="lg:hidden flex items-center gap-2">
                <PhoenixLogo className="w-7 h-7" />
                <span className="font-display text-sm font-bold text-gray-800">Phoenix AI</span>
              </div>
            </div>
            <LanguageToggleDark />
          </div>
        </header>

        <main className="p-4 lg:p-8 max-w-[1200px] mx-auto pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-gray-200 safe-area-bottom">
        <div className="flex items-center justify-around px-1 py-1">
          {mobileBottomNavItems?.map((item: any) => {
            const active = pathname === item?.href;
            return (
              <Link
                key={item?.href}
                href={item?.href}
                className={`flex flex-col items-center justify-center py-2 px-2 rounded-xl min-w-[52px] transition-all ${
                  active
                    ? 'text-[#0F9B8E]'
                    : 'text-gray-400 active:text-gray-600'
                }`}
              >
                <item.icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : ''}`} />
                <span className={`text-[10px] mt-0.5 leading-tight text-center font-medium ${
                  active ? 'text-[#0F9B8E]' : 'text-gray-400'
                }`}>
                  {t(item?.labelKey)?.split(' ')?.[0]}
                </span>
                {active && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#0F9B8E]" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
