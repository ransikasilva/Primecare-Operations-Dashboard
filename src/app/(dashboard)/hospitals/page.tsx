"use client";

import { useSystemOverview, useApproveHospitalNetwork } from '@/hooks/useApi';
import { useState, useEffect } from 'react';
import { HospitalNetworkDetailModal } from '@/components/modals/HospitalNetworkDetailModal';
import { operationsApi } from '@/lib/api';
import {
  Hospital,
  Building,
  Network,
  Users,
  User,
  Clock,
  Eye,
  Settings,
  CheckCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Search,
  Filter,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Activity,
  Check,
  X,
  Package,
  Truck,
  Timer
} from 'lucide-react';

export default function HospitalsPage() {
  const { data: systemData, loading, error } = useSystemOverview();
  const { approveNetwork } = useApproveHospitalNetwork();
  const [selectedHospital, setSelectedHospital] = useState<any>(null);
  const [selectedHospitalType, setSelectedHospitalType] = useState<'main' | 'regional'>('main');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending_hq_approval' | 'pending_main_hospital_approval' | 'rejected'>('all');

  // Extract hospital networks data
  const allHospitalNetworks = (systemData as any)?.data?.hospital_networks || [];

  // Extract main hospitals from networks with their regional hospitals
  const allMainHospitals = allHospitalNetworks.flatMap((network: any) => {
    const mainHospital = network.hospitals?.find((h: any) => h.is_main_hospital);
    if (mainHospital) {
      const regionalHospitals = network.hospitals?.filter((h: any) => !h.is_main_hospital) || [];
      return [{
        ...mainHospital,
        network_name: network.network_name,
        network_id: network.id,
        network_status: network.network_status,
        admin_name: network.admin_name,
        admin_email: network.admin_email,
        admin_phone: network.admin_phone,
        network_created_at: network.network_created_at,
        regionalHospitals: regionalHospitals
      }];
    }
    return [];
  });

  // Filter main hospitals based on search and filters
  const filteredMainHospitals = allMainHospitals.filter((hospital: any) => {
    const matchesSearch = hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hospital.network_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hospital.admin_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hospital.admin_phone?.includes(searchTerm);

    const matchesStatus = filterStatus === 'all' || hospital.network_status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Statistics
  const stats = {
    total: allMainHospitals.length,
    active: allMainHospitals.filter((h: any) => h.network_status === 'active').length,
    inactive: allMainHospitals.filter((h: any) => h.network_status === 'inactive').length,
    pending: allMainHospitals.filter((h: any) => h.network_status === 'pending').length,
    totalRegionalHospitals: allMainHospitals.reduce((sum: number, h: any) => sum + (h.regionalHospitals?.length || 0), 0)
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading hospital networks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="text-red-500 text-lg font-medium mb-2">Error Loading Hospital Networks</div>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div 
        className="relative overflow-hidden rounded-3xl p-8"
        style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
          boxShadow: '0 20px 40px rgba(59, 130, 246, 0.3)'
        }}
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Hospital className="w-8 h-8" />
                Hospital Network Management
              </h1>
              <p className="text-white/90 text-lg mb-3">
                Comprehensive management of all hospital networks and their facilities
              </p>
              <p className="text-white/80 text-base">
                {stats.total} main hospitals • {stats.totalRegionalHospitals} regional hospitals • {stats.active} active • {stats.pending} pending
              </p>
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div 
          className="rounded-3xl p-6"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
            border: '1px solid rgba(203, 213, 225, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: '#3b82f6' + '20', border: `2px solid #3b82f6` + '30' }}
          >
            <Network className="w-6 h-6" style={{ color: '#3b82f6' }} />
          </div>
          <h3 className="text-3xl font-bold text-gray-800 mb-2">{stats.total}</h3>
          <p className="text-sm font-medium text-gray-600">Total Networks</p>
        </div>

        <div 
          className="rounded-3xl p-6"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
            border: '1px solid rgba(203, 213, 225, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: '#10b981' + '20', border: `2px solid #10b981` + '30' }}
          >
            <CheckCircle className="w-6 h-6" style={{ color: '#10b981' }} />
          </div>
          <h3 className="text-3xl font-bold text-gray-800 mb-2">{stats.active}</h3>
          <p className="text-sm font-medium text-gray-600">Active Networks</p>
        </div>

        <div 
          className="rounded-3xl p-6"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
            border: '1px solid rgba(203, 213, 225, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: '#f59e0b' + '20', border: `2px solid #f59e0b` + '30' }}
          >
            <AlertCircle className="w-6 h-6" style={{ color: '#f59e0b' }} />
          </div>
          <h3 className="text-3xl font-bold text-gray-800 mb-2">{stats.pending}</h3>
          <p className="text-sm font-medium text-gray-600">Pending</p>
        </div>

        <div 
          className="rounded-3xl p-6"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
            border: '1px solid rgba(203, 213, 225, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: '#ef4444' + '20', border: `2px solid #ef4444` + '30' }}
          >
            <XCircle className="w-6 h-6" style={{ color: '#ef4444' }} />
          </div>
          <h3 className="text-3xl font-bold text-gray-800 mb-2">{stats.inactive}</h3>
          <p className="text-sm font-medium text-gray-600">Inactive</p>
        </div>

        <div 
          className="rounded-3xl p-6"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
            border: '1px solid rgba(203, 213, 225, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: '#8b5cf6' + '20', border: `2px solid #8b5cf6` + '30' }}
          >
            <Hospital className="w-6 h-6" style={{ color: '#8b5cf6' }} />
          </div>
          <h3 className="text-3xl font-bold text-gray-800 mb-2">{stats.totalRegionalHospitals}</h3>
          <p className="text-sm font-medium text-gray-600">Regional Hospitals</p>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div 
        className="rounded-3xl p-6"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
          border: '1px solid rgba(203, 213, 225, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)'
        }}
      >
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search main hospitals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending_hq_approval">Pending HQ Approval</option>
                  <option value="pending_main_hospital_approval">Pending Main Hospital Approval</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            Showing {filteredMainHospitals.length} of {stats.total} main hospitals
          </div>
        </div>
      </div>

      {/* Hospital Networks List */}
      <div 
        className="rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
          border: '1px solid rgba(203, 213, 225, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)'
        }}
      >
        <div className="p-6 border-b border-gray-100/60">
          <h2 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
            <Hospital className="w-6 h-6 text-teal-600" />
            Main Hospitals ({filteredMainHospitals.length})
          </h2>
          <p className="text-gray-600 text-base">Main hospitals with their regional hospital networks</p>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {filteredMainHospitals.length === 0 ? (
              <div className="text-center py-12">
                <Hospital className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">No Main Hospitals Found</p>
                <p className="text-gray-400">Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              filteredMainHospitals.map((hospital: any) => (
                <HospitalNetworkCard
                  key={hospital.id}
                  network={hospital}
                  onViewMainHospital={(hospital: any) => {
                    setSelectedHospital(hospital);
                    setSelectedHospitalType('main');
                    setShowDetailModal(true);
                  }}
                  onViewRegionalHospital={(hospital: any) => {
                    setSelectedHospital(hospital);
                    setSelectedHospitalType('regional');
                    setShowDetailModal(true);
                  }}
                  onApproveHospital={async (hospitalId: string, networkId: string) => {
                    setIsProcessing(true);
                    try {
                      await approveNetwork(networkId, 'Approved by Operations HQ');
                      // Refresh data after approval
                      window.location.reload();
                    } catch (error) {
                      console.error('Hospital approval failed:', error);
                    } finally {
                      setIsProcessing(false);
                    }
                  }}
                  isProcessing={isProcessing}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Hospital Detail Modal */}
      {selectedHospital && (
        <HospitalDetailModal
          hospital={selectedHospital}
          hospitalType={selectedHospitalType}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedHospital(null);
          }}
          onApprove={async (hospitalId: string, networkId: string) => {
            setIsProcessing(true);
            try {
              await approveNetwork(networkId, 'Approved by Operations HQ');
              setShowDetailModal(false);
              setSelectedHospital(null);
              // Refresh data after approval
              window.location.reload();
            } catch (error) {
              console.error('Hospital approval failed:', error);
            } finally {
              setIsProcessing(false);
            }
          }}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
}

// Main Hospital Card Component
function HospitalNetworkCard({
  network,
  onViewMainHospital,
  onViewRegionalHospital,
  onApproveHospital,
  isProcessing
}: {
  network: any;
  onViewMainHospital: (hospital: any) => void;
  onViewRegionalHospital: (hospital: any) => void;
  onApproveHospital: (hospitalId: string, networkId: string) => Promise<void>;
  isProcessing: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="group rounded-3xl transition-all duration-300 hover:transform hover:scale-[1.01]"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.8) 100%)',
        border: '1px solid rgba(203, 213, 225, 0.3)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)'
      }}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: network.network_status === 'active'
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : network.network_status === 'pending'
                  ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                  : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            >
              <Hospital className="w-6 h-6 text-white" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-bold text-gray-900">{network.name}</h3>
                <span className="text-xs px-2 py-1 bg-teal-100 text-teal-700 rounded-full font-medium">
                  Main Hospital
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  network.network_status === 'approved'
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : network.network_status === 'pending_hq_approval'
                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    : network.network_status === 'rejected'
                    ? 'bg-red-100 text-red-800 border-red-200'
                    : 'bg-gray-100 text-gray-800 border-gray-200'
                }`}>
                  {network.network_status === 'pending_hq_approval' ? 'Pending HQ Approval' :
                   network.network_status === 'approved' ? 'Approved' :
                   network.network_status === 'rejected' ? 'Rejected' : network.network_status}
                </span>
              </div>

              <div className="flex items-center gap-4 text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">Admin: {network.admin_name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Hospital className="w-4 h-4" />
                  <span className="text-sm">{network.regionalHospitals?.length || 0} Regional Hospitals</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Created: {new Date(network.network_created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Network:</span>
                  <div className="font-medium text-gray-800">{network.network_name}</div>
                </div>
                <div>
                  <span className="text-gray-500">Location:</span>
                  <div className="font-medium text-gray-800">{network.address || 'Not specified'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                <div>
                  <span className="text-gray-500">Email:</span>
                  <div className="font-medium text-gray-800">{network.admin_email}</div>
                </div>
                <div>
                  <span className="text-gray-500">Phone:</span>
                  <div className="font-medium text-gray-800">{network.admin_phone}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {network.regionalHospitals?.length > 0 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 font-medium"
              >
                {expanded ? 'Hide' : 'Show'} Regional ({network.regionalHospitals.length})
              </button>
            )}

            <button
              onClick={() => onViewMainHospital(network)}
              className="p-3 hover:bg-teal-50 rounded-xl transition-colors"
              title="View Main Hospital Details"
            >
              <Eye className="w-4 h-4 text-teal-600" />
            </button>

            {network.network_status === 'pending_hq_approval' && (
              <button
                onClick={() => onApproveHospital(network.id, network.network_id)}
                disabled={isProcessing}
                className="flex items-center gap-1 px-3 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors disabled:bg-gray-400"
                title="Approve Hospital Network"
              >
                <Check className="w-4 h-4" />
                {isProcessing ? 'Approving...' : 'Approve'}
              </button>
            )}
          </div>
        </div>

        {expanded && network.regionalHospitals?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Building className="w-4 h-4" />
              Regional Hospitals ({network.regionalHospitals.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {network.regionalHospitals.map((hospital: any, index: number) => (
                <div key={index} className="p-3 rounded-lg border bg-teal-50 border-teal-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-teal-600" />
                      <span className="text-sm font-medium text-gray-800">{hospital.name}</span>
                      <span className="text-xs px-2 py-1 bg-teal-100 text-teal-700 rounded-full font-medium">
                        Regional
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        hospital.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : hospital.status === 'pending_main_hospital_approval'
                          ? 'bg-yellow-100 text-yellow-700'
                          : hospital.status === 'inactive'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {hospital.status === 'pending_main_hospital_approval' ? 'Pending Main Hospital Approval' :
                         hospital.status === 'active' ? 'Approved' : hospital.status}
                      </span>
                      <button
                        onClick={() => onViewRegionalHospital({...hospital, network_name: network.network_name, network_id: network.network_id})}
                        className="p-1 hover:bg-teal-100 rounded-lg transition-colors"
                        title="View Regional Hospital Details"
                      >
                        <Eye className="w-3 h-3 text-teal-600" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                    <div>
                      <span className="font-medium">Type:</span> {hospital.hospital_type}
                    </div>
                    <div>
                      <span className="font-medium">Created:</span> {new Date(hospital.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 mt-1">
                    <div>
                      <span className="font-medium">City:</span> {hospital.city}
                    </div>
                    <div>
                      <span className="font-medium">Province:</span> {hospital.province}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Hospital Detail Modal Component
function HospitalDetailModal({
  hospital,
  hospitalType,
  isOpen,
  onClose,
  onApprove,
  isProcessing
}: {
  hospital: any;
  hospitalType: 'main' | 'regional';
  isOpen: boolean;
  onClose: () => void;
  onApprove: (hospitalId: string, networkId: string) => Promise<void>;
  isProcessing: boolean;
}) {
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
    if (!hospital?.id || !isOpen) return;

    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const params: any = { limit: 50 };

      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;

      const response = await operationsApi.getHospitalOrders(hospital.id, params);
      if (response.success && response.data) {
        // Remove duplicates based on order ID
        const uniqueOrders = (response.data.orders || []).filter((order: any, index: number, self: any[]) =>
          index === self.findIndex((o: any) => o.id === order.id)
        );
        setOrders(uniqueOrders);
      }
    } catch (error) {
      console.error('Failed to fetch hospital orders:', error);
      setOrdersError('Failed to load hospital orders');
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    setCurrentPage(1); // Reset to first page when filters change
  }, [hospital?.id, isOpen, dateFrom, dateTo, statusFilter]);

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

  if (!isOpen) return null;

  const isMainHospital = hospitalType === 'main';
  const canApprove = isMainHospital && hospital.network_status === 'pending_hq_approval';

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
          className="relative w-full max-w-4xl rounded-3xl overflow-hidden"
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
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
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
                className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/30 flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              >
                {isMainHospital ? (
                  <Hospital className="w-10 h-10 text-white" />
                ) : (
                  <Building className="w-10 h-10 text-white" />
                )}
              </div>

              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">{hospital.name}</h2>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="px-3 py-1 rounded-full text-sm font-semibold bg-white/20 text-white">
                    {isMainHospital ? 'Main Hospital' : 'Regional Hospital'}
                  </div>
                  <div
                    className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${
                      (isMainHospital ? hospital.network_status : hospital.status) === 'approved' ||
                      (isMainHospital ? hospital.network_status : hospital.status) === 'active'
                        ? 'bg-green-100'
                        : (isMainHospital ? hospital.network_status : hospital.status) === 'pending_hq_approval' ||
                          (isMainHospital ? hospital.network_status : hospital.status) === 'pending_main_hospital_approval'
                        ? 'bg-yellow-100'
                        : (isMainHospital ? hospital.network_status : hospital.status) === 'rejected'
                        ? 'bg-red-100'
                        : 'bg-gray-100'
                    }`}
                  >
                    {(isMainHospital ? hospital.network_status : hospital.status) === 'approved' ||
                     (isMainHospital ? hospital.network_status : hospital.status) === 'active' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (isMainHospital ? hospital.network_status : hospital.status) === 'pending_hq_approval' ||
                       (isMainHospital ? hospital.network_status : hospital.status) === 'pending_main_hospital_approval' ? (
                      <Clock className="w-5 h-5 text-yellow-600" />
                    ) : (isMainHospital ? hospital.network_status : hospital.status) === 'rejected' ? (
                      <XCircle className="w-5 h-5 text-red-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-gray-600" />
                    )}
                    <span
                      className={`font-semibold ${
                        (isMainHospital ? hospital.network_status : hospital.status) === 'approved' ||
                        (isMainHospital ? hospital.network_status : hospital.status) === 'active'
                          ? 'text-green-600'
                          : (isMainHospital ? hospital.network_status : hospital.status) === 'pending_hq_approval' ||
                            (isMainHospital ? hospital.network_status : hospital.status) === 'pending_main_hospital_approval'
                          ? 'text-yellow-600'
                          : (isMainHospital ? hospital.network_status : hospital.status) === 'rejected'
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {isMainHospital
                        ? (hospital.network_status === 'pending_hq_approval' ? 'Pending HQ Approval' :
                           hospital.network_status === 'approved' ? 'Approved' :
                           hospital.network_status === 'rejected' ? 'Rejected' : hospital.network_status)
                        : (hospital.status === 'pending_main_hospital_approval' ? 'Pending Main Hospital Approval' :
                           hospital.status === 'active' ? 'Approved' : hospital.status)
                      }
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-white/80">
                    <Network className="w-4 h-4" />
                    <span className="text-sm">Network: {hospital.network_name}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-white/80">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      Created: {new Date(hospital.created_at || hospital.network_created_at).toLocaleDateString('en-US', {
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
            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Hospital Information */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Hospital Information</h3>

                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                      {isMainHospital ?
                        <Hospital className="w-6 h-6 text-teal-600" /> :
                        <Building className="w-6 h-6 text-teal-600" />
                      }
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Hospital Name</p>
                      <p className="font-semibold text-gray-800">{hospital.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <Network className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Hospital Type</p>
                      <p className="font-semibold text-gray-800">
                        {hospital.hospital_type} {isMainHospital ? '(Main Hospital)' : '(Regional Hospital)'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Network className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Network Name</p>
                      <p className="font-semibold text-gray-800">{hospital.network_name}</p>
                    </div>
                  </div>

                  {hospital.city && hospital.province && (
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="font-semibold text-gray-800">{hospital.city}, {hospital.province}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Created Date</p>
                      <p className="font-semibold text-gray-800">
                        {new Date(hospital.created_at || hospital.network_created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Contact Information</h3>

                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Admin Name</p>
                      <p className="font-semibold text-gray-800">{hospital.admin_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Mail className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Admin Email</p>
                      <p className="font-semibold text-gray-800">{hospital.admin_email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <Phone className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Admin Phone</p>
                      <p className="font-semibold text-gray-800">{hospital.admin_phone}</p>
                    </div>
                  </div>

                  {hospital.coordinates_lat && hospital.coordinates_lng && (
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Coordinates</p>
                        <p className="font-semibold text-gray-800">
                          {hospital.coordinates_lat}, {hospital.coordinates_lng}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Full Width Orders Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Package className="w-6 h-6 text-teal-600" />
                  Hospital Orders
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-600">From:</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-600">To:</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-600">Status:</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading hospital orders...</p>
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
                            <p className="text-sm text-gray-600">{order.center_name}</p>
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
                          <span className="font-medium text-gray-800">{order.quantity || 'N/A'}</span>
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

          {/* Regional Hospitals Info for Main Hospital */}
          {isMainHospital && hospital.regionalHospitals && hospital.regionalHospitals.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-teal-600" />
                Regional Hospitals ({hospital.regionalHospitals.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {hospital.regionalHospitals.map((regHospital: any, index: number) => (
                  <div key={index} className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{regHospital.name}</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        regHospital.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : regHospital.status === 'pending_main_hospital_approval'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {regHospital.status === 'pending_main_hospital_approval' ? 'Pending' :
                         regHospital.status === 'active' ? 'Approved' : regHospital.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{regHospital.city}, {regHospital.province}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

            {/* Approval Section */}
            {canApprove && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertCircle className="w-6 h-6 text-yellow-600" />
                    <h3 className="text-xl font-semibold text-yellow-800">Pending HQ Approval</h3>
                  </div>
                  <p className="text-gray-700 mb-6">
                    This main hospital network is awaiting Operations HQ approval. Once approved,
                    the hospital can begin operations and accept regional hospital affiliations.
                  </p>
                  <div className="flex justify-end space-x-4">
                    <button
                      className="px-6 py-3 rounded-2xl font-semibold transition-all duration-200 hover:transform hover:scale-105"
                      style={{
                        backgroundColor: '#ef4444',
                        color: '#ffffff',
                        boxShadow: '0 8px 32px rgba(239, 68, 68, 0.3)'
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <XCircle className="w-5 h-5" />
                        <span>Reject Network</span>
                      </div>
                    </button>

                    <button
                      onClick={() => onApprove(hospital.id, hospital.network_id)}
                      disabled={isProcessing}
                      className="px-6 py-3 rounded-2xl font-semibold transition-all duration-200 hover:transform hover:scale-105 disabled:opacity-50"
                      style={{
                        backgroundColor: '#10b981',
                        color: '#ffffff',
                        boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>{isProcessing ? 'Approving...' : 'Approve Network'}</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Note for Regional Hospitals */}
            {!isMainHospital && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-6">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-teal-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-teal-800 mb-1">Regional Hospital Note</h4>
                      <p className="text-sm text-teal-700">
                        Regional hospitals are approved by their main hospital network administrator.
                        Operations HQ does not directly approve regional hospitals.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}