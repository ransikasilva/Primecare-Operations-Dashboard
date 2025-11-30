"use client";

import { useState, useEffect } from "react";
import { 
  FileText, 
  Users, 
  Building2, 
  TrendingUp, 
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Clock,
  AlertCircle,
  Globe
} from "lucide-react";
import { useOperationsDashboard, useSystemOverview, useAllOrders } from "@/hooks/useApi";

interface MetricData {
  title: string;
  value: number;
  previousValue: number;
  unit?: string;
  icon: any;
  gradient: string[];
  type: 'number' | 'percentage' | 'time';
  status: 'positive' | 'negative' | 'neutral';
  target?: number;
  description: string;
  sparklineData: number[];
}

const getMetricTemplate = () => [
  {
    title: "Total Active Orders",
    icon: FileText,
    gradient: ["#4ECDC4", "#4A9BC7"],
    type: "number" as const,
    description: "Orders nationwide in progress",
    key: "totalActiveOrders"
  },
  {
    title: "Total Main Hospitals",
    icon: Building2,
    gradient: ["#4ECDC4", "#6BB6E8"],
    type: "number" as const,
    description: "Main hospitals across all networks",
    key: "totalMainHospitals"
  },
  {
    title: "Total Riders",
    icon: Users,
    gradient: ["#4ECDC4", "#4FA5D8"],
    type: "number" as const,
    target: 300,
    description: "All riders in the system",
    key: "totalRiders"
  },
  {
    title: "Total Regional Hospitals",
    icon: Building2,
    gradient: ["#4ECDC4", "#7BBFEA"],
    type: "number" as const,
    description: "Regional hospitals across networks",
    key: "totalRegionalHospitals"
  }
];

function AnimatedCounter({ value, duration = 2000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      const easedProgress = 1 - Math.pow(1 - progress, 3); // Ease-out cubic
      setDisplayValue(Math.round(easedProgress * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <span>{displayValue}</span>;
}

function ProgressRing({ percentage, size = 60, strokeWidth = 6, gradient }: { 
  percentage: number; 
  size?: number; 
  strokeWidth?: number;
  gradient: string[];
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: gradient[0] }} />
            <stop offset="100%" style={{ stopColor: gradient[1] }} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(203, 213, 225, 0.2)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-gray-600">{percentage.toFixed(1)}%</span>
      </div>
    </div>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const sparklineId = `sparkline-${Math.random().toString(36).substr(2, 9)}`;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 80;
    const y = 30 - ((value - min) / range) * 20;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width="80" height="30" className="opacity-60">
      <defs>
        <linearGradient id={sparklineId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.3 }} />
          <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon
        points={`0,30 ${points} 80,30`}
        fill={`url(#${sparklineId})`}
      />
    </svg>
  );
}

export function MetricsCards() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const { data: systemOverviewData, loading, error } = useSystemOverview();
  const { data: allOrdersData } = useAllOrders();

  // Get real system data from overview API
  const systemData = systemOverviewData?.data?.data || systemOverviewData?.data || {};
  const allHospitalNetworks = Array.isArray((systemData as any)?.hospital_networks)
    ? (systemData as any).hospital_networks
    : [];
  const allRiders = Array.isArray((systemData as any)?.riders)
    ? (systemData as any).riders
    : [];

  // Get real orders data from backend
  const allOrders = Array.isArray(allOrdersData?.data?.orders)
    ? allOrdersData.data.orders
    : [];
  const totalActiveOrders = allOrders.filter((order: any) =>
    order.status === 'pending_rider_assignment' ||
    order.status === 'assigned' ||
    order.status === 'picked_up' ||
    order.status === 'in_transit'
  ).length;

  // Count all hospitals across all networks - use flatMap instead of reduce
  const allHospitals = Array.isArray(allHospitalNetworks)
    ? allHospitalNetworks.flatMap((network: any) =>
        Array.isArray(network?.hospitals) ? network.hospitals : []
      )
    : [];

  const totalMainHospitals = allHospitals.filter((h: any) => h.is_main_hospital === true).length;
  const totalRegionalHospitals = allHospitals.filter((h: any) => h.is_main_hospital === false).length;

  const totalRiders = allRiders.filter((rider: any) => rider.rider_status === 'approved').length;

  // Default fallback data for operations dashboard - show 0 when no real data
  const defaultMetrics = {
    active_orders: { value: 0, previous_value: 0, sparkline: [0, 0, 0, 0, 0, 0, 0] },
    main_hospitals: { value: 0, previous_value: 0, sparkline: [0, 0, 0, 0, 0, 0, 0] },
    total_riders: { value: 0, previous_value: 0, sparkline: [0, 0, 0, 0, 0, 0, 0] },
    regional_hospitals: { value: 0, previous_value: 0, sparkline: [0, 0, 0, 0, 0, 0, 0] }
  };

  // Use real data when available, fallback to defaults
  const metrics = systemData && Object.keys(systemData).length > 0 ? {
    totalActiveOrders: {
      value: totalActiveOrders,
      previous_value: Math.max(0, totalActiveOrders - 2),
      sparkline: [0, 0, 0, 0, 0, 0, totalActiveOrders]
    },
    totalMainHospitals: {
      value: totalMainHospitals,
      previous_value: Math.max(0, totalMainHospitals - 1),
      sparkline: [0, 0, 0, 0, 0, 0, totalMainHospitals]
    },
    totalRiders: {
      value: totalRiders,
      previous_value: Math.max(0, totalRiders - 3),
      sparkline: [0, 0, 0, 0, 0, 0, totalRiders]
    },
    totalRegionalHospitals: {
      value: totalRegionalHospitals,
      previous_value: Math.max(0, totalRegionalHospitals - 2),
      sparkline: [0, 0, 0, 0, 0, 0, totalRegionalHospitals]
    }
  } : {
    totalActiveOrders: defaultMetrics.active_orders,
    totalMainHospitals: defaultMetrics.main_hospitals,
    totalRiders: defaultMetrics.total_riders,
    totalRegionalHospitals: defaultMetrics.regional_hospitals
  };
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="animate-pulse bg-gray-200 rounded-3xl h-64"></div>
        ))}
      </div>
    );
  }
  
  if (error) {
    // Fallback to demo data when API fails
    console.warn('Operations Dashboard API failed, using demo data:', error);
  }

  const getChangePercentage = (current: number, previous: number) => {
    if (previous === 0) return 0;
    const percentage = ((current - previous) / previous) * 100;
    return Number(percentage.toFixed(1));
  };

  const getTrendIcon = (status: string) => {
    switch (status) {
      case 'positive': return ArrowUpRight;
      case 'negative': return ArrowDownRight;
      default: return Minus;
    }
  };

  const getTrendColor = (status: string) => {
    switch (status) {
      case 'positive': return '#10b981';
      case 'negative': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {getMetricTemplate().map((template, index) => {
        const metricData = metrics[template.key as keyof typeof metrics];
        const value = metricData?.value || 0;
        const previousValue = metricData?.previous_value || 0;
        const sparklineData = metricData?.sparkline || [0, 0, 0, 0, 0, 0, 0];
        
        const status = value > previousValue ? 'positive' : value < previousValue ? 'negative' : 'neutral';
        const Icon = template.icon;
        const TrendIcon = getTrendIcon(status);
        const changePercentage = getChangePercentage(value, previousValue);
        const isHovered = hoveredIndex === index;
        const completionPercentage = template.target ? Math.min((value / template.target) * 100, 100) : 0;

        return (
          <div
            key={index}
            className="group relative overflow-hidden rounded-3xl transition-all duration-500 ease-out cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${template.gradient[0]}15 0%, ${template.gradient[1]}10 100%)`,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: isHovered 
                ? `0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px ${template.gradient[0]}30`
                : '0 8px 32px rgba(0, 0, 0, 0.04)',
              transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)'
            }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* Background Pattern */}
            <div 
              className="absolute inset-0 opacity-5"
              style={{
                background: `radial-gradient(circle at 20% 20%, ${template.gradient[0]} 0%, transparent 50%),
                            radial-gradient(circle at 80% 80%, ${template.gradient[1]} 0%, transparent 50%)`
              }}
            />

            {/* Main Content */}
            <div className="relative p-8">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center relative overflow-hidden transition-all duration-300 group-hover:scale-110"
                  style={{
                    background: `linear-gradient(135deg, ${template.gradient[0]} 0%, ${template.gradient[1]} 100%)`,
                    boxShadow: `0 8px 32px ${template.gradient[0]}40`
                  }}
                >
                  <Icon className="w-7 h-7 text-white relative z-10" />
                  <div 
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0%, transparent 50%)'
                    }}
                  />
                </div>

                {/* Trend Indicator */}
                <div 
                  className="flex items-center space-x-1 px-3 py-1 rounded-full"
                  style={{
                    background: `${getTrendColor(status)}20`,
                    border: `1px solid ${getTrendColor(status)}30`
                  }}
                >
                  <TrendIcon 
                    className="w-4 h-4"
                    style={{ color: getTrendColor(status) }}
                  />
                  <span 
                    className="text-xs font-bold"
                    style={{ color: getTrendColor(status) }}
                  >
                    {changePercentage > 0 ? '+' : ''}{changePercentage}%
                  </span>
                </div>
              </div>

              {/* Value */}
              <div className="mb-4">
                <div className="flex items-baseline space-x-2">
                  <h3 
                    className="font-bold tracking-tight"
                    style={{
                      fontSize: '3rem',
                      lineHeight: '1',
                      background: `linear-gradient(135deg, ${template.gradient[0]} 0%, ${template.gradient[1]} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    <AnimatedCounter value={value} />
                    {(template as any).unit}
                  </h3>
                  {template.target && (
                    <div className="ml-auto">
                      <ProgressRing 
                        percentage={completionPercentage} 
                        size={50}
                        strokeWidth={4}
                        gradient={template.gradient}
                      />
                    </div>
                  )}
                </div>
                <p className="text-gray-600 font-medium mt-2" style={{ fontSize: '15px' }}>
                  {template.title}
                </p>
              </div>

              {/* Description & Sparkline */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-2">{template.description}</p>
                  <div className="flex items-center space-x-2">
                    <Globe className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">System-wide</span>
                  </div>
                </div>
                <div className="ml-4">
                  <Sparkline data={sparklineData} color={template.gradient[0]} />
                </div>
              </div>

              {/* Hover Overlay */}
              {isHovered && (
                <div 
                  className="absolute inset-0 rounded-3xl opacity-10 pointer-events-none"
                  style={{
                    background: `linear-gradient(135deg, ${template.gradient[0]} 0%, ${template.gradient[1]} 100%)`
                  }}
                />
              )}
            </div>

            {/* Target Progress Bar */}
            {template.target && (
              <div className="px-8 pb-6">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>Progress to target</span>
                  <span>{template.target}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${Math.min(completionPercentage, 100)}%`,
                      background: `linear-gradient(90deg, ${template.gradient[0]} 0%, ${template.gradient[1]} 100%)`
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}