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
    samples?: Array<{
      sample_type: string;
      quantity: number;
    }>;
    urgency: string;
    status: string;
    special_instructions?: string;
    estimated_distance_km?: number;
    actual_distance_km?: number;
    route_actual_km?: number;
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
  handover?: {
    handover_id: string;
    status: string;
    reason: string;
    original_rider: {
      id: string;
      name: string;
      phone?: string;
      vehicle?: string;
    };
    new_rider: {
      id: string;
      name: string;
      phone?: string;
      vehicle?: string;
    };
    location: {
      lat: number | null;
      lng: number | null;
    };
    initiated_at: string;
    accepted_at?: string;
    confirmed_at?: string;
  };
  multi_parcel?: {
    is_multi_parcel: boolean;
    route_id: string;
    total_parcels?: number;
    completed_parcels?: number;
    route_status?: string;
    route_created_at?: string;
    first_pickup_at?: string;
    other_orders?: Array<{
      id: string;
      order_number: string;
      status: string;
      sample_type?: string;
      urgency?: string;
      center_name?: string;
      created_at: string;
      assigned_at?: string;
      picked_up_at?: string;
      delivered_at?: string;
    }>;
  };
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
          handover: (response.data as any).handover || null,
          multi_parcel: (response.data as any).multi_parcel || null
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
                        {orderDetails.order.route_actual_km && orderDetails.order.route_actual_km > 0 && (
                          <div className="flex items-center space-x-2">
                            <Route className="w-5 h-5" />
                            <span className="text-white/90">
                              {orderDetails.order.route_actual_km.toFixed(1)} km
                              {orderDetails.multi_parcel?.is_multi_parcel && (
                                <span className="text-xs ml-1">(all orders)</span>
                              )}
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
                        {orderDetails.handover ? (
                          <>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                              <Users className="w-5 h-5 text-orange-600" />
                              Rider Information (Handover)
                            </h3>

                            {/* Original Rider */}
                            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <h4 className="text-sm font-semibold text-blue-900 mb-2 uppercase">Original Rider (Pickup)</h4>
                              <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                  <span className="text-gray-600 w-20">Name:</span>
                                  <span className="font-medium text-gray-900">{orderDetails.handover.original_rider.name}</span>
                                </div>
                                {orderDetails.handover.original_rider.phone && (
                                  <div className="flex items-center gap-3">
                                    <span className="text-gray-600 w-20">Phone:</span>
                                    <a
                                      href={`tel:${orderDetails.handover.original_rider.phone}`}
                                      className="font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1"
                                    >
                                      <Phone className="w-4 h-4" />
                                      {orderDetails.handover.original_rider.phone}
                                    </a>
                                  </div>
                                )}
                                {orderDetails.handover.original_rider.vehicle && (
                                  <div className="flex items-center gap-3">
                                    <span className="text-gray-600 w-20">Vehicle:</span>
                                    <span className="font-medium text-gray-900">{orderDetails.handover.original_rider.vehicle}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* New Rider */}
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                              <h4 className="text-sm font-semibold text-green-900 mb-2 uppercase">Current Rider (Delivery)</h4>
                              <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                  <span className="text-gray-600 w-20">Name:</span>
                                  <span className="font-medium text-gray-900">{orderDetails.handover.new_rider.name}</span>
                                </div>
                                {orderDetails.handover.new_rider.phone && (
                                  <div className="flex items-center gap-3">
                                    <span className="text-gray-600 w-20">Phone:</span>
                                    <a
                                      href={`tel:${orderDetails.handover.new_rider.phone}`}
                                      className="font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1"
                                    >
                                      <Phone className="w-4 h-4" />
                                      {orderDetails.handover.new_rider.phone}
                                    </a>
                                  </div>
                                )}
                                {orderDetails.handover.new_rider.vehicle && (
                                  <div className="flex items-center gap-3">
                                    <span className="text-gray-600 w-20">Vehicle:</span>
                                    <span className="font-medium text-gray-900">{orderDetails.handover.new_rider.vehicle}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
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
                          </>
                        )}
                      </div>
                    )}

                    {/* Order Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
                        <Route className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          {orderDetails.multi_parcel?.is_multi_parcel
                            ? 'Route Actual KM (for all orders)'
                            : 'Route Actual KM'
                          }
                        </p>
                        <p className="text-lg font-bold text-gray-900">
                          {orderDetails.order.route_actual_km && orderDetails.order.route_actual_km > 0
                            ? `${orderDetails.order.route_actual_km.toFixed(1)} km`
                            : orderDetails.order.status === 'delivered'
                              ? 'Not recorded'
                              : 'In Progress'}
                        </p>
                        {orderDetails.multi_parcel?.is_multi_parcel && (
                          <p className="text-xs text-gray-500 mt-1">
                            Combined for {orderDetails.multi_parcel.total_parcels} orders
                          </p>
                        )}
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-gray-200 text-center col-span-2">
                        <Package className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Samples</p>
                        {orderDetails.order.samples && orderDetails.order.samples.length > 0 ? (
                          <p className="text-lg font-bold text-gray-900">
                            {orderDetails.order.samples.map(s => `${s.quantity} ${s.sample_type}`).join(', ')}
                          </p>
                        ) : orderDetails.order.sample_type ? (
                          <p className="text-lg font-bold text-gray-900 capitalize">
                            {orderDetails.order.sample_quantity} {orderDetails.order.sample_type}
                          </p>
                        ) : (
                          <p className="text-lg font-bold text-gray-900">Not Applicable</p>
                        )}
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

                    {/* Handover Information - Show if handover occurred */}
                    {orderDetails.handover && (
                      <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Route className="w-5 h-5 text-orange-600" />
                          <h3 className="font-semibold text-orange-900">Handover Occurred</h3>
                          <span className={`ml-auto text-xs px-2 py-1 rounded ${
                            orderDetails.handover.status === 'confirmed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {orderDetails.handover.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          {/* Original Rider (Rider A) */}
                          <div className="bg-white border border-orange-200 rounded-lg p-3">
                            <label className="text-xs font-medium text-orange-700 uppercase">Original Rider (Pickup)</label>
                            <div className="mt-2 space-y-1">
                              <p className="font-semibold text-gray-900">{orderDetails.handover.original_rider.name}</p>
                              <p className="text-sm text-gray-600">{orderDetails.handover.original_rider.phone}</p>
                              <p className="text-xs text-gray-500">{orderDetails.handover.original_rider.vehicle || 'N/A'}</p>
                            </div>
                          </div>

                          {/* New Rider (Rider B) */}
                          <div className="bg-white border border-orange-200 rounded-lg p-3">
                            <label className="text-xs font-medium text-orange-700 uppercase">New Rider (Delivery)</label>
                            <div className="mt-2 space-y-1">
                              <p className="font-semibold text-gray-900">{orderDetails.handover.new_rider.name}</p>
                              <p className="text-sm text-gray-600">{orderDetails.handover.new_rider.phone}</p>
                              <p className="text-xs text-gray-500">{orderDetails.handover.new_rider.vehicle || 'N/A'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Handover Reason */}
                        {orderDetails.handover.reason && (
                          <div className="bg-white border border-orange-200 rounded-lg p-3 mb-3">
                            <label className="text-xs font-medium text-orange-700 uppercase">Handover Reason</label>
                            <p className="text-sm text-gray-900 mt-1">{orderDetails.handover.reason}</p>
                          </div>
                        )}

                        {/* Handover Timeline */}
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div className="bg-white border border-orange-200 rounded p-2">
                            <label className="text-orange-700 font-medium">Initiated</label>
                            <p className="text-gray-900 mt-1">
                              {new Date(orderDetails.handover.initiated_at).toLocaleString('en-US', { timeZone: 'Asia/Colombo' })}
                            </p>
                          </div>
                          {orderDetails.handover.accepted_at && (
                            <div className="bg-white border border-orange-200 rounded p-2">
                              <label className="text-orange-700 font-medium">Accepted</label>
                              <p className="text-gray-900 mt-1">
                                {new Date(orderDetails.handover.accepted_at).toLocaleString('en-US', { timeZone: 'Asia/Colombo' })}
                              </p>
                            </div>
                          )}
                          {orderDetails.handover.confirmed_at && (
                            <div className="bg-white border border-green-600 rounded p-2">
                              <label className="text-green-700 font-medium">Confirmed</label>
                              <p className="text-gray-900 mt-1">
                                {new Date(orderDetails.handover.confirmed_at).toLocaleString('en-US', { timeZone: 'Asia/Colombo' })}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Multi-Parcel Route Info */}
                    {orderDetails.multi_parcel?.is_multi_parcel && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Package className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-blue-900">Multi-Parcel Route</h3>
                              <span className="text-xs px-2 py-1 bg-blue-200 text-blue-900 rounded-full font-medium">
                                {orderDetails.multi_parcel.completed_parcels}/{orderDetails.multi_parcel.total_parcels} Delivered
                              </span>
                            </div>
                            <p className="text-sm text-blue-800 mb-3">
                              This order is part of a multi-parcel route.
                              Route Status: <span className="font-semibold">{orderDetails.multi_parcel.route_status?.replace(/_/g, ' ').toUpperCase()}</span>
                            </p>

                            {orderDetails.multi_parcel.other_orders && orderDetails.multi_parcel.other_orders.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-xs font-semibold text-blue-900 mb-2">Other Orders in This Route:</p>
                                {orderDetails.multi_parcel.other_orders.map((otherOrder: any) => (
                                  <div key={otherOrder.id} className="bg-white border border-blue-200 rounded p-2 text-xs">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-mono text-blue-900 font-medium">{otherOrder.order_number}</span>
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusConfig(otherOrder.status).bg} ${getStatusConfig(otherOrder.status).color}`}>
                                        {otherOrder.status?.replace(/_/g, ' ').toUpperCase()}
                                      </span>
                                    </div>
                                    <div className="text-gray-600">
                                      <p>{otherOrder.center_name}</p>
                                      {otherOrder.sample_type && <p>Sample: {otherOrder.sample_type}</p>}
                                      {otherOrder.urgency && (
                                        <span className={`inline-block mt-1 px-2 py-0.5 rounded ${otherOrder.urgency === 'urgent' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'}`}>
                                          {otherOrder.urgency}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
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
                      {/* Vertical timeline line */}
                      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                      <div className="space-y-6">
                        {/* Order Created */}
                        {orderDetails.order.created_at && (
                          <div className="relative pl-16">
                            <div className="absolute left-0 w-12 h-12 rounded-full bg-blue-100 border-4 border-white flex items-center justify-center shadow-lg">
                              <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="bg-white p-5 rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-bold text-gray-900 text-lg">📄 Order Created</h4>
                                <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                                  {new Date(orderDetails.order.created_at).toLocaleString('en-US', { timeZone: 'Asia/Colombo' })}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mb-2">
                                <span className="font-semibold text-blue-600">{orderDetails.order.center_name}</span> created order for sample delivery
                              </p>
                              {orderDetails.order.center_phone && (
                                <p className="text-xs text-gray-600 flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  Contact: {orderDetails.order.center_phone}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Rider Assigned */}
                        {orderDetails.order.assigned_at && orderDetails.order.rider_name && (
                          <div className="relative pl-16">
                            <div className="absolute left-0 w-12 h-12 rounded-full bg-purple-100 border-4 border-white flex items-center justify-center shadow-lg">
                              <User className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="bg-white p-5 rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-bold text-gray-900 text-lg">👤 Rider Assigned</h4>
                                <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                                  {new Date(orderDetails.order.assigned_at).toLocaleString('en-US', { timeZone: 'Asia/Colombo' })}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mb-2">
                                Order assigned to rider <span className="font-semibold text-purple-600">{orderDetails.handover ? orderDetails.handover.original_rider.name : orderDetails.order.rider_name}</span>
                              </p>
                              <div className="flex flex-wrap gap-2 text-xs">
                                {orderDetails.order.rider_phone && (
                                  <span className="text-gray-600 bg-gray-50 px-2 py-1 rounded flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {orderDetails.order.rider_phone}
                                  </span>
                                )}
                                {orderDetails.order.vehicle_number && (
                                  <span className="text-gray-600 bg-gray-50 px-2 py-1 rounded flex items-center gap-1">
                                    <Truck className="w-3 h-3" />
                                    {orderDetails.order.vehicle_number}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Sample Picked Up */}
                        {orderDetails.order.picked_up_at && (
                          <div className="relative pl-16">
                            <div className="absolute left-0 w-12 h-12 rounded-full bg-teal-100 border-4 border-white flex items-center justify-center shadow-lg">
                              <Package className="w-5 h-5 text-teal-600" />
                            </div>
                            <div className="bg-white p-5 rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-bold text-gray-900 text-lg">📦 Sample Picked Up</h4>
                                <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                                  {new Date(orderDetails.order.picked_up_at).toLocaleString('en-US', { timeZone: 'Asia/Colombo' })}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">
                                <span className="font-semibold text-teal-600">{orderDetails.handover ? orderDetails.handover.original_rider.name : orderDetails.order.rider_name}</span> picked up samples from{' '}
                                <span className="font-semibold text-blue-600">{orderDetails.order.center_name}</span>
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Handovers */}
                        {orderDetails.handover && orderDetails.handover.status === 'confirmed' && orderDetails.handover.confirmed_at && (
                          <div className="relative pl-16">
                            <div className="absolute left-0 w-12 h-12 rounded-full bg-orange-100 border-4 border-white flex items-center justify-center shadow-lg">
                              <Users className="w-5 h-5 text-orange-600" />
                            </div>
                            <div className="bg-white p-5 rounded-xl border-2 border-orange-300 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-bold text-gray-900 text-lg">🔄 Handover Completed</h4>
                                <span className="text-sm text-gray-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                                  {new Date(orderDetails.handover.confirmed_at).toLocaleString('en-US', { timeZone: 'Asia/Colombo' })}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mb-3">
                                <span className="font-semibold text-orange-600">{orderDetails.handover.original_rider.name}</span>
                                {orderDetails.handover.original_rider.phone && (
                                  <span className="text-xs text-gray-600"> ({orderDetails.handover.original_rider.phone})</span>
                                )}
                                {' '}handed over to{' '}
                                <span className="font-semibold text-orange-600">{orderDetails.handover.new_rider.name}</span>
                                {orderDetails.handover.new_rider.phone && (
                                  <span className="text-xs text-gray-600"> ({orderDetails.handover.new_rider.phone})</span>
                                )}
                              </p>
                              {orderDetails.handover.reason && (
                                <p className="text-xs text-gray-600 bg-orange-50 p-2 rounded border border-orange-100">
                                  <span className="font-medium">Reason:</span> {orderDetails.handover.reason}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* In Transit */}
                        {orderDetails.order.delivery_started_at && (
                          <div className="relative pl-16">
                            <div className="absolute left-0 w-12 h-12 rounded-full bg-blue-100 border-4 border-white flex items-center justify-center shadow-lg">
                              <Truck className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="bg-white p-5 rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-bold text-gray-900 text-lg">🚚 In Transit to Hospital</h4>
                                <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                                  {new Date(orderDetails.order.delivery_started_at).toLocaleString('en-US', { timeZone: 'Asia/Colombo' })}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">
                                En route to <span className="font-semibold text-green-600">{orderDetails.order.hospital_name}</span>
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Delivered */}
                        {orderDetails.order.delivered_at && (
                          <div className="relative pl-16">
                            <div className="absolute left-0 w-12 h-12 rounded-full bg-green-100 border-4 border-white flex items-center justify-center shadow-lg">
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="bg-white p-5 rounded-xl border-2 border-green-300 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-bold text-gray-900 text-lg">✅ Delivered Successfully</h4>
                                <span className="text-sm text-gray-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                                  {new Date(orderDetails.order.delivered_at).toLocaleString('en-US', { timeZone: 'Asia/Colombo' })}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mb-2">
                                Samples delivered to <span className="font-semibold text-green-600">{orderDetails.order.hospital_name}</span>
                              </p>
                              {orderDetails.order.hospital_contact_phone && (
                                <p className="text-xs text-gray-600 flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  Contact: {orderDetails.order.hospital_contact_phone}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Cancelled */}
                        {orderDetails.order.cancelled_at && (
                          <div className="relative pl-16">
                            <div className="absolute left-0 w-12 h-12 rounded-full bg-red-100 border-4 border-white flex items-center justify-center shadow-lg">
                              <XCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div className="bg-white p-5 rounded-xl border-2 border-red-300 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-bold text-gray-900 text-lg">❌ Order Cancelled</h4>
                                <span className="text-sm text-gray-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                                  {new Date(orderDetails.order.cancelled_at).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">Order was cancelled</p>
                            </div>
                          </div>
                        )}
                      </div>
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
                        {orderDetails.qr_scans
                          .filter((scan, index, self) =>
                            // Keep only the first scan of each scan_type
                            index === self.findIndex((s) => s.scan_type === scan.scan_type)
                          )
                          .map((scan, index) => (
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
                                    {Number(scan.scan_coordinates_lat).toFixed(6)}, {Number(scan.scan_coordinates_lng).toFixed(6)}
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