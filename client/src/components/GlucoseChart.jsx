import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';

export default function GlucoseChart({ readings = [], title = 'Blood Glucose Trend' }) {
  if (!readings || readings.length === 0) {
    return null;
  }

  // Sort readings chronologically
  const chartData = [...readings]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((r, idx) => ({
      index: idx,
      id: r.id,
      date: r.date,
      displayDate: r.date.slice(5), // MM-DD
      slot: r.slot,
      value: r.value,
      notes: r.notes,
    }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white px-3.5 py-2.5 rounded-xl shadow-lg border border-slate-800 text-xs">
          <div className="text-slate-400 font-semibold mb-1">
            {data.date} • {data.slot}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-extrabold text-rose-400">
              {data.value}
            </span>
            <span className="text-slate-400 text-xs">mg/dl</span>
          </div>
          {data.notes && (
            <p className="mt-1 text-slate-300 italic max-w-xs">{data.notes}</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">{title}</h3>
          <p className="text-xs text-slate-500">Visual trend over the selected period</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-600 font-medium">Target Zone (70–140 mg/dl)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-slate-600 font-medium">Readings</span>
          </div>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="displayDate"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis
              domain={[40, (dataMax) => Math.max(200, Math.ceil((dataMax + 20) / 20) * 20)]}
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Target glucose zone highlight */}
            <ReferenceArea
              y1={70}
              y2={140}
              fill="#ecfdf5"
              fillOpacity={0.7}
              stroke="#10b981"
              strokeOpacity={0.2}
              strokeDasharray="2 2"
            />
            <ReferenceLine y={140} stroke="#10b981" strokeDasharray="3 3" strokeWidth={1} />
            <ReferenceLine y={70} stroke="#10b981" strokeDasharray="3 3" strokeWidth={1} />

            <Line
              type="monotone"
              dataKey="value"
              stroke="#e11d48"
              strokeWidth={2.5}
              dot={{ fill: '#e11d48', strokeWidth: 2, r: 4, stroke: '#ffffff' }}
              activeDot={{ r: 6, fill: '#be123c', stroke: '#ffffff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
