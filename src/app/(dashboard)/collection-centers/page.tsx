"use client";

import { useSystemOverview } from '@/hooks/useApi';
import { useState } from 'react';
import { CollectionCenterDetailModal } from '@/components/modals/CollectionCenterDetailModal';
import { operationsApi } from '@/lib/api';
import { 
  FlaskConical,
  Building,
  Hospital,
  Network,
  Users,
  Clock,
  Eye,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter
} from 'lucide-react';

export default function CollectionCentersPage() {
  const { data: systemData, loading, error } = useSystemOverview();
  const [selectedCenter, setSelectedCenter] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'independent' | 'dependent'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');

  // Extract collection centers data
  const allCollectionCenters = systemData?.data?.data?.collection_centers || systemData?.data?.collection_centers || [];

  // Filter centers based on search and filters
  const filteredCenters = allCollectionCenters.filter((center: any) => {
    const matchesSearch = center.center_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         center.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         center.phone?.includes(searchTerm);
    
    const matchesType = filterType === 'all' || center.center_type === filterType;
    const matchesStatus = filterStatus === 'all' || center.center_status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Statistics
  const stats = {
    total: allCollectionCenters.length,
    independent: allCollectionCenters.filter((c: any) => c.center_type === 'independent').length,
    dependent: allCollectionCenters.filter((c: any) => c.center_type === 'dependent').length,
    approved: allCollectionCenters.filter((c: any) => c.center_status === 'approved').length,
    pending: allCollectionCenters.filter((c: any) => c.center_status !== 'approved').length
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading collection centers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="text-red-500 text-lg font-medium mb-2">Error Loading Collection Centers</div>
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
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          boxShadow: '0 20px 40px rgba(16, 185, 129, 0.3)'
        }}
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <FlaskConical className="w-8 h-8" />
                Collection Center Management
              </h1>
              <p className="text-white/90 text-lg mb-3">
                Complete system view of all collection centers and their relationships
              </p>
              <p className="text-white/80 text-base">
                {stats.total} total centers • {stats.independent} independent • {stats.dependent} dependent
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
            style={{ backgroundColor: '#10b981' + '20', border: `2px solid #10b981` + '30' }}
          >
            <FlaskConical className="w-6 h-6" style={{ color: '#10b981' }} />
          </div>
          <h3 className="text-3xl font-bold text-gray-800 mb-2">{stats.total}</h3>
          <p className="text-sm font-medium text-gray-600">Total Centers</p>
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
            style={{ backgroundColor: '#3b82f6' + '20', border: `2px solid #3b82f6` + '30' }}
          >
            <Building className="w-6 h-6" style={{ color: '#3b82f6' }} />
          </div>
          <h3 className="text-3xl font-bold text-gray-800 mb-2">{stats.independent}</h3>
          <p className="text-sm font-medium text-gray-600">Independent</p>
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
            <Network className="w-6 h-6" style={{ color: '#8b5cf6' }} />
          </div>
          <h3 className="text-3xl font-bold text-gray-800 mb-2">{stats.dependent}</h3>
          <p className="text-sm font-medium text-gray-600">Dependent</p>
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
            style={{ backgroundColor: '#059669' + '20', border: `2px solid #059669` + '30' }}
          >
            <CheckCircle className="w-6 h-6" style={{ color: '#059669' }} />
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
                placeholder="Search centers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="independent">Independent</option>
                  <option value="dependent">Dependent</option>
                </select>
              </div>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            Showing {filteredCenters.length} of {stats.total} centers
          </div>
        </div>
      </div>

      {/* Collection Centers List */}
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
            <FlaskConical className="w-6 h-6 text-green-600" />
            All Collection Centers ({filteredCenters.length})
          </h2>
          <p className="text-gray-600 text-base">Complete list with hospital relationships and status</p>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {filteredCenters.length === 0 ? (
              <div className="text-center py-12">
                <FlaskConical className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">No Collection Centers Found</p>
                <p className="text-gray-400">Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              filteredCenters.map((center: any) => (
                <CollectionCenterCard 
                  key={center.id}
                  center={center}
                  onViewDetails={(center: any) => {
                    // Transform center data for the modal to match expected interface
                    const transformedCenter = {
                      id: center.id,
                      center_name: center.center_name,
                      center_type: center.center_type,
                      center_status: center.center_status,
                      email: center.email,
                      phone: center.phone,
                      created_at: center.created_at
                    };
                    setSelectedCenter(transformedCenter);
                    setShowDetailModal(true);
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Collection Center Detail Modal */}
      <CollectionCenterDetailModal
        center={selectedCenter}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedCenter(null);
        }}
        onFeatureToggle={async (centerId: string, featureId: string, enabled: boolean) => {
          setIsProcessing(true);
          try {
            console.log('Toggling feature:', centerId, featureId, enabled);
            // Feature toggle is now handled internally by the modal
            // This callback can be used for additional actions like refreshing parent data
          } catch (error) {
            console.error('Feature toggle failed:', error);
            throw error;
          } finally {
            setIsProcessing(false);
          }
        }}
        onStatusChange={async (centerId: string, newStatus: string) => {
          setIsProcessing(true);
          try {
            console.log('Changing status:', centerId, newStatus);
            const response = await operationsApi.updateCollectionCenterStatus(
              centerId,
              newStatus as 'approved' | 'rejected',
              `Status changed to ${newStatus} by operations`
            );

            if (response.success) {
              // Update the selected center status
              setSelectedCenter((prev: any) => prev ? { ...prev, center_status: newStatus } : null);

              // Show success message
              console.log(`Collection center ${newStatus} successfully`);

              // Optionally refresh the page data
              // You might want to refresh the system overview data here
              // or implement a local state update to reflect the change
            }
          } catch (error) {
            console.error('Status change failed:', error);
            throw error; // Re-throw to let the modal handle the error
          } finally {
            setIsProcessing(false);
          }
        }}
        isProcessing={isProcessing}
      />
    </div>
  );
}

// Collection Center Card Component
function CollectionCenterCard({ 
  center, 
  onViewDetails 
}: {
  center: any;
  onViewDetails: (center: any) => void;
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
                background: center.center_type === 'independent'
                  ? 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)'
                  : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            >
              <FlaskConical className="w-6 h-6 text-white" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-bold text-gray-900">{center.center_name}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  center.center_type === 'independent'
                    ? 'bg-teal-100 text-teal-800 border-teal-200'
                    : 'bg-purple-100 text-purple-800 border-purple-200'
                }`}>
                  {center.center_type}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  center.center_status === 'approved'
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : center.center_status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    : 'bg-red-100 text-red-800 border-red-200'
                }`}>
                  {center.center_status}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">Contact: {center.phone || 'Not provided'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Created: {new Date(center.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Network className="w-4 h-4" />
                  <span className="text-sm">{center.hospital_relationships?.length || 0} Hospital Relations</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Email:</span>
                  <div className="font-medium text-gray-800">{center.email || 'Not provided'}</div>
                </div>
                <div>
                  <span className="text-gray-500">Phone:</span>
                  <div className="font-medium text-gray-800">{center.phone || 'Not provided'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {center.hospital_relationships?.length > 0 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 font-medium"
              >
                {expanded ? 'Hide' : 'Show'} Relations ({center.hospital_relationships.length})
              </button>
            )}
            
            <button 
              onClick={() => onViewDetails(center)}
              className="p-3 hover:bg-green-50 rounded-xl transition-colors"
              title="View Center Details"
            >
              <Eye className="w-4 h-4 text-green-600" />
            </button>
          </div>
        </div>
        
        {expanded && center.hospital_relationships?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Hospital className="w-4 h-4" />
              Hospital Relationships ({center.hospital_relationships.length})
            </h4>
            <div className="space-y-3">
              {center.hospital_relationships.map((relationship: any, index: number) => (
                <div key={index} className={`p-3 rounded-lg border ${
                  center.center_type === 'independent' 
                    ? 'bg-teal-50 border-teal-100' 
                    : 'bg-purple-50 border-purple-100'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Hospital className={`w-4 h-4 ${
                        center.center_type === 'independent' ? 'text-teal-600' : 'text-purple-600'
                      }`} />
                      <span className="text-sm font-medium text-gray-800">{relationship.hospital_name}</span>
                      {relationship.is_main_hospital && (
                        <span className="text-xs px-2 py-1 bg-teal-100 text-teal-700 rounded-full font-medium">
                          Main Hospital
                        </span>
                      )}
                      {relationship.is_main_hospital_relation && (
                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                          Supervising Hospital
                        </span>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      relationship.relation_status === 'approved' 
                        ? 'bg-green-100 text-green-700' 
                        : relationship.relation_status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {relationship.relation_status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                    <div>
                      <span className="font-medium">Network:</span> {relationship.network_name}
                    </div>
                    <div>
                      <span className="font-medium">Type:</span> {relationship.hospital_type}
                    </div>
                    {relationship.approved_at && (
                      <div className="col-span-2">
                        <span className="font-medium">Approved:</span> {new Date(relationship.approved_at).toLocaleDateString()}
                      </div>
                    )}
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