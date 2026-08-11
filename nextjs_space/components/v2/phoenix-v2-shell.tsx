'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { MotionConfig } from 'framer-motion';
import { Menu, Search, ArrowLeftRight, Command as CommandIcon, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PhoenixLogo } from '@/components/phoenix-logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { DemoBadge } from '@/components/v2/demo-badge';
import { V2_HCP_NAV, V2_COMMUNITY_NAV, type NavItem } from '@/lib/v2/nav';
import { isFeatureEnabled } from '@/lib/v2/feature-flags';
import { APP_VERSION } from '@/lib/v2/version';

interface PhoenixV2ShellProps {
  variant?: 'hcp' | 'community';
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

function visibleNav(items: NavItem[]): NavItem[] {
  return items.filter((item) => !item.requiresFlag || isFeatureEnabled(item.requiresFlag));
}

function isActive(pathname: string, item: NavItem): boolean {
  if (item.matchPrefix) return pathname === item.href || pathname.startsWith(`${item.href}/`);
  return pathname === item.href;
}

export function PhoenixV2Shell({ variant = 'hcp', title, subtitle, children }: PhoenixV2ShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const commandPaletteEnabled = isFeatureEnabled('commandPalette');

  const nav = visibleNav(variant === 'community' ? V2_COMMUNITY_NAV : V2_HCP_NAV);
  const homeHref = variant === 'community' ? '/v2/community' : '/v2/hcp';

  useEffect(() => {
    if (!commandPaletteEnabled) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [commandPaletteEnabled]);

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-col gap-1">
      {nav.map((item) => {
        const active = isActive(pathname, item);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
              active && 'v2-nav-active hover:bg-primary/10',
            )}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const Sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <PhoenixLogo className="h-9 w-9" alt="Phoenix AI Logo" />
        <div className="leading-tight">
          <p className="font-display text-sm font-bold tracking-tight text-foreground">Phoenix AI</p>
          <p className="text-[11px] font-semibold text-primary">v{APP_VERSION} · Enhanced</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <NavLinks onNavigate={() => setMobileOpen(false)} />
      </div>
      <div className="border-t p-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeftRight className="h-4 w-4" aria-hidden />
          Switch experience
        </Link>
        <p className="mt-2 px-3 text-[11px] text-muted-foreground">Phoenix AI v{APP_VERSION}</p>
      </div>
    </div>
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-background text-foreground">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-card lg:flex lg:flex-col">
          {Sidebar}
        </aside>

        <div className="lg:pl-64">
          {/* Top bar */}
          <header className="v2-glass sticky top-0 z-20 safe-area-top">
            <div className="flex h-16 items-center gap-3 px-4 md:px-6">
              {/* Mobile menu */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <SheetTitle className="sr-only">Navigation</SheetTitle>
                  {Sidebar}
                </SheetContent>
              </Sheet>

              <div className="min-w-0 flex-1">
                <h1 className="truncate font-display text-base font-bold tracking-tight text-foreground md:text-lg">{title}</h1>
                {subtitle ? <p className="hidden truncate text-xs text-muted-foreground sm:block">{subtitle}</p> : null}
              </div>

              <DemoBadge className="hidden sm:inline-flex" />

              {commandPaletteEnabled ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaletteOpen(true)}
                  className="hidden items-center gap-2 text-muted-foreground md:inline-flex"
                >
                  <Search className="h-4 w-4" />
                  <span className="text-xs">Search</span>
                  <kbd className="ml-1 inline-flex items-center gap-0.5 rounded border bg-muted px-1.5 text-[10px] font-medium">
                    <CommandIcon className="h-2.5 w-2.5" />K
                  </kbd>
                </Button>
              ) : null}

              <LanguageToggle />
              <ThemeToggle />
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-6 md:py-8">{children}</main>

          <footer className="border-t px-4 py-4 text-center text-xs text-muted-foreground md:px-6">
            Phoenix AI v{APP_VERSION} · Enhanced experience · Demonstration environment ·{' '}
            <Link href="/" className="text-primary hover:underline">
              Switch experience
            </Link>
          </footer>
        </div>

        {commandPaletteEnabled ? (
          <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen}>
            <CommandInput placeholder="Jump to a section…" />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Navigate">
                {nav.map((item) => (
                  <CommandItem
                    key={item.href}
                    value={item.label}
                    onSelect={() => {
                      setPaletteOpen(false);
                      router.push(item.href);
                    }}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup heading="Experience">
                <CommandItem
                  value="Switch experience"
                  onSelect={() => {
                    setPaletteOpen(false);
                    router.push('/');
                  }}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Switch experience
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </CommandDialog>
        ) : null}
      </div>
    </MotionConfig>
  );
}
