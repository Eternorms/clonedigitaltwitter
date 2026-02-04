'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DailyMetric } from '@/types';

interface PostsChartProps {
  metrics: DailyMetric[];
}

export function PostsChart({ metrics }: PostsChartProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-slate-900">Posts por Dia</h3>
        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
          Últimos 7 dias
        </span>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={metrics}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '0.75rem',
                border: '1px solid #f1f5f9',
                boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)',
                fontSize: '12px',
                fontWeight: 600,
              }}
            />
            <Bar
              dataKey="posts"
              name="Posts"
              fill="#0f172a"
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
