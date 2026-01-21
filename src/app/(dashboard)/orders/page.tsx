"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { OrderDetailModal } from '@/components/modals/OrderDetailModal';
import { useAllOrders } from '@/hooks/useApi';
import {
  Package,
  Search,
  Download,
  RefreshCw,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Timer,
  User,
  MapPin,
  Building2,
  Eye,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Settings
} from 'lucide-react';

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortBy] = useState<string>('created_at');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch all orders without backend filtering for frontend processing
  const { data: ordersData, loading, error, refetch } = useAllOrders({
    limit: 1000, // Fetch a large number to get all orders
    offset: 0,
    sort_by: 'created_at',
    sort_order: 'desc'
  });

  const allOrders = ordersData?.data?.orders || [];
  const summary = ordersData?.data?.summary || {};

  // Check for URL parameter to auto-open modal
  useEffect(() => {
    const orderId = searchParams.get('id');
    if (orderId && allOrders.length > 0) {
      setSelectedOrderId(orderId);
      setShowOrderModal(true);
    }
  }, [searchParams, allOrders]);

  // Debug: Log the first order to see SLA fields
  if (allOrders.length > 0) {
    console.log('🔍 First order SLA data:', {
      order_number: allOrders[0].order_number,
      status: allOrders[0].status,
      pickup_late: (allOrders[0] as any).pickup_late,
      delivery_late: (allOrders[0] as any).delivery_late,
      full_order: allOrders[0]
    });
  }

  // Frontend filtering
  const filteredOrders = allOrders.filter(order => {
    // Status filter
    if (statusFilter !== 'all' && order.status !== statusFilter) {
      return false;
    }

    // Urgency filter
    if (urgencyFilter !== 'all' && order.urgency !== urgencyFilter) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        order.order_number.toLowerCase().includes(searchLower) ||
        order.center_name.toLowerCase().includes(searchLower) ||
        order.hospital_name.toLowerCase().includes(searchLower) ||
        (order.rider_name && order.rider_name.toLowerCase().includes(searchLower));

      if (!matchesSearch) {
        return false;
      }
    }

    // Date range filters
    if (dateRange.from) {
      const orderDate = new Date(order.created_at).toISOString().split('T')[0];
      if (orderDate < dateRange.from) {
        return false;
      }
    }

    if (dateRange.to) {
      const orderDate = new Date(order.created_at).toISOString().split('T')[0];
      if (orderDate > dateRange.to) {
        return false;
      }
    }

    return true;
  });

  // Frontend pagination
  const totalFilteredOrders = filteredOrders.length;
  const totalPages = Math.ceil(totalFilteredOrders / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const orders = filteredOrders.slice(startIndex, endIndex);

  const pagination = {
    total: totalFilteredOrders,
    total_pages: totalPages,
    current_page: currentPage,
    per_page: itemsPerPage
  };

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, urgencyFilter, searchQuery, dateRange.from, dateRange.to]);

  // Debug logging
  console.log('🔍 Orders Debug:', {
    ordersData,
    orders: orders.length,
    loading,
    error,
    pagination,
    summary
  });

  // Calculate metrics from actual orders data
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeOrders = allOrders.filter(order =>
    ['assigned', 'pickup_started', 'picked_up', 'delivery_started', 'in_transit'].includes(order.status)
  ).length;

  const pendingAssignment = allOrders.filter(order =>
    order.status === 'pending_rider_assignment'
  ).length;

  const deliveredToday = allOrders.filter(order => {
    if (order.status === 'delivered' && order.delivered_at) {
      const deliveredDate = new Date(order.delivered_at);
      deliveredDate.setHours(0, 0, 0, 0);
      return deliveredDate.getTime() === today.getTime();
    }
    return false;
  }).length;


  // Status configuration helper function
  const getStatusConfig = (status: string) => {
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
          color: 'text-teal-600',
          bg: 'bg-teal-100',
          text: 'text-teal-800',
          label: 'Picked Up'
        };
      case 'delayed':
        return {
          icon: AlertTriangle,
          color: 'text-orange-600',
          bg: 'bg-orange-100',
          text: 'text-orange-800',
          label: 'Delayed'
        };
      case 'assigned':
        return {
          icon: User,
          color: 'text-purple-600',
          bg: 'bg-purple-100',
          text: 'text-purple-800',
          label: 'Assigned'
        };
      case 'pending_rider_assignment':
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          label: 'Pending Assignment'
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
          icon: Clock,
          color: 'text-gray-600',
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          label: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        };
    }
  };

  const handleViewOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowOrderModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section - Matching Dashboard Style */}
      <div
        className="relative overflow-hidden rounded-3xl p-8"
        style={{
          background: 'linear-gradient(135deg, #4ECDC4 0%, #4A9BC7 100%)',
          boxShadow: '0 20px 40px rgba(78, 205, 196, 0.3)'
        }}
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              >
                <Package className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Orders Management</h1>
                <p className="text-white/90 text-xl mb-2">
                  System-wide order tracking and monitoring
                </p>
                <p className="text-white/80 text-lg">
                  {totalFilteredOrders} orders {totalFilteredOrders !== allOrders.length ? `(filtered from ${allOrders.length} total)` : 'across all networks'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => refetch()}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl transition-all duration-300 hover:transform hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(248,250,252,0.1) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 8px 32px rgba(255, 255, 255, 0.1)'
                }}
              >
                <RefreshCw className={`w-5 h-5 text-white ${loading ? 'animate-spin' : ''}`} />
                <span className="text-white font-semibold">Refresh</span>
              </button>
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

      {/* Summary Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Orders', value: allOrders.length || 0, color: '#4ECDC4', icon: Package },
          { label: 'Active Orders', value: activeOrders, color: '#10B981', icon: Clock },
          { label: 'Pending Assignment', value: pendingAssignment, color: '#F59E0B', icon: Timer },
          { label: 'Delivered Today', value: deliveredToday, color: '#059669', icon: CheckCircle2 }
        ].map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={index}
              className="rounded-3xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
                border: '1px solid rgba(203, 213, 225, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${stat.color}20` }}
                  >
                    <IconComponent className="w-6 h-6" style={{ color: stat.color }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Orders Table */}
      <div
        className="rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
          border: '1px solid rgba(203, 213, 225, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)'
        }}
      >
        <div className="p-8 border-b border-gray-100/60">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">All Orders</h2>
              <p className="text-gray-600">Real-time order tracking and management</p>
            </div>
            <button
              className="flex items-center space-x-2 px-6 py-3 rounded-2xl transition-all duration-300 hover:transform hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #4ECDC4 0%, #4A9BC7 100%)',
                boxShadow: '0 8px 32px rgba(78, 205, 196, 0.3)'
              }}
            >
              <span className="text-white font-semibold">Filters</span>
              <Settings className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Filters Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders, hospitals, riders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-teal-500 bg-white/60 backdrop-blur-sm"
                style={{ fontSize: '14px' }}
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-teal-500 appearance-none bg-white/60 backdrop-blur-sm"
                style={{ fontSize: '14px' }}
              >
                <option value="all">All Statuses</option>
                <option value="pending_rider_assignment">Pending Assignment</option>
                <option value="assigned">Assigned</option>
                <option value="picked_up">Picked Up</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Urgency Filter */}
            <div className="relative">
              <select
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-teal-500 appearance-none bg-white/60 backdrop-blur-sm"
                style={{ fontSize: '14px' }}
              >
                <option value="all">All Urgency</option>
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Date Range */}
            <div className="flex space-x-2">
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="flex-1 px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-teal-500 bg-white/60 backdrop-blur-sm"
                style={{ fontSize: '14px' }}
              />
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="flex-1 px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-teal-500 bg-white/60 backdrop-blur-sm"
                style={{ fontSize: '14px' }}
              />
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              <span className="ml-3 text-gray-600">Loading orders...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 font-medium">{error}</p>
                <button
                  onClick={() => refetch()}
                  className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No orders found</p>
              <p className="text-sm text-gray-400 mt-1">Orders will appear here once created</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const statusConfig = getStatusConfig(order.status);
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
                          {/* SLA Status */}
                          <div className="mt-2">
                            {(order as any).pickup_late || (order as any).delivery_late ? (
                              <div className="flex items-center space-x-2">
                                <span className="px-2 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800 border border-red-300 shadow-sm">
                                  🚨 LATE
                                </span>
                                {(order as any).pickup_late && (
                                  <span className="text-xs text-red-700 font-medium">
                                    Pickup Delay
                                  </span>
                                )}
                                {(order as any).delivery_late && (
                                  <span className="text-xs text-red-700 font-medium">
                                    {order.urgency === 'urgent' || order.urgency === 'emergency' ? 'Urgent Delivery Delay' : 'Delivery Delay'}
                                  </span>
                                )}
                              </div>
                            ) : order.status === 'delivered' ? (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 border border-green-200">
                                ✓ On Time
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className="font-bold text-sm text-gray-800">{formatTime(order.created_at)}</div>
                          <div className="text-xs text-gray-500">{formatDate(order.created_at)}</div>
                        </div>

                        <button
                          onClick={() => handleViewOrder(order.id)}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-gray-100/60 pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, totalFilteredOrders)} of {totalFilteredOrders} orders
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

      {/* Order Detail Modal */}
      <OrderDetailModal
        orderId={selectedOrderId || ''}
        isOpen={showOrderModal}
        onClose={() => {
          setShowOrderModal(false);
          setSelectedOrderId(null);
        }}
      />
    </div>
  );
}