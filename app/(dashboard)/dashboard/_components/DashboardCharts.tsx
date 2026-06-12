'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ReportsOverview } from '@/types';

const STAGE_COLORS: Record<string, string> = {
  LEAD: '#cbd5e1',
  COUNSELING: '#60a5fa',
  PAYMENT_PENDING: '#f59e0b',
  PAYMENT_CONFIRMED: '#34d399',
  APPLICATION_SUBMITTED: '#818cf8',
  UNIVERSITY_ACCEPTED: '#10b981',
  TRAVEL_PLANNING: '#a78bfa',
  TRAVELLED: '#fb7185',
  MONITORING: '#64748b',
};

export function MonthlyIntakeChart({ data }: { data: ReportsOverview['monthlyTrend'] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="gradStudents" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#9c003d" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#9c003d" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#64748b" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Area type="monotone" dataKey="leads" stroke="#64748b" fill="url(#gradLeads)" strokeWidth={2} />
        <Area type="monotone" dataKey="students" stroke="#9c003d" fill="url(#gradStudents)" strokeWidth={2} />
        <Area type="monotone" dataKey="travelled" stroke="#16a34a" fill="transparent" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function PipelineDonut({ data }: { data: ReportsOverview['pipeline'] }) {
  const chartData = data
    .filter((p) => p.count > 0)
    .map((p) => ({
      name: p.stage.replace(/_/g, ' ').toLowerCase(),
      stage: p.stage,
      value: p.count,
    }));

  if (chartData.length === 0) {
    return (
      <div className="h-[320px] flex items-center justify-center text-sm text-gray-400 bg-gray-50 rounded-lg">
        No students yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={95}
          paddingAngle={2}
        >
          {chartData.map((d) => (
            <Cell key={d.stage} fill={STAGE_COLORS[d.stage] ?? '#94a3b8'} />
          ))}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
