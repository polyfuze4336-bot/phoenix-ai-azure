'use client';

import { useLanguage } from '@/components/language-provider';
import { Activity, Flame, Droplets, AlertTriangle, Percent } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';

const DashboardCharts = dynamic(() => import('./dashboard-charts').then(m => ({ default: m.DashboardCharts })), { ssr: false, loading: () => <div className="h-96 flex items-center justify-center text-gray-400">Loading charts...</div> });

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]: any) => { if (entry?.isIntersecting) setInView(true); },
      { threshold: 0.3 }
    );
    if (ref?.current) observer?.observe(ref.current);
    return () => observer?.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1200;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target]);

  return <span ref={ref} className="font-mono text-2xl md:text-3xl font-bold">{count}{suffix}</span>;
}

const summaryCards = [
  { key: 'dash.total_cases', value: 1247, icon: Activity, color: 'from-[#8B0000] to-[#C0392B]', textColor: 'text-white' },
  { key: 'dash.burn_cases', value: 834, icon: Flame, color: 'from-[#E67E22] to-[#F59B0C]', textColor: 'text-white' },
  { key: 'dash.wound_cases', value: 413, icon: Droplets, color: 'from-[#0F9B8E] to-[#0e8a7e]', textColor: 'text-white' },
  { key: 'dash.critical', value: 89, icon: AlertTriangle, color: 'from-red-500 to-red-600', textColor: 'text-white' },
  { key: 'dash.avg_tbsa', value: 14, suffix: '%', icon: Percent, color: 'from-purple-500 to-purple-600', textColor: 'text-white' },
];

export function DashboardClient() {
  const { t } = useLanguage();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{t('hcp.dashboard')}</h1>
        <p className="text-sm text-gray-500 mt-1">Clinical analytics overview for burn and wound cases</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {summaryCards?.map((card: any, i: number) => (
          <motion.div
            key={card?.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className={`bg-gradient-to-br ${card?.color} rounded-xl p-5 shadow-md`}
          >
            <div className="flex items-center justify-between mb-3">
              <card.icon className={`w-5 h-5 ${card?.textColor} opacity-80`} />
            </div>
            <div className={card?.textColor}>
              <AnimatedCounter target={card?.value ?? 0} suffix={card?.suffix ?? ''} />
            </div>
            <p className={`text-xs mt-1 ${card?.textColor} opacity-80`}>{t(card?.key)}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <DashboardCharts />
    </div>
  );
}
