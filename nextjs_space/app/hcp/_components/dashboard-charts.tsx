'use client';

import { useLanguage } from '@/components/language-provider';
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line, Legend
} from 'recharts';

const COLORS = ['#8B0000', '#E67E22', '#F59B0C', '#0F9B8E', '#C0392B', '#60B5FF', '#FF9898'];

const tbsaRangeData = [
  { range: '<5%', count: 320 }, { range: '5-10%', count: 245 },
  { range: '10-20%', count: 178 }, { range: '20-40%', count: 112 },
  { range: '>40%', count: 49 },
];

const ageGroupData = [
  { group: '0-5', count: 145 }, { group: '6-12', count: 98 },
  { group: '13-18', count: 76 }, { group: '19-40', count: 412 },
  { group: '41-60', count: 334 }, { group: '60+', count: 182 },
];

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <h3 className="font-display text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      <div className="h-64">{children}</div>
    </div>
  );
}

export function DashboardCharts() {
  const { t, lang } = useLanguage();
  const severityData = [
    { name: t('dash.degree_1'), value: 210 },
    { name: t('dash.degree_2_superficial'), value: 285 },
    { name: t('dash.degree_2_deep'), value: 178 },
    { name: t('dash.degree_3'), value: 112 },
    { name: t('dash.degree_4'), value: 49 },
  ];
  const bodyRegionData = [
    { region: t('dash.head_neck'), cases: 145 },
    { region: t('dash.trunk'), cases: 234 },
    { region: t('dash.upper_limb'), cases: 312 },
    { region: t('dash.lower_limb'), cases: 267 },
    { region: t('dash.perineum'), cases: 42 },
  ];
  const monthValues = [85, 92, 78, 110, 125, 98, 134, 112, 95, 108, 120, 90];
  const monthlyData = monthValues.map((cases, month) => ({
    month: new Intl.DateTimeFormat(lang === 'ms' ? 'ms-MY' : 'en-MY', { month: 'short' }).format(new Date(2026, month, 1)),
    cases,
  }));
  const woundTypeData = [
    { type: t('dash.burn'), count: 834 },
    { type: t('dash.diabetic_ulcer'), count: 128 },
    { type: t('dash.pressure_ulcer'), count: 95 },
    { type: t('dash.traumatic'), count: 112 },
    { type: t('dash.surgical'), count: 78 },
  ];
  const outcomeData = [
    { name: t('dash.healed'), value: 612 },
    { name: t('dash.ongoing'), value: 345 },
    { name: t('dash.referred'), value: 178 },
    { name: t('dash.complicated'), value: 112 },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Severity Distribution */}
      <ChartCard title={t('dash.severity_dist')}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={severityData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100)?.toFixed?.(0) ?? 0}%`} labelLine={false} style={{ fontSize: 10 }}>
              {severityData?.map((_: any, i: number) => <Cell key={i} fill={COLORS?.[i % (COLORS?.length ?? 1)]} />)}
            </Pie>
            <Tooltip contentStyle={{ fontSize: 11 }} />
            <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Body Region */}
      <ChartCard title={t('dash.body_region')}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bodyRegionData} margin={{ top: 5, right: 10, left: 0, bottom: 25 }}>
            <XAxis dataKey="region" tickLine={false} tick={{ fontSize: 10 }} angle={-25} textAnchor="end" />
            <YAxis tickLine={false} tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ fontSize: 11 }} />
            <Bar dataKey="cases" fill="#0F9B8E" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Monthly Trend */}
      <ChartCard title={t('dash.monthly_trend')}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <XAxis dataKey="month" tickLine={false} tick={{ fontSize: 10 }} />
            <YAxis tickLine={false} tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="cases" stroke="#8B0000" strokeWidth={2} dot={{ fill: '#8B0000', r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Wound Type */}
      <ChartCard title={t('dash.wound_type')}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={woundTypeData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <XAxis type="number" tickLine={false} tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="type" tickLine={false} tick={{ fontSize: 10 }} width={90} />
            <Tooltip contentStyle={{ fontSize: 11 }} />
            <Bar dataKey="count" fill="#E67E22" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* TBSA Range */}
      <ChartCard title={t('dash.tbsa_range')}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={tbsaRangeData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <XAxis dataKey="range" tickLine={false} tick={{ fontSize: 10 }} />
            <YAxis tickLine={false} tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ fontSize: 11 }} />
            <Bar dataKey="count" fill="#C0392B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Age Group */}
      <ChartCard title={t('dash.age_group')}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={ageGroupData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <XAxis dataKey="group" tickLine={false} tick={{ fontSize: 10 }} />
            <YAxis tickLine={false} tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ fontSize: 11 }} />
            <Bar dataKey="count" fill="#F59B0C" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Treatment Outcomes */}
      <ChartCard title={t('dash.outcomes')}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={outcomeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100)?.toFixed?.(0) ?? 0}%`} style={{ fontSize: 10 }}>
              {outcomeData?.map((_: any, i: number) => <Cell key={i} fill={['#10B981', '#F59B0C', '#60B5FF', '#EF4444']?.[i] ?? '#ccc'} />)}
            </Pie>
            <Tooltip contentStyle={{ fontSize: 11 }} />
            <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
