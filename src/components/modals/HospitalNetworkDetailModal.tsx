"use client";

import {
  X,
  Hospital,
  Building,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Settings,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Users,
  Activity,
  Network
} from "lucide-react";

import { useState } from "react";

interface HospitalNetwork {
  id: string;
  network_name: string;
  admin_name: string;
  admin_email: string;
  admin_phone: string;
  network_status: string;
  network_created_at: string;
  hospitals?: Array<{
    id: string;
    name: string;
    hospital_type: string;
    is_main_hospital: boolean;
    status: string;
    created_at: string;
  }>;
}

interface HospitalNetworkDetailModalProps {
  network: HospitalNetwork | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (networkId: string, newStatus: string) => Promise<void>;
  isProcessing?: boolean;
}

export function HospitalNetworkDetailModal({
  network,
  isOpen,
  onClose,
  onStatusChange,
  isProcessing = false
}: HospitalNetworkDetailModalProps) {
  const [processingStatus, setProcessingStatus] = useState(false);

  if (!isOpen || !network) return null;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          icon: CheckCircle2,
          color: '#10b981',
          text: 'Active',
          className: 'text-green-600',
          bg: 'bg-green-100'
        };
      case 'pending':
        return {
          icon: Clock,
          color: '#f59e0b',
          text: 'Pending',
          className: 'text-amber-600',
          bg: 'bg-amber-100'
        };
      case 'inactive':
        return {
          icon: XCircle,
          color: '#ef4444',
          text: 'Inactive',
          className: 'text-red-600',
          bg: 'bg-red-100'
        };
      default:
        return {
          icon: AlertTriangle,
          color: '#6b7280',
          text: 'Unknown',
          className: 'text-gray-600',
          bg: 'bg-gray-100'
        };
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!network?.id || processingStatus) return;
    
    setProcessingStatus(true);
    try {
      if (onStatusChange) {
        await onStatusChange(network.id, newStatus);
      }
    } catch (error) {
      console.error('Failed to change status:', error);
    } finally {
      setProcessingStatus(false);
    }
  };

  const statusConfig = getStatusConfig(network.network_status);
  const StatusIcon = statusConfig.icon;

  const activeHospitals = network.hospitals?.filter(h => h.status === 'active').length || 0;
  const mainHospitals = network.hospitals?.filter(h => h.is_main_hospital).length || 0;
  const regionalHospitals = network.hospitals?.filter(h => !h.is_main_hospital).length || 0;

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
                <Hospital className="w-10 h-10 text-white" />
              </div>
              
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">{network.network_name}</h2>
                <div className="flex items-center space-x-4 mb-4">
                  <div
                    className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${statusConfig.bg}`}
                  >
                    <StatusIcon className={`w-5 h-5 ${statusConfig.className}`} />
                    <span className={`font-semibold ${statusConfig.className}`}>
                      {statusConfig.text}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span className="text-white/90">{network.hospitals?.length || 0} Hospitals</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-white/80">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      Network Created: {new Date(network.network_created_at).toLocaleDateString('en-US', {
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
            {/* Network Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-teal-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-teal-600 font-medium">Total Hospitals</p>
                    <p className="text-2xl font-bold text-teal-800">{network.hospitals?.length || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-teal-200 rounded-xl flex items-center justify-center">
                    <Hospital className="w-6 h-6 text-teal-600" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Active Hospitals</p>
                    <p className="text-2xl font-bold text-green-800">{activeHospitals}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-2xl border border-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-600 font-medium">Main Hospitals</p>
                    <p className="text-2xl font-bold text-amber-800">{mainHospitals}</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-200 rounded-xl flex items-center justify-center">
                    <Building className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Regional</p>
                    <p className="text-2xl font-bold text-purple-800">{regionalHospitals}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-200 rounded-xl flex items-center justify-center">
                    <Network className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Network Administration */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Network Administration</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Network Administrator</p>
                      <p className="font-semibold text-gray-800">{network.admin_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <Phone className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone Number</p>
                      <p className="font-semibold text-gray-800">{network.admin_phone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Mail className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email Address</p>
                      <p className="font-semibold text-gray-800">{network.admin_email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                      <StatusIcon className={`w-6 h-6 ${statusConfig.className}`} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Network Status</p>
                      <p className={`font-semibold ${statusConfig.className}`}>{statusConfig.text}</p>
                    </div>
                  </div>
                </div>

                {/* Status Management */}
                {onStatusChange && (
                  <div className="pt-6 border-t border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Status Management</h4>
                    <div className="space-y-3">
                      {['active', 'inactive', 'pending'].map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(status)}
                          disabled={processingStatus || network.network_status === status}
                          className={`w-full px-6 py-3 rounded-2xl font-semibold transition-all duration-200 hover:transform hover:scale-105 disabled:opacity-50 ${
                            network.network_status === status
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : status === 'active'
                                ? 'text-white'
                                : status === 'pending'
                                ? 'text-white'
                                : 'text-white'
                          }`}
                          style={
                            network.network_status === status
                              ? {}
                              : status === 'active'
                              ? {
                                  backgroundColor: '#10b981',
                                  boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)'
                                }
                              : status === 'pending'
                              ? {
                                  backgroundColor: '#f59e0b',
                                  boxShadow: '0 8px 32px rgba(245, 158, 11, 0.3)'
                                }
                              : {
                                  backgroundColor: '#ef4444',
                                  boxShadow: '0 8px 32px rgba(239, 68, 68, 0.3)'
                                }
                          }
                        >
                          {processingStatus ? 'Processing...' : `Mark as ${status.charAt(0).toUpperCase() + status.slice(1)}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Network Approval Management (HQ Only) */}
                {onStatusChange && (
                  <div className="pt-6 border-t border-gray-200 mt-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">Network Status Management (HQ)</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Current Status: {' '}
                      {network.network_status === 'approved' && (
                        <span className="font-semibold text-green-600">✓ Approved by HQ</span>
                      )}
                      {network.network_status === 'rejected' && (
                        <span className="font-semibold text-red-600">✗ Rejected by HQ</span>
                      )}
                      {network.network_status === 'pending_hq_approval' && (
                        <span className="font-semibold text-amber-600">⏳ Pending HQ Approval</span>
                      )}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleStatusChange('approved')}
                        disabled={processingStatus || network.network_status === 'approved'}
                        className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-200 hover:transform hover:scale-105 disabled:opacity-50 ${
                          network.network_status === 'approved'
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'text-white'
                        }`}
                        style={
                          network.network_status === 'approved'
                            ? {}
                            : {
                                backgroundColor: '#10b981',
                                boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)'
                              }
                        }
                      >
                        {processingStatus ? (
                          'Processing...'
                        ) : network.network_status === 'approved' ? (
                          'Already Approved'
                        ) : network.network_status === 'rejected' ? (
                          'Re-approve Network'
                        ) : (
                          'Approve Network'
                        )}
                      </button>
                      <button
                        onClick={() => handleStatusChange('rejected')}
                        disabled={processingStatus || network.network_status === 'rejected'}
                        className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-200 hover:transform hover:scale-105 disabled:opacity-50 ${
                          network.network_status === 'rejected'
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'text-white'
                        }`}
                        style={
                          network.network_status === 'rejected'
                            ? {}
                            : {
                                backgroundColor: '#ef4444',
                                boxShadow: '0 8px 32px rgba(239, 68, 68, 0.3)'
                              }
                        }
                      >
                        {processingStatus ? 'Processing...' : network.network_status === 'rejected' ? 'Already Rejected' : 'Reject Network'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Hospitals in Network */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Hospitals in Network</h3>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {network.hospitals && network.hospitals.length > 0 ? (
                    network.hospitals.map((hospital) => {
                      const hospitalStatusConfig = getStatusConfig(hospital.status);
                      const HospitalStatusIcon = hospitalStatusConfig.icon;
                      
                      return (
                        <div key={hospital.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-center space-x-4">
                            <div className={`w-10 h-10 ${hospitalStatusConfig.bg} rounded-lg flex items-center justify-center`}>
                              <Building className={`w-5 h-5 ${hospitalStatusConfig.className}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-gray-800">{hospital.name}</p>
                                {hospital.is_main_hospital && (
                                  <span className="text-xs px-2 py-1 rounded-full bg-teal-100 text-teal-800 font-medium">
                                    Main Hospital
                                  </span>
                                )}
                                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                                  {hospital.hospital_type}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <HospitalStatusIcon className={`w-4 h-4 ${hospitalStatusConfig.className}`} />
                                <span className={`text-sm ${hospitalStatusConfig.className} font-medium`}>
                                  {hospitalStatusConfig.text}
                                </span>
                                <span className="text-xs text-gray-500">• {new Date(hospital.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <Hospital className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No hospitals in this network</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}