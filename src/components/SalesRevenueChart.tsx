import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Calendar, TrendingUp, DollarSign, BarChart2, LineChart } from 'lucide-react';

interface Order {
  id: number;
  total: number;
  payment_status: string;
  status: string;
  created_at: string;
  items?: any[];
}

interface SalesRevenueChartProps {
  orders: Order[];
}

export function SalesRevenueChart({ orders }: SalesRevenueChartProps) {
  const [timeframe, setTimeframe] = useState<'daily' | 'monthly'>('daily');
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  const chartData = useMemo(() => {
    if (timeframe === 'daily') {
      // Generate last 7 days
      const days: { [key: string]: { dateStr: string; label: string; revenue: number; ordersCount: number } } = {};
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const iso = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        days[iso] = { dateStr: iso, label, revenue: 0, ordersCount: 0 };
      }

      orders.forEach((order) => {
        if (order.created_at) {
          const orderIso = new Date(order.created_at).toISOString().split('T')[0];
          if (days[orderIso]) {
            days[orderIso].revenue += order.total || 0;
            days[orderIso].ordersCount += 1;
          } else {
            // Also include if order falls outside last 7 days but within last 14 days
            const label = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            days[orderIso] = { dateStr: orderIso, label, revenue: order.total || 0, ordersCount: 1 };
          }
        }
      });

      return Object.values(days).sort((a, b) => a.dateStr.localeCompare(b.dateStr));
    } else {
      // Monthly View (last 6 months)
      const months: { [key: string]: { key: string; label: string; revenue: number; ordersCount: number } } = {};
      const today = new Date();

      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        months[key] = { key, label, revenue: 0, ordersCount: 0 };
      }

      orders.forEach((order) => {
        if (order.created_at) {
          const d = new Date(order.created_at);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          if (months[key]) {
            months[key].revenue += order.total || 0;
            months[key].ordersCount += 1;
          }
        }
      });

      return Object.values(months).sort((a, b) => a.key.localeCompare(b.key));
    }
  }, [orders, timeframe]);

  const totalPeriodRevenue = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.revenue, 0);
  }, [chartData]);

  const totalPeriodOrders = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.ordersCount, 0);
  }, [chartData]);

  const avgOrderValue = totalPeriodOrders > 0 ? totalPeriodRevenue / totalPeriodOrders : 0;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Sales & Revenue Analytics</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">Track sales performance trends over time</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Timeframe Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setTimeframe('daily')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeframe === 'daily'
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Daily
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('monthly')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeframe === 'monthly'
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Monthly
            </button>
          </div>

          {/* Chart Type Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs text-slate-600">
            <button
              type="button"
              onClick={() => setChartType('area')}
              className={`p-1.5 rounded-lg transition-all ${
                chartType === 'area' ? 'bg-white text-teal-700 shadow-xs' : 'hover:text-slate-900'
              }`}
              title="Area Chart"
            >
              <LineChart className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`p-1.5 rounded-lg transition-all ${
                chartType === 'bar' ? 'bg-white text-teal-700 shadow-xs' : 'hover:text-slate-900'
              }`}
              title="Bar Chart"
            >
              <BarChart2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Period Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <p className="text-xs text-slate-500 font-medium">Period Revenue</p>
          <p className="text-xl font-bold text-teal-600 mt-1">EC ${totalPeriodRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <p className="text-xs text-slate-500 font-medium">Period Orders</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{totalPeriodOrders} orders</p>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <p className="text-xs text-slate-500 font-medium">Avg. Order Value</p>
          <p className="text-xl font-bold text-slate-900 mt-1">EC ${avgOrderValue.toFixed(2)}</p>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[280px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '12px',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                formatter={(value: any) => [`EC $${Number(value).toFixed(2)}`, 'Revenue']}
                labelStyle={{ fontWeight: 'bold', marginBottom: '4px', color: '#94a3b8' }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#0d9488"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '12px',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '12px',
                }}
                formatter={(value: any) => [`EC $${Number(value).toFixed(2)}`, 'Revenue']}
                labelStyle={{ fontWeight: 'bold', marginBottom: '4px', color: '#94a3b8' }}
              />
              <Bar dataKey="revenue" fill="#0d9488" radius={[6, 6, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
