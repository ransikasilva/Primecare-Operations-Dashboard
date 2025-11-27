"use client";

import { useSystemOverview } from '@/hooks/useApi';
import { useState } from 'react';
import { RiderDetailModal } from '@/components/modals/RiderDetailModal';
import { 
  Users,
  User,
  Hospital,
  Network,
  Truck,
  Clock,
  Eye,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Phone,
  Mail
} from 'lucide-react';

export default function RidersPage() {
  const { data: systemData, loading, error } = useSystemOverview();
  const [selectedRider, setSelectedRider] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');

  // Extract riders data
  const allRiders = systemData?.data?.data?.riders || systemData?.data?.riders || [];

  // Filter riders based on search and filters
  const filteredRiders = allRiders.filter((rider: any) => {
    const matchesSearch = rider.rider_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rider.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rider.phone?.includes(searchTerm) ||
                         rider.vehicle_registration?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || rider.rider_status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Statistics
  const stats = {
    total: allRiders.length,
    approved: allRiders.filter((r: any) => r.rider_status === 'approved').length,
    pending: allRiders.filter((r: any) => r.rider_status === 'pending').length,
    withHospital: allRiders.filter((r: any) => r.hospital_affiliation).length,
    withoutHospital: allRiders.filter((r: any) => !r.hospital_affiliation).length
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading riders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="text-red-500 text-lg font-medium mb-2">Error Loading Riders</div>
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
                <Users className="w-8 h-8" />
                Rider Management
              </h1>
              <p className="text-white/90 text-lg mb-3">
                Complete system view of all riders and their hospital affiliations
              </p>
              <p className="text-white/80 text-base">
                {stats.total} total riders • {stats.approved} approved • {stats.withHospital} with hospital affiliation
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
            <Users className="w-6 h-6" style={{ color: '#3b82f6' }} />
          </div>
          <h3 className="text-3xl font-bold text-gray-800 mb-2">{stats.total}</h3>
          <p className="text-sm font-medium text-gray-600">Total Riders</p>
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
          <h3 className="text-3xl font-bold text-gray-800 mb-2">{stats.approved}</h3>
          <p className="text-sm font-medium text-gray-600">Approved</p>
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
            style={{ backgroundColor: '#8b5cf6' + '20', border: `2px solid #8b5cf6` + '30' }}
          >
            <Hospital className="w-6 h-6" style={{ color: '#8b5cf6' }} />
          </div>
          <h3 className="text-3xl font-bold text-gray-800 mb-2">{stats.withHospital}</h3>
          <p className="text-sm font-medium text-gray-600">With Hospital</p>
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
            style={{ backgroundColor: '#6b7280' + '20', border: `2px solid #6b7280` + '30' }}
          >
            <User className="w-6 h-6" style={{ color: '#6b7280' }} />
          </div>
          <h3 className="text-3xl font-bold text-gray-800 mb-2">{stats.withoutHospital}</h3>
          <p className="text-sm font-medium text-gray-600">Independent</p>
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
                placeholder="Search riders..."
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
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            Showing {filteredRiders.length} of {stats.total} riders
          </div>
        </div>
      </div>

      {/* Riders List */}
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
            <Users className="w-6 h-6 text-blue-600" />
            All Riders ({filteredRiders.length})
          </h2>
          <p className="text-gray-600 text-base">Complete list with hospital affiliations and contact details</p>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {filteredRiders.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">No Riders Found</p>
                <p className="text-gray-400">Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              filteredRiders.map((rider: any) => (
                <RiderCard 
                  key={rider.id}
                  rider={rider}
                  onViewDetails={async (rider: any) => {
                    try {
                      // Import the API client and fetch detailed rider data
                      const { operationsApi } = await import('@/lib/api');
                      const riderDetailsResponse = await operationsApi.getRiderDetails(rider.id);
                      
                      if (riderDetailsResponse.success) {
                        // Use real data from API
                        setSelectedRider(riderDetailsResponse.data);
                      } else {
                        // Fallback to transformed data
                        const transformedRider = {
                          id: rider.id,
                          full_name: rider.rider_name,
                          mobile_number: rider.phone || 'N/A',
                          nic_number: rider.nic_number || 'N/A',
                          email: rider.email,
                          date_of_birth: rider.date_of_birth || new Date().toISOString(),
                          address: rider.address || 'N/A',
                          emergency_contact: rider.emergency_contact || 'N/A',
                          vehicle_type: rider.vehicle_type || 'N/A',
                          vehicle_number: rider.vehicle_registration || 'N/A',
                          license_number: rider.license_number || 'N/A',
                          experience: rider.experience || 'Not specified',
                          areas_known: rider.areas_known || [],
                          hospital_affiliation: {
                            main_hospital: rider.hospital_affiliation?.hospital_name,
                            regional_hospitals: []
                          },
                          status: rider.rider_status,
                          total_deliveries: 0,
                          successful_deliveries: 0,
                          cancelled_deliveries: 0,
                          average_delivery_time: 30,
                          total_km: 0,
                          monthly_km: 0,
                          weekly_km: 0,
                          created_at: rider.created_at,
                          last_active: rider.last_active || new Date().toISOString(),
                          current_location: undefined,
                          profile_picture: rider.profile_picture,
                          driver_license_front: rider.driver_license_front,
                          driver_license_back: rider.driver_license_back,
                          nic_front: rider.nic_front,
                          nic_back: rider.nic_back
                        };
                        setSelectedRider(transformedRider);
                      }
                      setShowDetailModal(true);
                    } catch (error) {
                      console.error('Failed to fetch rider details:', error);
                      // Use basic transformation as fallback
                      const transformedRider = {
                        id: rider.id,
                        full_name: rider.rider_name,
                        mobile_number: rider.phone || 'N/A',
                        nic_number: 'N/A',
                        email: rider.email,
                        date_of_birth: new Date().toISOString(),
                        address: 'N/A',
                        emergency_contact: 'N/A',
                        vehicle_type: rider.vehicle_type || 'N/A',
                        vehicle_number: rider.vehicle_registration || 'N/A',
                        license_number: 'N/A',
                        experience: 'Not specified',
                        areas_known: [],
                        hospital_affiliation: {
                          main_hospital: rider.hospital_affiliation?.hospital_name,
                          regional_hospitals: []
                        },
                        status: rider.rider_status,
                        total_deliveries: 0,
                        successful_deliveries: 0,
                        cancelled_deliveries: 0,
                        average_delivery_time: 30,
                        total_km: 0,
                        monthly_km: 0,
                        weekly_km: 0,
                        created_at: rider.created_at,
                        last_active: rider.last_active || new Date().toISOString()
                      };
                      setSelectedRider(transformedRider);
                      setShowDetailModal(true);
                    }
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Rider Detail Modal */}
      <RiderDetailModal
        rider={selectedRider}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedRider(null);
        }}
        onStatusChange={async (riderId: string, newStatus: string) => {
          setIsProcessing(true);
          try {
            console.log('Changing rider status:', riderId, newStatus);
            // Import the API client
            const { operationsApi } = await import('@/lib/api');
            const response = await operationsApi.updateRiderStatus(riderId, newStatus);
            
            if (response.success) {
              console.log('Rider status updated successfully');
              // Update the selectedRider status locally
              if (selectedRider) {
                setSelectedRider({
                  ...selectedRider,
                  status: newStatus
                });
              }
            }
          } catch (error) {
            console.error('Status change failed:', error);
          } finally {
            setIsProcessing(false);
          }
        }}
        onKmFilterChange={async (riderId: string, filter: 'all' | 'monthly' | 'weekly') => {
          try {
            console.log('Fetching KM data:', riderId, filter);
            // Import the API client
            const { operationsApi } = await import('@/lib/api');
            const kmResponse = await operationsApi.getRiderKmData(riderId, filter);
            
            if (kmResponse.success && selectedRider) {
              // Update the selected rider with new KM data
              setSelectedRider({
                ...selectedRider,
                total_km: kmResponse.data.total_km,
                monthly_km: kmResponse.data.monthly_km,
                weekly_km: kmResponse.data.weekly_km,
                total_deliveries: kmResponse.data.total_deliveries,
                average_delivery_time: kmResponse.data.avg_delivery_time_minutes
              });
            }
          } catch (error) {
            console.error('KM filter change failed:', error);
          }
        }}
        isProcessing={isProcessing}
      />
    </div>
  );
}

// Rider Card Component
function RiderCard({ 
  rider, 
  onViewDetails 
}: {
  rider: any;
  onViewDetails: (rider: any) => void;
}) {
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
                background: rider.hospital_affiliation
                  ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                  : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            >
              <User className="w-6 h-6 text-white" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-bold text-gray-900">{rider.rider_name}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  rider.rider_status === 'approved'
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : rider.rider_status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    : 'bg-red-100 text-red-800 border-red-200'
                }`}>
                  {rider.rider_status}
                </span>
                {rider.hospital_affiliation && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                    Hospital Affiliated
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                  <Truck className="w-4 h-4" />
                  <span className="text-sm">Vehicle: {rider.vehicle_registration} ({rider.vehicle_type})</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Joined: {new Date(rider.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                <div>
                  <span className="text-gray-500">Phone:</span>
                  <div className="font-medium text-gray-800 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {rider.phone || 'Not provided'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Email:</span>
                  <div className="font-medium text-gray-800 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {rider.email || 'Not provided'}
                  </div>
                </div>
              </div>

              {rider.hospital_affiliation && (
                <div className="p-2 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-purple-800">
                    <Hospital className="w-4 h-4" />
                    <span className="font-medium">Hospital:</span>
                    <span>{rider.hospital_affiliation.hospital_name}</span>
                    {rider.hospital_affiliation.is_main_hospital && (
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                        Main Hospital
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-purple-700 mt-1">
                    <Network className="w-3 h-3" />
                    <span>Network: {rider.hospital_affiliation.network_name}</span>
                    <span>•</span>
                    <span>Type: {rider.hospital_affiliation.hospital_type}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onViewDetails(rider)}
              className="p-3 hover:bg-blue-50 rounded-xl transition-colors"
              title="View Rider Details"
            >
              <Eye className="w-4 h-4 text-blue-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}