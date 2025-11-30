"use client";

import React, { useState, useEffect } from 'react';
import { MetricsCards } from '@/components/MetricsCards';
import Link from 'next/link';
import { useOperationsDashboard, useHospitalNetworks, useSystemAlerts, useSystemOverview, useAllOrders } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { HospitalNetworkDetailModal } from '@/components/HospitalNetworkDetailModal';
import { QRCodeOverview } from '@/components/QRCodeOverview';
// import { useOperationsDashboardRealtime } from '@/hooks/useRealtime';
import {
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Bell,
  Zap,
  Settings,
  ArrowUpRight,
  BarChart3,
  FileText,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Building,
  Network,
  RefreshCw
} from 'lucide-react';

export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(null);
  const [selectedNetworkData, setSelectedNetworkData] = useState<any>(null);
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [expandedNetworks, setExpandedNetworks] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const { refetch: refetchDashboard } = useOperationsDashboard();
  const { refetch: refetchNetworks } = useHospitalNetworks();
  const { data: alertsData, refetch: refetchAlerts } = useSystemAlerts();
  const { data: systemOverviewData, refetch: refetchSystemOverview } = useSystemOverview();
  const { data: allOrdersData, refetch: refetchAllOrders } = useAllOrders();
  // const realtimeData = useOperationsDashboardRealtime(); // Disabled until backend socket support

  // Debug auth state
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    console.log('🔍 Auth State Changed:', {
      isAuthenticated,
      authLoading,
      timestamp: new Date().toISOString()
    });
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    console.log('📊 Dashboard component mounted');
  }, []);

  useEffect(() => {
    console.log('📥 API Data Status:', {
      systemOverview: systemOverviewData ? 'has data' : 'null',
      orders: allOrdersData ? 'has data' : 'null',
      alerts: alertsData ? 'has data' : 'null'
    });
    console.log('🔍 Raw Data Values:', {
      systemOverviewData,
      allOrdersData,
      alertsData
    });
  }, [systemOverviewData, allOrdersData, alertsData]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Extract all raw data FIRST before any processing
  const systemData = systemOverviewData?.data?.data || systemOverviewData?.data || {};
  const rawHospitalNetworks = (systemData as any)?.hospital_networks;
  const rawRiders = (systemData as any)?.riders;
  const rawOrders = allOrdersData?.data?.orders;

  // Validate and convert to arrays
  const allHospitalNetworks = Array.isArray(rawHospitalNetworks) ? rawHospitalNetworks : [];
  const allRiders = Array.isArray(rawRiders) ? rawRiders : [];
  const allOrders = Array.isArray(rawOrders) ? rawOrders : [];

  // Process main hospitals - using flatMap instead of reduce to avoid TDZ issues
  const allMainHospitals = (() => {
    if (!Array.isArray(allHospitalNetworks) || allHospitalNetworks.length === 0) return [];
    if (!Array.isArray(allOrders)) return [];
    if (!Array.isArray(allRiders)) return [];

    return allHospitalNetworks.flatMap((network: any) => {
      const networkHospitals = Array.isArray(network?.hospitals) ? network.hospitals : [];
      const mainHospitals = networkHospitals.filter((h: any) => h.is_main_hospital === true);

      // Add network info to each main hospital
      return mainHospitals.map((hospital: any) => {
        // Get regional hospitals for this network (since they're linked by network, not main hospital)
        const regionalHospitals = networkHospitals.filter((h: any) =>
          h.is_main_hospital === false
        );

        // Calculate real metrics from backend data
        const hospitalOrders = allOrders.filter((order: any) =>
          order.hospital_id === hospital.id &&
          (order.status === 'pending_rider_assignment' ||
           order.status === 'assigned' ||
           order.status === 'picked_up' ||
           order.status === 'in_transit')
        );

        // Get riders affiliated with this hospital
        const hospitalRiders = allRiders.filter((rider: any) =>
          rider.hospital_affiliation?.hospital_id === hospital.id && rider.rider_status === 'approved'
        );
        const ridersCount = hospitalRiders.length;

      return {
        id: hospital.id,
        name: hospital.name,
        network_name: network.network_name,
        network_id: network.id,
        city: hospital.city,
        province: hospital.province,
        status: hospital.status,
        activeOrders: hospitalOrders.length, // Real active orders from backend
        ridersOnline: ridersCount, // Real riders count from backend
        regionalHospitals: regionalHospitals.length,
        coordinates: {
          lat: hospital.coordinates_lat,
          lng: hospital.coordinates_lng
        },
        created_at: hospital.created_at,
        contact_phone: hospital.contact_phone || 'Not specified',
        email: hospital.email || 'Not specified',
        regional_hospitals_detail: regionalHospitals,
        network_admin: network.admin_name,
        network_admin_email: network.admin_email,
        network_admin_phone: network.admin_phone,
        riders_detail: hospitalRiders
      };
    });
    });
  })(); // IIFE - immediately invoked function expression

  // Use system overview data for header metrics
  const businessMetrics = {
    hospitalNetworks: Array.isArray(allHospitalNetworks) ? allHospitalNetworks.length : 0,
    totalMainHospitals: Array.isArray(allMainHospitals) ? allMainHospitals.length : 0,
    totalRiders: Array.isArray(allRiders) ? allRiders.filter((rider: any) => rider.rider_status === 'active').length : 0,
    systemHealth: 88 // Fixed system health percentage
  };

  // Status configuration helper function
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Excellent':
        return {
          text: 'Excellent',
          color: '#059669',
          bg: 'rgba(5, 150, 105, 0.1)',
          border: '#059669',
          pulse: false
        };
      case 'Good':
        return {
          text: 'Good',
          color: '#16a34a',
          bg: 'rgba(22, 163, 74, 0.1)',
          border: '#16a34a',
          pulse: false
        };
      case 'Watch':
        return {
          text: 'Watch',
          color: '#d97706',
          bg: 'rgba(217, 119, 6, 0.1)',
          border: '#d97706',
          pulse: true
        };
      case 'Risk':
        return {
          text: 'Risk',
          color: '#dc2626',
          bg: 'rgba(220, 38, 38, 0.1)',
          border: '#dc2626',
          pulse: true
        };
      default:
        return {
          text: status || 'Unknown',
          color: '#6b7280',
          bg: 'rgba(107, 114, 128, 0.1)',
          border: '#6b7280',
          pulse: false
        };
    }
  };

  // Alert configuration helper function
  const getAlertConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          icon: AlertTriangle,
          color: '#dc2626',
          bg: 'rgba(220, 38, 38, 0.1)',
          border: '#dc2626'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          color: '#d97706',
          bg: 'rgba(217, 119, 6, 0.1)',
          border: '#d97706'
        };
      case 'info':
        return {
          icon: Bell,
          color: '#2563eb',
          bg: 'rgba(37, 99, 235, 0.1)',
          border: '#2563eb'
        };
      default:
        return {
          icon: Bell,
          color: '#6b7280',
          bg: 'rgba(107, 114, 128, 0.1)',
          border: '#6b7280'
        };
    }
  };

  // Pagination logic for Main Hospitals
  const totalHospitals = allMainHospitals.length;
  const totalPages = Math.ceil(totalHospitals / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedHospitals = allMainHospitals.slice(startIndex, endIndex);

  // System alerts from operations perspective - using real backend data only
  const alertsArray = Array.isArray(alertsData?.data) ? alertsData.data : [];
  const systemAlerts = alertsArray;

  // Quick actions for operations dashboard
  const quickActions = [
    {
      icon: Building2,
      title: 'Network Management',
      description: 'Manage hospital networks',
      link: '/configuration',
      gradient: ['#4ECDC4', '#4A9BC7'],
      count: '12 Networks'
    },
    {
      icon: CheckCircle2,
      title: 'Pending Approvals',
      description: 'Review and approve',
      link: '/approvals',
      gradient: ['#4ECDC4', '#6BB6E8'],
      count: '16 Pending'
    },
    {
      icon: BarChart3,
      title: 'System Analytics',
      description: 'Performance insights',
      link: '/analytics',
      gradient: ['#4ECDC4', '#4FA5D8'],
      count: '94.8% SLA'
    },
    {
      icon: FileText,
      title: 'Billing Management',
      description: 'Revenue & subscriptions',
      link: '/billing',
      gradient: ['#4ECDC4', '#7BBFEA'],
      count: 'Rs. 2.4M'
    }
  ];

  // Toggle network expansion
  const toggleNetworkExpansion = (networkId: string) => {
    setExpandedNetworks(prev =>
      prev.includes(networkId)
        ? prev.filter(id => id !== networkId)
        : [...prev, networkId]
    );
  };

  // Refresh all data
  const handleRefreshData = async () => {
    await Promise.all([
      refetchDashboard(),
      refetchNetworks(),
      refetchAlerts(),
      refetchSystemOverview(),
      refetchAllOrders()
    ]);
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section - Matching Hospital Dashboard */}
      <div 
        className="relative overflow-hidden rounded-3xl p-8"
        style={{
          background: 'linear-gradient(135deg, #4ECDC4 0%, #4A9BC7 100%)',
          boxShadow: '0 20px 40px rgba(78, 205, 196, 0.3)'
        }}
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 18 ? 'Afternoon' : 'Evening'}! 👋
              </h1>
              <p className="text-white/90 text-xl mb-4">
                TransFleet Operations Center
              </p>
              <p className="text-white/80 text-lg">
                System-wide management across {businessMetrics.hospitalNetworks} networks
              </p>
            </div>
            <div className="text-right">
              <div className="text-white/90 mb-2">
                <div className="text-2xl font-bold">
                  {currentTime.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <div className="text-sm">
                  {currentTime.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
              <div className="flex items-center justify-end space-x-4 text-white/80">
                <button
                  onClick={handleRefreshData}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 hover:bg-white/10 hover:transform hover:scale-105"
                  title="Refresh all data"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="text-sm font-medium">Refresh</span>
                </button>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-sm">All systems operational</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Simple background pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            background: `
              radial-gradient(circle at 20% 20%, rgba(255,255,255,0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(255,255,255,0.2) 0%, transparent 50%)
            `
          }}
        />
      </div>

      {/* Metrics Cards */}
      <MetricsCards />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Hospitals Status - Takes 2 columns */}
        <div className="xl:col-span-2">
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
              border: '1px solid rgba(203, 213, 225, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div className="p-8 border-b border-gray-100/60">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Main Hospitals Status</h2>
                  <p className="text-gray-600">Real-time main hospital performance monitoring</p>
                </div>
                <Link href="/hospitals">
                  <button
                    className="flex items-center space-x-2 px-6 py-3 rounded-2xl transition-all duration-300 hover:transform hover:scale-105"
                    style={{
                      background: 'linear-gradient(135deg, #4ECDC4 0%, #4A9BC7 100%)',
                      boxShadow: '0 8px 32px rgba(78, 205, 196, 0.3)'
                    }}
                  >
                    <span className="text-white font-semibold">Manage</span>
                    <Settings className="w-4 h-4 text-white" />
                  </button>
                </Link>
              </div>
            </div>

            <div className="p-8">
              <div className="space-y-4">
                {paginatedHospitals.length === 0 ? (
                  <div className="text-center py-8">
                    <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No main hospitals found</p>
                    <p className="text-sm text-gray-400 mt-1">Main hospitals will appear here once registered</p>
                  </div>
                ) : (
                  paginatedHospitals.map((hospital: any, index: number) => {
                    const isExpanded = expandedNetworks.includes(hospital.id || index.toString());
                    const hospitalId = hospital.id || index.toString();
                    
                    return (
                      <div key={index} className="space-y-3">
                        {/* Main Hospital Card */}
                        <div
                          className="group p-6 rounded-2xl transition-all duration-300 hover:transform hover:scale-[1.02]"
                          style={{
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.8) 100%)',
                            border: '1px solid rgba(203, 213, 225, 0.3)',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)'
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div
                                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                style={{
                                  background: 'linear-gradient(135deg, #4ECDC4 0%, #4A9BC7 100%)'
                                }}
                              >
                                <Building className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <div className="flex items-center gap-3 mb-1">
                                  <h3 className="font-bold text-gray-800 text-lg">{hospital.name}</h3>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleNetworkExpansion(hospitalId);
                                    }}
                                    className="flex items-center gap-1 px-3 py-1 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors text-sm font-medium"
                                  >
                                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    Details
                                  </button>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="flex items-center space-x-1 text-gray-600">
                                    <MapPin className="w-4 h-4" />
                                    <span className="text-sm">{hospital.city}, {hospital.province}</span>
                                  </div>
                                  <div className="flex items-center space-x-1 text-gray-600">
                                    <Network className="w-4 h-4" />
                                    <span className="text-sm">{hospital.network_name}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-6">
                              <div className="text-center">
                                <div className="font-bold text-2xl text-gray-800">{hospital.activeOrders}</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider">Active Orders</div>
                              </div>

                              <div className="text-center">
                                <div className="font-bold text-2xl text-gray-800">{hospital.ridersOnline}</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider">Riders</div>
                              </div>

                              <div className="text-center">
                                <div className="font-bold text-2xl text-gray-800">{hospital.regionalHospitals}</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider">Regional</div>
                              </div>

                              <div
                                className="flex items-center space-x-2 px-4 py-2 rounded-full border"
                                style={{
                                  background: hospital.status === 'active' ? getStatusConfig('Excellent').bg : getStatusConfig('Watch').bg,
                                  borderColor: hospital.status === 'active' ? getStatusConfig('Excellent').border : getStatusConfig('Watch').border
                                }}
                              >
                                <span
                                  className="text-sm font-bold"
                                  style={{ color: hospital.status === 'active' ? getStatusConfig('Excellent').color : getStatusConfig('Watch').color }}
                                >
                                  {hospital.status === 'active' ? 'Active' : 'Inactive'}
                                </span>
                              </div>

                              <button
                                onClick={() => {
                                  setSelectedNetworkId(hospitalId);
                                  setSelectedNetworkData(hospital);
                                  setShowNetworkModal(true);
                                }}
                                className="p-2 hover:bg-teal-50 rounded-xl transition-colors"
                                title="View Hospital Details"
                              >
                                <ArrowUpRight className="w-5 h-5 text-gray-500" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Hospital Details */}
                        {isExpanded && (
                          <div className="ml-8 space-y-3">
                            {/* Hospital Details */}
                            <div
                              className="p-4 rounded-xl transition-all duration-200 hover:bg-teal-50"
                              style={{
                                background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.05) 0%, rgba(74, 155, 199, 0.03) 100%)',
                                border: '1px solid rgba(78, 205, 196, 0.15)'
                              }}
                            >
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-500 block mb-1">Hospital Email:</span>
                                  <div className="font-medium text-gray-800">{hospital.email || 'Not specified'}</div>
                                </div>
                                <div>
                                  <span className="text-gray-500 block mb-1">Contact Phone:</span>
                                  <div className="font-medium text-gray-800">{hospital.contact_phone || 'Not specified'}</div>
                                </div>
                                <div>
                                  <span className="text-gray-500 block mb-1">Network Admin:</span>
                                  <div className="font-medium text-gray-800">{hospital.network_admin || 'Not specified'}</div>
                                </div>
                              </div>
                            </div>

                            {/* Regional Hospitals */}
                            {hospital.regional_hospitals_detail && hospital.regional_hospitals_detail.length > 0 && (
                              <div
                                className="p-4 rounded-xl"
                                style={{
                                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.03) 100%)',
                                  border: '1px solid rgba(16, 185, 129, 0.15)'
                                }}
                              >
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">Regional Hospitals ({Array.isArray(hospital.regional_hospitals_detail) ? hospital.regional_hospitals_detail.length : 0})</h4>
                                <div className="grid grid-cols-2 gap-2">
                                  {Array.isArray(hospital.regional_hospitals_detail) && hospital.regional_hospitals_detail.slice(0, 6).map((regional: any, idx: number) => (
                                    <div key={idx} className="flex items-center space-x-2 text-sm">
                                      <Building2 className="w-3 h-3 text-green-600" />
                                      <span className="text-gray-700">{regional.name}</span>
                                      <span className="text-xs text-gray-500">({regional.city})</span>
                                    </div>
                                  ))}
                                  {Array.isArray(hospital.regional_hospitals_detail) && hospital.regional_hospitals_detail.length > 6 && (
                                    <div className="text-xs text-gray-500 col-span-2">
                                      +{hospital.regional_hospitals_detail.length - 6} more regional hospitals
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
              
              {/* Pagination Controls */}
              {totalHospitals > itemsPerPage && (
                <div className="px-8 pb-8">
                  <div className="flex items-center justify-between border-t border-gray-100/60 pt-6">
                    <div className="text-sm text-gray-600">
                      Showing {startIndex + 1} to {Math.min(endIndex, totalHospitals)} of {totalHospitals} hospitals
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-2 px-4 py-2 rounded-2xl transition-all duration-300 hover:transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
                        style={{
                          background: currentPage === 1 
                            ? 'rgba(255,255,255,0.5)' 
                            : 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.8) 100%)',
                          border: '1px solid rgba(203, 213, 225, 0.3)',
                          boxShadow: currentPage === 1 ? 'none' : '0 4px 16px rgba(0, 0, 0, 0.02)'
                        }}
                      >
                        <ChevronLeft className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Previous</span>
                      </button>
                      
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 rounded-xl transition-all duration-300 hover:transform hover:scale-105 ${
                              currentPage === page
                                ? 'text-white font-semibold'
                                : 'text-gray-600 hover:bg-gray-100 font-medium'
                            }`}
                            style={currentPage === page ? {
                              background: 'linear-gradient(135deg, #4ECDC4 0%, #4A9BC7 100%)',
                              boxShadow: '0 8px 32px rgba(78, 205, 196, 0.3)'
                            } : {}}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-2 px-4 py-2 rounded-2xl transition-all duration-300 hover:transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
                        style={{
                          background: currentPage === totalPages 
                            ? 'rgba(255,255,255,0.5)' 
                            : 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.8) 100%)',
                          border: '1px solid rgba(203, 213, 225, 0.3)',
                          boxShadow: currentPage === totalPages ? 'none' : '0 4px 16px rgba(0, 0, 0, 0.02)'
                        }}
                      >
                        <span className="text-sm font-medium text-gray-700">Next</span>
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - System Alerts & Quick Actions */}
        <div className="space-y-8">
          {/* System Alerts */}
          <div 
            className="rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
              border: '1px solid rgba(203, 213, 225, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div className="p-6 border-b border-gray-100/60">
              <div className="flex items-center space-x-3">
                <Bell className="w-6 h-6 text-gray-700" />
                <h2 className="text-xl font-bold text-gray-800">System Alerts</h2>
                <div 
                  className="w-2 h-2 rounded-full bg-red-500 animate-pulse"
                  title="Live updates active"
                />
              </div>
            </div>

            <div className="p-6 space-y-4">
              {systemAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No active alerts</p>
                  <p className="text-sm text-gray-400 mt-1">System alerts will appear here</p>
                </div>
              ) : (
                systemAlerts.map((alert, index) => {
                  const alertConfig = getAlertConfig(alert.severity || 'info');
                  return (
                    <div 
                      key={index}
                      className="group p-4 rounded-2xl transition-all duration-300 hover:transform hover:scale-[1.02]"
                      style={{
                        background: alertConfig.bg,
                        border: `1px solid ${alertConfig.border}30`
                      }}
                    >
                      <div className="flex items-start space-x-4">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: alertConfig.color }}
                        >
                          <AlertTriangle className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 mb-1">{alert.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">{alert.time}</span>
                            <Link href={alert.actionLink || '/sla'}>
                              <button 
                                className="text-xs font-semibold px-3 py-1 rounded-full transition-all duration-200 hover:opacity-80"
                                style={{
                                  backgroundColor: alertConfig.color,
                                  color: 'white'
                                }}
                              >
                                {alert.actionText || 'View'}
                              </button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div 
            className="rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
              border: '1px solid rgba(203, 213, 225, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div className="p-6 border-b border-gray-100/60">
              <div className="flex items-center space-x-3">
                <Zap className="w-6 h-6 text-gray-700" />
                <h2 className="text-xl font-bold text-gray-800">Quick Actions</h2>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link key={index} href={action.link}>
                    <div 
                      className="group p-4 rounded-2xl transition-all duration-300 hover:transform hover:scale-[1.02] cursor-pointer"
                      style={{
                        background: `linear-gradient(135deg, ${action.gradient[0]}15 0%, ${action.gradient[1]}10 100%)`,
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}
                    >
                      <div className="flex items-center space-x-4">
                        <div 
                          className="w-12 h-12 rounded-2xl flex items-center justify-center"
                          style={{
                            background: `linear-gradient(135deg, ${action.gradient[0]} 0%, ${action.gradient[1]} 100%)`
                          }}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-800">{action.title}</h4>
                            <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" />
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{action.description}</p>
                          <div className="flex items-center justify-between">
                            <span 
                              className="text-xs font-bold"
                              style={{ color: action.gradient[0] }}
                            >
                              {action.count}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Tracking Overview */}
      <div className="mt-8">
        <QRCodeOverview />
      </div>

      {/* Hospital Network Detail Modal */}
      <HospitalNetworkDetailModal
        isOpen={showNetworkModal}
        onClose={() => {
          setShowNetworkModal(false);
          setSelectedNetworkId(null);
          setSelectedNetworkData(null);
        }}
        networkId={selectedNetworkId}
        networkData={selectedNetworkData}
      />
    </div>
  );
}