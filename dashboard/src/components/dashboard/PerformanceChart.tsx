'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { dailyMetrics } from '@/lib/mock-data';

export function PerformanceChart() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-slate-900">
          Impress\u00F5es e Engajamento
        </h3>
        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
          \u00DAltimos 7 dias
        </span>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dailyMetrics}>
            <defs>
              <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorEngagements" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4ade80" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
              </linearGradient>
            </defs>
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
              tickFormatter={(v: number) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
              }
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
            <Area
              type="monotone"
              dataKey="impressions"
              name="Impress\u00F5es"
              stroke="#38bdf8"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorImpressions)"
            />
            <Area
              type="monotone"
              dataKey="engagements"
              name="Engajamentos"
              stroke="#4ade80"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorEngagements)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
