'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatCurrency } from '@/lib/format';
import { ReportsOverview, Role } from '@/types';

const PIE_COLORS = ['#9c003d', '#1e293b', '#64748b', '#cbd5e1', '#e9b8cb', '#94a3b8'];

type SectionId = 'pipeline' | 'trend' | 'destinations' | 'applications' | 'finance' | 'wellbeing';

const ROLE_SECTIONS: Record<Role, SectionId[]> = {
  MANAGING_DIRECTOR: ['trend', 'finance', 'pipeline', 'destinations', 'applications', 'wellbeing'],
  MARKETING_MANAGER: ['trend', 'pipeline', 'destinations'],
  MARKETING_STAFF: ['trend', 'pipeline', 'destinations'],
  SUB_AGENT: ['trend', 'destinations'],
  FINANCE: ['finance', 'pipeline'],
  ADMISSIONS: ['applications', 'pipeline', 'destinations'],
  TRAVEL: ['trend', 'destinations', 'pipeline'],
  OPERATIONS: ['wellbeing', 'pipeline', 'trend'],
  IT_ADMIN: ['trend', 'pipeline'],
};

export function ReportsDashboard({ data, role }: { data: ReportsOverview; role: Role }) {
  const sections = ROLE_SECTIONS[role] ?? ['trend', 'pipeline'];
  const m = data.keyMetrics;

  const kpis =
    role === 'FINANCE'
      ? [
          { label: 'Receipts (YTD)', value: formatCurrency(m.receiptsYtd, { compact: true }) },
          { label: 'Payments (YTD)', value: formatCurrency(m.paymentsYtd, { compact: true }) },
          { label: 'Receivables', value: formatCurrency(m.receivables, { compact: true }) },
          { label: 'Students', value: String(m.totalStudents) },
        ]
      : role === 'OPERATIONS'
        ? [
            { label: 'Students Abroad', value: String(m.travelledStudents) },
            { label: 'Escalations', value: String(m.escalations) },
            { label: 'Total Students', value: String(m.totalStudents) },
            { label: 'Leads (all time)', value: String(m.totalLeads) },
          ]
        : [
            { label: 'Total Leads', value: String(m.totalLeads) },
            { label: 'Conversion Rate', value: `${m.conversionRate}%` },
            { label: 'Total Students', value: String(m.totalStudents) },
            { label: 'Travelled', value: String(m.travelledStudents) },
          ];

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-xl shadow-card border border-gray-100 p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{k.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1.5">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sections.includes('trend') && (
          <ChartCard title="Leads · Students · Travelled (6 months)">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="leads" stroke="#64748b" strokeWidth={2} />
                <Line type="monotone" dataKey="students" stroke="#9c003d" strokeWidth={2} />
                <Line type="monotone" dataKey="travelled" stroke="#16a34a" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {sections.includes('finance') && (
          <ChartCard title="Receipts vs Payments (6 months)">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.financeTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => formatCurrency(v, { compact: true })} />
                <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
                <Legend />
                <Bar dataKey="receipts" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="payments" fill="#9c003d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {sections.includes('pipeline') && (
          <ChartCard title="Students by Pipeline Stage">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={data.pipeline.map((p) => ({
                  stage: p.stage.replace(/_/g, ' ').toLowerCase(),
                  count: p.count,
                }))}
                layout="vertical"
                margin={{ left: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="stage" width={130} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#9c003d" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {sections.includes('destinations') && (
          <ChartCard title="Top Destinations">
            {data.destinations.length === 0 ? (
              <EmptyChart label="No destination data yet." />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={data.destinations.map((d) => ({ name: d.country, value: d.count }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(entry) => entry.name}
                  >
                    {data.destinations.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        )}

        {sections.includes('applications') && (
          <ChartCard title="Applications by Status">
            {data.applications.length === 0 ? (
              <EmptyChart label="No applications yet." />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={data.applications.map((a) => ({
                    status: a.status.replace(/_/g, ' ').toLowerCase(),
                    count: a.count,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1e293b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        )}

        {sections.includes('wellbeing') && (
          <ChartCard title="Student Wellbeing (Monitoring)">
            {data.wellbeing.length === 0 ? (
              <EmptyChart label="No monitoring records yet." />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={data.wellbeing.map((w) => ({
                      name: w.status.replace(/_/g, ' ').toLowerCase(),
                      value: w.count,
                    }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(entry) => entry.name}
                  >
                    <Cell fill="#16a34a" />
                    <Cell fill="#f59e0b" />
                    <Cell fill="#dc2626" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        )}
      </div>

      <p className="text-[11px] text-gray-400 text-right">
        Generated {new Date(data.generatedAt).toLocaleString()}
      </p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
      <h3 className="text-sm font-bold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="h-[280px] flex items-center justify-center text-sm text-gray-400 bg-gray-50 rounded-lg">
      {label}
    </div>
  );
}
