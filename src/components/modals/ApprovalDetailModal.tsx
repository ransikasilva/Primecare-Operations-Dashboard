"use client";

import { useState, useEffect } from "react";
import { useRejectApproval } from "@/hooks/useApi";
import {
  X,
  MapPin,
  Phone,
  Mail,
  Building2,
  Clock,
  User,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  Truck,
  Hospital,
  Star,
  Activity,
  Globe,
  ToggleLeft,
  ToggleRight
} from "lucide-react";

interface ApprovalItem {
  id: string;
  type: 'hospital_network' | 'main_hospital' | 'collection_center' | 'rider';
  applicantName: string;
  status: string;
  appliedDate: string;
  details: any; // Will contain type-specific data
  priority?: 'High' | 'Normal' | 'Low';
  requestingNetwork?: string;
}

interface ApprovalDetailModalProps {
  item: ApprovalItem | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (itemId: string, itemName: string, selectedFeatures?: { [key: string]: boolean }) => Promise<void>;
  onReject: (itemId: string, itemName: string, reason?: string) => Promise<void>;
  isProcessing: boolean;
}

export function ApprovalDetailModal({
  item,
  isOpen,
  onClose,
  onApprove,
  onReject,
  isProcessing
}: ApprovalDetailModalProps) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState<{ [key: string]: boolean }>({});
  const { rejectApproval, loading: rejectingApproval } = useRejectApproval();

  // Initialize selected features when item changes
  useEffect(() => {
    if (item?.type === 'collection_center' && item.details?.featureRequests) {
      const initialFeatures: { [key: string]: boolean } = {};
      item.details.featureRequests.forEach((request: any) => {
        // Default to enabled for all requested features
        initialFeatures[request.feature_id] = true;
      });
      setSelectedFeatures(initialFeatures);
    } else {
      setSelectedFeatures({});
    }
  }, [item]);

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures(prev => ({
      ...prev,
      [featureId]: !prev[featureId]
    }));
  };

  if (!isOpen || !item) return null;

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'hospital_network':
        return {
          icon: Hospital,
          color: '#3b82f6',
          bg: 'bg-teal-100',
          text: 'Hospital Network',
          className: 'text-teal-800',
          gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
        };
      case 'main_hospital':
        return {
          icon: Hospital,
          color: '#2563eb',
          bg: 'bg-teal-100',
          text: 'Main Hospital',
          className: 'text-teal-800',
          gradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
        };
      case 'collection_center':
        return {
          icon: Building2,
          color: '#10b981',
          bg: 'bg-emerald-100',
          text: 'Collection Center',
          className: 'text-emerald-800',
          gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)'
        };
      case 'rider':
        return {
          icon: Truck,
          color: '#f59e0b',
          bg: 'bg-amber-100',
          text: 'Rider',
          className: 'text-amber-800',
          gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
        };
      default:
        return {
          icon: Shield,
          color: '#6b7280',
          bg: 'bg-gray-100',
          text: type,
          className: 'text-gray-800',
          gradient: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
        };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending_operations_approval':
      case 'pending':
        return {
          icon: AlertTriangle,
          color: '#f59e0b',
          bg: 'bg-yellow-100',
          text: 'Pending Final Approval',
          className: 'text-yellow-800'
        };
      case 'approved':
        return {
          icon: CheckCircle2,
          color: '#10b981',
          bg: 'bg-green-100',
          text: 'Approved',
          className: 'text-green-800'
        };
      case 'rejected':
        return {
          icon: XCircle,
          color: '#ef4444',
          bg: 'bg-red-100',
          text: 'Rejected',
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

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'High':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-200'
        };
      case 'Normal':
        return {
          bg: 'bg-teal-100',
          text: 'text-teal-800',
          border: 'border-teal-200'
        };
      case 'Low':
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-200'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-200'
        };
    }
  };

  const typeConfig = getTypeConfig(item.type);
  const statusConfig = getStatusConfig(item.status);
  const priorityConfig = getPriorityConfig(item.priority || 'Normal');
  const TypeIcon = typeConfig.icon;
  const StatusIcon = statusConfig.icon;

  const handleApprove = async () => {
    await onApprove(item.id, item.applicantName, selectedFeatures);
    onClose();
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      // Call the rejection API directly
      await rejectApproval(item.type, item.id, rejectionReason);

      // Also call the parent onReject for any additional handling
      await onReject(item.id, item.applicantName, rejectionReason);

      setShowRejectForm(false);
      setRejectionReason("");
      onClose();

      alert(`${item.applicantName} has been rejected successfully!`);
    } catch (error) {
      console.error('Rejection failed:', error);
      alert(`Rejection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const renderTypeSpecificDetails = () => {
    const details = item.details || {};

    switch (item.type) {
      case 'hospital_network':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Hospital Information</h3>

              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                    <Hospital className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Hospital Name</p>
                    <p className="font-semibold text-gray-800">{details.hospital_name || item.applicantName}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Hospital Code</p>
                    <p className="font-semibold text-gray-800">{details.hospital_code || 'HC-XXX'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-semibold text-gray-800">{details.city || 'N/A'}, {details.province || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Contact Details</h3>

              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                    <Mail className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-semibold text-gray-800">{details.email || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Phone className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-semibold text-gray-800">{details.phone || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                    <User className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Administrator</p>
                    <p className="font-semibold text-gray-800">{details.admin_name || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'main_hospital':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Main Hospital Information</h3>

              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                    <Hospital className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Hospital Name</p>
                    <p className="font-semibold text-gray-800">{details.name || item.applicantName}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Hospital Type</p>
                    <p className="font-semibold text-gray-800">{details.hospital_type || 'Main Hospital'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Network</p>
                    <p className="font-semibold text-gray-800">{details.network_name || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-semibold text-gray-800">{new Date(details.created_at || item.appliedDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Network Admin Details</h3>

              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                    <Mail className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Admin Email</p>
                    <p className="font-semibold text-gray-800">{details.admin_email || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Phone className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Admin Phone</p>
                    <p className="font-semibold text-gray-800">{details.admin_phone || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                    <User className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Network Administrator</p>
                    <p className="font-semibold text-gray-800">{details.admin_name || 'N/A'}</p>
                  </div>
                </div>

                {details.hospital_code && (
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                      <Shield className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Hospital Code</p>
                      <p className="font-semibold text-gray-800">{details.hospital_code}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 bg-teal-50 border border-teal-200 rounded-lg">
                <p className="text-sm text-teal-800">
                  <strong>Note:</strong> Approving this main hospital will approve the entire network and trigger an email notification with the hospital code.
                </p>
              </div>
            </div>
          </div>
        );

      case 'collection_center':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Center Information</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Center Name</p>
                      <p className="font-semibold text-gray-800">{details.center_name || item.applicantName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                      <Globe className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Center Type</p>
                      <p className="font-semibold text-gray-800 capitalize">{details.center_type || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">License Number</p>
                      <p className="font-semibold text-gray-800">{details.license_number || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Contact & Location</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <User className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Contact Person</p>
                      <p className="font-semibold text-gray-800">{details.contact_person || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-semibold text-gray-800">{details.address || 'N/A'}</p>
                      <p className="text-sm text-gray-600">{details.city || 'N/A'}, {details.province || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <Phone className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-semibold text-gray-800">{details.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Requests Section */}
            <div 
              className="rounded-3xl p-6"
              style={{
                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.05) 0%, rgba(219, 39, 119, 0.05) 100%)',
                border: '1px solid rgba(236, 72, 153, 0.2)'
              }}
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Activity className="w-6 h-6 text-pink-600" />
                Feature Requests ({details.featureRequests?.length || 0})
              </h3>
              
              {details.featureRequests && details.featureRequests.length > 0 ? (
                <>
                  <p className="text-gray-600 text-sm mb-6">
                    This collection center has requested the following features that require TransFleet HQ approval:
                  </p>

                  <div className="space-y-4">
                    {details.featureRequests.map((request: any, index: number) => {
                      const isEnabled = selectedFeatures[request.feature_id] || false;

                      return (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                            isEnabled
                              ? 'bg-green-50 border-green-300'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                          style={{ boxShadow: isEnabled ? '0 4px 12px rgba(16, 185, 129, 0.15)' : '0 2px 8px rgba(0, 0, 0, 0.04)' }}
                        >
                          <div className="flex items-start gap-4 flex-1">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              request.feature_type === 'enterprise'
                                ? 'bg-purple-100'
                                : request.feature_type === 'premium'
                                ? 'bg-teal-100'
                                : 'bg-gray-100'
                            }`}>
                              <Activity className={`w-5 h-5 ${
                                request.feature_type === 'enterprise'
                                  ? 'text-purple-600'
                                  : request.feature_type === 'premium'
                                  ? 'text-teal-600'
                                  : 'text-gray-600'
                              }`} />
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold text-gray-900">{request.feature_name}</h4>
                                <span className={`text-xs px-3 py-1 rounded-full font-bold border ${
                                  request.feature_type === 'enterprise'
                                    ? 'bg-purple-100 text-purple-800 border-purple-200'
                                    : request.feature_type === 'premium'
                                    ? 'bg-teal-100 text-teal-800 border-teal-200'
                                    : 'bg-gray-100 text-gray-800 border-gray-200'
                                }`}>
                                  {request.feature_type.toUpperCase()}
                                </span>
                                {isEnabled && (
                                  <span className="text-xs px-3 py-1 rounded-full font-bold bg-green-100 text-green-800 border border-green-200">
                                    WILL BE APPROVED
                                  </span>
                                )}
                              </div>

                              <p className="text-sm text-gray-600 mb-3">{request.feature_description}</p>

                              {request.justification && (
                                <div className="bg-white p-3 rounded-xl border border-gray-200">
                                  <p className="text-xs text-gray-500 font-medium mb-1">Business Justification:</p>
                                  <p className="text-sm text-gray-700">{request.justification}</p>
                                </div>
                              )}

                              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>Requested: {new Date(request.requested_at).toLocaleDateString()}</span>
                                </div>
                                {request.requires_approval && (
                                  <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
                                    Requires Approval
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => toggleFeature(request.feature_id)}
                            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ml-4 ${
                              isEnabled
                                ? 'bg-green-500 hover:bg-green-600 text-white'
                                : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                            }`}
                          >
                            {isEnabled ? (
                              <>
                                <ToggleRight className="w-5 h-5" />
                                <span>Approve</span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="w-5 h-5" />
                                <span>Skip</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-pink-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-lg font-medium">No Feature Requests</p>
                  <p className="text-gray-400">This collection center hasn't requested any features yet</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'rider':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Rider Information</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <User className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-semibold text-gray-800">{details.full_name || item.applicantName}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                    <Phone className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Mobile Number</p>
                    <p className="font-semibold text-gray-800">{details.mobile_number || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">NIC Number</p>
                    <p className="font-semibold text-gray-800">{details.nic_number || 'N/A'}</p>
                  </div>
                </div>

                {details.rating && (
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                      <Star className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Current Rating</p>
                      <p className="font-semibold text-gray-800">{details.rating} / 5.0</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Vehicle & Experience</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Truck className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Vehicle Type</p>
                    <p className="font-semibold text-gray-800 capitalize">{details.vehicle_type || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Vehicle Number</p>
                    <p className="font-semibold text-gray-800">{details.vehicle_number || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                    <Activity className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Experience</p>
                    <p className="font-semibold text-gray-800">{details.experience || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Hospital className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Hospital Affiliation</p>
                    <p className="font-semibold text-gray-800">{item.requestingNetwork || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-500">Details not available for this item type</p>
          </div>
        );
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
              background: typeConfig.gradient
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
                <TypeIcon className="w-10 h-10 text-white" />
              </div>
              
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">{item.applicantName}</h2>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span className="text-white/90">{typeConfig.text}</span>
                  </div>
                  {item.requestingNetwork && (
                    <div className="flex items-center space-x-2">
                      <Hospital className="w-5 h-5" />
                      <span className="text-white/90">{item.requestingNetwork}</span>
                    </div>
                  )}
                  {item.priority && (
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${priorityConfig.bg} ${priorityConfig.text} ${priorityConfig.border} border`}>
                      {item.priority} Priority
                    </div>
                  )}
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
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      Applied: {new Date(item.appliedDate).toLocaleDateString('en-US', {
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
            {renderTypeSpecificDetails()}

            {/* Action Buttons */}
            {(item.status === "pending_operations_approval" || item.status === "pending" || item.status === "rejected" || item.status === "approved") && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                {!showRejectForm ? (
                  <div className="flex justify-end space-x-4">
                    {/* Show Reject button only if not already rejected */}
                    {item.status !== "rejected" && (
                      <button
                        onClick={() => setShowRejectForm(true)}
                        disabled={isProcessing}
                        className="px-6 py-3 rounded-2xl font-semibold transition-all duration-200 hover:transform hover:scale-105 disabled:opacity-50"
                        style={{
                          backgroundColor: '#ef4444',
                          color: '#ffffff',
                          boxShadow: '0 8px 32px rgba(239, 68, 68, 0.3)'
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <XCircle className="w-5 h-5" />
                          <span>Reject Application</span>
                        </div>
                      </button>
                    )}

                    {/* Show Approve button only if not already approved */}
                    {item.status !== "approved" && (
                      <button
                        onClick={handleApprove}
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
                          <span>{isProcessing ? 'Processing...' : 'Give Final Approval'}</span>
                        </div>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Rejection Reason
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Please provide a detailed reason for rejecting this application..."
                        className="w-full p-4 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-blue-500 resize-none"
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-4">
                      <button
                        onClick={() => {
                          setShowRejectForm(false);
                          setRejectionReason("");
                        }}
                        className="px-6 py-3 rounded-2xl font-semibold transition-all duration-200 hover:transform hover:scale-105"
                        style={{
                          backgroundColor: '#f3f4f6',
                          color: '#374151'
                        }}
                      >
                        Cancel
                      </button>
                      
                      <button
                        onClick={handleReject}
                        disabled={isProcessing || rejectingApproval || !rejectionReason.trim()}
                        className="px-6 py-3 rounded-2xl font-semibold transition-all duration-200 hover:transform hover:scale-105 disabled:opacity-50"
                        style={{
                          backgroundColor: '#ef4444',
                          color: '#ffffff',
                          boxShadow: '0 8px 32px rgba(239, 68, 68, 0.3)'
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <XCircle className="w-5 h-5" />
                          <span>{(isProcessing || rejectingApproval) ? 'Rejecting...' : 'Confirm Rejection'}</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}