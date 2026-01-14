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
  Network,
  FlaskConical
} from "lucide-react";

import { useState } from "react";

interface Hospital {
  id: string;
  name: string;
  hospital_type: string;
  is_main_hospital: boolean;
  status: string;
  created_at: string;
  network_name: string;
  network_id: string;
  network_status: string;
  admin_name: string;
  admin_email: string;
  admin_phone: string;
}

interface CollectionCenter {
  id: string;
  center_name: string;
  center_type: string;
  center_status: string;
  phone: string;
  email: string;
  created_at: string;
  hospital_relationships: Array<{
    hospital_id: string;
    hospital_name: string;
    hospital_type: string;
    is_main_hospital: boolean;
    relation_status: string;
    is_main_hospital_relation: boolean;
    approved_at: string | null;
    network_name: string;
    network_id: string;
  }>;
}

interface HospitalDetailModalProps {
  hospital: Hospital | null;
  collectionCenters: CollectionCenter[];
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (hospitalId: string, newStatus: string) => Promise<void>;
  isProcessing?: boolean;
}

export function HospitalDetailModal({
  hospital,
  collectionCenters,
  isOpen,
  onClose,
  onStatusChange,
  isProcessing = false
}: HospitalDetailModalProps) {
  const [processingStatus, setProcessingStatus] = useState(false);

  if (!isOpen || !hospital) return null;

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
    if (!hospital?.id || processingStatus) return;
    
    setProcessingStatus(true);
    try {
      if (onStatusChange) {
        await onStatusChange(hospital.id, newStatus);
      }
    } catch (error) {
      console.error('Failed to change status:', error);
    } finally {
      setProcessingStatus(false);
    }
  };

  const statusConfig = getStatusConfig(hospital.status);
  const StatusIcon = statusConfig.icon;

  const approvedCenters = collectionCenters.filter(c => 
    c.hospital_relationships?.some(rel => 
      rel.hospital_id === hospital.id && rel.relation_status === 'approved'
    )
  );
  const pendingCenters = collectionCenters.filter(c => 
    c.hospital_relationships?.some(rel => 
      rel.hospital_id === hospital.id && rel.relation_status === 'pending'
    )
  );
  const independentCenters = collectionCenters.filter(c => c.center_type === 'independent');
  const dependentCenters = collectionCenters.filter(c => c.center_type === 'dependent');

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
                {hospital.is_main_hospital ?
                  <Hospital className="w-10 h-10 text-white" /> :
                  <Building className="w-10 h-10 text-white" />
                }
              </div>
              
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">{hospital.name}</h2>
                <div className="flex items-center space-x-4 mb-4">
                  <div
                    className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${statusConfig.bg}`}
                  >
                    <StatusIcon className={`w-5 h-5 ${statusConfig.className}`} />
                    <span className={`font-semibold ${statusConfig.className}`}>
                      {statusConfig.text}
                    </span>
                  </div>
                  <div className="px-3 py-1 rounded-full text-sm font-semibold bg-white/20 text-white">
                    {hospital.hospital_type.toUpperCase()}
                  </div>
                  {hospital.is_main_hospital && (
                    <div className="px-3 py-1 rounded-full text-sm font-semibold bg-white/20 text-white">
                      MAIN HOSPITAL
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-white/80">
                    <Network className="w-4 h-4" />
                    <span className="text-sm">Network: {hospital.network_name}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-white/80">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      Created: {new Date(hospital.created_at).toLocaleDateString('en-US', {
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
            {/* Hospital Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Affiliated Centers</p>
                    <p className="text-2xl font-bold text-green-800">{collectionCenters.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center">
                    <FlaskConical className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-teal-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-teal-600 font-medium">Approved Relations</p>
                    <p className="text-2xl font-bold text-teal-800">{approvedCenters.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-teal-200 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-teal-600" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-2xl border border-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-600 font-medium">Pending Relations</p>
                    <p className="text-2xl font-bold text-amber-800">{pendingCenters.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-200 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Independent Centers</p>
                    <p className="text-2xl font-bold text-purple-800">{independentCenters.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-200 rounded-xl flex items-center justify-center">
                    <Building className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Hospital Information */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Hospital Information</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                      {hospital.is_main_hospital ? 
                        <Hospital className="w-6 h-6 text-teal-600" /> : 
                        <Building className="w-6 h-6 text-teal-600" />
                      }
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Hospital Type</p>
                      <p className="font-semibold text-gray-800">
                        {hospital.hospital_type} {hospital.is_main_hospital ? '(Main Hospital)' : '(Regional Hospital)'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <Network className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Hospital Network</p>
                      <p className="font-semibold text-gray-800">{hospital.network_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Network Administrator</p>
                      <p className="font-semibold text-gray-800">{hospital.admin_name}</p>
                      <p className="text-sm text-gray-600">{hospital.admin_email}</p>
                      <p className="text-sm text-gray-600">{hospital.admin_phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                      <StatusIcon className={`w-6 h-6 ${statusConfig.className}`} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Hospital Status</p>
                      <p className={`font-semibold ${statusConfig.className}`}>{statusConfig.text}</p>
                    </div>
                  </div>
                </div>

                {/* Network Approval Management (HQ Only) */}
                {onStatusChange && (
                  <div className="pt-6 border-t border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-800 mb-2 flex items-center space-x-2">
                      <Network className="w-5 h-5 text-purple-600" />
                      <span>Network Status Management (HQ)</span>
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Current Status: <span className="font-semibold">
                        {hospital.network_status === 'approved' ? '✓ Approved' :
                         hospital.network_status === 'rejected' ? '✗ Rejected' :
                         '⏳ Pending HQ Approval'}
                      </span>
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleStatusChange('approved')}
                        disabled={processingStatus || hospital.network_status === 'approved'}
                        className={`px-6 py-3 rounded-2xl font-semibold text-white transition-all duration-200 hover:transform hover:scale-105 disabled:opacity-50 flex items-center justify-center space-x-2 ${
                          hospital.network_status === 'approved' ? 'bg-gray-300 cursor-not-allowed' : ''
                        }`}
                        style={hospital.network_status === 'approved' ? {} : {
                          backgroundColor: '#10b981',
                          boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        <span>
                          {processingStatus ? 'Processing...' :
                           hospital.network_status === 'approved' ? 'Already Approved' :
                           hospital.network_status === 'rejected' ? 'Re-approve Network' :
                           'Approve Network'}
                        </span>
                      </button>
                      <button
                        onClick={() => handleStatusChange('rejected')}
                        disabled={processingStatus || hospital.network_status === 'rejected'}
                        className={`px-6 py-3 rounded-2xl font-semibold text-white transition-all duration-200 hover:transform hover:scale-105 disabled:opacity-50 flex items-center justify-center space-x-2 ${
                          hospital.network_status === 'rejected' ? 'bg-gray-300 cursor-not-allowed' : ''
                        }`}
                        style={hospital.network_status === 'rejected' ? {} : {
                          backgroundColor: '#ef4444',
                          boxShadow: '0 8px 32px rgba(239, 68, 68, 0.3)'
                        }}
                      >
                        <XCircle className="w-5 h-5" />
                        <span>
                          {processingStatus ? 'Processing...' :
                           hospital.network_status === 'rejected' ? 'Already Rejected' :
                           'Reject Network'}
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Hospital Status Management */}
                {onStatusChange && (
                  <div className="pt-6 border-t border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Hospital Status Management</h4>
                    <div className="space-y-3">
                      {['active', 'inactive', 'pending'].map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(status)}
                          disabled={processingStatus || hospital.status === status}
                          className={`w-full px-6 py-3 rounded-2xl font-semibold transition-all duration-200 hover:transform hover:scale-105 disabled:opacity-50 ${
                            hospital.status === status
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : status === 'active'
                                ? 'text-white'
                                : status === 'pending'
                                ? 'text-white'
                                : 'text-white'
                          }`}
                          style={
                            hospital.status === status
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
              </div>

              {/* Affiliated Collection Centers */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Affiliated Collection Centers</h3>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {collectionCenters.length > 0 ? (
                    collectionCenters.map((center) => {
                      const relationship = center.hospital_relationships?.find(rel => rel.hospital_id === hospital.id);
                      if (!relationship) return null;
                      
                      const relationStatusConfig = getStatusConfig(relationship.relation_status);
                      const RelationStatusIcon = relationStatusConfig.icon;
                      
                      return (
                        <div key={center.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-center space-x-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              center.center_type === 'independent' 
                                ? 'bg-teal-100' 
                                : 'bg-purple-100'
                            }`}>
                              <FlaskConical className={`w-5 h-5 ${
                                center.center_type === 'independent' 
                                  ? 'text-teal-600' 
                                  : 'text-purple-600'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-gray-800">{center.center_name}</p>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  center.center_type === 'independent'
                                    ? 'bg-teal-100 text-teal-800'
                                    : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {center.center_type}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <RelationStatusIcon className={`w-4 h-4 ${relationStatusConfig.className}`} />
                                <span className={`${relationStatusConfig.className} font-medium`}>
                                  {relationStatusConfig.text}
                                </span>
                                {relationship.approved_at && (
                                  <span className="text-xs text-gray-500">
                                    • Approved {new Date(relationship.approved_at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-1">
                                <div>
                                  <span className="font-medium">Phone:</span> {center.phone}
                                </div>
                                <div>
                                  <span className="font-medium">Email:</span> {center.email}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <FlaskConical className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No affiliated collection centers</p>
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