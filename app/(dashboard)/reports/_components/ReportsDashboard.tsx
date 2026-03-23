'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const conversionData = [
  { name: 'Jan', leads: 400, enrolled: 240 },
  { name: 'Feb', leads: 300, enrolled: 139 },
  { name: 'Mar', leads: 200, enrolled: 980 },
  { name: 'Apr', leads: 278, enrolled: 390 },
  { name: 'May', leads: 189, enrolled: 480 },
  { name: 'Jun', leads: 239, enrolled: 380 },
];

const revenueData = [
  { name: 'Q1', target: 4000, actual: 2400 },
  { name: 'Q2', target: 3000, actual: 1398 },
  { name: 'Q3', target: 2000, actual: 9800 },
  { name: 'Q4', target: 2780, actual: 3908 },
];

const destinationData = [
  { name: 'UK', value: 400 },
  { name: 'USA', value: 300 },
  { name: 'Canada', value: 300 },
  { name: 'Australia', value: 200 },
];

const COLORS = ['#9c003d', '#1e293b', '#64748b', '#cbd5e1'];

export function ReportsDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Chart */}
        <div className="bg-white p-6 rounded-xl shadow-card">
          <h3 className="text-lg font-bold font-urbanist text-gray-900 mb-4">Lead Conversion Trends</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={conversionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" />
                <Line type="monotone" dataKey="leads" stroke="#64748b" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="enrolled" stroke="#9c003d" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-xl shadow-card">
          <h3 className="text-lg font-bold font-urbanist text-gray-900 mb-4">Revenue vs Target</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="target" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" fill="#1e293b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Destinations Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-card">
          <h3 className="text-lg font-bold font-urbanist text-gray-900 mb-4">Top Destinations</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={destinationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {destinationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="bg-white p-6 rounded-xl shadow-card flex flex-col justify-center">
           <h3 className="text-lg font-bold font-urbanist text-gray-900 mb-6">Key Metrics Summary</h3>
           <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <span className="text-gray-600">Total Leads (YTD)</span>
                <span className="font-bold text-xl text-gray-900">1,484</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <span className="text-gray-600">Conversion Rate</span>
                <span className="font-bold text-xl text-green-600">24.5%</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <span className="text-gray-600">Avg. Processing Time</span>
                <span className="font-bold text-xl text-gray-900">42 Days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Revenue Collected</span>
                <span className="font-bold text-xl text-primary">$1.2M</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
