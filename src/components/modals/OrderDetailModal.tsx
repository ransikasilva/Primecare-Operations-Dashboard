"use client";

import { useState, useEffect } from 'react';
import { operationsApi } from '@/lib/api';
import {
  X,
  Package,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Timer,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Hash,
  FileText,
  Route,
  Navigation,
  QrCode,
  Scan,
  Activity,
  Flag,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Copy,
  Users,
} from 'lucide-react';
import OrderTrackingMap from '@/components/OrderTrackingMap';

interface OrderDetailProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface OrderDetails {
  order: {
    id: string;
    order_number: string;
    center_id: string;
    center_name: string;
    center_address: string;
    center_contact_person?: string;
    center_phone?: string;
    center_coordinates: {
      lat: number | null;
      lng: number | null;
    };
    hospital_id: string;
    hospital_name: string;
    hospital_address: string;
    hospital_contact_phone?: string;
    hospital_email?: string;
    hospital_coordinates: {
      lat: number | null;
      lng: number | null;
    };
    rider_id?: string;
    rider_name?: string;
    rider_phone?: string;
    vehicle_number?: string;
    rider_current_location: {
      lat: number | null;
      lng: number | null;
      updated_at?: string;
    };
    sample_type: string;
    sample_quantity: number;
    urgency: string;
    status: string;
    special_instructions?: string;
    estimated_distance_km?: number;
    actual_distance_km?: number;
    estimated_payment?: number;
    actual_payment?: number;
    created_at: string;
    assigned_at?: string;
    pickup_started_at?: string;
    picked_up_at?: string;
    delivery_started_at?: string;
    delivered_at?: string;
    cancelled_at?: string;
  };
  // Note: status_history is generated from order timestamps, not a separate table
  qr_scans: Array<{
    qr_id: string;
    scan_type: string;
    scanned_by: string;
    scanner_type: string;
    scan_location?: string;
    scan_coordinates_lat?: number;
    scan_coordinates_lng?: number;
    scanned_at: string;
    scanned_by_email?: string;
  }>;
  location_tracking: Array<{
    location_lat: number;
    location_lng: number;
    speed_kmh?: number;
    accuracy_meters?: number;
    recorded_at: string;
  }>;
  handover_history?: Array<{
    id: string;
    original_rider_id: string;
    original_rider_name: string;
    new_rider_id?: string;
    new_rider_name?: string;
    handover_reason: string;
    handover_location?: {
      lat: number;
      lng: number;
    };
    status: string;
    notes?: string;
    initiated_at: string;
    accepted_at?: string;
    confirmed_at?: string;
  }>;
}

// Generate status history from order timestamps
const generateStatusHistory = (order: any) => {
  const history = [];

  if (order.created_at) {
    history.push({
      id: 'created',
      status: 'pending_rider_assignment',
      changed_at: order.created_at,
      notes: 'Order created'
    });
  }

  if (order.assigned_at) {
    history.push({
      id: 'assigned',
      status: 'assigned',
      changed_at: order.assigned_at,
      notes: 'Rider assigned'
    });
  }

  if (order.pickup_started_at) {
    history.push({
      id: 'pickup_started',
      status: 'pickup_started',
      changed_at: order.pickup_started_at,
      notes: 'Pickup started'
    });
  }

  if (order.picked_up_at) {
    history.push({
      id: 'picked_up',
      status: 'picked_up',
      changed_at: order.picked_up_at,
      notes: 'Package picked up'
    });
  }

  if (order.delivery_started_at) {
    history.push({
      id: 'delivery_started',
      status: 'delivery_started',
      changed_at: order.delivery_started_at,
      notes: 'Delivery started'
    });
  }

  if (order.delivered_at) {
    history.push({
      id: 'delivered',
      status: 'delivered',
      changed_at: order.delivered_at,
      notes: 'Package delivered'
    });
  }

  if (order.cancelled_at) {
    history.push({
      id: 'cancelled',
      status: 'cancelled',
      changed_at: order.cancelled_at,
      notes: 'Order cancelled'
    });
  }

  return history;
};

// Transform order details to match map component expectations
const transformOrderDetailsForMap = (orderDetails: OrderDetails) => {
  // Only show map for active orders (assigned, pickup_started, picked_up, delivery_started)
  const isActiveOrder = ['assigned', 'pickup_started', 'picked_up', 'delivery_started'].includes(orderDetails.order.status);

  if (!isActiveOrder) {
    return null; // Don't show map for non-active orders
  }

  // Check if we have valid coordinates
  const hasValidCenterCoords = orderDetails.order.center_coordinates.lat !== null && orderDetails.order.center_coordinates.lng !== null;
  const hasValidHospitalCoords = orderDetails.order.hospital_coordinates.lat !== null && orderDetails.order.hospital_coordinates.lng !== null;

  if (!hasValidCenterCoords || !hasValidHospitalCoords) {
    return null; // Don't show map if coordinates are missing
  }

  // Build location tracking array
  const locationTracking = [];

  // First, add the rider's current location if available (most recent)
  if (orderDetails.order.rider_current_location.lat !== null &&
      orderDetails.order.rider_current_location.lng !== null) {
    locationTracking.push({
      id: 'current-location',
      rider_id: orderDetails.order.rider_id || 'unknown',
      location: {
        lat: orderDetails.order.rider_current_location.lat,
        lng: orderDetails.order.rider_current_location.lng
      },
      speed_kmh: undefined,
      accuracy_meters: undefined,
      recorded_at: orderDetails.order.rider_current_location.updated_at || new Date().toISOString()
    });
  }

  // Then add historical location tracking
  if (orderDetails.location_tracking && orderDetails.location_tracking.length > 0) {
    orderDetails.location_tracking.forEach((location, index) => {
      locationTracking.push({
        id: `location-${index}`,
        rider_id: orderDetails.order.rider_id || 'unknown',
        location: {
          lat: location.location_lat,
          lng: location.location_lng
        },
        speed_kmh: location.speed_kmh,
        accuracy_meters: location.accuracy_meters,
        recorded_at: location.recorded_at
      });
    });
  }

  return {
    order: {
      ...orderDetails.order,
      pickup_location: {
        // Use real collection center coordinates
        lat: orderDetails.order.center_coordinates.lat!,
        lng: orderDetails.order.center_coordinates.lng!
      },
      delivery_location: {
        // Use real hospital coordinates
        lat: orderDetails.order.hospital_coordinates.lat!,
        lng: orderDetails.order.hospital_coordinates.lng!
      },
      status: orderDetails.order.status
    },
    location_tracking: locationTracking
  };
};

export function OrderDetailModal({ orderId, isOpen, onClose }: OrderDetailProps) {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'chain' | 'qr' | 'location'>('overview');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch order details
  const fetchOrderDetails = async () => {
    if (!orderId || !isOpen) return;

    try {
      setLoading(true);
      setError(null);

      const response = await operationsApi.getOrderDetails(orderId);

      if (response.success && response.data) {
        // Map backend response to frontend interface
        const backendOrder = response.data.order as any;
        const mappedData: OrderDetails = {
          order: {
            ...backendOrder,
            // Ensure coordinate structures exist even if null
            center_coordinates: backendOrder.center_coordinates || { lat: null, lng: null },
            hospital_coordinates: backendOrder.hospital_coordinates || { lat: null, lng: null },
            rider_current_location: backendOrder.rider_current_location || { lat: null, lng: null }
          },
          qr_scans: (response.data as any).qr_scans || [],
          location_tracking: (response.data as any).location_tracking || [],
          handover_history: (response.data as any).handover_history || []
        };
        setOrderDetails(mappedData);
      } else {
        setError('Failed to load order details');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  // Refresh current location
  const handleRefreshLocation = async () => {
    if (!orderDetails?.order.rider_id) return;

    setRefreshing(true);
    try {
      await fetchOrderDetails();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId, isOpen]);

  // Set up auto-refresh for active orders
  useEffect(() => {
    if (!isOpen || !orderDetails) return;

    const isActiveOrder = ['assigned', 'pickup_started', 'picked_up', 'delivery_started'].includes(
      orderDetails.order.status
    );

    if (!isActiveOrder) return;

    const interval = setInterval(() => {
      fetchOrderDetails();
    }, 30000); // Refresh every 30 seconds for active orders

    return () => clearInterval(interval);
  }, [isOpen, orderDetails?.order.status]);

  if (!isOpen) return null;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'delivered':
        return {
          icon: CheckCircle2,
          color: 'text-green-600',
          bg: 'bg-green-100',
          text: 'Delivered'
        };
      case 'delivery_started':
      case 'in_transit':
        return {
          icon: Truck,
          color: 'text-teal-600',
          bg: 'bg-teal-100',
          text: 'In Transit'
        };
      case 'picked_up':
        return {
          icon: Timer,
          color: 'text-yellow-600',
          bg: 'bg-yellow-100',
          text: 'Picked Up'
        };
      case 'pickup_started':
        return {
          icon: Timer,
          color: 'text-orange-600',
          bg: 'bg-orange-100',
          text: 'Pickup Started'
        };
      case 'assigned':
        return {
          icon: User,
          color: 'text-purple-600',
          bg: 'bg-purple-100',
          text: 'Assigned'
        };
      case 'cancelled':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bg: 'bg-red-100',
          text: 'Cancelled'
        };
      default:
        return {
          icon: Clock,
          color: 'text-gray-600',
          bg: 'bg-gray-100',
          text: 'Pending'
        };
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const isActiveOrder = orderDetails && ['assigned', 'pickup_started', 'picked_up', 'delivery_started'].includes(
    orderDetails.order.status
  );

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
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              <span className="ml-3 text-gray-600">Loading order details...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 font-medium">{error}</p>
                <button
                  onClick={fetchOrderDetails}
                  className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : orderDetails && (
            <>
              {/* Header */}
              <div
                className="relative p-8 text-white"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                }}
              >
                <button
                  onClick={onClose}
                  className="absolute top-6 right-6 p-2 rounded-full bg-black bg-opacity-20 hover:bg-red-500 hover:bg-opacity-90 border border-white border-opacity-30 hover:border-red-400 transition-all duration-200 hover:scale-110 active:scale-95 hover:shadow-lg group"
                >
                  <X className="w-6 h-6 text-white drop-shadow-lg group-hover:text-white transition-all duration-200" />
                </button>

                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-6">
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                    >
                      <Package className="w-10 h-10 text-white" />
                    </div>

                    <div className="flex-1">
                      <h2 className="text-3xl font-bold mb-2">{orderDetails.order.order_number}</h2>
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-5 h-5" />
                          <span className="text-white/90">
                            {new Date(orderDetails.order.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Package className="w-5 h-5" />
                          <span className="text-white/90">
                            {orderDetails.order.sample_type} ({orderDetails.order.sample_quantity})
                          </span>
                        </div>
                        {orderDetails.order.estimated_distance_km && (
                          <div className="flex items-center space-x-2">
                            <Route className="w-5 h-5" />
                            <span className="text-white/90">
                              {orderDetails.order.estimated_distance_km.toFixed(1)} km
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-4">
                        {(() => {
                          const statusConfig = getStatusConfig(orderDetails.order.status);
                          const StatusIcon = statusConfig.icon;
                          return (
                            <div
                              className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${statusConfig.bg}`}
                            >
                              <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                              <span className={`font-semibold ${statusConfig.color}`}>
                                {statusConfig.text}
                              </span>
                            </div>
                          );
                        })()}

                        {orderDetails.order.urgency === 'urgent' && (
                          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-red-100">
                            <Flag className="w-5 h-5 text-red-600" />
                            <span className="font-semibold text-red-600">🔴 Urgent</span>
                          </div>
                        )}

                        {isActiveOrder && (
                          <button
                            onClick={handleRefreshLocation}
                            disabled={refreshing}
                            className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all"
                          >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                            <span className="text-sm font-medium">Live Update</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200">
                <div className="flex space-x-8 px-8">
                  {[
                    { key: 'overview', label: 'Overview', icon: Package },
                    { key: 'chain', label: 'Chain of Custody', icon: Activity },
                    { key: 'qr', label: 'QR Tracking', icon: QrCode },
                    { key: 'location', label: 'Live Location', icon: MapPin, disabled: !isActiveOrder }
                  ].map((tab) => {
                    const TabIcon = tab.icon;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        disabled={tab.disabled}
                        className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                          activeTab === tab.key
                            ? 'border-teal-500 text-teal-600'
                            : tab.disabled
                              ? 'border-transparent text-gray-400 cursor-not-allowed'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <TabIcon className="w-4 h-4" />
                        <span>{tab.label}</span>
                        {tab.disabled && <span className="text-xs">(Inactive)</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-8">
                {activeTab === 'overview' && (
                  <div className="space-y-8">
                    {/* Order Information Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Collection Center Info */}
                      <div className="bg-white p-6 rounded-xl border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Activity className="w-5 h-5 text-teal-600" />
                          Collection Center
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <span className="text-gray-600 w-20">Name:</span>
                            <span className="font-medium text-gray-900">{orderDetails.order.center_name}</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="text-gray-600 w-20">Address:</span>
                            <span className="font-medium text-gray-900">{orderDetails.order.center_address}</span>
                          </div>
                          {orderDetails.order.center_phone && (
                            <div className="flex items-center gap-3">
                              <span className="text-gray-600 w-20">Phone:</span>
                              <a
                                href={`tel:${orderDetails.order.center_phone}`}
                                className="font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1"
                              >
                                <Phone className="w-4 h-4" />
                                {orderDetails.order.center_phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Hospital Info */}
                      <div className="bg-white p-6 rounded-xl border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Activity className="w-5 h-5 text-green-600" />
                          Hospital
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <span className="text-gray-600 w-20">Name:</span>
                            <span className="font-medium text-gray-900">{orderDetails.order.hospital_name}</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="text-gray-600 w-20">Address:</span>
                            <span className="font-medium text-gray-900">{orderDetails.order.hospital_address}</span>
                          </div>
                          {orderDetails.order.hospital_contact_phone && (
                            <div className="flex items-center gap-3">
                              <span className="text-gray-600 w-20">Phone:</span>
                              <a
                                href={`tel:${orderDetails.order.hospital_contact_phone}`}
                                className="font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1"
                              >
                                <Phone className="w-4 h-4" />
                                {orderDetails.order.hospital_contact_phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Rider Information */}
                    {orderDetails.order.rider_name && (
                      <div className="bg-white p-6 rounded-xl border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <User className="w-5 h-5 text-purple-600" />
                          Assigned Rider
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <span className="text-gray-600 w-20">Name:</span>
                            <span className="font-medium text-gray-900">{orderDetails.order.rider_name}</span>
                          </div>
                          {orderDetails.order.rider_phone && (
                            <div className="flex items-center gap-3">
                              <span className="text-gray-600 w-20">Phone:</span>
                              <a
                                href={`tel:${orderDetails.order.rider_phone}`}
                                className="font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1"
                              >
                                <Phone className="w-4 h-4" />
                                {orderDetails.order.rider_phone}
                              </a>
                            </div>
                          )}
                          {orderDetails.order.vehicle_number && (
                            <div className="flex items-center gap-3">
                              <span className="text-gray-600 w-20">Vehicle:</span>
                              <span className="font-medium text-gray-900">{orderDetails.order.vehicle_number}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Order Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
                        <Route className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Distance</p>
                        <p className="text-lg font-bold text-gray-900">
                          {orderDetails.order.estimated_distance_km?.toFixed(1) || 'N/A'} km
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
                        <Package className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Sample Type</p>
                        <p className="text-lg font-bold text-gray-900 capitalize">
                          {orderDetails.order.sample_type || 'Not Applicable'}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
                        <Hash className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Quantity</p>
                        <p className="text-lg font-bold text-gray-900">
                          {orderDetails.order.sample_quantity || 'Not Applicable'}
                        </p>
                      </div>
                    </div>

                    {/* Special Instructions */}
                    {orderDetails.order.special_instructions && (
                      <div className="bg-amber-50 p-6 rounded-xl border border-amber-200">
                        <h3 className="text-lg font-semibold text-amber-900 mb-3 flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          Special Instructions
                        </h3>
                        <p className="text-amber-800">{orderDetails.order.special_instructions}</p>
                      </div>
                    )}

                    {/* Handover History */}
                    {orderDetails.handover_history && orderDetails.handover_history.length > 0 && (
                      <div className="bg-white p-6 rounded-xl border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Users className="w-5 h-5 text-purple-600" />
                          Handover History
                        </h3>
                        <div className="space-y-4">
                          {orderDetails.handover_history.map((handover, index) => {
                            const isCompleted = handover.status === 'confirmed';
                            const isCancelledDeclined = ['cancelled', 'declined', 'expired'].includes(handover.status);
                            const isPending = handover.status === 'pending';

                            return (
                              <div key={handover.id || index} className={`p-5 rounded-xl border-2 ${
                                isCompleted
                                  ? 'bg-green-50 border-green-300'
                                  : isCancelledDeclined
                                    ? 'bg-red-50 border-red-300'
                                    : 'bg-yellow-50 border-yellow-300'
                              }`}>
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${
                                      isCompleted
                                        ? 'bg-green-100'
                                        : isCancelledDeclined
                                          ? 'bg-red-100'
                                          : 'bg-yellow-100'
                                    }`}>
                                      <Users className={`w-5 h-5 ${
                                        isCompleted
                                          ? 'text-green-700'
                                          : isCancelledDeclined
                                            ? 'text-red-700'
                                            : 'text-yellow-700'
                                      }`} />
                                    </div>
                                    <div>
                                      <span className={`font-semibold text-base ${
                                        isCompleted
                                          ? 'text-green-900'
                                          : isCancelledDeclined
                                            ? 'text-red-900'
                                            : 'text-yellow-900'
                                      }`}>
                                        {handover.status === 'confirmed' && '✅ Handover Completed'}
                                        {handover.status === 'cancelled' && '❌ Handover Cancelled'}
                                        {handover.status === 'declined' && '🚫 Handover Declined'}
                                        {handover.status === 'expired' && '⏱️ Handover Expired'}
                                        {handover.status === 'pending' && '⏳ Handover Pending'}
                                      </span>
                                      <p className="text-sm text-gray-600 mt-1">
                                        {new Date(handover.initiated_at).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                  <div className="bg-white bg-opacity-60 p-3 rounded-lg">
                                    <label className="text-xs text-gray-600 font-medium">Original Rider</label>
                                    <p className="font-semibold text-gray-900 mt-1">{handover.original_rider_name}</p>
                                    <p className="text-sm text-gray-600">ID: {handover.original_rider_id}</p>
                                  </div>
                                  {handover.new_rider_name && (
                                    <div className="bg-white bg-opacity-60 p-3 rounded-lg">
                                      <label className="text-xs text-gray-600 font-medium">New Rider</label>
                                      <p className="font-semibold text-gray-900 mt-1">{handover.new_rider_name}</p>
                                      <p className="text-sm text-gray-600">ID: {handover.new_rider_id}</p>
                                    </div>
                                  )}
                                </div>

                                {handover.handover_reason && (
                                  <div className="mb-3">
                                    <label className="text-xs text-gray-600 font-medium">Reason</label>
                                    <p className="text-sm text-gray-900 mt-1 bg-white bg-opacity-60 p-2 rounded">
                                      {handover.handover_reason}
                                    </p>
                                  </div>
                                )}

                                {handover.notes && (
                                  <div className="mb-3">
                                    <label className="text-xs text-gray-600 font-medium">Notes</label>
                                    <p className="text-sm text-gray-900 mt-1 bg-white bg-opacity-60 p-2 rounded">
                                      {handover.notes}
                                    </p>
                                  </div>
                                )}

                                {handover.handover_location && handover.handover_location.lat && handover.handover_location.lng && (
                                  <div className="mb-3">
                                    <label className="text-xs text-gray-600 font-medium">Handover Location</label>
                                    <p className="text-sm text-gray-900 mt-1 bg-white bg-opacity-60 p-2 rounded font-mono">
                                      {handover.handover_location.lat.toFixed(6)}, {handover.handover_location.lng.toFixed(6)}
                                    </p>
                                  </div>
                                )}

                                <div className="flex items-center gap-6 text-xs text-gray-700 mt-4 pt-4 border-t border-gray-300">
                                  {handover.initiated_at && (
                                    <div>
                                      <span className="font-semibold">Initiated:</span>{' '}
                                      <span>{new Date(handover.initiated_at).toLocaleString()}</span>
                                    </div>
                                  )}
                                  {handover.accepted_at && (
                                    <div>
                                      <span className="font-semibold">Accepted:</span>{' '}
                                      <span>{new Date(handover.accepted_at).toLocaleString()}</span>
                                    </div>
                                  )}
                                  {handover.confirmed_at && (
                                    <div>
                                      <span className="font-semibold">Confirmed:</span>{' '}
                                      <span>{new Date(handover.confirmed_at).toLocaleString()}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'chain' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Activity className="w-6 h-6 text-teal-600" />
                      Chain of Custody Timeline
                    </h3>

                    <div className="relative">
                      {generateStatusHistory(orderDetails.order).map((event, index) => {
                        const isLast = index === generateStatusHistory(orderDetails.order).length - 1;
                        const statusConfig = getStatusConfig(event.status);
                        const StatusIcon = statusConfig.icon;

                        return (
                          <div key={event.id} className="relative flex items-start space-x-4 pb-8">
                            {/* Timeline line */}
                            {!isLast && (
                              <div className="absolute left-6 top-12 w-0.5 h-full bg-gray-200" />
                            )}

                            {/* Status icon */}
                            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${statusConfig.bg}`}>
                              <StatusIcon className={`w-6 h-6 ${statusConfig.color}`} />
                            </div>

                            {/* Event details */}
                            <div className="flex-grow bg-white p-4 rounded-xl border border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className={`font-semibold ${statusConfig.color}`}>
                                  {statusConfig.text}
                                </h4>
                                <time className="text-sm text-gray-500">
                                  {new Date(event.changed_at).toLocaleString()}
                                </time>
                              </div>


                              {event.notes && (
                                <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                                  {event.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === 'qr' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <QrCode className="w-6 h-6 text-purple-600" />
                      QR Code Tracking & Scans
                    </h3>

                    {orderDetails.qr_scans.length === 0 ? (
                      <div className="text-center py-8">
                        <QrCode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No QR code scans recorded yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orderDetails.qr_scans.map((scan, index) => (
                          <div key={`${scan.qr_id}-${index}`} className="bg-white p-6 rounded-xl border border-gray-200">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-100">
                                  <Scan className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                    {scan.scan_type}
                                    <button
                                      onClick={() => copyToClipboard(scan.qr_id)}
                                      className="text-gray-400 hover:text-gray-600"
                                    >
                                      <Copy className="w-4 h-4" />
                                    </button>
                                  </h4>
                                  <p className="text-sm text-gray-600">QR ID: {scan.qr_id}</p>
                                </div>
                              </div>
                              <time className="text-sm text-gray-500">
                                {new Date(scan.scanned_at).toLocaleString()}
                              </time>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Scanned by:</span>
                                <span className="font-medium text-gray-900 ml-2">{scan.scanned_by}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Scanner type:</span>
                                <span className="font-medium text-gray-900 ml-2 capitalize">{scan.scanner_type}</span>
                              </div>
                              {scan.scan_location && (
                                <div>
                                  <span className="text-gray-600">Location:</span>
                                  <span className="font-medium text-gray-900 ml-2">{scan.scan_location}</span>
                                </div>
                              )}
                              {scan.scan_coordinates_lat && scan.scan_coordinates_lng && (
                                <div>
                                  <span className="text-gray-600">Coordinates:</span>
                                  <span className="font-medium text-gray-900 ml-2">
                                    {scan.scan_coordinates_lat.toFixed(6)}, {scan.scan_coordinates_lng.toFixed(6)}
                                  </span>
                                </div>
                              )}
                            </div>

                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'location' && isActiveOrder && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <MapPin className="w-6 h-6 text-green-600" />
                        Live Location Tracking
                      </h3>
                      <button
                        onClick={handleRefreshLocation}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh Location
                      </button>
                    </div>

                    {/* Interactive Map */}
                    {(() => {
                      const mapData = transformOrderDetailsForMap(orderDetails);
                      return mapData ? (
                        <OrderTrackingMap
                          orderDetails={mapData}
                          onRefresh={handleRefreshLocation}
                        />
                      ) : (
                        <div className="bg-gray-50 p-8 rounded-xl border-2 border-dashed border-gray-300 text-center">
                          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Live Tracking Not Available</h3>
                          <p className="text-gray-600">
                            Map view is only available for active orders (assigned, picked up, or in transit).
                          </p>
                        </div>
                      );
                    })()}

                    {/* Location data summary */}
                    {orderDetails.location_tracking && orderDetails.location_tracking.length > 0 && (
                      <div className="bg-white p-6 rounded-xl border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-4">Recent Location Updates</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {orderDetails.location_tracking.slice(0, 3).map((location, index) => (
                            <div key={`${location.location_lat}-${index}`} className={`p-3 rounded-lg ${index === 0 ? 'bg-green-50' : 'bg-gray-50'}`}>
                              <div className="flex items-center gap-2 mb-2">
                                <Navigation className={`w-4 h-4 ${index === 0 ? 'text-green-600' : 'text-gray-600'}`} />
                                <span className={`text-sm font-medium ${index === 0 ? 'text-green-700' : 'text-gray-700'}`}>
                                  {index === 0 ? 'Latest' : `${index + 1} ago`}
                                </span>
                              </div>
                              <div className="space-y-1 text-xs">
                                <div className="text-gray-600">
                                  {parseFloat(location.location_lat.toString()).toFixed(4)}, {parseFloat(location.location_lng.toString()).toFixed(4)}
                                </div>
                                {location.speed_kmh !== undefined && (
                                  <div className="text-gray-600">{location.speed_kmh} km/h</div>
                                )}
                                <div className="text-gray-500">
                                  {new Date(location.recorded_at).toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {orderDetails.location_tracking.length > 3 && (
                          <div className="mt-4 text-center">
                            <span className="text-sm text-gray-500">
                              +{orderDetails.location_tracking.length - 3} more location updates available
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* No location data message */}
                    {(!orderDetails.location_tracking || orderDetails.location_tracking.length === 0) && (
                      <div className="bg-amber-50 p-6 rounded-xl border border-amber-200">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-600" />
                          <div>
                            <h4 className="font-medium text-amber-900">No GPS Data Available</h4>
                            <p className="text-sm text-amber-700 mt-1">
                              Live location tracking will appear here once the rider accepts the order and starts location sharing.
                            </p>
                          </div>
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
  );
}