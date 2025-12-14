"use client";

import React, { useState, useEffect } from 'react';
import { MetricsCards } from '@/components/MetricsCards';
import Link from 'next/link';
import { useSystemOverview, useSystemAlerts, useAllOrders } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { HospitalNetworkDetailModal } from '@/components/HospitalNetworkDetailModal';
import { OrderDetailModal } from '@/components/modals/OrderDetailModal';
import {
  Building2,
  Bell,
  ArrowUpRight,
  BarChart3,
  FileText,
  ChevronRight,
  ChevronDown,
  Building,
  Network,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Settings,
  Package,
  Truck,
  Clock,
  User,
  Eye,
  XCircle
} from 'lucide-react';

export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(null);
  const [selectedNetworkData, setSelectedNetworkData] = useState<any>(null);
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [expandedNetworks, setExpandedNetworks] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const { data: systemOverviewData, refetch: refetchSystemOverview } = useSystemOverview();
  const { data: alertsData, refetch: refetchAlerts } = useSystemAlerts();
  const { data: allOrdersData, refetch: refetchAllOrders } = useAllOrders();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Extract data safely
  const systemData = systemOverviewData?.data?.data || systemOverviewData?.data || {};
  const allHospitalNetworks = Array.isArray((systemData as any)?.hospital_networks)
    ? (systemData as any).hospital_networks : [];
  const allRiders = Array.isArray((systemData as any)?.riders)
    ? (systemData as any).riders : [];
  const allOrders = Array.isArray(allOrdersData?.data?.orders)
    ? allOrdersData.data.orders : [];

  // Process main hospitals using flatMap (not reduce!)
  const allMainHospitals = allHospitalNetworks.flatMap((network: any) => {
    const networkHospitals = Array.isArray(network?.hospitals) ? network.hospitals : [];
    const mainHospitals = networkHospitals.filter((h: any) => h.is_main_hospital === true);

    return mainHospitals.map((hospital: any) => {
      const regionalHospitals = networkHospitals.filter((h: any) => !h.is_main_hospital);
      const hospitalOrders = allOrders.filter((order: any) =>
        order.hospital_id === hospital.id &&
        ['pending_rider_assignment', 'assigned', 'picked_up', 'in_transit'].includes(order.status)
      );
      const hospitalRiders = allRiders.filter((rider: any) =>
        rider.hospital_affiliation?.hospital_id === hospital.id && rider.rider_status === 'approved'
      );

      return {
        id: hospital.id,
        name: hospital.name,
        network_name: network.network_name,
        network_id: network.id,
        city: hospital.city,
        province: hospital.province,
        status: hospital.status,
        activeOrders: hospitalOrders.length,
        ridersOnline: hospitalRiders.length,
        regionalHospitals: regionalHospitals.length,
        coordinates: {
          lat: hospital.coordinates_lat,
          lng: hospital.coordinates_lng
        },
        regional_hospitals_detail: regionalHospitals,
        network_admin: network.admin_name,
        network_admin_email: network.admin_email,
        network_admin_phone: network.admin_phone,
        riders_detail: hospitalRiders
      };
    });
  });

  // Pagination
  const totalPages = Math.ceil(allMainHospitals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHospitals = allMainHospitals.slice(startIndex, startIndex + itemsPerPage);

  // System alerts
  const systemAlerts = Array.isArray(alertsData?.data) ? alertsData.data : [];

  // Business metrics for header
  const businessMetrics = {
    hospitalNetworks: allHospitalNetworks.length,
    totalMainHospitals: allMainHospitals.length,
    totalRiders: allRiders.filter((rider: any) => rider.rider_status === 'approved').length,
    systemHealth: 98
  };

  // Hospital status configuration helper function
  const getHospitalStatusConfig = (status: string) => {
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

  // Order status configuration helper function
  const getOrderStatusConfig = (status: string) => {
    switch (status) {
      case 'delivered':
        return {
          icon: CheckCircle2,
          color: 'text-green-600',
          bg: 'bg-green-100',
          text: 'text-green-800',
          label: 'Delivered'
        };
      case 'in_transit':
        return {
          icon: Truck,
          color: 'text-teal-600',
          bg: 'bg-teal-100',
          text: 'text-teal-800',
          label: 'In Transit'
        };
      case 'picked_up':
        return {
          icon: Package,
          color: 'text-purple-600',
          bg: 'bg-purple-100',
          text: 'text-purple-800',
          label: 'Picked Up'
        };
      case 'assigned':
        return {
          icon: User,
          color: 'text-teal-600',
          bg: 'bg-teal-100',
          text: 'text-teal-800',
          label: 'Assigned'
        };
      case 'pending_rider_assignment':
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          label: 'Pending'
        };
      case 'delayed':
        return {
          icon: AlertTriangle,
          color: 'text-orange-600',
          bg: 'bg-orange-100',
          text: 'text-orange-800',
          label: 'Delayed'
        };
      case 'cancelled':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bg: 'bg-red-100',
          text: 'text-red-800',
          label: 'Cancelled'
        };
      default:
        return {
          icon: Package,
          color: 'text-gray-600',
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          label: status || 'Unknown'
        };
    }
  };

  // Toggle network expansion
  const toggleNetworkExpansion = (networkId: string) => {
    setExpandedNetworks(prev =>
      prev.includes(networkId)
        ? prev.filter(id => id !== networkId)
        : [...prev, networkId]
    );
  };

  const handleRefreshAll = () => {
    refetchSystemOverview();
    refetchAlerts();
    refetchAllOrders();
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Welcome Section with Gradient */}
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
                  onClick={handleRefreshAll}
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

        {/* Background pattern */}
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

      {/* Hospital Networks Section with Styled Cards */}
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
                              background: (hospital.status === 'active' || hospital.status === 'approved') ? getHospitalStatusConfig('Excellent').bg : getHospitalStatusConfig('Watch').bg,
                              borderColor: (hospital.status === 'active' || hospital.status === 'approved') ? getHospitalStatusConfig('Excellent').border : getHospitalStatusConfig('Watch').border
                            }}
                          >
                            <span
                              className="text-sm font-bold"
                              style={{ color: (hospital.status === 'active' || hospital.status === 'approved') ? getHospitalStatusConfig('Excellent').color : getHospitalStatusConfig('Watch').color }}
                            >
                              {(hospital.status === 'active' || hospital.status === 'approved') ? 'Active' : 'Inactive'}
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

                    {/* Expanded Regional Hospitals */}
                    {isExpanded && hospital.regional_hospitals_detail && hospital.regional_hospitals_detail.length > 0 && (
                      <div className="ml-8 space-y-2">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Regional Hospitals ({hospital.regional_hospitals_detail.length})
                        </p>
                        {hospital.regional_hospitals_detail.slice(0, 5).map((regional: any, idx: number) => (
                          <div key={idx} className="flex items-center space-x-2 text-sm text-gray-600">
                            <Building className="w-4 h-4 text-green-500" />
                            <span>{regional.name}</span>
                            <span className="text-gray-400">•</span>
                            <span>{regional.city}</span>
                          </div>
                        ))}
                        {hospital.regional_hospitals_detail.length > 5 && (
                          <p className="text-xs text-gray-500 pl-6">
                            +{hospital.regional_hospitals_detail.length - 5} more
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-6">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
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
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Recent Orders</h2>
              <p className="text-gray-600">Latest order activity across all networks</p>
            </div>
            <Link href="/orders">
              <button
                className="flex items-center space-x-2 px-6 py-3 rounded-2xl transition-all duration-300 hover:transform hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #4ECDC4 0%, #4A9BC7 100%)',
                  boxShadow: '0 8px 32px rgba(78, 205, 196, 0.3)'
                }}
              >
                <span className="text-white font-semibold">View All</span>
                <ArrowUpRight className="w-4 h-4 text-white" />
              </button>
            </Link>
          </div>
        </div>

        <div className="p-8">
          {allOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No orders found</p>
              <p className="text-sm text-gray-400 mt-1">Orders will appear here once created</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allOrders.slice(0, 5).map((order: any) => {
                const statusConfig = getOrderStatusConfig(order.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <div
                    key={order.id}
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
                          <Package className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-bold text-gray-800 text-lg">{order.order_number}</h3>
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig.label}
                            </div>
                            {order.urgency === 'urgent' && (
                              <div className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-medium">
                                🟠 Urgent
                              </div>
                            )}
                            {order.urgency === 'emergency' && (
                              <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-medium">
                                🔴 Emergency
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-6 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Building2 className="w-4 h-4" />
                              <span>{order.center_name}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{order.hospital_name}</span>
                            </div>
                            {order.rider_name && (
                              <div className="flex items-center space-x-1">
                                <User className="w-4 h-4" />
                                <span>{order.rider_name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className="font-bold text-sm text-gray-800">
                            {new Date(order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedOrderId(order.id);
                            setShowOrderModal(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 hover:transform hover:scale-105"
                          style={{
                            background: 'linear-gradient(135deg, #4ECDC4 0%, #4A9BC7 100%)',
                            boxShadow: '0 8px 32px rgba(78, 205, 196, 0.3)'
                          }}
                        >
                          <Eye className="w-4 h-4 text-white" />
                          <span className="text-white font-semibold">View</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Network Modal */}
      {showNetworkModal && selectedNetworkData && (
        <HospitalNetworkDetailModal
          isOpen={showNetworkModal}
          onClose={() => {
            setShowNetworkModal(false);
            setSelectedNetworkData(null);
          }}
          networkId={selectedNetworkId || ''}
          networkData={selectedNetworkData}
        />
      )}

      {/* Order Detail Modal */}
      {showOrderModal && selectedOrderId && (
        <OrderDetailModal
          isOpen={showOrderModal}
          onClose={() => {
            setShowOrderModal(false);
            setSelectedOrderId(null);
          }}
          orderId={selectedOrderId}
        />
      )}
    </div>
  );
}
