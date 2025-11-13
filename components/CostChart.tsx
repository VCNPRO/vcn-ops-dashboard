'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DailyCost {
  id: number;
  appId: number;
  date: string;
  providerId: number;
  costLocal: number;
  currency: string;
  notes?: string;
}

interface App {
  id: number;
  name: string;
  dailyCosts: DailyCost[];
}

interface CostChartProps {
  apps: App[];
}

export default function CostChart({ apps }: CostChartProps) {
  const chartData = useMemo(() => {
    const dataByDate: Record<string, any> = {};

    apps.forEach((app) => {
      app.dailyCosts.forEach((cost) => {
        const date = new Date(cost.date).toISOString().split('T')[0];
        if (!dataByDate[date]) {
          dataByDate[date] = { date };
        }
        dataByDate[date][app.name] =
          (dataByDate[date][app.name] || 0) + Number(cost.costLocal || 0);
      });
    });

    return Object.values(dataByDate).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [apps]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No hay datos de costos disponibles
      </div>
    );
  }

  const colors = [
    '#3b82f6',
    '#ef4444',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#ec4899',
  ];

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => {
            const date = new Date(value);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          }}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
        />
        <Legend />
        {apps.map((app, index) => (
          <Line
            key={app.id}
            type="monotone"
            dataKey={app.name}
            stroke={colors[index % colors.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
