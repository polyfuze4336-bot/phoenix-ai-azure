'use client';

import Link from 'next/link';
import { motion, MotionConfig } from 'framer-motion';
import { Stethoscope, Users, ArrowRight, Sparkles, LayoutDashboard, ScanLine, BarChart3, FolderKanban } from 'lucide-react';
import { PhoenixLogo } from '@/components/phoenix-logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';
import { DemoBadge } from '@/components/v2/demo-badge';
import { APP_VERSION } from '@/lib/v2/version';

const highlights = [
  { icon: LayoutDashboard, title: 'Clinical command centre', desc: 'Live overview of caseload, priorities and activity at a glance.' },
  { icon: FolderKanban, title: 'Case-centric workflow', desc: 'Every assessment becomes a trackable case with a full timeline.' },
  { icon: ScanLine, title: 'Guided AI assessment', desc: 'Step-by-step capture, quality checks and explainable analysis.' },
  { icon: BarChart3, title: 'Reports & insights', desc: 'Structured clinical reports and operational analytics.' },
];

export function V2LandingClient() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-background text-foreground">
        <header className="v2-glass sticky top-0 z-20 safe-area-top">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-2.5">
              <PhoenixLogo className="h-9 w-9" alt="Phoenix AI Logo" />
              <div className="leading-tight">
                <p className="font-display text-base font-bold tracking-tight">Phoenix AI</p>
                <p className="text-[11px] font-semibold text-primary">v{APP_VERSION} · Enhanced</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DemoBadge className="hidden sm:inline-flex" />
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>
        </header>

        <section className="v2-hero-gradient">
          <div className="mx-auto max-w-6xl px-4 py-14 text-center md:px-6 md:py-20">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" /> Enhanced experience
              </span>
              <h1 className="mt-5 font-display text-3xl font-bold tracking-tight md:text-5xl">
                <span className="phoenix-gradient-text">Phoenix AI v2.0</span>
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground md:text-lg">
                A reimagined clinical workspace for burn &amp; wound assessment — built on the original Phoenix AI,
                with the same trusted branding and clinical tools.
              </p>
            </motion.div>

            <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                <Link href="/v2/hcp" className="group block h-full rounded-2xl border bg-card p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
                  <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#8B0000] to-[#C0392B]">
                    <Stethoscope className="h-7 w-7 text-white" />
                  </span>
                  <h2 className="mt-4 font-display text-lg font-bold tracking-tight">Clinician Workspace</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Dashboard, cases, guided AI assessment, calculators, reports &amp; insights.</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary transition-all group-hover:gap-2">
                    Enter workspace <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                <Link href="/v2/community" className="group block h-full rounded-2xl border bg-card p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-accent/30 hover:shadow-lg">
                  <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#0F9B8E] to-[#0e8a7e]">
                    <Users className="h-7 w-7 text-white" />
                  </span>
                  <h2 className="mt-4 font-display text-lg font-bold tracking-tight">Community Portal</h2>
                  <p className="mt-1 text-sm text-muted-foreground">First aid, self-assessment, image check and health education.</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent transition-all group-hover:gap-2">
                    Open portal <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
          <h3 className="text-center font-display text-2xl font-bold tracking-tight">What&rsquo;s new in v2.0</h3>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {highlights.map((h, i) => (
              <motion.div
                key={h.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="rounded-xl border bg-card p-5"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <h.icon className="h-5 w-5" />
                </span>
                <h4 className="mt-3 font-display text-sm font-bold tracking-tight">{h.title}</h4>
                <p className="mt-1 text-sm text-muted-foreground">{h.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </MotionConfig>
  );
}
