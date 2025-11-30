"use client";

import { useState, useEffect } from 'react';
import { 
  Settings, 
  Package, 
  Zap, 
  CheckCircle, 
  AlertCircle,
  Search,
  Filter,
  MoreVertical,
  User,
  MapPin,
  Building2,
  Phone,
  Mail,
  FileText,
  Loader2
} from 'lucide-react';
import { 
  useAllCollectionCenters,
  useFeatureUsageAnalytics,
  useEnableCenterFeature,
  useBulkUpdateCenterFeatures
} from '@/hooks/useApi';

interface CollectionCenter {
  id: string;
  name: string;
  type: 'laboratory' | 'clinic' | 'diagnostic_center' | 'hospital_lab';
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  status: 'active' | 'pending' | 'suspended';
  features: {
    sampleTypeQuantity: boolean;
    urgentDelivery: boolean;
    multiParcel: boolean;
  };
  affiliatedHospitals: Array<{ id: string; name: string; region: string }>;
  monthlyOrders: number;
  lastActive: string;
}

interface CollectionCenterFeatureManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CollectionCenterFeatureManager({ 
  isOpen, 
  onClose 
}: CollectionCenterFeatureManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedFeature, setSelectedFeature] = useState<string>('all');
  const [selectedCenters, setSelectedCenters] = useState<string[]>([]);
  const [bulkFeature, setBulkFeature] = useState<string>('');
  const [bulkEnabled, setBulkEnabled] = useState<boolean>(false);

  const { data: centersData, loading: centersLoading, refetch } = useAllCollectionCenters();
  const { data: analyticsData } = useFeatureUsageAnalytics();
  const { enableCenterFeature, loading: updateLoading } = useEnableCenterFeature();
  const { bulkUpdateFeatures, loading: bulkLoading } = useBulkUpdateCenterFeatures();

  // Mock data with real structure
  const centers: CollectionCenter[] = centersData?.data || [
    {
      id: '1',
      name: 'HealthGuard Diagnostics',
      type: 'laboratory',
      contactPerson: 'Ms. Priya Jayawardena',
      email: 'info@healthguard.lk',
      phone: '+94 11 234 5678',
      address: '123 Galle Road, Colombo 03',
      status: 'active',
      features: {
        sampleTypeQuantity: true,
        urgentDelivery: true,
        multiParcel: false
      },
      affiliatedHospitals: [
        { id: '1', name: 'Western Medical Center', region: 'Western' }
      ],
      monthlyOrders: 485,
      lastActive: '2024-01-20T14:30:00Z'
    },
    {
      id: '2',
      name: 'MediCare Laboratory Services',
      type: 'clinic',
      contactPerson: 'Dr. Kamal Perera',
      email: 'contact@medicare.lk',
      phone: '+94 11 987 6543',
      address: '456 Kandy Road, Colombo 07',
      status: 'active',
      features: {
        sampleTypeQuantity: false,
        urgentDelivery: true,
        multiParcel: true
      },
      affiliatedHospitals: [
        { id: '1', name: 'Western Medical Center', region: 'Western' },
        { id: '2', name: 'Central Hospital Network', region: 'Central' }
      ],
      monthlyOrders: 324,
      lastActive: '2024-01-20T16:15:00Z'
    },
    {
      id: '3',
      name: 'Advanced Medical Testing',
      type: 'diagnostic_center',
      contactPerson: 'Dr. Samantha Fernando',
      email: 'info@advancedmed.lk',
      phone: '+94 77 123 9876',
      address: '789 Hospital Street, Gampaha',
      status: 'pending',
      features: {
        sampleTypeQuantity: false,
        urgentDelivery: false,
        multiParcel: false
      },
      affiliatedHospitals: [
        { id: '3', name: 'Gampaha Regional Hospital', region: 'Western' }
      ],
      monthlyOrders: 0,
      lastActive: '2024-01-19T10:00:00Z'
    },
    {
      id: '4',
      name: 'City Lab Diagnostics',
      type: 'laboratory',
      contactPerson: 'Mr. Rajesh Silva',
      email: 'admin@citylab.lk',
      phone: '+94 33 456 7890',
      address: '321 Main Street, Kandy',
      status: 'active',
      features: {
        sampleTypeQuantity: true,
        urgentDelivery: false,
        multiParcel: true
      },
      affiliatedHospitals: [
        { id: '4', name: 'Kandy General Hospital', region: 'Central' }
      ],
      monthlyOrders: 267,
      lastActive: '2024-01-20T12:45:00Z'
    },
    {
      id: '5',
      name: 'Southern Diagnostic Center',
      type: 'hospital_lab',
      contactPerson: 'Dr. Nimal Ranasinghe',
      email: 'lab@southern.lk',
      phone: '+94 91 234 5678',
      address: '654 Galle Road, Matara',
      status: 'suspended',
      features: {
        sampleTypeQuantity: false,
        urgentDelivery: false,
        multiParcel: false
      },
      affiliatedHospitals: [
        { id: '5', name: 'Matara Base Hospital', region: 'Southern' }
      ],
      monthlyOrders: 158,
      lastActive: '2024-01-18T09:30:00Z'
    }
  ];

  const analytics = analyticsData?.data || {
    sampleTypeUsage: { enabled: 78, total: 156, percentage: 50 },
    urgentDeliveryUsage: { enabled: 92, total: 156, percentage: 59 },
    multiParcelUsage: { enabled: 134, total: 156, percentage: 86 }
  };

  // Filter centers based on search and filters
  const filteredCenters = centers.filter(center => {
    const matchesSearch = center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         center.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         center.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || center.status === selectedStatus;
    
    const matchesFeature = selectedFeature === 'all' ||
                          (selectedFeature === 'sampleTypeQuantity' && center.features.sampleTypeQuantity) ||
                          (selectedFeature === 'urgentDelivery' && center.features.urgentDelivery) ||
                          (selectedFeature === 'multiParcel' && center.features.multiParcel);
    
    return matchesSearch && matchesStatus && matchesFeature;
  });

  const handleFeatureToggle = async (centerId: string, feature: string, enabled: boolean) => {
    try {
      await enableCenterFeature(centerId, feature, enabled);
      // Refresh data
      refetch();
    } catch (error) {
      console.error('Failed to update feature:', error);
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedCenters.length === 0 || !bulkFeature) return;

    const updates = selectedCenters.map(centerId => ({
      centerId,
      feature: bulkFeature,
      enabled: bulkEnabled
    }));

    try {
      await bulkUpdateFeatures(updates);
      setSelectedCenters([]);
      setBulkFeature('');
      // Refresh data
      refetch();
    } catch (error) {
      console.error('Failed to bulk update features:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'suspended': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusBg = (status: string) => {
    return getStatusColor(status) + '20';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'laboratory': return FileText;
      case 'clinic': return Building2;
      case 'diagnostic_center': return Settings;
      case 'hospital_lab': return Building2;
      default: return FileText;
    }
  };

  const getTypeLabel = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div 
        className="w-full max-w-7xl max-h-[95vh] mx-4 rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
          border: '1px solid rgba(203, 213, 225, 0.3)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-gray-200/60">
          <div className="flex items-center space-x-4">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #4ECDC4 0%, #4A9BC7 100%)'
              }}
            >
              <Settings className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-800">Collection Center Features</h2>
              <p className="text-gray-600 text-lg">Manage features for {centers.length} collection centers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            ×
          </button>
        </div>

        {/* Feature Usage Analytics */}
        <div className="p-8 border-b border-gray-200/40">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Feature Usage Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div 
              className="p-6 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}
            >
              <div className="flex items-center space-x-4">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: '#10b981' }}
                >
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Sample Type & Quantity</h4>
                  <p className="text-2xl font-bold text-gray-800">{analytics.sampleTypeUsage.enabled}/{analytics.sampleTypeUsage.total}</p>
                  <p className="text-sm text-gray-600">{analytics.sampleTypeUsage.percentage}% adoption</p>
                </div>
              </div>
            </div>

            <div 
              className="p-6 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.2)'
              }}
            >
              <div className="flex items-center space-x-4">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: '#ef4444' }}
                >
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Urgent Delivery</h4>
                  <p className="text-2xl font-bold text-gray-800">{analytics.urgentDeliveryUsage.enabled}/{analytics.urgentDeliveryUsage.total}</p>
                  <p className="text-sm text-gray-600">{analytics.urgentDeliveryUsage.percentage}% adoption</p>
                </div>
              </div>
            </div>

            <div 
              className="p-6 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}
            >
              <div className="flex items-center space-x-4">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: '#3b82f6' }}
                >
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Multi-Parcel</h4>
                  <p className="text-2xl font-bold text-gray-800">{analytics.multiParcelUsage.enabled}/{analytics.multiParcelUsage.total}</p>
                  <p className="text-sm text-gray-600">{analytics.multiParcelUsage.percentage}% adoption</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Bulk Actions */}
        <div className="p-8 border-b border-gray-200/40">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search centers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-teal-500"
                />
              </div>

              <select 
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-teal-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>

              <select 
                value={selectedFeature}
                onChange={(e) => setSelectedFeature(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-teal-500"
              >
                <option value="all">All Features</option>
                <option value="sampleTypeQuantity">Sample Type & Quantity</option>
                <option value="urgentDelivery">Urgent Delivery</option>
                <option value="multiParcel">Multi-Parcel</option>
              </select>
            </div>

            {selectedCenters.length > 0 && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">{selectedCenters.length} selected</span>
                
                <select 
                  value={bulkFeature}
                  onChange={(e) => setBulkFeature(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-teal-500"
                >
                  <option value="">Select Feature</option>
                  <option value="sampleTypeQuantity">Sample Type & Quantity</option>
                  <option value="urgentDelivery">Urgent Delivery</option>
                  <option value="multiParcel">Multi-Parcel</option>
                </select>

                <select 
                  value={bulkEnabled.toString()}
                  onChange={(e) => setBulkEnabled(e.target.value === 'true')}
                  className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-teal-500"
                >
                  <option value="true">Enable</option>
                  <option value="false">Disable</option>
                </select>

                <button
                  onClick={handleBulkUpdate}
                  disabled={bulkLoading || !bulkFeature}
                  className="px-6 py-2 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors disabled:opacity-50"
                >
                  {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Collection Centers List */}
        <div className="p-8 max-h-[50vh] overflow-y-auto">
          {centersLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCenters.map((center) => {
                const Icon = getTypeIcon(center.type);
                const isSelected = selectedCenters.includes(center.id);
                
                return (
                  <div 
                    key={center.id}
                    className={`p-6 rounded-2xl transition-all duration-300 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.8) 100%)',
                      border: '1px solid rgba(203, 213, 225, 0.3)'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCenters([...selectedCenters, center.id]);
                            } else {
                              setSelectedCenters(selectedCenters.filter(id => id !== center.id));
                            }
                          }}
                          className="w-4 h-4 text-teal-600 rounded"
                        />
                        
                        <div 
                          className="w-12 h-12 rounded-2xl flex items-center justify-center"
                          style={{
                            backgroundColor: getStatusColor(center.status) + '20',
                            border: `2px solid ${getStatusColor(center.status)}30`
                          }}
                        >
                          <Icon 
                            className="w-6 h-6"
                            style={{ color: getStatusColor(center.status) }}
                          />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-bold text-gray-800">{center.name}</h4>
                            <div 
                              className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                              style={{ backgroundColor: getStatusColor(center.status) }}
                            >
                              {center.status.toUpperCase()}
                            </div>
                            <div className="px-2 py-1 rounded-full text-xs font-semibold text-gray-600 bg-gray-100">
                              {getTypeLabel(center.type)}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4" />
                              <span>{center.contactPerson}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Mail className="w-4 h-4" />
                              <span>{center.email}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Phone className="w-4 h-4" />
                              <span>{center.phone}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4" />
                              <span>{center.address}</span>
                            </div>
                          </div>
                          
                          <div className="mt-2 text-sm text-gray-500">
                            <span>{center.monthlyOrders} orders this month • </span>
                            <span>Last active: {new Date(center.lastActive).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Feature Toggles */}
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className="mb-1">
                            <button
                              onClick={() => handleFeatureToggle(center.id, 'sampleTypeQuantity', !center.features.sampleTypeQuantity)}
                              disabled={updateLoading}
                              className={`w-12 h-6 rounded-full transition-all duration-200 ${
                                center.features.sampleTypeQuantity ? 'bg-green-500' : 'bg-gray-300'
                              }`}
                            >
                              <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                                center.features.sampleTypeQuantity ? 'translate-x-7' : 'translate-x-1'
                              }`} />
                            </button>
                          </div>
                          <div className="text-xs text-gray-500">Sample Type</div>
                        </div>

                        <div className="text-center">
                          <div className="mb-1">
                            <button
                              onClick={() => handleFeatureToggle(center.id, 'urgentDelivery', !center.features.urgentDelivery)}
                              disabled={updateLoading}
                              className={`w-12 h-6 rounded-full transition-all duration-200 ${
                                center.features.urgentDelivery ? 'bg-red-500' : 'bg-gray-300'
                              }`}
                            >
                              <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                                center.features.urgentDelivery ? 'translate-x-7' : 'translate-x-1'
                              }`} />
                            </button>
                          </div>
                          <div className="text-xs text-gray-500">Urgent</div>
                        </div>

                        <div className="text-center">
                          <div className="mb-1">
                            <button
                              onClick={() => handleFeatureToggle(center.id, 'multiParcel', !center.features.multiParcel)}
                              disabled={updateLoading}
                              className={`w-12 h-6 rounded-full transition-all duration-200 ${
                                center.features.multiParcel ? 'bg-teal-500' : 'bg-gray-300'
                              }`}
                            >
                              <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                                center.features.multiParcel ? 'translate-x-7' : 'translate-x-1'
                              }`} />
                            </button>
                          </div>
                          <div className="text-xs text-gray-500">Multi-Parcel</div>
                        </div>

                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-800">{center.monthlyOrders}</div>
                          <div className="text-xs text-gray-500">Orders/Month</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-8 border-t border-gray-200/60">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {filteredCenters.length} of {centers.length} collection centers
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={onClose}
                className="px-8 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}