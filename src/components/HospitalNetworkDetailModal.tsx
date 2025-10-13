"use client";

import { useState, useEffect } from 'react';
import { 
  X, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Users, 
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  BarChart3,
  DollarSign,
  Package,
  Truck
} from 'lucide-react';
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { operationsApi } from '@/lib/api';

interface HospitalNetwork {
  id: string;
  name: string;
  region: string;
  hospitals: number;
  activeOrders: number;
  ridersOnline: number;
  slaCompliance: number;
  status: string;
  // Extended details
  adminName?: string;
  adminEmail?: string;
  adminPhone?: string;
  adminDesignation?: string;
  totalRiders?: number;
  completedOrders?: number;
  monthlyRevenue?: number;
  subscriptionStatus?: 'active' | 'pending' | 'suspended';
  joinDate?: string;
}

interface HospitalNetworkDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  networkId: string | null;
  networkData?: any;
}

export function HospitalNetworkDetailModal({ 
  isOpen, 
  onClose, 
  networkId,
  networkData 
}: HospitalNetworkDetailModalProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [displayNetworkData, setDisplayNetworkData] = useState<HospitalNetwork | null>(null);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [performance, setPerformance] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && networkId) {
      loadNetworkData();
    }
  }, [isOpen, networkId, networkData]);

  const loadNetworkData = async () => {
    if (!networkId) return;

    setLoading(true);
    console.log('Modal received networkData:', networkData);
    console.log('Regional hospitals detail:', networkData?.regional_hospitals_detail);
    try {
      // Load network details, hospitals, riders, and performance data
      const [networkResponse, hospitalsResponse, ridersResponse, performanceResponse] = await Promise.all([
        operationsApi.getHospitalNetworkDetails(networkId).catch(() => ({ success: false })),
        operationsApi.getNetworkHospitals(networkId).catch(() => ({ success: false })),
        operationsApi.getNetworkRiders(networkId).catch(() => ({ success: false })),
        operationsApi.getNetworkPerformance(networkId, '30d').catch(() => ({ success: false }))
      ]);

          // Use passed networkData (which is actually hospital data from dashboard)
      if (networkData) {
        setDisplayNetworkData({
          id: networkData.id,
          name: networkData.name,
          region: `${networkData.city}, ${networkData.province}`,
          hospitals: (networkData.regional_hospitals_detail?.length || 0), // Regional hospitals count
          activeOrders: networkData.activeOrders,
          ridersOnline: networkData.ridersOnline,
          slaCompliance: 95, // Default for hospitals
          status: networkData.status === 'active' ? 'Active' : 'Inactive',
          adminName: networkData.network_admin || 'Hospital Administrator',
          adminEmail: networkData.network_admin_email || networkData.email,
          adminPhone: networkData.network_admin_phone || networkData.contact_phone,
          adminDesignation: 'Hospital Administrator',
          totalRiders: networkData.ridersOnline,
          completedOrders: networkData.activeOrders * 45, // Estimate based on active orders
          monthlyRevenue: 45000, // Estimate for hospital
          subscriptionStatus: 'active',
          joinDate: networkData.created_at ? networkData.created_at.split('T')[0] : '2024-01-01'
        });
      } else {
        // Only use API response if available, otherwise don't set anything
        if (networkResponse.success && 'data' in networkResponse && networkResponse.data) {
          setDisplayNetworkData(networkResponse.data as HospitalNetwork);
        }
      }

      // Set hospitals data - show ONLY regional hospitals
      const realHospitals: any[] = [];
      if (networkData && networkData.regional_hospitals_detail && networkData.regional_hospitals_detail.length > 0) {
        networkData.regional_hospitals_detail.forEach((regionalHospital: any) => {
          realHospitals.push({
            id: regionalHospital.id,
            name: regionalHospital.name,
            type: 'regional',
            address: `${regionalHospital.city || 'Not specified'}, ${regionalHospital.province || 'Not specified'}`,
            phone: regionalHospital.contact_phone || regionalHospital.phone || 'Not provided',
            activeOrders: 0, // Regional hospitals don't have active orders in current data
            ridersAssigned: 0, // Regional hospitals don't have riders in current data
            slaCompliance: 95,
            status: regionalHospital.status || 'active'
          });
        });
      }

      setHospitals(hospitalsResponse.success && 'data' in hospitalsResponse && hospitalsResponse.data ? hospitalsResponse.data as any[] : realHospitals);

      // Set riders data - use riders from networkData (passed from dashboard)
      let hospitalRiders: any[] = [];
      if (ridersResponse.success && 'data' in ridersResponse && ridersResponse.data) {
        hospitalRiders = ridersResponse.data as any[];
      } else if (networkData?.riders_detail) {
        // Use riders data passed from dashboard
        hospitalRiders = networkData.riders_detail.map((rider: any) => ({
          id: rider.id,
          name: rider.rider_name || rider.full_name,
          email: rider.email,
          phone: rider.phone || rider.mobile_number,
          hospital: networkData.name,
          status: rider.rider_status === 'approved' ? 'available' : 'inactive',
          rating: rider.rating || 0,
          totalDeliveries: rider.total_deliveries || 0,
          totalKm: rider.total_km || 0
        }));
      }
      setRiders(hospitalRiders);

      // Set performance data - only use real data from API
      if (performanceResponse.success && 'data' in performanceResponse && performanceResponse.data) {
        setPerformance(performanceResponse.data);
      } else {
        setPerformance(null);
      }

    } catch (error) {
      console.error('Failed to load network data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !networkId) return null;

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'optimal':
      case 'active':
        return '#10b981';
      case 'good':
        return '#5DADE2';
      case 'warning':
        return '#f59e0b';
      case 'critical':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusBg = (status: string) => {
    const color = getStatusColor(status);
    return color + '20';
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="w-full max-w-7xl max-h-[95vh] mx-4 rounded-3xl overflow-y-auto"
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
                background: 'linear-gradient(135deg, #5DADE2 0%, #4A9BC7 100%)'
              }}
            >
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-3xl font-bold text-gray-800">{displayNetworkData?.name}</h2>
                <div 
                  className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: getStatusColor(displayNetworkData?.status || '') }}
                >
                  {displayNetworkData?.status}
                </div>
              </div>
              <p className="text-gray-600 text-lg">{displayNetworkData?.region} Region Network</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Building2 className="w-4 h-4" />
                  <span>{displayNetworkData?.hospitals} hospitals</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{displayNetworkData?.totalRiders} riders</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {displayNetworkData?.joinDate}</span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Key Metrics */}
        <div className="p-8 border-b border-gray-200/40">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div 
              className="p-6 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(93, 173, 226, 0.1) 0%, rgba(74, 155, 199, 0.05) 100%)',
                border: '1px solid rgba(93, 173, 226, 0.2)'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: '#5DADE2' }}
                >
                  <Package className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">{displayNetworkData?.activeOrders}</h3>
              <p className="text-sm text-gray-600">Active Orders</p>
            </div>

            <div 
              className="p-6 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: '#10b981' }}
                >
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">{displayNetworkData?.ridersOnline}</h3>
              <p className="text-sm text-gray-600">Riders Online</p>
            </div>


            <div
              className="p-6 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.1) 0%, rgba(120, 53, 15, 0.05) 100%)',
                border: '1px solid rgba(139, 69, 19, 0.2)'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: '#8b4513' }}
                >
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">{displayNetworkData?.hospitals || 1}</h3>
              <p className="text-sm text-gray-600">Total Hospitals</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 p-6 border-b border-gray-200/40">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'hospitals', label: 'Hospitals' },
            { id: 'riders', label: 'Riders' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* Network Administration */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div 
                      className="p-6 rounded-2xl"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.8) 100%)',
                        border: '1px solid rgba(203, 213, 225, 0.3)'
                      }}
                    >
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Network Administration</h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <User className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Administrator</p>
                            <p className="text-gray-800">{displayNetworkData?.adminName}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Mail className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Email</p>
                            <p className="text-gray-800">{displayNetworkData?.adminEmail}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Phone className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Phone</p>
                            <p className="text-gray-800">{displayNetworkData?.adminPhone}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Building2 className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Designation</p>
                            <p className="text-gray-800">{displayNetworkData?.adminDesignation}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recent Performance */}
                    <div 
                      className="p-6 rounded-2xl"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.8) 100%)',
                        border: '1px solid rgba(203, 213, 225, 0.3)'
                      }}
                    >
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Performance Summary</h3>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Active Orders</span>
                          <span className="text-xl font-bold text-gray-800">{displayNetworkData?.activeOrders}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Total Riders</span>
                          <span className="text-xl font-bold text-gray-800">{displayNetworkData?.totalRiders}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Hospital Status</span>
                          <span className="text-xl font-bold text-green-500">{displayNetworkData?.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {activeTab === 'hospitals' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-gray-800">Network Hospitals ({hospitals?.length || 0})</h3>
                  
                  <div className="space-y-4">
                    {hospitals && hospitals.length > 0 ? hospitals.map((hospital) => (
                      <div 
                        key={hospital.id}
                        className="p-6 rounded-2xl"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.8) 100%)',
                          border: '1px solid rgba(203, 213, 225, 0.3)'
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div 
                              className="w-12 h-12 rounded-2xl flex items-center justify-center"
                              style={{
                                backgroundColor: hospital.type === 'main' ? '#5DADE2' : '#4A9BC7'
                              }}
                            >
                              <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="font-bold text-gray-800">{hospital.name}</h4>
                                <div 
                                  className="px-2 py-1 rounded-full text-xs font-semibold text-white"
                                  style={{
                                    backgroundColor: hospital.type === 'main' ? '#10b981' : '#f59e0b'
                                  }}
                                >
                                  {hospital.type === 'main' ? 'Main' : 'Regional'}
                                </div>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <div className="flex items-center space-x-1">
                                  <MapPin className="w-4 h-4" />
                                  <span>{hospital.address}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Phone className="w-4 h-4" />
                                  <span>{hospital.phone}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-6">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-gray-800">{hospital.activeOrders}</div>
                              <div className="text-xs text-gray-500 uppercase">Active Orders</div>
                            </div>
                            
                            <div className="text-center">
                              <div className="text-2xl font-bold text-gray-800">{hospital.ridersAssigned}</div>
                              <div className="text-xs text-gray-500 uppercase">Riders</div>
                            </div>

                            <div className="text-center">
                              <div className="text-2xl font-bold text-gray-800">{hospital.slaCompliance}%</div>
                              <div className="text-xs text-gray-500 uppercase">SLA</div>
                            </div>

                            <div 
                              className="flex items-center space-x-2 px-4 py-2 rounded-full"
                              style={{
                                backgroundColor: getStatusBg(hospital.status),
                                borderColor: getStatusColor(hospital.status),
                                border: '1px solid'
                              }}
                            >
                              <div 
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: getStatusColor(hospital.status) }}
                              />
                              <span 
                                className="text-sm font-bold capitalize"
                                style={{ color: getStatusColor(hospital.status) }}
                              >
                                {hospital.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-12">
                        <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No hospitals found for this network</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'riders' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-gray-800">Network Riders ({riders?.length || 0})</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {riders && riders.length > 0 ? riders.map((rider) => (
                      <div 
                        key={rider.id}
                        className="p-6 rounded-2xl"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.8) 100%)',
                          border: '1px solid rgba(203, 213, 225, 0.3)'
                        }}
                      >
                        <div className="flex items-center space-x-4 mb-4">
                          <div 
                            className="w-12 h-12 rounded-2xl flex items-center justify-center"
                            style={{
                              backgroundColor: rider.status === 'available' ? '#10b981' : 
                                             rider.status === 'busy' ? '#f59e0b' : '#6b7280'
                            }}
                          >
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800">{rider.name}</h4>
                            <p className="text-sm text-gray-600">{rider.hospital}</p>
                            <div className="flex items-center space-x-1 mt-1">
                              <span className="text-xs text-gray-500">Rider ID: {rider.id.slice(0, 8)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Phone</span>
                            <span className="text-sm font-bold text-gray-800">{rider.phone}</span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Total Deliveries</span>
                            <span className="text-sm font-bold text-gray-800">{rider.totalDeliveries}</span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Total KM</span>
                            <span className="text-sm font-bold text-gray-800">{rider.totalKm} km</span>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-12">
                        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No riders found for this network</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </>
          )}
        </div>

        {/* Actions */}
        <div className="p-8 border-t border-gray-200/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div
                className="px-4 py-2 rounded-xl text-sm font-semibold"
                style={{
                  backgroundColor: displayNetworkData?.status === 'Active' ? '#10b981' : '#f59e0b',
                  color: 'white'
                }}
              >
                Status: {displayNetworkData?.status?.toUpperCase()}
              </div>
              <div className="text-sm text-gray-600">
                Joined: {displayNetworkData?.joinDate}
              </div>
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