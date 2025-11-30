"use client";

import {
  X,
  XCircle,
  MapPin,
  Phone,
  Mail,
  Truck,
  Clock,
  User,
  Calendar,
  FileText,
  Activity,
  Shield,
  Hospital,
  Route,
  Award,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  TrendingUp,
  Filter,
  Package,
  Timer
} from "lucide-react";

import { useState, useEffect } from "react";
import { operationsApi } from "@/lib/api";

interface RiderDetails {
  id: string;
  full_name: string;
  mobile_number: string;
  nic_number: string;
  email?: string;
  date_of_birth: string;
  address: string;
  emergency_contact: string;
  vehicle_type: string;
  vehicle_number: string;
  license_number: string;
  experience: string;
  areas_known: string[];
  hospital_affiliation: {
    main_hospital?: string;
    regional_hospitals: string[];
  };
  status: string;
  total_deliveries: number;
  successful_deliveries: number;
  cancelled_deliveries: number;
  average_delivery_time: number;
  total_km: number;
  monthly_km: number;
  weekly_km: number;
  created_at: string;
  last_active: string;
  current_location?: {
    latitude: number;
    longitude: number;
  };
  // Backend S3 image URLs
  profile_image_url?: string;
  license_image_url?: string;
  license_image_back_url?: string;
  nic_image_url?: string;
  nic_image_back_url?: string;
  // Legacy field names
  profile_picture?: string;
  driver_license_front?: string;
  driver_license_back?: string;
  nic_front?: string;
  nic_back?: string;
}

interface RiderDetailModalProps {
  rider: RiderDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (riderId: string, newStatus: string) => Promise<void>;
  onKmFilterChange?: (riderId: string, filter: 'all' | 'monthly' | 'weekly') => Promise<void>;
  isProcessing?: boolean;
}

export function RiderDetailModal({
  rider,
  isOpen,
  onClose,
  onStatusChange,
  onKmFilterChange,
  isProcessing = false
}: RiderDetailModalProps) {
  const [kmFilter, setKmFilter] = useState<'all' | 'monthly' | 'weekly'>('monthly');
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);

  // Fetch orders when modal opens or filters change
  const fetchOrders = async () => {
    if (!rider?.id || !isOpen) return;

    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const params: any = { limit: 50 };

      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;

      const response = await operationsApi.getRiderOrders(rider.id, params);
      if (response.success && response.data) {
        // Remove duplicates based on order ID
        const uniqueOrders = (response.data.orders || []).filter((order: any, index: number, self: any[]) =>
          index === self.findIndex((o: any) => o.id === order.id)
        );
        setOrders(uniqueOrders);
      }
    } catch (error) {
      console.error('Failed to fetch rider orders:', error);
      setOrdersError('Failed to load rider orders');
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    setCurrentPage(1); // Reset to first page when filters change
  }, [rider?.id, isOpen, dateFrom, dateTo, statusFilter]);

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

  if (!isOpen || !rider) return null;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          icon: CheckCircle2,
          color: '#10b981',
          bg: 'bg-green-100',
          text: 'Active',
          className: 'text-green-800'
        };
      case 'inactive':
      case 'offline':
        return {
          icon: Clock,
          color: '#6b7280',
          bg: 'bg-gray-100',
          text: 'Offline',
          className: 'text-gray-800'
        };
      case 'suspended':
        return {
          icon: AlertTriangle,
          color: '#f59e0b',
          bg: 'bg-yellow-100',
          text: 'Suspended',
          className: 'text-yellow-800'
        };
      case 'blocked':
        return {
          icon: AlertTriangle,
          color: '#ef4444',
          bg: 'bg-red-100',
          text: 'Blocked',
          className: 'text-red-800'
        };
      default:
        return {
          icon: AlertTriangle,
          color: '#6b7280',
          bg: 'bg-gray-100',
          text: status,
          className: 'text-gray-800'
        };
    }
  };

  const statusConfig = getStatusConfig(rider.status);
  const StatusIcon = statusConfig.icon;
  const successRate = rider.total_deliveries > 0 ? 
    Math.round((rider.successful_deliveries / rider.total_deliveries) * 100) : 0;

  const getKmValue = () => {
    switch (kmFilter) {
      case 'weekly':
        return rider.weekly_km || 0;
      case 'monthly':
        return rider.monthly_km || 0;
      default:
        return rider.total_km || 0;
    }
  };

  const getKmLabel = () => {
    switch (kmFilter) {
      case 'weekly':
        return 'This Week';
      case 'monthly':
        return 'This Month';
      default:
        return 'Total KMs';
    }
  };

  const handleKmFilterChange = async (newFilter: 'all' | 'monthly' | 'weekly') => {
    setKmFilter(newFilter);
    if (onKmFilterChange) {
      await onKmFilterChange(rider.id, newFilter);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const handleStatusChange = async (newStatus: string) => {
    if (onStatusChange) {
      await onStatusChange(rider.id, newStatus);
    }
  };

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
          className="relative w-full max-w-5xl rounded-3xl overflow-hidden"
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
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
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
                {(rider.profile_image_url || rider.profile_picture) ? (
                  <img
                    src={rider.profile_image_url || rider.profile_picture}
                    alt={rider.full_name}
                    className="w-full h-full rounded-2xl object-cover"
                    onError={(e) => {
                      // Fallback to icon if image fails to load
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <Truck
                  className="w-10 h-10 text-white"
                  style={{ display: (rider.profile_image_url || rider.profile_picture) ? 'none' : 'block' }}
                />
              </div>
              
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">{rider.full_name}</h2>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Truck className="w-5 h-5" />
                    <span className="text-white/90 capitalize">{rider.vehicle_type}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Hospital className="w-5 h-5" />
                    <span className="text-white/90">{rider.hospital_affiliation?.main_hospital || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Route className="w-5 h-5" />
                    <span className="text-white/90">{rider.total_km.toFixed(1)} KM Total</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div 
                    className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${statusConfig.bg}`}
                  >
                    <StatusIcon className={`w-5 h-5 ${statusConfig.className}`} />
                    <span className={`font-semibold ${statusConfig.className}`}>
                      {statusConfig.text}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-white/80">
                    <Activity className="w-4 h-4" />
                    <span className="text-sm">
                      Last Active: {new Date(rider.last_active).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Performance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-teal-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-teal-600 font-medium">Total Deliveries</p>
                    <p className="text-2xl font-bold text-teal-800">{rider.total_deliveries}</p>
                  </div>
                  <div className="w-12 h-12 bg-teal-200 rounded-xl flex items-center justify-center">
                    <Route className="w-6 h-6 text-teal-600" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Success Rate</p>
                    <p className="text-2xl font-bold text-green-800">{successRate}%</p>
                  </div>
                  <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-2xl border border-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-600 font-medium">Avg. Time</p>
                    <p className="text-2xl font-bold text-amber-800">{formatTime(rider.average_delivery_time)}</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-200 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Total KMs</p>
                    <p className="text-2xl font-bold text-purple-800">{rider.total_km.toFixed(1)} KM</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-200 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* KM Analytics Section */}
            <div className="mb-8">
              <div 
                className="rounded-3xl p-6"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
                  border: '1px solid rgba(203, 213, 225, 0.3)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)'
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Route className="w-6 h-6 text-purple-600" />
                    KM Analytics & Performance
                  </h3>
                  
                  {/* Filter Buttons */}
                  <div className="flex items-center gap-2">
                    {(['weekly', 'monthly', 'all'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => handleKmFilterChange(filter)}
                        className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                          kmFilter === filter
                            ? 'bg-purple-500 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {filter === 'weekly' ? 'This Week' : filter === 'monthly' ? 'This Month' : 'All Time'}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* KM Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-2xl border border-teal-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-teal-600 font-medium">{getKmLabel()}</p>
                      <Route className="w-5 h-5 text-teal-600" />
                    </div>
                    <p className="text-2xl font-bold text-teal-800">{getKmValue().toFixed(1)} KM</p>
                    <p className="text-xs text-teal-600 mt-1">Primary metric</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-2xl border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-green-600 font-medium">Avg per Day</p>
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-800">
                      {kmFilter === 'weekly' ? (getKmValue() / 7).toFixed(1) : 
                       kmFilter === 'monthly' ? (getKmValue() / 30).toFixed(1) : 
                       (getKmValue() / Math.max(1, Math.ceil((new Date().getTime() - new Date(rider.created_at).getTime()) / (1000 * 60 * 60 * 24)))).toFixed(1)} KM
                    </p>
                    <p className="text-xs text-green-600 mt-1">Daily average</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-2xl border border-amber-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-amber-600 font-medium">KM per Delivery</p>
                      <Activity className="w-5 h-5 text-amber-600" />
                    </div>
                    <p className="text-2xl font-bold text-amber-800">
                      {rider.total_deliveries > 0 ? (getKmValue() / rider.total_deliveries).toFixed(1) : '0.0'} KM
                    </p>
                    <p className="text-xs text-amber-600 mt-1">Efficiency metric</p>
                  </div>
                </div>
                
                {/* Period Breakdown */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Monthly Breakdown
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">This Month</span>
                        <span className="text-sm font-medium text-gray-800">{rider.monthly_km.toFixed(1)} KM</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">This Week</span>
                        <span className="text-sm font-medium text-gray-800">{rider.weekly_km.toFixed(1)} KM</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">All Time Total</span>
                        <span className="text-sm font-medium text-gray-800">{rider.total_km.toFixed(1)} KM</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-2xl border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Performance Insights
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Efficiency Rating</span>
                        <span className="text-sm font-medium text-green-600">
                          {rider.total_deliveries > 0 && getKmValue() / rider.total_deliveries < 15 ? 'Excellent' : 
                           rider.total_deliveries > 0 && getKmValue() / rider.total_deliveries < 25 ? 'Good' : 'Average'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Activity Level</span>
                        <span className="text-sm font-medium text-teal-600">
                          {getKmValue() > 100 ? 'High' : getKmValue() > 50 ? 'Medium' : 'Low'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Consistency</span>
                        <span className="text-sm font-medium text-purple-600">
                          {Math.abs(rider.weekly_km * 4 - rider.monthly_km) < rider.monthly_km * 0.2 ? 'Consistent' : 'Variable'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Personal Information */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Personal Information</h3>

                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                      <User className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="font-semibold text-gray-800">{rider.full_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <Phone className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Mobile Number</p>
                      <p className="font-semibold text-gray-800">{rider.mobile_number}</p>
                    </div>
                  </div>

                  {rider.email && (
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Mail className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-semibold text-gray-800">{rider.email}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">NIC Number</p>
                      <p className="font-semibold text-gray-800">{rider.nic_number}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Emergency Contact</p>
                      <p className="font-semibold text-gray-800">{rider.emergency_contact}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-semibold text-gray-800">{rider.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle & Work Information */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Vehicle & Work Details</h3>

                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                      <Truck className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Vehicle Type</p>
                      <p className="font-semibold text-gray-800 capitalize">{rider.vehicle_type}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Vehicle Number</p>
                      <p className="font-semibold text-gray-800">{rider.vehicle_number}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <Shield className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">License Number</p>
                      <p className="font-semibold text-gray-800">{rider.license_number}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Award className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Experience</p>
                      <p className="font-semibold text-gray-800">{rider.experience}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                      <Hospital className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Main Hospital</p>
                      <p className="font-semibold text-gray-800">{rider.hospital_affiliation?.main_hospital || 'N/A'}</p>
                    </div>
                  </div>

                  {rider.hospital_affiliation?.regional_hospitals?.length > 0 && (
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                        <Hospital className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Regional Hospitals</p>
                        <div className="space-y-1">
                          {rider.hospital_affiliation.regional_hospitals.map((hospital, index) => (
                            <p key={index} className="font-semibold text-gray-800 text-sm">{hospital}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {rider.areas_known?.length > 0 && (
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
                        <Navigation className="w-6 h-6 text-cyan-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Areas Known</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {rider.areas_known.map((area, index) => (
                            <span key={index} className="px-2 py-1 bg-cyan-100 text-cyan-800 text-xs rounded-full">
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Joined Date</p>
                      <p className="font-semibold text-gray-800">
                        {new Date(rider.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Full Width Orders Section */}
            <div className="space-y-6 mb-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Package className="w-6 h-6 text-orange-600" />
                  Rider Orders
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-600">From:</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-600">To:</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-600">Status:</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="all">All Orders</option>
                      <option value="pending">Pending</option>
                      <option value="assigned">Assigned</option>
                      <option value="picked_up">Picked Up</option>
                      <option value="in_transit">In Transit</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              {ordersLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading rider orders...</p>
                </div>
              ) : ordersError ? (
                <div className="text-center py-12">
                  <div className="text-red-500 text-lg font-medium mb-2">Error Loading Orders</div>
                  <p className="text-gray-500">{ordersError}</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium">No orders found</p>
                  <p className="text-gray-400">Try adjusting your date range or status filter</p>
                </div>
              ) : (
                <div>
                  <div className="grid gap-4 mb-6">
                    {currentOrders.map((order: any, index: number) => (
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
                            <p className="text-sm text-gray-600">{order.center_name} → {order.hospital_name}</p>
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

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 block">Distance:</span>
                          <span className="font-medium text-gray-800">{order.distance_km ? `${order.distance_km.toFixed(1)} km` : 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Duration:</span>
                          <span className="font-medium text-gray-800">{order.delivery_duration ? `${order.delivery_duration} min` : 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Sample Type:</span>
                          <span className="font-medium text-gray-800">{order.sample_type || 'Not specified'}</span>
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
                                ? 'bg-orange-500 text-white'
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

            {/* Document Verification Section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6 text-teal-600" />
                Document Verification
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Profile Picture */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-teal-600" />
                    <span className="text-sm font-semibold text-gray-700">Profile Picture</span>
                  </div>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50">
                    {(rider.profile_image_url || rider.profile_picture) ? (
                      <div className="space-y-2">
                        <img
                          src={rider.profile_image_url || rider.profile_picture}
                          alt="Profile"
                          className="w-full h-32 object-cover rounded-lg"
                          onError={(e) => {
                            // Fallback to no image state if loading fails
                            const container = e.currentTarget.parentElement;
                            if (container) {
                              container.innerHTML = `
                                <div class="text-center py-6">
                                  <svg class="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                  </svg>
                                  <p class="text-xs text-gray-500">Image failed to load</p>
                                </div>
                              `;
                            }
                          }}
                        />
                        <div className="flex items-center gap-1 text-green-600 text-xs">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Uploaded</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <User className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">No profile picture</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Driver License Front */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-gray-700">Driver License (Front)</span>
                  </div>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50">
                    {(rider.license_image_url || rider.driver_license_front) ? (
                      <div className="space-y-2">
                        <img
                          src={rider.license_image_url || rider.driver_license_front}
                          alt="Driver License Front"
                          className="w-full h-32 object-cover rounded-lg"
                          onError={(e) => {
                            const container = e.currentTarget.parentElement;
                            if (container) {
                              container.innerHTML = `
                                <div class="text-center py-6">
                                  <svg class="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                                  </svg>
                                  <p class="text-xs text-gray-500">Image failed to load</p>
                                </div>
                              `;
                            }
                          }}
                        />
                        <div className="flex items-center gap-1 text-green-600 text-xs">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Uploaded</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Shield className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">Not uploaded</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Driver License Back */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-gray-700">Driver License (Back)</span>
                  </div>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50">
                    {(rider.license_image_back_url || rider.driver_license_back) ? (
                      <div className="space-y-2">
                        <img
                          src={rider.license_image_back_url || rider.driver_license_back}
                          alt="Driver License Back"
                          className="w-full h-32 object-cover rounded-lg"
                          onError={(e) => {
                            const container = e.currentTarget.parentElement;
                            if (container) {
                              container.innerHTML = `
                                <div class="text-center py-6">
                                  <svg class="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                                  </svg>
                                  <p class="text-xs text-gray-500">Image failed to load</p>
                                </div>
                              `;
                            }
                          }}
                        />
                        <div className="flex items-center gap-1 text-green-600 text-xs">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Uploaded</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Shield className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">Not uploaded</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* NIC Front */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-semibold text-gray-700">NIC (Front)</span>
                  </div>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50">
                    {(rider.nic_image_url || rider.nic_front) ? (
                      <div className="space-y-2">
                        <img
                          src={rider.nic_image_url || rider.nic_front}
                          alt="NIC Front"
                          className="w-full h-32 object-cover rounded-lg"
                          onError={(e) => {
                            const container = e.currentTarget.parentElement;
                            if (container) {
                              container.innerHTML = `
                                <div class="text-center py-6">
                                  <svg class="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                  </svg>
                                  <p class="text-xs text-gray-500">Image failed to load</p>
                                </div>
                              `;
                            }
                          }}
                        />
                        <div className="flex items-center gap-1 text-green-600 text-xs">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Uploaded</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">Not uploaded</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* NIC Back */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-semibold text-gray-700">NIC (Back)</span>
                  </div>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50">
                    {(rider.nic_image_back_url || rider.nic_back) ? (
                      <div className="space-y-2">
                        <img
                          src={rider.nic_image_back_url || rider.nic_back}
                          alt="NIC Back"
                          className="w-full h-32 object-cover rounded-lg"
                          onError={(e) => {
                            const container = e.currentTarget.parentElement;
                            if (container) {
                              container.innerHTML = `
                                <div class="text-center py-6">
                                  <svg class="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                  </svg>
                                  <p class="text-xs text-gray-500">Image failed to load</p>
                                </div>
                              `;
                            }
                          }}
                        />
                        <div className="flex items-center gap-1 text-green-600 text-xs">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Uploaded</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">Not uploaded</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Document Verification Status */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-semibold text-gray-700">Verification Status</span>
                  </div>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50">
                    <div className="space-y-3">
                      {/* Calculate verification completion */}
                      {(() => {
                        const documents = [
                          rider.profile_image_url || rider.profile_picture,
                          rider.license_image_url || rider.driver_license_front,
                          rider.license_image_back_url || rider.driver_license_back,
                          rider.nic_image_url || rider.nic_front,
                          rider.nic_image_back_url || rider.nic_back
                        ];
                        const uploadedCount = documents.filter(doc => doc).length;
                        const totalCount = documents.length;
                        const percentage = Math.round((uploadedCount / totalCount) * 100);
                        
                        return (
                          <>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-gray-600">
                                {uploadedCount}/{totalCount} Documents
                              </span>
                              <span className="text-xs font-bold text-gray-800">
                                {percentage}%
                              </span>
                            </div>
                            
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-amber-500 to-amber-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            
                            <div className="mt-3">
                              {percentage === 100 ? (
                                <div className="flex items-center gap-1 text-green-600 text-xs">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span className="font-medium">Complete</span>
                                </div>
                              ) : percentage >= 60 ? (
                                <div className="flex items-center gap-1 text-amber-600 text-xs">
                                  <Clock className="w-3 h-3" />
                                  <span className="font-medium">Partial</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-red-600 text-xs">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span className="font-medium">Incomplete</span>
                                </div>
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}