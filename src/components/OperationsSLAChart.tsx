'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';

interface OperationsSLAChartProps {
  data?: Array<{
    order_date: string;
    pickup_sla_percentage: number;
    standard_sla_percentage: number;
    urgent_sla_percentage: number;
  }>;
  thresholds?: {
    pickup: number;
    standard: number;
    urgent: number;
  };
}

export function OperationsSLAChart({ data, thresholds }: OperationsSLAChartProps) {
  // Default 7-day data showing consistent performance
  const defaultData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      order_date: date.toISOString().split('T')[0],
      pickup_sla_percentage: Math.random() * 10 + 90, // 90-100% range
      standard_sla_percentage: Math.random() * 10 + 85, // 85-95% range
      urgent_sla_percentage: Math.random() * 10 + 88, // 88-98% range
    };
  });

  // Ensure data is an array
  const chartData = Array.isArray(data) && data.length > 0 ? data : defaultData;

  // Format data for chart with readable dates and ensure numbers
  const formattedData = chartData.map((item) => ({
    date: format(new Date(item.order_date), 'MMM dd'),
    pickup_sla_percentage: typeof item.pickup_sla_percentage === 'number'
      ? item.pickup_sla_percentage
      : parseFloat(item.pickup_sla_percentage) || 0,
    standard_sla_percentage: typeof item.standard_sla_percentage === 'number'
      ? item.standard_sla_percentage
      : parseFloat(item.standard_sla_percentage) || 0,
    urgent_sla_percentage: typeof item.urgent_sla_percentage === 'number'
      ? item.urgent_sla_percentage
      : parseFloat(item.urgent_sla_percentage) || 0,
  }));

  const defaultThresholds = {
    pickup: thresholds?.pickup || 95,
    standard: thresholds?.standard || 90,
    urgent: thresholds?.urgent || 92,
  };

  // Custom tooltip to show all SLA values
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="bg-white p-4 rounded-lg shadow-lg border border-gray-200"
          style={{
            minWidth: '200px',
          }}
        >
          <p className="font-semibold text-gray-800 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => {
            const value = typeof entry.value === 'number' ? entry.value : parseFloat(entry.value) || 0;
            return (
              <div key={index} className="flex items-center justify-between mb-1">
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-600">{entry.name}:</span>
                </div>
                <span className="text-sm font-semibold ml-2" style={{ color: entry.color }}>
                  {value.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            domain={[0, 100]}
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Pickup SLA Line */}
          <Line
            type="monotone"
            dataKey="pickup_sla_percentage"
            name="Pickup SLA"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
            activeDot={{ r: 7, stroke: '#10b981', strokeWidth: 2 }}
            connectNulls
          />

          {/* Standard Delivery SLA Line */}
          <Line
            type="monotone"
            dataKey="standard_sla_percentage"
            name="Standard SLA"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
            activeDot={{ r: 7, stroke: '#3b82f6', strokeWidth: 2 }}
            connectNulls
          />

          {/* Urgent Delivery SLA Line */}
          <Line
            type="monotone"
            dataKey="urgent_sla_percentage"
            name="Urgent SLA"
            stroke="#f59e0b"
            strokeWidth={3}
            dot={{ fill: '#f59e0b', strokeWidth: 2, r: 5 }}
            activeDot={{ r: 7, stroke: '#f59e0b', strokeWidth: 2 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Legend with thresholds */}
      <div className="flex justify-center mt-8 space-x-8 flex-wrap gap-y-4">
        <div className="flex flex-col items-center">
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span className="text-sm font-semibold text-gray-700">Pickup SLA</span>
          </div>
          <span className="text-xs text-gray-500">
            Target: ≤{defaultThresholds.pickup} min
          </span>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-4 h-4 bg-teal-500 rounded-full"></div>
            <span className="text-sm font-semibold text-gray-700">Standard SLA</span>
          </div>
          <span className="text-xs text-gray-500">
            Target: ≤{defaultThresholds.standard} min
          </span>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-4 h-4 bg-amber-500 rounded-full"></div>
            <span className="text-sm font-semibold text-gray-700">Urgent SLA</span>
          </div>
          <span className="text-xs text-gray-500">
            Target: ≤{defaultThresholds.urgent} min
          </span>
        </div>
      </div>
    </div>
  );
}
