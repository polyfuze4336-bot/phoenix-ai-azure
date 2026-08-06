'use client';

import { useLanguage } from '@/components/language-provider';
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line, Legend
} from 'recharts';

const COLORS = ['#8B0000', '#E67E22', '#F59B0C', '#0F9B8E', '#C0392B', '#60B5FF', '#FF9898'];

const severityData = [
  { name: '1st Degree', value: 210 },
  { name: '2nd Superficial', value: 285 },
  { name: '2nd Deep', value: 178 },
  { name: '3rd Degree', value: 112 },
  { name: '4th Degree', value: 49 },
];

const bodyRegionData = [
  { region: 'Head/Neck', cases: 145 },
  { region: 'Trunk', cases: 234 },
  { region: 'Upper Limb', cases: 312 },
  { region: 'Lower Limb', cases: 267 },
  { region: 'Perineum', cases: 42 },
];

const monthlyData = [
  { month: 'Jan', cases: 85 }, { month: 'Feb', cases: 92 }, { month: 'Mar', cases: 78 },
  { month: 'Apr', cases: 110 }, { month: 'May', cases: 125 }, { month: 'Jun', cases: 98 },
  { month: 'Jul', cases: 134 }, { month: 'Aug', cases: 112 }, { month: 'Sep', cases: 95 },
  { month: 'Oct', cases: 108 }, { month: 'Nov', cases: 120 }, { month: 'Dec', cases: 90 },
];

const woundTypeData = [
  { type: 'Burn', count: 834 },
  { type: 'Diabetic Ulcer', count: 128 },
  { type: 'Pressure Ulcer', count: 95 },
  { type: 'Traumatic', count: 112 },
  { type: 'Surgical', count: 78 },
];

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

const outcomeData = [
  { name: 'Healed', value: 612 },
  { name: 'Ongoing', value: 345 },
  { name: 'Referred', value: 178 },
  { name: 'Complicated', value: 112 },
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
  const { t } = useLanguage();

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
