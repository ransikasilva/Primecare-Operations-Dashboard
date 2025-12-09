"use client";

import { useOperationsPendingApprovals, usePendingFeatureRequests, useSystemOverview, useApproveHospitalNetwork, useApproveCollectionCenterFinal, useEnableCenterFeature, useRejectApproval } from '@/hooks/useApi';
import { useState } from 'react';
import { ApprovalDetailModal } from '@/components/modals/ApprovalDetailModal';
import {
  Clock,
  Check,
  Eye,
  Hospital,
  FlaskConical,
  Building,
  Network,
  Shield,
  ChevronDown,
  ChevronRight,
  Zap
} from 'lucide-react';

export default function ApprovalsPage() {
  const { data: approvalsData, loading: approvalsLoading, error: approvalsError, refetch: refetchApprovals } = useOperationsPendingApprovals();
  const { data: featureRequestsData, loading: featureRequestsLoading, error: featureRequestsError } = usePendingFeatureRequests();
  const { data: systemOverviewData } = useSystemOverview();

  // Approval hooks
  const { approveNetwork, loading: approvingNetwork } = useApproveHospitalNetwork();
  const { approveCenter, loading: approvingCenter } = useApproveCollectionCenterFinal();
  const { enableCenterFeature, loading: enablingFeature } = useEnableCenterFeature();

  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedNetworks, setExpandedNetworks] = useState<string[]>([]);
  const [expandedCenters, setExpandedCenters] = useState<string[]>([]);

  // Extract pending approvals data
  const approvalsRaw = approvalsData?.data;
  const pendingHospitalNetworks = approvalsRaw?.hospital_networks || [];
  const pendingHospitals = approvalsRaw?.hospitals || [];
  const pendingCollectionCenters = approvalsRaw?.collection_centers || [];
  
  // Extract pending feature requests data
  const featureRequestsRaw = featureRequestsData?.data;
  const pendingFeatureRequests = featureRequestsRaw?.requests || [];
  const featureRequestsStats = featureRequestsRaw?.by_type || { core: 0, premium: 0, enterprise: 0 };
  
  // Extract system overview for relationship context
  const systemData = systemOverviewData?.data?.data || systemOverviewData?.data || {};
  const allHospitalNetworks = (systemData as any)?.hospital_networks || [];
  const allCollectionCenters = (systemData as any)?.collection_centers || [];
  
  // Create lookup maps for relationships
  const hospitalNetworkMap = allHospitalNetworks.reduce((acc: any, network: any) => {
    acc[network.id] = network;
    return acc;
  }, {});

  const collectionCenterMap = allCollectionCenters.reduce((acc: any, center: any) => {
    acc[center.id] = center;
    return acc;
  }, {});

  // Calculate main hospitals count after hospitalNetworkMap is ready
  const mainHospitalsCount = pendingHospitalNetworks.filter((network: any) => {
    const networkData = hospitalNetworkMap[network.id];
    return networkData?.hospitals?.some((h: any) => h.is_main_hospital);
  }).length;

  // Separate dependent and independent collection centers
  const independentCenters = pendingCollectionCenters.filter((center: any) => {
    const centerData = collectionCenterMap[center.id];
    return centerData?.center_type === 'independent';
  });
  
  const dependentCenters = pendingCollectionCenters.filter((center: any) => {
    const centerData = collectionCenterMap[center.id];
    return centerData?.center_type === 'dependent';
  });

  const toggleNetworkExpanded = (networkId: string) => {
    setExpandedNetworks(prev => 
      prev.includes(networkId) 
        ? prev.filter(id => id !== networkId)
        : [...prev, networkId]
    );
  };

  const toggleCenterExpanded = (centerId: string) => {
    setExpandedCenters(prev => 
      prev.includes(centerId) 
        ? prev.filter(id => id !== centerId)
        : [...prev, centerId]
    );
  };

  if (approvalsLoading || featureRequestsLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading pending approvals and feature requests...</p>
        </div>
      </div>
    );
  }

  if (approvalsError || featureRequestsError) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="text-red-500 text-lg font-medium mb-2">Error Loading Data</div>
          <p className="text-gray-500">{approvalsError || featureRequestsError}</p>
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
          background: 'linear-gradient(135deg, #4ECDC4 0%, #4A9BC7 100%)',
          boxShadow: '0 20px 40px rgba(78, 205, 196, 0.3)'
        }}
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Shield className="w-8 h-8" />
                TransFleet HQ Approvals
              </h1>
              <p className="text-white/90 text-lg mb-3">
                Final approval workflow for hospital networks and collection centers
              </p>
              <p className="text-white/80 text-base">
                {mainHospitalsCount + pendingCollectionCenters.length + pendingFeatureRequests.length} items awaiting TransFleet HQ approval
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

      {/* Approval Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div 
          className="rounded-3xl p-6"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
            border: '1px solid rgba(203, 213, 225, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{
                backgroundColor: '#4ECDC4' + '20',
                border: `2px solid #4ECDC4` + '30'
              }}
            >
              <Network className="w-6 h-6" style={{ color: '#4ECDC4' }} />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-800 mb-2">{mainHospitalsCount}</h3>
          <p className="text-sm font-medium text-gray-600">Main Hospitals</p>
          <p className="text-xs text-gray-500 mt-1">Pending HQ approval</p>
        </div>


        <div 
          className="rounded-3xl p-6"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
            border: '1px solid rgba(203, 213, 225, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{
                backgroundColor: '#10b981' + '20',
                border: `2px solid #10b981` + '30'
              }}
            >
              <FlaskConical className="w-6 h-6" style={{ color: '#10b981' }} />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-800 mb-2">{independentCenters.length}</h3>
          <p className="text-sm font-medium text-gray-600">Independent Centers</p>
          <p className="text-xs text-gray-500 mt-1">Multi-network access requests</p>
        </div>

        <div 
          className="rounded-3xl p-6"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
            border: '1px solid rgba(203, 213, 225, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{
                backgroundColor: '#8b5cf6' + '20',
                border: `2px solid #8b5cf6` + '30'
              }}
            >
              <FlaskConical className="w-6 h-6" style={{ color: '#8b5cf6' }} />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-800 mb-2">{dependentCenters.length}</h3>
          <p className="text-sm font-medium text-gray-600">Dependent Centers</p>
          <p className="text-xs text-gray-500 mt-1">Main hospital affiliation</p>
        </div>

        <div 
          className="rounded-3xl p-6"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
            border: '1px solid rgba(203, 213, 225, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{
                backgroundColor: '#ec4899' + '20',
                border: `2px solid #ec4899` + '30'
              }}
            >
              <Zap className="w-6 h-6" style={{ color: '#ec4899' }} />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-800 mb-2">{pendingFeatureRequests.length}</h3>
          <p className="text-sm font-medium text-gray-600">Feature Requests</p>
          <p className="text-xs text-gray-500 mt-1">Center feature approvals</p>
        </div>

        <div 
          className="rounded-3xl p-6"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
            border: '1px solid rgba(203, 213, 225, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{
                backgroundColor: '#f59e0b' + '20',
                border: `2px solid #f59e0b` + '30'
              }}
            >
              <Shield className="w-6 h-6" style={{ color: '#f59e0b' }} />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-800 mb-2">{mainHospitalsCount + pendingCollectionCenters.length + pendingFeatureRequests.length}</h3>
          <p className="text-sm font-medium text-gray-600">Total Pending</p>
          <p className="text-xs text-gray-500 mt-1">Awaiting final approval</p>
        </div>
      </div>

      {/* Main Hospitals Section */}
      <MainHospitalsSection
        networks={pendingHospitalNetworks}
        hospitalNetworkMap={hospitalNetworkMap}
        expandedNetworks={expandedNetworks}
        onToggleExpanded={toggleNetworkExpanded}
        onViewDetails={(hospital: any) => {
          setSelectedEntity({
            id: hospital.network_id,  // Use network_id for approval API
            type: 'main_hospital',
            applicantName: hospital.name,
            status: 'pending_operations_approval',
            appliedDate: hospital.network_created_at,
            details: hospital,
            priority: 'High',
            requestingNetwork: hospital.network_name
          });
          setShowDetailModal(true);
        }}
        onApprove={async (hospital: any) => {
          setIsProcessing(true);
          try {
            console.log('Direct approval - hospital network:', hospital.network_id, hospital.network_name);
            await approveNetwork(hospital.network_id, `Approved by operations: ${hospital.network_name}`);
            console.log('Hospital network approved successfully');
            await refetchApprovals();
            alert(`${hospital.network_name} has been approved successfully!`);
          } catch (error) {
            console.error('Approval failed:', error);
            alert(`Approval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          } finally {
            setIsProcessing(false);
          }
        }}
      />
      
      {/* Independent Collection Centers Section */}
      <IndependentCentersSection
        centers={independentCenters}
        collectionCenterMap={collectionCenterMap}
        expandedCenters={expandedCenters}
        onToggleExpanded={toggleCenterExpanded}
        onViewDetails={(center: any) => {
          const centerData = collectionCenterMap[center.id];
          // Get feature requests for this center
          const centerFeatureRequests = pendingFeatureRequests.filter((req: any) => req.center_id === center.id);

          setSelectedEntity({
            id: center.id,
            type: 'collection_center',
            applicantName: center.name || centerData?.center_name,
            status: 'pending_operations_approval',
            appliedDate: center.created_at,
            details: {
              ...centerData || center,
              featureRequests: centerFeatureRequests
            },
            priority: centerData?.center_type === 'independent' ? 'High' : 'Normal',
            requestingNetwork: centerData?.hospital_relationships?.[0]?.hospital_name || 'Multiple Networks'
          });
          setShowDetailModal(true);
        }}
        onApprove={async (center: any) => {
          setIsProcessing(true);
          try {
            console.log('Direct approval - collection center:', center.id, center.name);
            await approveCenter(center.id, `Approved by operations: ${center.name || collectionCenterMap[center.id]?.center_name}`);
            console.log('Collection center approved successfully');
            await refetchApprovals();
            alert(`${center.name || collectionCenterMap[center.id]?.center_name} has been approved successfully!`);
          } catch (error) {
            console.error('Approval failed:', error);
            alert(`Approval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          } finally {
            setIsProcessing(false);
          }
        }}
      />
      
      {/* Dependent Collection Centers Section */}
      <DependentCentersSection
        centers={dependentCenters}
        collectionCenterMap={collectionCenterMap}
        expandedCenters={expandedCenters}
        onToggleExpanded={toggleCenterExpanded}
        onViewDetails={(center: any) => {
          const centerData = collectionCenterMap[center.id];
          // Get feature requests for this center
          const centerFeatureRequests = pendingFeatureRequests.filter((req: any) => req.center_id === center.id);

          setSelectedEntity({
            id: center.id,
            type: 'collection_center',
            applicantName: center.name || centerData?.center_name,
            status: 'pending_operations_approval',
            appliedDate: center.created_at,
            details: {
              ...centerData || center,
              featureRequests: centerFeatureRequests
            },
            priority: 'Normal',
            requestingNetwork: centerData?.hospital_relationships?.find((rel: any) => rel.is_main_hospital_relation)?.hospital_name || 'N/A'
          });
          setShowDetailModal(true);
        }}
        onApprove={async (center: any) => {
          setIsProcessing(true);
          try {
            console.log('Direct approval - collection center:', center.id, center.name);
            await approveCenter(center.id, `Approved by operations: ${center.name || collectionCenterMap[center.id]?.center_name}`);
            console.log('Collection center approved successfully');
            await refetchApprovals();
            alert(`${center.name || collectionCenterMap[center.id]?.center_name} has been approved successfully!`);
          } catch (error) {
            console.error('Approval failed:', error);
            alert(`Approval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          } finally {
            setIsProcessing(false);
          }
        }}
      />

      {/* Approval Detail Modal */}
      <ApprovalDetailModal
        item={selectedEntity}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedEntity(null);
        }}
        onApprove={async (itemId: string, itemName: string, selectedFeatures?: { [key: string]: boolean }) => {
          setIsProcessing(true);
          try {
            // Determine item type and call appropriate approval API
            if (selectedEntity?.type === 'hospital_network' || selectedEntity?.type === 'main_hospital') {
              console.log('Approving hospital network/main hospital:', itemId, itemName, 'Type:', selectedEntity?.type);
              await approveNetwork(itemId, `Approved by operations: ${itemName}`);
              console.log('Hospital network approved successfully');
            } else if (selectedEntity?.type === 'collection_center') {
              console.log('Approving collection center:', itemId, itemName);
              await approveCenter(itemId, `Approved by operations: ${itemName}`);
              console.log('Collection center approved successfully');

              // After approving center, enable/disable requested features based on selection
              if (selectedFeatures && selectedEntity?.details?.featureRequests) {
                console.log('🔧 Processing feature approvals:', selectedFeatures);
                console.log('🔧 Feature requests:', selectedEntity.details.featureRequests);

                for (const request of selectedEntity.details.featureRequests) {
                  const featureId = request.feature_id;
                  const shouldEnable = selectedFeatures[featureId] || false;

                  console.log(`🔧 Processing feature: ${featureId}, shouldEnable: ${shouldEnable}`);

                  try {
                    const result = await enableCenterFeature(
                      itemId,
                      featureId,
                      shouldEnable,
                      shouldEnable ? 'Approved by operations' : 'Not approved at this time'
                    );
                    console.log(`✅ Feature ${featureId} ${shouldEnable ? 'enabled' : 'disabled'} successfully`, result);
                  } catch (featureError) {
                    console.error(`❌ Failed to ${shouldEnable ? 'enable' : 'disable'} feature ${featureId}:`, featureError);
                    // Continue with other features even if one fails
                  }
                }
              } else {
                console.log('⚠️ No feature approvals to process:', {
                  hasSelectedFeatures: !!selectedFeatures,
                  hasFeatureRequests: !!selectedEntity?.details?.featureRequests,
                  selectedFeatures,
                  featureRequests: selectedEntity?.details?.featureRequests
                });
              }
            } else {
              console.log('Unknown item type for approval:', selectedEntity?.type);
              throw new Error(`Approval not implemented for type: ${selectedEntity?.type}`);
            }

            // Refresh approvals data
            await refetchApprovals();
            console.log('Approvals data refreshed');

          } catch (error) {
            console.error('Approval failed:', error);
            alert(`Approval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          } finally {
            setIsProcessing(false);
          }
        }}
        onReject={async (itemId: string, itemName: string, reason?: string) => {
          setIsProcessing(true);
          try {
            // TODO: Implement actual rejection API call
            console.log('Rejecting:', itemId, itemName, reason);
            // await rejectItem(itemId, reason);
          } catch (error) {
            console.error('Rejection failed:', error);
          } finally {
            setIsProcessing(false);
          }
        }}
        isProcessing={isProcessing}
      />
    </div>
  );
}

// Main Hospitals Section Component
function MainHospitalsSection({
  networks,
  hospitalNetworkMap,
  expandedNetworks,
  onToggleExpanded,
  onViewDetails,
  onApprove
}: {
  networks: any[];
  hospitalNetworkMap: any;
  expandedNetworks: string[];
  onToggleExpanded: (networkId: string) => void;
  onViewDetails: (hospital: any) => void;
  onApprove: (hospital: any) => Promise<void>;
}) {
  // Extract main hospitals from networks
  const mainHospitals = networks.flatMap((network: any) => {
    const networkData = hospitalNetworkMap[network.id];
    const mainHospital = networkData?.hospitals?.find((h: any) => h.is_main_hospital);
    if (mainHospital) {
      return [{
        ...mainHospital,
        network_name: network.name,
        network_id: network.id,
        admin_name: network.admin_name,
        admin_email: network.admin_email,
        admin_phone: network.phone,
        network_created_at: network.created_at
      }];
    }
    return [];
  });

  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
        border: '1px solid rgba(203, 213, 225, 0.3)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)'
      }}
    >
      <div className="p-6 border-b border-gray-100/60">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
              <Hospital className="w-6 h-6 text-teal-600" />
              Main Hospitals ({mainHospitals.length})
            </h2>
            <p className="text-gray-600 text-base">Main hospitals pending TransFleet HQ approval (approving approves the entire network)</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {mainHospitals.length === 0 ? (
            <div className="text-center py-12">
              <Hospital className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">No Main Hospitals Pending</p>
              <p className="text-gray-400">Main hospital applications will appear here</p>
            </div>
          ) : (
            mainHospitals.map((hospital: any) => {
              const networkData = hospitalNetworkMap[hospital.network_id];
              const isExpanded = expandedNetworks.includes(hospital.network_id);

              return (
                <div
                  key={hospital.id}
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
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                          }}
                        >
                          <Hospital className="w-6 h-6 text-white" />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-gray-900">{hospital.name}</h3>
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">
                              Main Hospital
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">
                              Pending HQ Approval
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <Network className="w-4 h-4" />
                              <span className="text-sm">Network: {hospital.network_name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span className="text-sm">Applied: {new Date(hospital.network_created_at).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Hospital Type:</span>
                              <div className="font-medium text-gray-800">{hospital.hospital_type}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Admin:</span>
                              <div className="font-medium text-gray-800">{hospital.admin_name}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Email:</span>
                              <div className="font-medium text-gray-800">{hospital.admin_email}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Contact:</span>
                              <div className="font-medium text-gray-800">{hospital.admin_phone}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          networkData?.hospitals?.length > 1 ? 'bg-teal-100 text-teal-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          Network: {networkData?.hospitals?.length || 1} hospitals
                        </span>

                        {networkData?.hospitals?.length > 1 && (
                          <button
                            onClick={() => onToggleExpanded(hospital.network_id)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 font-medium"
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            {isExpanded ? 'Hide' : 'Show'} Network
                          </button>
                        )}

                        <button
                          onClick={() => onViewDetails(hospital)}
                          className="p-3 hover:bg-teal-50 rounded-xl transition-colors"
                          title="View Hospital Details"
                        >
                          <Eye className="w-4 h-4 text-teal-600" />
                        </button>

                        <button
                          onClick={() => onApprove(hospital)}
                          className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 hover:transform hover:scale-105"
                          style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                          }}
                        >
                          <Check className="w-4 h-4" />
                          Approve Hospital & Network
                        </button>
                      </div>
                    </div>

                    {isExpanded && networkData?.hospitals && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <Network className="w-4 h-4" />
                          Complete Network ({networkData.hospitals.length} hospitals)
                        </h4>
                        <div className="space-y-3">
                          {networkData.hospitals.map((h: any) => (
                            <div key={h.id} className={`p-3 rounded-lg border ${
                              h.is_main_hospital
                                ? 'bg-teal-50 border-teal-100'
                                : 'bg-green-50 border-green-100'
                            }`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Hospital className={`w-4 h-4 ${
                                    h.is_main_hospital ? 'text-teal-600' : 'text-green-600'
                                  }`} />
                                  <span className="text-sm font-medium text-gray-800">{h.name}</span>
                                  {h.is_main_hospital && (
                                    <span className="text-xs px-2 py-1 bg-teal-100 text-teal-700 rounded-full font-medium">
                                      Main Hospital
                                    </span>
                                  )}
                                  {!h.is_main_hospital && (
                                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                                      Regional Hospital
                                    </span>
                                  )}
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  h.status === 'active'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {h.status}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                                <div>
                                  <span className="font-medium">Type:</span> {h.hospital_type}
                                </div>
                                <div>
                                  <span className="font-medium">Created:</span> {new Date(h.created_at).toLocaleDateString()}
                                </div>
                              </div>
                              {h.hospital_code && (
                                <div className="mt-2 text-xs text-teal-600 bg-teal-50 p-2 rounded">
                                  <span className="font-medium">Hospital Code:</span> {h.hospital_code}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// Independent Collection Centers Section Component
function IndependentCentersSection({
  centers,
  collectionCenterMap,
  expandedCenters,
  onToggleExpanded,
  onViewDetails,
  onApprove
}: {
  centers: any[];
  collectionCenterMap: any;
  expandedCenters: string[];
  onToggleExpanded: (centerId: string) => void;
  onViewDetails: (center: any) => void;
  onApprove: (center: any) => Promise<void>;
}) {
  return (
    <div 
      className="rounded-3xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
        border: '1px solid rgba(203, 213, 225, 0.3)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)'
      }}
    >
      <div className="p-6 border-b border-gray-100/60">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
              <FlaskConical className="w-6 h-6 text-green-600" />
              Independent Collection Centers ({centers.length})
            </h2>
            <p className="text-gray-600 text-base">Centers requesting access to multiple hospital networks</p>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="space-y-4">
          {centers.length === 0 ? (
            <div className="text-center py-12">
              <FlaskConical className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">No Independent Centers Pending</p>
              <p className="text-gray-400">Independent center applications will appear here</p>
            </div>
          ) : (
            centers.map((center: any) => {
              const centerData = collectionCenterMap[center.id];
              const isExpanded = expandedCenters.includes(center.id);
              
              return (
                <div 
                  key={center.id}
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
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                          }}
                        >
                          <FlaskConical className="w-6 h-6 text-white" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-gray-900">{center.name}</h3>
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                              Independent Center
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <Building className="w-4 h-4" />
                              <span className="text-sm">Type: Independent</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span className="text-sm">Applied: {new Date(center.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Contact:</span>
                              <div className="font-medium text-gray-800">{centerData?.phone || center.phone || 'Not provided'}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Email:</span>
                              <div className="font-medium text-gray-800">{centerData?.email || center.email || 'Not provided'}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          centerData?.hospital_relationships?.length > 0 ? 'bg-teal-100 text-teal-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {centerData?.hospital_relationships?.length || 0} Hospital Relations
                        </span>
                        
                        {centerData?.hospital_relationships?.length > 0 && (
                          <button
                            onClick={() => onToggleExpanded(center.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 font-medium"
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            {isExpanded ? 'Hide' : 'Show'} Relations
                          </button>
                        )}
                        
                        <button 
                          onClick={() => onViewDetails(center)}
                          className="p-3 hover:bg-green-50 rounded-xl transition-colors"
                          title="View Center Details"
                        >
                          <Eye className="w-4 h-4 text-green-600" />
                        </button>
                        
                        <button
                          onClick={() => onApprove(center)}
                          className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 hover:transform hover:scale-105"
                          style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                          }}
                        >
                          <Check className="w-4 h-4" />
                          Approve Center
                        </button>
                      </div>
                    </div>
                    
                    {isExpanded && centerData?.hospital_relationships && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <Network className="w-4 h-4" />
                          Hospital Application Status
                        </h4>
                        <div className="space-y-3">
                          {centerData.hospital_relationships.map((relationship: any) => (
                            <div key={relationship.hospital_id} className="p-3 bg-teal-50 rounded-lg border border-teal-100">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Hospital className="w-4 h-4 text-teal-600" />
                                  <span className="text-sm font-medium text-gray-800">{relationship.hospital_name}</span>
                                  {relationship.is_main_hospital && (
                                    <span className="text-xs px-2 py-1 bg-teal-100 text-teal-700 rounded-full font-medium">
                                      Main Hospital
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
            })
          )}
        </div>
      </div>
    </div>
  );
}

// Dependent Collection Centers Section Component
function DependentCentersSection({
  centers,
  collectionCenterMap,
  expandedCenters,
  onToggleExpanded,
  onViewDetails,
  onApprove
}: {
  centers: any[];
  collectionCenterMap: any;
  expandedCenters: string[];
  onToggleExpanded: (centerId: string) => void;
  onViewDetails: (center: any) => void;
  onApprove: (center: any) => Promise<void>;
}) {
  return (
    <div 
      className="rounded-3xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
        border: '1px solid rgba(203, 213, 225, 0.3)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)'
      }}
    >
      <div className="p-6 border-b border-gray-100/60">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
              <FlaskConical className="w-6 h-6 text-purple-600" />
              Dependent Collection Centers ({centers.length})
            </h2>
            <p className="text-gray-600 text-base">Centers operating under main hospital supervision</p>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="space-y-4">
          {centers.length === 0 ? (
            <div className="text-center py-12">
              <FlaskConical className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">No Dependent Centers Pending</p>
              <p className="text-gray-400">Dependent center applications will appear here</p>
            </div>
          ) : (
            centers.map((center: any) => {
              const centerData = collectionCenterMap[center.id];
              const isExpanded = expandedCenters.includes(center.id);
              const mainHospitalRelation = centerData?.hospital_relationships?.find((rel: any) => rel.is_main_hospital_relation);
              
              return (
                <div 
                  key={center.id}
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
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                          }}
                        >
                          <FlaskConical className="w-6 h-6 text-white" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-gray-900">{center.name}</h3>
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                              Dependent Center
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <Building className="w-4 h-4" />
                              <span className="text-sm">Type: Dependent</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span className="text-sm">Applied: {new Date(center.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          {mainHospitalRelation && (
                            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg mb-3">
                              <div className="flex items-center gap-2 text-sm text-yellow-800">
                                <Hospital className="w-4 h-4" />
                                <span className="font-medium">Main Hospital:</span>
                                <span>{mainHospitalRelation.hospital_name}</span>
                                <span className="ml-2 text-xs">({mainHospitalRelation.network_name})</span>
                              </div>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Contact:</span>
                              <div className="font-medium text-gray-800">{centerData?.phone || center.phone || 'Not provided'}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Email:</span>
                              <div className="font-medium text-gray-800">{centerData?.email || center.email || 'Not provided'}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {centerData?.hospital_relationships?.length > 0 && (
                          <button
                            onClick={() => onToggleExpanded(center.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 font-medium"
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            Details
                          </button>
                        )}
                        
                        <button 
                          onClick={() => onViewDetails(center)}
                          className="p-3 hover:bg-purple-50 rounded-xl transition-colors"
                          title="View Center Details"
                        >
                          <Eye className="w-4 h-4 text-purple-600" />
                        </button>
                        
                        <button
                          onClick={() => onApprove(center)}
                          className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 hover:transform hover:scale-105"
                          style={{
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                            color: 'white',
                            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                          }}
                        >
                          <Check className="w-4 h-4" />
                          Approve Center
                        </button>
                      </div>
                    </div>
                    
                    {isExpanded && centerData?.hospital_relationships && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <Network className="w-4 h-4" />
                          Main Hospital Relationship
                        </h4>
                        <div className="space-y-3">
                          {centerData.hospital_relationships.map((relationship: any) => (
                            <div key={relationship.hospital_id} className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Hospital className="w-4 h-4 text-purple-600" />
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
                              {relationship.is_main_hospital_relation && (
                                <div className="mt-2 text-xs text-purple-600 bg-purple-50 p-2 rounded border border-purple-200">
                                  <span className="font-medium">⚠️ Supervision Relationship:</span> This dependent center operates under the supervision of this main hospital
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}