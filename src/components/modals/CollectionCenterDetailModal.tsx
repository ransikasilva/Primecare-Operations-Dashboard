"use client";

import {
  X,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Settings,
  Shield,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Zap,
  Award,
  Power,
  FileText,
  User,
  Package,
  Truck,
  Timer
} from "lucide-react";

import { useState, useEffect } from "react";
import { operationsApi } from "@/lib/api";

interface CollectionCenter {
  id: string;
  center_name: string;
  center_type: string;
  center_status: string;
  email: string;
  phone: string;
  created_at: string;
}

interface CenterFeature {
  feature_id: string;
  feature_name: string;
  description: string;
  feature_type: 'core' | 'premium' | 'enterprise';
  requires_approval: boolean;
  enabled: boolean;
  enabled_at: string | null;
  enabled_by: string | null;
  enabled_by_email: string | null;
  requested_at: string | null;
  justification: string | null;
  status: 'not_requested' | 'requested' | 'approved' | 'rejected' | 'disabled';
}

interface CenterOrder {
  id: string;
  order_number: string;
  hospital_name: string;
  rider_name?: string;
  sample_type: string;
  sample_quantity: number;
  urgency: string;
  status: string;
  created_at: string;
  updated_at: string;
  pickup_time?: string;
  delivery_time?: string;
  estimated_delivery_time?: string;
}

interface CollectionCenterDetailModalProps {
  center: CollectionCenter | null;
  isOpen: boolean;
  onClose: () => void;
  onFeatureToggle?: (centerId: string, featureId: string, enabled: boolean) => Promise<void>;
  onStatusChange?: (centerId: string, newStatus: string) => Promise<void>;
  isProcessing?: boolean;
}

export function CollectionCenterDetailModal({
  center,
  isOpen,
  onClose,
  onFeatureToggle,
  onStatusChange,
  isProcessing = false
}: CollectionCenterDetailModalProps) {
  const [processingFeature, setProcessingFeature] = useState<string | null>(null);
  const [features, setFeatures] = useState<CenterFeature[]>([]);
  const [orders, setOrders] = useState<CenterOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);

  // Fetch features when modal opens with a center
  useEffect(() => {
    const fetchFeatures = async () => {
      if (!center?.id || !isOpen) return;

      setLoading(true);
      setError(null);
      try {
        const response = await operationsApi.getCollectionCenterFeatures(center.id);
        if (response.success && response.data) {
          setFeatures(response.data.features || []);
        }
      } catch (error) {
        console.error('Failed to fetch center features:', error);
        setError('Failed to load center features');
        setFeatures([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatures();
  }, [center?.id, isOpen]);

  // Fetch orders when modal opens with a center or filters change
  const fetchOrders = async () => {
    if (!center?.id || !isOpen) return;

    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const params: any = { limit: 50 };

      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;

      const response = await operationsApi.getCollectionCenterOrders(center.id, params);
      if (response.success && response.data) {
        // Remove duplicates based on order ID
        const uniqueOrders = (response.data.orders || []).filter((order: any, index: number, self: any[]) =>
          index === self.findIndex((o: any) => o.id === order.id)
        );
        setOrders(uniqueOrders);
      }
    } catch (error) {
      console.error('Failed to fetch center orders:', error);
      setOrdersError('Failed to load center orders');
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    setCurrentPage(1); // Reset to first page when filters change
  }, [center?.id, isOpen, dateFrom, dateTo, statusFilter]);

  // Set default date range to last 30 days when modal opens
  useEffect(() => {
    if (isOpen && !dateFrom && !dateTo) {
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);

      setDateTo(today.toISOString().split('T')[0]);
      setDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
    }
  }, [isOpen]);

  // Calculate pagination
  const totalPages = Math.ceil(orders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const currentOrders = orders.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (!isOpen || !center) return null;

  const getFeatureTypeConfig = (type: string) => {
    switch (type) {
      case 'core':
        return {
          icon: Shield,
          color: '#3b82f6',
          bg: 'bg-teal-100',
          text: 'Core',
          className: 'text-teal-800',
          description: 'Essential features for basic operation'
        };
      case 'premium':
        return {
          icon: Zap,
          color: '#f59e0b',
          bg: 'bg-amber-100',
          text: 'Premium',
          className: 'text-amber-800',
          description: 'Advanced features for enhanced operation'
        };
      case 'enterprise':
        return {
          icon: Award,
          color: '#8b5cf6',
          bg: 'bg-purple-100',
          text: 'Enterprise',
          className: 'text-purple-800',
          description: 'Enterprise-grade features for large operations'
        };
      default:
        return {
          icon: Settings,
          color: '#6b7280',
          bg: 'bg-gray-100',
          text: 'Feature',
          className: 'text-gray-800',
          description: 'System feature'
        };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          icon: CheckCircle2,
          color: '#10b981',
          text: 'Approved',
          className: 'text-green-600'
        };
      case 'requested':
        return {
          icon: Clock,
          color: '#f59e0b',
          text: 'Pending',
          className: 'text-amber-600'
        };
      case 'rejected':
        return {
          icon: XCircle,
          color: '#ef4444',
          text: 'Rejected',
          className: 'text-red-600'
        };
      case 'disabled':
        return {
          icon: Power,
          color: '#6b7280',
          text: 'Disabled',
          className: 'text-gray-600'
        };
      default:
        return {
          icon: AlertTriangle,
          color: '#6b7280',
          text: 'Not Requested',
          className: 'text-gray-600'
        };
    }
  };

  const handleFeatureToggle = async (featureId: string, currentEnabled: boolean) => {
    if (!center?.id || processingFeature) return;
    
    setProcessingFeature(featureId);
    try {
      const response = await operationsApi.updateCollectionCenterFeature(
        center.id, 
        featureId, 
        !currentEnabled
      );
      
      if (response.success) {
        // Update local features state
        setFeatures(prev => prev.map(f => 
          f.feature_id === featureId 
            ? { ...f, enabled: !currentEnabled }
            : f
        ));
        
        // Call parent callback if provided
        if (onFeatureToggle) {
          await onFeatureToggle(center.id, featureId, !currentEnabled);
        }
      }
    } catch (error) {
      console.error('Failed to toggle feature:', error);
    } finally {
      setProcessingFeature(null);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!center?.id || isProcessing) return;
    
    try {
      if (onStatusChange) {
        await onStatusChange(center.id, newStatus);
      }
    } catch (error) {
      console.error('Failed to change status:', error);
    }
  };

  const enabledFeatures = features.filter(f => f.enabled).length;
  const pendingRequests = features.filter(f => f.status === 'requested').length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 transition-all duration-300"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative w-full max-w-6xl rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
            border: '1px solid rgba(203, 213, 225, 0.3)',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div 
            className="relative p-8 text-white"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)'
            }}
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full bg-black bg-opacity-20 hover:bg-red-500 hover:bg-opacity-90 border border-white border-opacity-30 hover:border-red-400 transition-all duration-200 hover:scale-110 active:scale-95 hover:shadow-lg group"
            >
              <X className="w-6 h-6 text-white drop-shadow-lg group-hover:text-white transition-all duration-200" />
            </button>
            
            <div className="flex items-start space-x-6">
              <div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              >
                <Building2 className="w-10 h-10 text-white" />
              </div>
              
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">{center.center_name}</h2>
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    center.center_type === 'independent' 
                      ? 'bg-teal-100 text-teal-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {center.center_type.toUpperCase()}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    center.center_status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : center.center_status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {center.center_status.toUpperCase()}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-white/80">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      Created: {new Date(center.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading features...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-500 text-lg font-medium mb-2">Error Loading Features</div>
                <p className="text-gray-500">{error}</p>
              </div>
            ) : (
              <>
                {/* Feature Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-teal-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-teal-600 font-medium">Total Features</p>
                        <p className="text-2xl font-bold text-teal-800">{features.length}</p>
                      </div>
                      <div className="w-12 h-12 bg-teal-200 rounded-xl flex items-center justify-center">
                        <Settings className="w-6 h-6 text-teal-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 font-medium">Enabled</p>
                        <p className="text-2xl font-bold text-green-800">{enabledFeatures}</p>
                      </div>
                      <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-2xl border border-amber-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-amber-600 font-medium">Pending</p>
                        <p className="text-2xl font-bold text-amber-800">{pendingRequests}</p>
                      </div>
                      <div className="w-12 h-12 bg-amber-200 rounded-xl flex items-center justify-center">
                        <Clock className="w-6 h-6 text-amber-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-600 font-medium">Disabled</p>
                        <p className="text-2xl font-bold text-purple-800">{features.length - enabledFeatures}</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-200 rounded-xl flex items-center justify-center">
                        <Power className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {/* Contact Information */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Contact Information</h3>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                          <Phone className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Phone Number</p>
                          <p className="font-semibold text-gray-800">{center.phone || 'Not provided'}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                          <Mail className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Email Address</p>
                          <p className="font-semibold text-gray-800">{center.email || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Feature Management */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Feature Management</h3>
                    
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {features.map((feature) => {
                        const typeConfig = getFeatureTypeConfig(feature.feature_type);
                        const statusConfig = getStatusConfig(feature.status);
                        const TypeIcon = typeConfig.icon;
                        const StatusIcon = statusConfig.icon;
                        
                        return (
                          <div key={feature.feature_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div className="flex items-center space-x-4">
                              <div className={`w-10 h-10 ${typeConfig.bg} rounded-lg flex items-center justify-center`}>
                                <TypeIcon className={`w-5 h-5 ${typeConfig.className}`} />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold text-gray-800">{feature.feature_name}</p>
                                  <span className={`text-xs px-2 py-1 rounded-full ${typeConfig.bg} ${typeConfig.className} font-medium`}>
                                    {typeConfig.text}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-1">{feature.description}</p>
                                <div className="flex items-center gap-2">
                                  <StatusIcon className={`w-4 h-4 ${statusConfig.className}`} />
                                  <span className={`text-sm ${statusConfig.className} font-medium`}>
                                    {statusConfig.text}
                                  </span>
                                  {feature.enabled_at && (
                                    <span className="text-xs text-gray-500">• {new Date(feature.enabled_at).toLocaleDateString()}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              {feature.requires_approval && feature.status === 'requested' && (
                                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-medium">
                                  Approval Required
                                </span>
                              )}
                              <button
                                onClick={() => handleFeatureToggle(feature.feature_id, feature.enabled)}
                                disabled={processingFeature === feature.feature_id}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                                  feature.enabled
                                    ? 'bg-green-600'
                                    : 'bg-gray-200'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    feature.enabled ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Status Management */}
                    {onStatusChange && (
                      <div className="pt-6 border-t border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4">Status Management</h4>
                        <div className="space-y-3">
                          {['approved', 'rejected'].map((status) => (
                            <button
                              key={status}
                              onClick={() => handleStatusChange(status)}
                              disabled={isProcessing || center.center_status === status}
                              className={`w-full px-4 py-3 rounded-xl font-semibold transition-all duration-200 hover:transform hover:scale-105 disabled:opacity-50 ${
                                center.center_status === status
                                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                  : status === 'approved'
                                    ? 'bg-green-500 text-white hover:bg-green-600'
                                    : 'bg-red-500 text-white hover:bg-red-600'
                              }`}
                            >
                              {isProcessing ? 'Processing...' : `Mark as ${status.charAt(0).toUpperCase() + status.slice(1)}`}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Orders Section - Full Width */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-800">Recent Orders</h3>
                    <div className="flex items-center space-x-4">
                      {/* Date Range Filters */}
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-600">From:</label>
                        <input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-600">To:</label>
                        <input
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      {/* Status Filter */}
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="all">All Status</option>
                        <option value="pending_rider_assignment">Pending</option>
                        <option value="assigned">Assigned</option>
                        <option value="picked_up">Picked Up</option>
                        <option value="in_transit">In Transit</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  {ordersLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                      <p className="text-gray-500">Loading orders...</p>
                    </div>
                  ) : ordersError ? (
                    <div className="text-center py-12">
                      <div className="text-red-500 font-medium mb-2">Error Loading Orders</div>
                      <p className="text-gray-500 text-sm">{ordersError}</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No orders found for the selected criteria</p>
                    </div>
                  ) : (
                    <div>
                      <div className="grid gap-4 mb-6">
                        {currentOrders.map((order, index) => (
                          <div key={`${order.id}-${index}`} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                  order.status === 'delivered' ? 'bg-green-100' :
                                  order.status === 'in_transit' ? 'bg-teal-100' :
                                  order.status === 'picked_up' ? 'bg-yellow-100' :
                                  order.status === 'assigned' ? 'bg-purple-100' :
                                  order.status === 'pending' ? 'bg-gray-100' :
                                  'bg-red-100'
                                }`}>
                                  {order.status === 'delivered' ? (
                                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                                  ) : order.status === 'in_transit' ? (
                                    <Truck className="w-6 h-6 text-teal-600" />
                                  ) : order.status === 'picked_up' ? (
                                    <Timer className="w-6 h-6 text-yellow-600" />
                                  ) : order.status === 'assigned' ? (
                                    <User className="w-6 h-6 text-purple-600" />
                                  ) : order.status === 'pending' ? (
                                    <Clock className="w-6 h-6 text-gray-600" />
                                  ) : (
                                    <XCircle className="w-6 h-6 text-red-600" />
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-bold text-gray-900 text-lg">{order.order_number}</h4>
                                  <p className="text-sm text-gray-600">{order.hospital_name}</p>
                                </div>
                                {order.urgency === 'urgent' && (
                                  <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                                    🔴 Urgent
                                  </span>
                                )}
                              </div>
                              <div className="text-right">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                  order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                  order.status === 'in_transit' ? 'bg-teal-100 text-teal-800' :
                                  order.status === 'picked_up' ? 'bg-yellow-100 text-yellow-800' :
                                  order.status === 'assigned' ? 'bg-purple-100 text-purple-800' :
                                  order.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {order.status.replace('_', ' ').toUpperCase()}
                                </span>
                                <p className="text-sm text-gray-500 mt-1">
                                  {new Date(order.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500 block">Sample Type:</span>
                                <span className="font-medium text-gray-800">{order.sample_type || 'Not specified'}</span>
                              </div>
                              <div>
                                <span className="text-gray-500 block">Quantity:</span>
                                <span className="font-medium text-gray-800">{order.sample_quantity || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-gray-500 block">Pickup Time:</span>
                                <span className="font-medium text-gray-800">
                                  {order.pickup_time ? new Date(order.pickup_time).toLocaleString() : 'Not scheduled'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                          <div className="text-sm text-gray-600">
                            Showing {startIndex + 1}-{Math.min(endIndex, orders.length)} of {orders.length} orders
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1}
                              className="px-3 py-1 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Previous
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                              <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                                  currentPage === page
                                    ? 'bg-teal-500 text-white'
                                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            ))}

                            <button
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === totalPages}
                              className="px-3 py-1 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
