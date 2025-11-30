"use client";

import { useState } from 'react';
import { 
  X, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  User,
  Calendar,
  Badge,
  Settings,
  Zap,
  Package
} from 'lucide-react';

interface ApprovalItem {
  id: string;
  type: 'hospital' | 'collection_center' | 'regional_hospital';
  name: string;
  appliedDate: string;
  priority: 'High' | 'Normal' | 'Low';
  status: 'Pending' | 'Under Review' | 'Approved' | 'Rejected';
  // Collection center specific
  centerType?: 'laboratory' | 'clinic' | 'diagnostic_center' | 'hospital_lab';
  licenseNumber?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  businessHours?: string;
  requestedFeatures?: {
    sampleTypeQuantity: boolean;
    urgentNonUrgent: boolean;
    multiParcel: boolean;
  };
  affiliatedHospitals?: Array<{ id: string; name: string; region: string }>;
  // Hospital network specific
  adminName?: string;
  adminEmail?: string;
  adminPhone?: string;
  adminDesignation?: string;
  networkScope?: string;
  proposedHospitals?: Array<{ name: string; location: string; type: string }>;
  // Approval history
  hospitalApprovals?: Array<{
    hospitalName: string;
    status: 'approved' | 'pending' | 'rejected';
    date?: string;
    notes?: string;
  }>;
  documents?: Array<{
    type: string;
    name: string;
    url?: string;
    verified: boolean;
  }>;
}

interface ApprovalDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ApprovalItem | null;
  onApprove: (itemId: string, type: string, notes?: string) => Promise<void>;
  onReject: (itemId: string, type: string, reason: string, notes?: string) => Promise<void>;
  loading?: boolean;
}

export function ApprovalDetailModal({ 
  isOpen, 
  onClose, 
  item, 
  onApprove, 
  onReject, 
  loading = false 
}: ApprovalDetailModalProps) {
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [activeTab, setActiveTab] = useState('details');

  if (!isOpen || !item) return null;

  const handleApprove = async () => {
    try {
      await onApprove(item.id, item.type, notes);
      setNotes('');
      onClose();
    } catch (error) {
      console.error('Approve failed:', error);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;
    
    try {
      await onReject(item.id, item.type, rejectionReason, notes);
      setNotes('');
      setRejectionReason('');
      onClose();
    } catch (error) {
      console.error('Reject failed:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return '#ef4444';
      case 'Normal': return '#4ECDC4';
      case 'Low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'hospital': return Building2;
      case 'collection_center': return FileText;
      case 'regional_hospital': return Building2;
      default: return Building2;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'hospital': return 'Hospital Network';
      case 'collection_center': return 'Collection Center';
      case 'regional_hospital': return 'Regional Hospital';
      default: return 'Unknown';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div 
        className="w-full max-w-4xl max-h-[90vh] mx-4 rounded-3xl overflow-hidden"
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
                backgroundColor: getPriorityColor(item.priority) + '20',
                border: `2px solid ${getPriorityColor(item.priority)}30`
              }}
            >
              {(() => {
                const Icon = getTypeIcon(item.type);
                return <Icon className="w-8 h-8" style={{ color: getPriorityColor(item.priority) }} />;
              })()}
            </div>
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-3xl font-bold text-gray-800">{item.name}</h2>
                <div 
                  className="px-3 py-1 rounded-full text-xs font-semibold text-white"  
                  style={{ backgroundColor: getPriorityColor(item.priority) }}
                >
                  {item.priority}
                </div>
              </div>
              <p className="text-gray-600 text-lg">{getTypeLabel(item.type)} Application</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Applied {item.appliedDate}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{item.status}</span>
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

        {/* Tabs */}
        <div className="flex space-x-1 p-6 border-b border-gray-200/40">
          {['details', 'features', 'history', 'documents'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-8 max-h-[50vh] overflow-y-auto">
          {activeTab === 'details' && (
            <div className="space-y-8">
              {item.type === 'collection_center' && (
                <>
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Basic Information</h3>
                      
                      <div className="flex items-center space-x-3">
                        <Badge className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Center Type</p>
                          <p className="text-gray-800 capitalize">{item.centerType?.replace('_', ' ')}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">License Number</p>
                          <p className="text-gray-800">{item.licenseNumber || 'Not provided'}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <User className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Contact Person</p>
                          <p className="text-gray-800">{item.contactPerson || 'Not provided'}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Clock className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Business Hours</p>
                          <p className="text-gray-800">{item.businessHours || '9:00 AM - 5:00 PM'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Contact Details</h3>
                      
                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Email</p>
                          <p className="text-gray-800">{item.email || 'Not provided'}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Phone</p>
                          <p className="text-gray-800">{item.phone || 'Not provided'}</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <MapPin className="w-5 h-5 text-gray-600 mt-1" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Address</p>
                          <p className="text-gray-800">{item.address || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Affiliated Hospitals */}
                  {item.affiliatedHospitals && item.affiliatedHospitals.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Requested Hospital Affiliations</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {item.affiliatedHospitals.map((hospital, index) => (
                          <div 
                            key={index}
                            className="p-4 rounded-2xl"
                            style={{
                              background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.1) 0%, rgba(74, 155, 199, 0.05) 100%)',
                              border: '1px solid rgba(78, 205, 196, 0.2)'
                            }}
                          >
                            <div className="flex items-center space-x-3">
                              <Building2 className="w-6 h-6 text-teal-600" />
                              <div>
                                <p className="font-semibold text-gray-800">{hospital.name}</p>
                                <p className="text-sm text-gray-600">{hospital.region} Region</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {item.type === 'hospital' && (
                <>
                  {/* Hospital Network Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Network Administration</h3>
                      
                      <div className="flex items-center space-x-3">
                        <User className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Admin Name</p>
                          <p className="text-gray-800">{item.adminName || 'Not provided'}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Admin Email</p>
                          <p className="text-gray-800">{item.adminEmail || 'Not provided'}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Admin Phone</p>
                          <p className="text-gray-800">{item.adminPhone || 'Not provided'}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Badge className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Designation</p>
                          <p className="text-gray-800">{item.adminDesignation || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Network Details</h3>
                      
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Network Scope</p>
                          <p className="text-gray-800">{item.networkScope || 'Multi-regional'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Proposed Hospitals */}
                  {item.proposedHospitals && item.proposedHospitals.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Proposed Network Hospitals</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {item.proposedHospitals.map((hospital, index) => (
                          <div 
                            key={index}
                            className="p-4 rounded-2xl"
                            style={{
                              background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.1) 0%, rgba(74, 155, 199, 0.05) 100%)',
                              border: '1px solid rgba(78, 205, 196, 0.2)'
                            }}
                          >
                            <div className="flex items-center space-x-3">
                              <Building2 className="w-6 h-6 text-teal-600" />
                              <div>
                                <p className="font-semibold text-gray-800">{hospital.name}</p>
                                <p className="text-sm text-gray-600">{hospital.location}</p>
                                <div 
                                  className="inline-block px-2 py-1 rounded-full text-xs font-semibold mt-1"
                                  style={{
                                    backgroundColor: hospital.type === 'main' ? '#10b981' : '#f59e0b',
                                    color: 'white'
                                  }}
                                >
                                  {hospital.type === 'main' ? 'Main Hospital' : 'Regional'}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'features' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Requested Features</h3>
              
              {item.type === 'collection_center' && item.requestedFeatures && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div 
                    className="p-6 rounded-2xl"
                    style={{
                      background: item.requestedFeatures.sampleTypeQuantity 
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)'
                        : 'linear-gradient(135deg, rgba(107, 114, 128, 0.1) 0%, rgba(75, 85, 99, 0.05) 100%)',
                      border: `1px solid ${item.requestedFeatures.sampleTypeQuantity ? '#10b981' : '#6b7280'}20`
                    }}
                  >
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{
                          backgroundColor: item.requestedFeatures.sampleTypeQuantity ? '#10b981' : '#6b7280'
                        }}
                      >
                        <Package className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Sample Type & Quantity</h4>
                        <p className="text-sm text-gray-600">Advanced sample categorization</p>
                        <div className="flex items-center mt-2">
                          {item.requestedFeatures.sampleTypeQuantity ? (
                            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-gray-400 mr-2" />
                          )}
                          <span className={`text-sm font-medium ${
                            item.requestedFeatures.sampleTypeQuantity ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            {item.requestedFeatures.sampleTypeQuantity ? 'Requested' : 'Not Requested'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div 
                    className="p-6 rounded-2xl"
                    style={{
                      background: item.requestedFeatures.urgentNonUrgent 
                        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)'
                        : 'linear-gradient(135deg, rgba(107, 114, 128, 0.1) 0%, rgba(75, 85, 99, 0.05) 100%)',
                      border: `1px solid ${item.requestedFeatures.urgentNonUrgent ? '#ef4444' : '#6b7280'}20`
                    }}
                  >
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{
                          backgroundColor: item.requestedFeatures.urgentNonUrgent ? '#ef4444' : '#6b7280'
                        }}
                      >
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Urgent Delivery</h4>
                        <p className="text-sm text-gray-600">Priority delivery options</p>
                        <div className="flex items-center mt-2">
                          {item.requestedFeatures.urgentNonUrgent ? (
                            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-gray-400 mr-2" />
                          )}
                          <span className={`text-sm font-medium ${
                            item.requestedFeatures.urgentNonUrgent ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            {item.requestedFeatures.urgentNonUrgent ? 'Requested' : 'Not Requested'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div 
                    className="p-6 rounded-2xl md:col-span-2"
                    style={{
                      background: item.requestedFeatures.multiParcel 
                        ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)'
                        : 'linear-gradient(135deg, rgba(107, 114, 128, 0.1) 0%, rgba(75, 85, 99, 0.05) 100%)',
                      border: `1px solid ${item.requestedFeatures.multiParcel ? '#3b82f6' : '#6b7280'}20`
                    }}
                  >
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{
                          backgroundColor: item.requestedFeatures.multiParcel ? '#3b82f6' : '#6b7280'
                        }}
                      >
                        <Settings className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Multi-Parcel Management</h4>
                        <p className="text-sm text-gray-600">Handle multiple sample batches efficiently</p>
                        <div className="flex items-center mt-2">
                          {item.requestedFeatures.multiParcel ? (
                            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-gray-400 mr-2" />
                          )}
                          <span className={`text-sm font-medium ${
                            item.requestedFeatures.multiParcel ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            {item.requestedFeatures.multiParcel ? 'Requested' : 'Not Requested'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {item.type === 'hospital' && (
                <div className="p-6 rounded-2xl bg-teal-50 border border-teal-200">
                  <p className="text-gray-600">Hospital networks receive full system access upon approval, including rider management, collection center oversight, and reporting capabilities.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Approval History</h3>
              
              {item.hospitalApprovals && item.hospitalApprovals.length > 0 ? (
                <div className="space-y-4">
                  {item.hospitalApprovals.map((approval, index) => (
                    <div 
                      key={index}
                      className="p-4 rounded-2xl"
                      style={{
                        background: approval.status === 'approved' 
                          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)'
                          : approval.status === 'rejected'
                          ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)'
                          : 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
                        border: `1px solid ${
                          approval.status === 'approved' ? '#10b981' 
                          : approval.status === 'rejected' ? '#ef4444' 
                          : '#f59e0b'
                        }20`
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            approval.status === 'approved' ? 'bg-green-500' 
                            : approval.status === 'rejected' ? 'bg-red-500'
                            : 'bg-yellow-500'
                          }`}>
                            {approval.status === 'approved' ? (
                              <CheckCircle className="w-5 h-5 text-white" />
                            ) : (
                              <Clock className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{approval.hospitalName}</p>
                            <p className="text-sm text-gray-600 capitalize">{approval.status}</p>
                            {approval.date && (
                              <p className="text-xs text-gray-500">{approval.date}</p>
                            )}
                          </div>
                        </div>
                        <div 
                          className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
                            approval.status === 'approved' ? 'bg-green-500' 
                            : approval.status === 'rejected' ? 'bg-red-500'
                            : 'bg-yellow-500'
                          }`}
                        >
                          {approval.status.toUpperCase()}
                        </div>
                      </div>
                      {approval.notes && (
                        <p className="text-sm text-gray-600 mt-2 ml-13">{approval.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No approval history available</p>
                  <p className="text-sm text-gray-400 mt-1">Approval history will appear here once hospitals review the application</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Supporting Documents</h3>
              
              {item.documents && item.documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {item.documents.map((doc, index) => (
                    <div 
                      key={index}
                      className="p-4 rounded-2xl border"
                      style={{
                        background: doc.verified 
                          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)'
                          : 'linear-gradient(135deg, rgba(107, 114, 128, 0.1) 0%, rgba(75, 85, 99, 0.05) 100%)',
                        borderColor: doc.verified ? '#10b981' : '#6b7280'
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          doc.verified ? 'bg-green-500' : 'bg-gray-500'
                        }`}>
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">{doc.name}</p>
                          <p className="text-sm text-gray-600 capitalize">{doc.type.replace('_', ' ')}</p>
                          <div className="flex items-center mt-1">
                            {doc.verified ? (
                              <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-gray-400 mr-1" />
                            )}
                            <span className={`text-xs font-medium ${
                              doc.verified ? 'text-green-600' : 'text-gray-500'
                            }`}>
                              {doc.verified ? 'Verified' : 'Pending Verification'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No documents uploaded</p>
                  <p className="text-sm text-gray-400 mt-1">Supporting documents will appear here when provided</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-8 border-t border-gray-200/60">
          <div className="space-y-4">
            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Approval/Rejection Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-teal-500"
                placeholder="Add notes about this approval decision..."
              />
            </div>

            {/* Rejection Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason (if rejecting)
              </label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Select rejection reason...</option>
                <option value="incomplete_documentation">Incomplete Documentation</option>
                <option value="invalid_credentials">Invalid Credentials</option>
                <option value="duplicate_application">Duplicate Application</option>
                <option value="insufficient_information">Insufficient Information</option>
                <option value="policy_violation">Policy Violation</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4">
              <button
                onClick={onClose}
                className="px-8 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              
              <button
                onClick={handleReject}
                disabled={loading || !rejectionReason.trim()}
                className="px-8 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Reject'}
              </button>
              
              <button
                onClick={handleApprove}
                disabled={loading}
                className="px-8 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}