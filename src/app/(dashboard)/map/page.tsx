"use client";

import { useState, useEffect, useRef } from 'react';
import OperationsMap from '@/components/map/OperationsMap';
import { useSystemOverview } from '@/hooks/useApi';
import { exportMapDataToExcel, exportMapDataToPDF } from '@/lib/exportUtils';
import { 
  Building2, 
  MapPin, 
  Users2, 
  Activity,
  Stethoscope,
  Navigation,
  RefreshCw,
  Filter,
  Download,
  Maximize2
} from 'lucide-react';

export default function MapPage() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'hospitals' | 'centers' | 'riders'>('all');
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Get real data from API
  const { data: systemData, loading: systemLoading, refetch } = useSystemOverview();

  // Handle click outside to close export menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Calculate real metrics from API data
  const mapStats = {
    totalHospitals: (systemData?.data as any)?.hospital_networks?.length || 0,
    totalCenters: (systemData?.data as any)?.collection_centers?.length || 0,
    activeRiders: (systemData?.data as any)?.riders?.filter((rider: any) => rider.availability_status === 'available').length || 0,
    systemHealth: systemData?.data ? Math.round((
      ((systemData.data as any).hospital_networks?.filter((n: any) => n.network_status === 'approved').length || 0) / 
      Math.max((systemData.data as any).hospital_networks?.length || 1, 1) * 100
    )) : 0
  };

  const handleExportToExcel = () => {
    if (systemData?.data) {
      exportMapDataToExcel(systemData.data);
      setShowExportMenu(false);
    }
  };

  const handleExportToPDF = () => {
    if (systemData?.data) {
      exportMapDataToPDF(systemData.data);
      setShowExportMenu(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Map</h1>
          <p className="text-gray-600 mt-1">Real-time view of all hospitals, collection centers, and riders</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={systemLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl transition-all duration-300 hover:transform hover:scale-105 disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.8) 100%)',
              border: '1px solid rgba(203, 213, 225, 0.3)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)'
            }}
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 ${systemLoading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium text-gray-700">Refresh</span>
          </button>
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl transition-all duration-300 hover:transform hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.8) 100%)',
                border: '1px solid rgba(203, 213, 225, 0.3)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)'
              }}
            >
              <Download className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Export</span>
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
                      <div className="text-xs text-gray-500">Download as .xlsx file</div>
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
                      <div className="text-xs text-gray-500">Download as .pdf file</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl transition-all duration-300 hover:transform hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #5DADE2 0%, #4A9BC7 100%)',
              boxShadow: '0 8px 32px rgba(93, 173, 226, 0.3)'
            }}
          >
            <Maximize2 className="w-4 h-4 text-white" />
            <span className="text-sm font-semibold text-white">Fullscreen</span>
          </button>
        </div>
      </div>

      {!isFullscreen && (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div 
              className="p-6 rounded-2xl transition-all duration-300 hover:transform hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
                border: '1px solid rgba(203, 213, 225, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Hospital Networks</p>
                  {systemLoading ? (
                    <div className="w-8 h-8 bg-gray-200 animate-pulse rounded mt-1"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{mapStats.totalHospitals}</p>
                  )}
                </div>
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)'
                  }}
                >
                  <Building2 className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div 
              className="p-6 rounded-2xl transition-all duration-300 hover:transform hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
                border: '1px solid rgba(203, 213, 225, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Collection Centers</p>
                  {systemLoading ? (
                    <div className="w-8 h-8 bg-gray-200 animate-pulse rounded mt-1"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{mapStats.totalCenters}</p>
                  )}
                </div>
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #EA580C 0%, #DC2626 100%)'
                  }}
                >
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div 
              className="p-6 rounded-2xl transition-all duration-300 hover:transform hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
                border: '1px solid rgba(203, 213, 225, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Riders</p>
                  {systemLoading ? (
                    <div className="w-8 h-8 bg-gray-200 animate-pulse rounded mt-1"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{mapStats.activeRiders}</p>
                  )}
                </div>
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                  }}
                >
                  <Users2 className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div 
              className="p-6 rounded-2xl transition-all duration-300 hover:transform hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
                border: '1px solid rgba(203, 213, 225, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">System Health</p>
                  {systemLoading ? (
                    <div className="w-8 h-8 bg-gray-200 animate-pulse rounded mt-1"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{mapStats.systemHealth}%</p>
                  )}
                </div>
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #5DADE2 0%, #4A9BC7 100%)'
                  }}
                >
                  <Activity className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Map Controls */}
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
                <h3 className="text-lg font-bold text-gray-800">Map Filters</h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-xs text-blue-700 font-medium">Hospitals</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 rounded-lg">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-xs text-orange-700 font-medium">Centers</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-700 font-medium">Available</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 rounded-lg">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-xs text-blue-700 font-medium">Busy</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    <span className="text-xs text-gray-700 font-medium">Offline</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Show:</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedFilter === 'all'
                        ? 'text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    style={selectedFilter === 'all' ? {
                      background: 'linear-gradient(135deg, #5DADE2 0%, #4A9BC7 100%)',
                      boxShadow: '0 4px 16px rgba(93, 173, 226, 0.3)'
                    } : {}}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setSelectedFilter('hospitals')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedFilter === 'hospitals'
                        ? 'text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    style={selectedFilter === 'hospitals' ? {
                      background: 'linear-gradient(135deg, #5DADE2 0%, #4A9BC7 100%)',
                      boxShadow: '0 4px 16px rgba(93, 173, 226, 0.3)'
                    } : {}}
                  >
                    <Building2 className="w-4 h-4" />
                    Hospitals
                  </button>
                  <button
                    onClick={() => setSelectedFilter('centers')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedFilter === 'centers'
                        ? 'text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    style={selectedFilter === 'centers' ? {
                      background: 'linear-gradient(135deg, #5DADE2 0%, #4A9BC7 100%)',
                      boxShadow: '0 4px 16px rgba(93, 173, 226, 0.3)'
                    } : {}}
                  >
                    <Stethoscope className="w-4 h-4" />
                    Centers
                  </button>
                  <button
                    onClick={() => setSelectedFilter('riders')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedFilter === 'riders'
                        ? 'text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    style={selectedFilter === 'riders' ? {
                      background: 'linear-gradient(135deg, #5DADE2 0%, #4A9BC7 100%)',
                      boxShadow: '0 4px 16px rgba(93, 173, 226, 0.3)'
                    } : {}}
                  >
                    <Navigation className="w-4 h-4" />
                    Riders
                  </button>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={showActiveOnly}
                      onChange={(e) => setShowActiveOnly(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-gray-600 font-medium">Active only</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Map Container */}
      <div 
        className={`rounded-3xl overflow-hidden ${isFullscreen ? "fixed inset-0 z-50 rounded-none" : ""}`}
        style={!isFullscreen ? {
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
          border: '1px solid rgba(203, 213, 225, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)'
        } : {}}
      >
        <OperationsMap 
          selectedFilter={selectedFilter}
          showActiveOnly={showActiveOnly}
          isFullscreen={isFullscreen}
          onExitFullscreen={() => setIsFullscreen(false)}
        />
      </div>
    </div>
  );
}