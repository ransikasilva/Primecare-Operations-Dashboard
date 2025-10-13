"use client";

import React, { useState, useEffect } from 'react';
import { MetricsCards } from '@/components/MetricsCards';
import Link from 'next/link';
import { useSystemOverview, useSystemAlerts, useAllOrders } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { HospitalNetworkDetailModal } from '@/components/HospitalNetworkDetailModal';
import {
  Building2,
  Bell,
  ArrowUpRight,
  BarChart3,
  FileText,
  ChevronRight,
  Building,
  Network,
  RefreshCw,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(null);
  const [selectedNetworkData, setSelectedNetworkData] = useState<any>(null);
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [expandedNetworks, setExpandedNetworks] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const { data: systemOverviewData, refetch: refetchSystemOverview } = useSystemOverview();
  const { data: alertsData, refetch: refetchAlerts } = useSystemAlerts();
  const { data: allOrdersData, refetch: refetchAllOrders } = useAllOrders();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Extract data safely
  const systemData = systemOverviewData?.data?.data || systemOverviewData?.data || {};
  const allHospitalNetworks = Array.isArray((systemData as any)?.hospital_networks)
    ? (systemData as any).hospital_networks : [];
  const allRiders = Array.isArray((systemData as any)?.riders)
    ? (systemData as any).riders : [];
  const allOrders = Array.isArray(allOrdersData?.data?.orders)
    ? allOrdersData.data.orders : [];

  // Process main hospitals using flatMap (not reduce!)
  const allMainHospitals = allHospitalNetworks.flatMap((network: any) => {
    const networkHospitals = Array.isArray(network?.hospitals) ? network.hospitals : [];
    const mainHospitals = networkHospitals.filter((h: any) => h.is_main_hospital === true);

    return mainHospitals.map((hospital: any) => {
      const regionalHospitals = networkHospitals.filter((h: any) => !h.is_main_hospital);
      const hospitalOrders = allOrders.filter((order: any) =>
        order.hospital_id === hospital.id &&
        ['pending_rider_assignment', 'assigned', 'picked_up', 'in_transit'].includes(order.status)
      );
      const hospitalRiders = allRiders.filter((rider: any) =>
        rider.hospital_affiliation?.hospital_id === hospital.id && rider.rider_status === 'approved'
      );

      return {
        id: hospital.id,
        name: hospital.name,
        network_name: network.network_name,
        network_id: network.id,
        city: hospital.city,
        province: hospital.province,
        status: hospital.status,
        activeOrders: hospitalOrders.length,
        ridersOnline: hospitalRiders.length,
        regionalHospitals: regionalHospitals.length,
        coordinates: {
          lat: hospital.coordinates_lat,
          lng: hospital.coordinates_lng
        },
        regional_hospitals_detail: regionalHospitals,
        network_admin: network.admin_name,
        network_admin_email: network.admin_email,
        network_admin_phone: network.admin_phone,
        riders_detail: hospitalRiders
      };
    });
  });

  // Pagination
  const totalPages = Math.ceil(allMainHospitals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHospitals = allMainHospitals.slice(startIndex, startIndex + itemsPerPage);

  // System alerts
  const systemAlerts = Array.isArray(alertsData?.data) ? alertsData.data : [];

  const handleRefreshAll = () => {
    refetchSystemOverview();
    refetchAlerts();
    refetchAllOrders();
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Operations Overview</h1>
          <p className="text-sm text-gray-500 mt-1">
            {currentTime.toLocaleString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        <button
          onClick={handleRefreshAll}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <MetricsCards />

      {/* Hospital Networks Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Hospital Networks ({allMainHospitals.length})</h2>
          <Link href="/hospitals" className="text-blue-500 hover:text-blue-600 text-sm font-medium">
            View All →
          </Link>
        </div>

        {paginatedHospitals.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hospital networks found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedHospitals.map((hospital: any, index: number) => {
              const isExpanded = expandedNetworks.includes(hospital.id);

              return (
                <div key={hospital.id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{hospital.name}</h3>
                        <p className="text-sm text-gray-500">{hospital.network_name} • {hospital.city}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{hospital.activeOrders} Orders</p>
                        <p className="text-xs text-gray-500">{hospital.ridersOnline} Riders</p>
                      </div>

                      {hospital.regionalHospitals > 0 && (
                        <button
                          onClick={() => {
                            if (isExpanded) {
                              setExpandedNetworks(prev => prev.filter(id => id !== hospital.id));
                            } else {
                              setExpandedNetworks(prev => [...prev, hospital.id]);
                            }
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                          <ChevronRight
                            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                          />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Regional Hospitals */}
                  {isExpanded && hospital.regional_hospitals_detail && hospital.regional_hospitals_detail.length > 0 && (
                    <div className="mt-4 pl-16 space-y-2">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Regional Hospitals ({hospital.regional_hospitals_detail.length})
                      </p>
                      {hospital.regional_hospitals_detail.slice(0, 5).map((regional: any, idx: number) => (
                        <div key={idx} className="flex items-center space-x-2 text-sm text-gray-600">
                          <Building className="w-4 h-4 text-green-500" />
                          <span>{regional.name}</span>
                          <span className="text-gray-400">•</span>
                          <span>{regional.city}</span>
                        </div>
                      ))}
                      {hospital.regional_hospitals_detail.length > 5 && (
                        <p className="text-xs text-gray-500 pl-6">
                          +{hospital.regional_hospitals_detail.length - 5} more
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-6">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* System Alerts */}
      {systemAlerts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Bell className="w-5 h-5 mr-2 text-orange-500" />
            System Alerts ({systemAlerts.length})
          </h2>
          <div className="space-y-3">
            {systemAlerts.slice(0, 5).map((alert: any, index: number) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{alert.title || 'System Alert'}</p>
                  <p className="text-sm text-gray-600">{alert.message || 'No details available'}</p>
                </div>
                <span className="text-xs text-gray-500">{alert.timestamp || 'Now'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Network Modal */}
      {showNetworkModal && selectedNetworkData && (
        <HospitalNetworkDetailModal
          isOpen={showNetworkModal}
          onClose={() => {
            setShowNetworkModal(false);
            setSelectedNetworkData(null);
          }}
          networkId={selectedNetworkId || ''}
          networkData={selectedNetworkData}
        />
      )}
    </div>
  );
}
