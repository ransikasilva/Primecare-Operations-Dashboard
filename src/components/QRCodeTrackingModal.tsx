"use client";

import { useState } from 'react';
import {
  QrCode,
  MapPin,
  Clock,
  User,
  Truck,
  CheckCircle,
  AlertTriangle,
  Package,
  Search,
  Download,
  Eye,
  Navigation,
  Timer,
  Shield
} from 'lucide-react';
import { 
  useQRCodeLogs,
  useChainOfCustody,
  useQRComplianceMetrics,
  useHandoverLogs
} from '@/hooks/useApi';
import { exportQRTrackingToExcel, exportQRTrackingToPDF } from '@/lib/exportUtils';

interface QRCodeTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedQRId?: string;
}

interface QRCodeLog {
  id: string;
  qrCode: string;
  sampleId: string;
  sampleType: string;
  priority: 'urgent' | 'standard' | 'routine';
  status: 'pending' | 'pickup' | 'transit' | 'delivered' | 'failed';
  collectionCenter: {
    id: string;
    name: string;
    location: string;
  };
  destinationHospital: {
    id: string;
    name: string;
    location: string;
  };
  rider: {
    id: string;
    name: string;
    phone: string;
    vehicleNumber: string;
  };
  timestamps: {
    created: string;
    pickedUp?: string;
    inTransit?: string;
    delivered?: string;
    failed?: string;
  };
  route: {
    distance: number;
    estimatedTime: number;
    actualTime?: number;
  };
  handovers: Array<{
    id: string;
    fromRider: string;
    toRider: string;
    location: string;
    timestamp: string;
    reason: string;
  }>;
  compliance: {
    temperatureLogged: boolean;
    timeCompliant: boolean;
    signatureObtained: boolean;
    photoEvidence: boolean;
  };
}

interface ChainOfCustodyEvent {
  id: string;
  timestamp: string;
  type: 'created' | 'pickup' | 'handover' | 'checkpoint' | 'delivered' | 'failed';
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  actor: {
    id: string;
    name: string;
    role: 'collection_center' | 'rider' | 'hospital' | 'system';
    contact?: string;
  };
  details: string;
  evidence?: {
    photo?: string;
    signature?: string;
    temperature?: number;
    notes?: string;
  };
}

export function QRCodeTrackingModal({
  isOpen,
  onClose
}: QRCodeTrackingModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'compliance' | 'handovers'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedQR, setSelectedQR] = useState<QRCodeLog | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const { data: qrLogsData } = useQRCodeLogs({
    period: 'all', // Show all QR codes instead of just recent ones
    type: statusFilter !== 'all' ? statusFilter : undefined,
    limit: 1000 // Request more QR codes to show all available
  });

  const { data: chainOfCustodyData } = useChainOfCustody(selectedQR?.qrCode || '');
  const { data: complianceData } = useQRComplianceMetrics();
  const { data: handoverData } = useHandoverLogs();

  // Use real QR logs data from backend instead of mock data
  const rawQRLogs = Array.isArray(qrLogsData?.data) ? qrLogsData.data : [];
  const qrLogs: QRCodeLog[] = rawQRLogs.length > 0 ? rawQRLogs.map(log => ({
    id: log.id,
    qrCode: log.qrCode,
    sampleId: log.sampleId || log.qrCode,
    sampleType: log.sampleType || 'Unknown Sample',
    priority: log.priority as 'urgent' | 'standard' | 'routine',
    status: log.status as 'pending' | 'pickup' | 'transit' | 'delivered' | 'failed',
    collectionCenter: log.collectionCenter || {
      id: 'unknown',
      name: 'Unknown Center',
      location: 'Unknown Location'
    },
    destinationHospital: log.destinationHospital || {
      id: 'unknown',
      name: 'Unknown Hospital',
      location: 'Unknown Location'
    },
    rider: log.rider || {
      id: 'unknown',
      name: 'Unknown Rider',
      phone: 'N/A',
      vehicleNumber: 'N/A'
    },
    timestamps: {
      created: log.timestamps?.created || new Date().toISOString(),
      pickedUp: log.timestamps?.scanned,
      inTransit: log.timestamps?.scanned,
      delivered: log.status === 'delivered' ? log.timestamps?.scanned : undefined
    },
    route: {
      distance: 0, // This would need to be calculated from GPS data
      estimatedTime: 30,
      actualTime: log.status === 'delivered' ? 35 : undefined
    },
    handovers: [], // Would come from handover logs
    compliance: {
      temperatureLogged: true,
      timeCompliant: log.status !== 'failed',
      signatureObtained: log.status === 'delivered',
      photoEvidence: log.status === 'delivered'
    }
  })) : [];

  const chainOfCustodyArray = Array.isArray(chainOfCustodyData?.data) ? chainOfCustodyData.data : [];
  const chainOfCustody: ChainOfCustodyEvent[] = chainOfCustodyArray;

  const complianceMetrics = (complianceData?.data as any) || {
    totalDeliveries: 0,
    compliantDeliveries: 0,
    complianceRate: 0,
    temperatureCompliance: 0,
    timeCompliance: 0,
    signatureCompliance: 0,
    photoCompliance: 0
  };

  const handoverLogsArray = Array.isArray(handoverData?.data) ? handoverData.data : [];
  const handoverLogs = handoverLogsArray;

  // Filter QR logs
  const filteredQRLogs = qrLogs.filter(log => {
    const matchesSearch = log.qrCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.sampleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.collectionCenter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.destinationHospital.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || log.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Export handlers
  const handleExportToExcel = () => {
    exportQRTrackingToExcel(filteredQRLogs);
    setShowExportMenu(false);
  };

  const handleExportToPDF = () => {
    exportQRTrackingToPDF(filteredQRLogs);
    setShowExportMenu(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return '#10b981';
      case 'transit': return '#3b82f6';
      case 'pickup': return '#f59e0b';
      case 'pending': return '#6b7280';
      case 'failed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusBg = (status: string) => {
    return getStatusColor(status) + '20';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'standard': return '#3b82f6';
      case 'routine': return '#10b981';
      default: return '#6b7280';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-7xl max-h-[95vh] rounded-3xl overflow-hidden flex flex-col"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
          border: '1px solid rgba(203, 213, 225, 0.3)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-gray-200/60 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #4ECDC4 0%, #4A9BC7 100%)'
              }}
            >
              <QrCode className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-800">QR Code Tracking & Chain of Custody</h2>
              <p className="text-gray-600 text-lg">Monitor sample deliveries and compliance across the network</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            ×
          </button>
        </div>

        {/* Compliance Metrics Overview */}
        <div className="p-8 border-b border-gray-200/40 flex-shrink-0">
          <h3 className="text-xl font-bold text-gray-800 mb-4">QR Compliance Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Overall Compliance</h4>
                  <p className="text-2xl font-bold text-gray-800">{complianceMetrics.complianceRate}%</p>
                  <p className="text-sm text-gray-600">{complianceMetrics.compliantDeliveries}/{complianceMetrics.totalDeliveries} deliveries</p>
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
                  <QrCode className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">QR Scans</h4>
                  <p className="text-2xl font-bold text-gray-800">{complianceMetrics.totalScans}</p>
                  <p className="text-sm text-gray-600">{complianceMetrics.successfulScans} successful scans</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="p-8 border-b border-gray-200/40 flex-shrink-0">
          <div className="flex items-center space-x-8">
            {[
              { id: 'overview', label: 'QR Code Logs', icon: QrCode },
              { id: 'compliance', label: 'Compliance Details', icon: Shield },
              { id: 'handovers', label: 'Rider Handovers', icon: Truck }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'text-white'
                      : 'text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200'
                  }`}
                  style={activeTab === tab.id ? {
                    background: 'linear-gradient(135deg, #4ECDC4 0%, #4A9BC7 100%)',
                    boxShadow: '0 8px 32px rgba(78, 205, 196, 0.3)'
                  } : {}}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search QR codes, samples..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-teal-500"
                    />
                  </div>

                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-teal-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="pickup">Pickup</option>
                    <option value="transit">In Transit</option>
                    <option value="delivered">Delivered</option>
                    <option value="failed">Failed</option>
                  </select>

                  <select 
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-teal-500"
                  >
                    <option value="all">All Priority</option>
                    <option value="urgent">Urgent</option>
                    <option value="standard">Standard</option>
                    <option value="routine">Routine</option>
                  </select>
                </div>

                <div className="relative">
                  <button 
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                  </button>
                  
                  {showExportMenu && (
                    <div 
                      className="fixed right-4 top-20 w-48 rounded-2xl"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)',
                        border: '1px solid rgba(203, 213, 225, 0.3)',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
                        zIndex: 9999
                      }}
                    >
                      <div className="p-3 space-y-2">
                        <button
                          onClick={handleExportToExcel}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-green-50 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200">
                            <span className="text-xs font-bold text-green-700">XLS</span>
                          </div>
                          <div className="text-left">
                            <div className="text-sm font-medium text-gray-800">Export to Excel</div>
                            <div className="text-xs text-gray-500">QR tracking report (.xlsx)</div>
                          </div>
                        </button>
                        
                        <button
                          onClick={handleExportToPDF}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center group-hover:bg-red-200">
                            <span className="text-xs font-bold text-red-700">PDF</span>
                          </div>
                          <div className="text-left">
                            <div className="text-sm font-medium text-gray-800">Export to PDF</div>
                            <div className="text-xs text-gray-500">QR tracking report (.pdf)</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* QR Code Logs */}
              <div className="space-y-4">
                {filteredQRLogs.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <QrCode className="w-16 h-16 mx-auto" />
                    </div>
                    <p className="text-xl font-semibold text-gray-600">No QR Code Data Available</p>
                    <p className="text-gray-500 mt-2">QR code tracking logs will appear when QR codes are scanned in the system</p>
                  </div>
                ) : (
                  filteredQRLogs.map((log) => (
                  <div 
                    key={log.id}
                    className={`p-6 rounded-2xl transition-all duration-300 cursor-pointer hover:shadow-lg ${
                      selectedQR?.id === log.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.8) 100%)',
                      border: '1px solid rgba(203, 213, 225, 0.3)'
                    }}
                    onClick={() => setSelectedQR(log)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div 
                          className="w-12 h-12 rounded-2xl flex items-center justify-center"
                          style={{
                            backgroundColor: getStatusBg(log.status),
                            border: `2px solid ${getStatusColor(log.status)}30`
                          }}
                        >
                          <QrCode className="w-6 h-6" style={{ color: getStatusColor(log.status) }} />
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-bold text-gray-800">{log.qrCode}</h4>
                            <div 
                              className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                              style={{ backgroundColor: getStatusColor(log.status) }}
                            >
                              {log.status.toUpperCase()}
                            </div>
                            <div 
                              className="px-2 py-1 rounded-full text-xs font-semibold"
                              style={{ 
                                backgroundColor: getPriorityColor(log.priority) + '20',
                                color: getPriorityColor(log.priority)
                              }}
                            >
                              {log.priority.toUpperCase()}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div>
                              <p className="font-medium">{log.sampleType}</p>
                              <p className="text-xs text-gray-500">Sample ID: {log.sampleId}</p>
                            </div>
                            <div>
                              <p>{log.collectionCenter.name} → {log.destinationHospital.name}</p>
                              <p className="text-xs text-gray-500">{log.route.distance}km • {formatDuration(log.route.estimatedTime)} est.</p>
                            </div>
                            <div>
                              <p>{log.rider.name}</p>
                              <p className="text-xs text-gray-500">{log.rider.vehicleNumber}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-800">
                            {log.route.actualTime ? formatDuration(log.route.actualTime) : '--'}
                          </div>
                          <div className="text-xs text-gray-500">Actual Time</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="flex items-center space-x-1">
                            {log.compliance.temperatureLogged && <CheckCircle className="w-4 h-4 text-green-500" />}
                            {log.compliance.timeCompliant && <Clock className="w-4 h-4 text-green-500" />}
                            {log.compliance.signatureObtained && <User className="w-4 h-4 text-green-500" />}
                            {log.compliance.photoEvidence && <Eye className="w-4 h-4 text-green-500" />}
                          </div>
                          <div className="text-xs text-gray-500">Compliance</div>
                        </div>

                        <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                          <Eye className="w-5 h-5 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                )))}
              </div>
            </div>
          )}


          {activeTab === 'compliance' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-800">Detailed Compliance Analysis</h3>
              
              {/* Compliance breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div 
                  className="p-6 rounded-2xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
                    border: '1px solid rgba(203, 213, 225, 0.3)'
                  }}
                >
                  <h4 className="text-lg font-bold text-gray-800 mb-4">Compliance Breakdown</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Overall Compliance Rate</span>
                      <span className="font-bold text-gray-800">{complianceMetrics.complianceRate}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total QR Codes Created</span>
                      <span className="font-bold text-gray-800">{complianceMetrics.totalDeliveries}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Completed Deliveries</span>
                      <span className="font-bold text-gray-800">{complianceMetrics.compliantDeliveries}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Scans</span>
                      <span className="font-bold text-gray-800">{complianceMetrics.totalScans}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Successful Scans</span>
                      <span className="font-bold text-gray-800">{complianceMetrics.successfulScans}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Failed Scans</span>
                      <span className="font-bold text-gray-800">{complianceMetrics.failedScans}</span>
                    </div>
                  </div>
                </div>

                <div 
                  className="p-6 rounded-2xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
                    border: '1px solid rgba(203, 213, 225, 0.3)'
                  }}
                >
                  <h4 className="text-lg font-bold text-gray-800 mb-4">Non-Compliant Deliveries</h4>
                  <div className="space-y-4">
                    {qrLogs.filter(log => !log.compliance.timeCompliant || !log.compliance.temperatureLogged).map(log => (
                      <div key={log.id} className="p-3 rounded-xl bg-red-50 border border-red-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-800">{log.qrCode}</p>
                            <p className="text-sm text-gray-600">{log.sampleType}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {!log.compliance.timeCompliant && <Clock className="w-4 h-4 text-red-500" />}
                            {!log.compliance.temperatureLogged && <Package className="w-4 h-4 text-red-500" />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'handovers' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-800">Rider Handover History</h3>
                <span className="text-gray-600">{handoverLogs.length} handovers recorded</span>
              </div>

              <div className="space-y-4">
                {handoverLogs.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <Truck className="w-16 h-16 mx-auto" />
                    </div>
                    <p className="text-xl font-semibold text-gray-600">No Handover Data Available</p>
                    <p className="text-gray-500 mt-2">Rider handover logs will appear when handovers are recorded</p>
                  </div>
                ) : (
                  handoverLogs.map((handover) => (
                  <div 
                    key={handover.id}
                    className="p-6 rounded-2xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.8) 100%)',
                      border: '1px solid rgba(203, 213, 225, 0.3)'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center">
                          <Truck className="w-6 h-6 text-teal-600" />
                        </div>
                        
                        <div>
                          <h4 className="font-bold text-gray-800">{handover.qrCode}</h4>
                          <p className="text-gray-600">{handover.fromRider} → {handover.toRider}</p>
                          <p className="text-sm text-gray-500">{handover.location} • {new Date(handover.timestamp).toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div 
                          className="px-3 py-1 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: handover.status === 'completed' ? '#10b981' : '#f59e0b',
                            color: 'white'
                          }}
                        >
                          {handover.status.toUpperCase()}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{handover.reason}</p>
                      </div>
                    </div>
                  </div>
                )))}
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-gray-200/60 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Tracking {filteredQRLogs.length} active QR codes • {complianceMetrics.complianceRate}% compliance rate
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={onClose}
                className="px-8 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button className="px-8 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors">
                Generate Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}