"use client";

import { useState } from 'react';
import {
  QrCode,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye
} from 'lucide-react';
import { QRCodeTrackingModal } from './QRCodeTrackingModal';
import { useQRComplianceMetrics, useQRCodeLogs } from '@/hooks/useApi';

export function QRCodeOverview() {
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const { data: complianceData } = useQRComplianceMetrics();
  const { data: qrLogsData } = useQRCodeLogs({ period: '24h' });

  // Debug QR data
  console.log('🔍 QR Compliance Data:', complianceData);
  console.log('🔍 QR Logs Data:', qrLogsData);

  // Use real compliance data from backend only
  const compliance = complianceData?.data as any;
  const metrics = compliance ? {
    totalDeliveries: compliance.totalDeliveries || 0,
    compliantDeliveries: compliance.compliantDeliveries || 0,
    complianceRate: compliance.complianceRate || compliance.signatureCompliance || 0,
    activeQRCodes: compliance.totalScans || 0,
    pendingDeliveries: Math.max(0, (compliance.totalDeliveries || 0) - (compliance.compliantDeliveries || 0)),
    failedDeliveries: compliance.failedScans || 0,
    averageDeliveryTime: compliance.averageDeliveryTime || 0
  } : null;

  // Use real QR logs data from backend
  const logsArray = Array.isArray(qrLogsData?.data) ? qrLogsData.data : [];
  const recentActivity = logsArray.slice(0, 5).map(log => ({
    id: log.id,
    qrCode: log.qrCode,
    status: log.status,
    sampleType: log.sampleType,
    priority: log.priority,
    timeAgo: log.timestamps?.scanned ? 
      formatTimeAgo(new Date(log.timestamps.scanned)) : 'Unknown'
  }));

  // Helper function to format time ago
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'standard': return '#3b82f6';
      case 'routine': return '#10b981';
      default: return '#6b7280';
    }
  };

  // Show loading or no data state
  if (!metrics) {
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
            <div className="flex items-center space-x-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #5DADE2 0%, #4A9BC7 100%)'
                }}
              >
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">QR Code Tracking</h2>
                <p className="text-sm text-gray-500">Chain of custody monitoring</p>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <QrCode className="w-12 h-12 mx-auto" />
            </div>
            <p className="text-gray-500">No QR tracking data available</p>
            <p className="text-sm text-gray-400">QR compliance metrics will appear when data is available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
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
            <div className="flex items-center space-x-3">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #5DADE2 0%, #4A9BC7 100%)'
                }}
              >
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">QR Code Tracking</h2>
                <p className="text-sm text-gray-500">Chain of custody monitoring</p>
              </div>
            </div>
            <button
              onClick={() => setShowTrackingModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>View Details</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 rounded-xl bg-green-50 border border-green-200">
              <div className="w-8 h-8 mx-auto mb-2 rounded-xl bg-green-500 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-bold text-green-600">{metrics.complianceRate}%</div>
              <div className="text-xs text-green-700">Compliance Rate</div>
            </div>

            <div className="text-center p-4 rounded-xl bg-blue-50 border border-blue-200">
              <div className="w-8 h-8 mx-auto mb-2 rounded-xl bg-blue-500 flex items-center justify-center">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-bold text-blue-600">{metrics.activeQRCodes}</div>
              <div className="text-xs text-blue-700">Active QR Codes</div>
            </div>

            <div className="text-center p-4 rounded-xl bg-orange-50 border border-orange-200">
              <div className="w-8 h-8 mx-auto mb-2 rounded-xl bg-orange-500 flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-bold text-orange-600">{metrics.averageDeliveryTime}m</div>
              <div className="text-xs text-orange-700">Avg Delivery</div>
            </div>

            <div className="text-center p-4 rounded-xl bg-red-50 border border-red-200">
              <div className="w-8 h-8 mx-auto mb-2 rounded-xl bg-red-500 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-bold text-red-600">{metrics.failedDeliveries}</div>
              <div className="text-xs text-red-700">Failed Today</div>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Recent QR Activity</h3>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Live updates" />
            </div>

            <div className="space-y-3">
              {recentActivity.length > 0 ? recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{
                        backgroundColor: getStatusColor(activity.status) + '20',
                        border: `1px solid ${getStatusColor(activity.status)}30`
                      }}
                    >
                      <QrCode className="w-4 h-4" style={{ color: getStatusColor(activity.status) }} />
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-800 text-sm">{activity.qrCode}</span>
                        <div 
                          className="px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: getPriorityColor(activity.priority) + '20',
                            color: getPriorityColor(activity.priority)
                          }}
                        >
                          {activity.priority}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">{activity.sampleType}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div 
                      className="px-2 py-1 rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: getStatusColor(activity.status) }}
                    >
                      {activity.status}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{activity.timeAgo}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-6">
                  <div className="text-gray-400 mb-2">
                    <Clock className="w-8 h-8 mx-auto" />
                  </div>
                  <p className="text-gray-500">No recent QR activity</p>
                  <p className="text-sm text-gray-400">Activity will appear when QR codes are scanned</p>
                </div>
              )}
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={() => setShowTrackingModal(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
              >
                View all QR tracking →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Tracking Modal */}
      <QRCodeTrackingModal
        isOpen={showTrackingModal}
        onClose={() => setShowTrackingModal(false)}
      />
    </>
  );
}