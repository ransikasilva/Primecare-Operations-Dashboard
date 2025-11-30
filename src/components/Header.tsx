"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useOperationsNotifications } from "@/hooks/useRealtime";
import apiClient from "@/lib/api";
import {
  Bell,
  ChevronDown,
  Search,
  Settings,
  LogOut,
  User,
  HelpCircle,
  Plus,
  Filter,
  Download,
  RefreshCw,
  Globe,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Building2,
  Users as UsersIcon,
  Package,
  Hospital
} from "lucide-react";

const quickActions = [
  { icon: Plus, label: "New Network", color: "#4ECDC4" },
  { icon: RefreshCw, label: "Refresh", color: "#0ea5e9" }
];

const pathTitles: { [key: string]: string } = {
  "/dashboard": "Operations Overview",
  "/sla": "SLA Report & System Monitoring", 
  "/approvals": "Approvals & Management",
  "/configuration": "System Configuration",
  "/billing": "Billing & Subscriptions",
  "/analytics": "Analytics & Reports"
};

export function Header() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Get real data from APIs and real-time hooks
  const { user, logout } = useAuth();
  const { alerts, unreadCount, criticalCount } = useOperationsNotifications();
  
  // Get user display info for operations team
  const userDisplayName = user?.name || user?.email?.split('@')[0] || "Operations Admin";
  const userEmail = user?.email || "admin@primecare.com";
  const userInitials = userDisplayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || "OA";

  const currentTitle = pathTitles[pathname] || "TransFleet Operations";

  // Perform search when query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const query = searchQuery.toLowerCase();
        const results: any[] = [];
        const token = apiClient.currentToken;
        const headers: HeadersInit = {
          'Content-Type': 'application/json'
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // Search hospitals/networks
        try {
          const hospitalsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/operations/hospitals`, { headers });
          if (hospitalsRes.ok) {
            const hospitalsData = await hospitalsRes.json();
            if (hospitalsData?.data?.networks) {
              hospitalsData.data.networks.forEach((network: any) => {
                if (network.network_name?.toLowerCase().includes(query)) {
                  results.push({
                    type: 'hospital',
                    id: network.id,
                    title: network.network_name,
                    subtitle: `${network.total_hospitals || 0} hospitals • ${network.region || 'Unknown Region'}`,
                    icon: Hospital
                  });
                }
              });
            }
          }
        } catch (e) { console.error('Hospital search error:', e); }

        // Search collection centers
        try {
          const centersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/operations/collection-centers`, { headers });
          if (centersRes.ok) {
            const centersData = await centersRes.json();
            if (centersData?.data?.centers) {
              centersData.data.centers.forEach((center: any) => {
                if (center.center_name?.toLowerCase().includes(query)) {
                  results.push({
                    type: 'center',
                    id: center.id,
                    title: center.center_name,
                    subtitle: `${center.hospital_name || 'Unknown Hospital'}`,
                    icon: Building2
                  });
                }
              });
            }
          }
        } catch (e) { console.error('Center search error:', e); }

        // Search riders
        try {
          const ridersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/operations/riders`, { headers });
          if (ridersRes.ok) {
            const ridersData = await ridersRes.json();
            if (ridersData?.data?.riders) {
              ridersData.data.riders.forEach((rider: any) => {
                if (rider.rider_name?.toLowerCase().includes(query) || rider.rider_id?.toLowerCase().includes(query)) {
                  results.push({
                    type: 'rider',
                    id: rider.id,
                    title: rider.rider_name,
                    subtitle: `${rider.hospital_name || 'Unknown Hospital'} • ${rider.availability_status || 'Unknown'}`,
                    icon: UsersIcon
                  });
                }
              });
            }
          }
        } catch (e) { console.error('Rider search error:', e); }

        // Search orders
        try {
          const ordersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/operations/orders?limit=50`, { headers });
          if (ordersRes.ok) {
            const ordersData = await ordersRes.json();
            if (ordersData?.data?.orders) {
              ordersData.data.orders.forEach((order: any) => {
                if (order.order_number?.toLowerCase().includes(query)) {
                  results.push({
                    type: 'order',
                    id: order.id,
                    title: order.order_number,
                    subtitle: `${order.center_name || 'Unknown'} → ${order.hospital_name || 'Unknown'}`,
                    icon: Package
                  });
                }
              });
            }
          }
        } catch (e) { console.error('Order search error:', e); }

        setSearchResults(results.slice(0, 10)); // Limit to 10 results
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchQuery('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'error':
      case 'critical': return AlertTriangle;
      case 'success': return CheckCircle2;
      default: return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'error':
      case 'critical': return '#ef4444';
      case 'success': return '#10b981';
      case 'warning': return '#f59e0b';
      default: return '#4ECDC4';
    }
  };

  return (
    <header 
      className="relative z-20"
      style={{
        height: '80px',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(203, 213, 225, 0.3)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 24px rgba(0, 0, 0, 0.02)'
      }}
    >
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left Section - Title & System Status */}
        <div className="flex items-center space-x-6">
          <div>
            <h1 
              className="text-2xl font-bold tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              {currentTitle}
            </h1>
            <div className="flex items-center space-x-2 mt-1">
              <div 
                className="flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: '#4ECDC4',
                  color: 'white',
                  boxShadow: '0 2px 8px rgba(78, 205, 196, 0.3)'
                }}
              >
                <Globe className="w-3 h-3 mr-1" />
                System Wide • All Networks
              </div>
              <div 
                className="flex items-center px-2 py-1 rounded-full text-xs font-medium"
                style={{
                  background: criticalCount > 0 
                    ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
                  color: criticalCount > 0 ? '#dc2626' : '#065f46',
                  border: criticalCount > 0 
                    ? '1px solid rgba(239, 68, 68, 0.2)'
                    : '1px solid rgba(16, 185, 129, 0.2)'
                }}
              >
                <div 
                  className={`w-2 h-2 rounded-full mr-1 animate-pulse`}
                  style={{ 
                    backgroundColor: criticalCount > 0 ? '#ef4444' : '#10b981'
                  }}
                />
                {criticalCount > 0 ? 'Issues Detected' : 'Operational'}
              </div>
            </div>
          </div>
        </div>

        {/* Center Section - Search */}
        <div className="flex-1 max-w-xl mx-8">
          <div className="relative" ref={searchRef}>
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search hospitals, centers, riders, orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border-0 text-gray-800 placeholder-gray-500 transition-all duration-300 focus:outline-none focus:ring-2"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.8) 100%)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(10px)'
              }}
            />
            {searchQuery && (
              <div
                className="absolute top-full left-0 right-0 mt-2 rounded-2xl border-0 overflow-hidden z-50 max-h-96 overflow-y-auto"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)'
                }}
              >
                <div className="p-2">
                  <div className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {isSearching ? 'Searching...' : `Search Results (${searchResults.length})`}
                  </div>
                  <div className="space-y-1">
                    {isSearching ? (
                      <div className="px-4 py-8 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600 mx-auto"></div>
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500">
                        No results found
                      </div>
                    ) : (
                      searchResults.map((result, index) => {
                        const Icon = result.icon;
                        return (
                          <div
                            key={index}
                            onClick={() => {
                              // Navigate based on type
                              if (result.type === 'hospital') router.push(`/hospitals?id=${result.id}`);
                              else if (result.type === 'center') router.push(`/centers?id=${result.id}`);
                              else if (result.type === 'rider') router.push(`/riders?id=${result.id}`);
                              else if (result.type === 'order') router.push(`/orders?id=${result.id}`);
                              setSearchQuery('');
                            }}
                            className="px-4 py-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors duration-200 flex items-center space-x-3"
                          >
                            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                              <Icon className="w-4 h-4 text-teal-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-800 truncate">{result.title}</div>
                              <div className="text-sm text-gray-500 truncate">{result.subtitle}</div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Section - Actions & User */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="group relative p-3 rounded-xl transition-all duration-300 hover:transform hover:scale-105"
              style={{
                background: showNotifications 
                  ? '#4ECDC4'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.8) 100%)',
                border: '1px solid rgba(203, 213, 225, 0.3)',
                boxShadow: showNotifications 
                  ? '0 8px 32px rgba(78, 205, 196, 0.3)'
                  : '0 2px 8px rgba(0, 0, 0, 0.02)'
              }}
            >
              <Bell 
                className={`w-5 h-5 transition-colors duration-300 ${
                  showNotifications ? 'text-white' : 'text-gray-600'
                }`} 
              />
              {unreadCount > 0 && (
                <div 
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white animate-pulse"
                  style={{
                    background: criticalCount > 0 
                      ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                      : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    boxShadow: criticalCount > 0 
                      ? '0 2px 8px rgba(239, 68, 68, 0.4)'
                      : '0 2px 8px rgba(245, 158, 11, 0.4)',
                    fontSize: '11px'
                  }}
                >
                  {unreadCount}
                </div>
              )}
            </button>

            {showNotifications && (
              <div 
                className="absolute right-0 top-full mt-2 w-96 rounded-2xl border-0 overflow-hidden z-50"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)'
                }}
              >
                <div className="p-4 border-b border-gray-100/60">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">System Alerts</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">{unreadCount} unread</span>
                      {criticalCount > 0 && (
                        <div className="flex items-center space-x-1">
                          <Shield className="w-4 h-4 text-red-500" />
                          <span className="text-xs font-bold text-red-600">{criticalCount} critical</span>
                        </div>
                      )}
                      <Clock className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {alerts.slice(0, 10).map((alert) => {
                    const Icon = getNotificationIcon(alert.severity);
                    return (
                      <div 
                        key={alert.id}
                        className="p-4 border-b border-gray-50 hover:bg-gray-25 transition-colors duration-200 cursor-pointer"
                      >
                        <div className="flex items-start space-x-3">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{
                              background: `linear-gradient(135deg, ${getNotificationColor(alert.severity)}20 0%, ${getNotificationColor(alert.severity)}10 100%)`,
                              border: `1px solid ${getNotificationColor(alert.severity)}30`
                            }}
                          >
                            <Icon 
                              className="w-5 h-5"
                              style={{ color: getNotificationColor(alert.severity) }}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-gray-800">{alert.title}</h4>
                              {!alert.isRead && (
                                <div className="w-2 h-2 rounded-full bg-teal-500" />
                              )}
                              {alert.severity === 'critical' && (
                                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">
                                  CRITICAL
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <p className="text-xs text-gray-500">{alert.source}</p>
                              <span className="text-gray-300">•</span>
                              <p className="text-xs text-gray-500">{alert.timestamp}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="p-4 border-t border-gray-100/60">
                  <button 
                    className="w-full text-center text-sm font-medium transition-colors duration-200"
                    style={{ color: '#4ECDC4' }}
                  >
                    View All System Alerts
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 rounded-xl transition-all duration-300 hover:bg-gray-50"
            >
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800">{userDisplayName}</p>
                <p className="text-xs text-gray-500">Operations Administrator</p>
              </div>
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center relative overflow-hidden"
                style={{
                  backgroundColor: '#4ECDC4',
                  boxShadow: '0 4px 16px rgba(78, 205, 196, 0.3)'
                }}
              >
                <span className="text-white font-bold text-lg relative z-10">{userInitials}</span>
                <div 
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0%, transparent 50%)'
                  }}
                />
              </div>
              <ChevronDown 
                className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${
                  showUserMenu ? 'transform rotate-180' : ''
                }`} 
              />
            </button>

            {showUserMenu && (
              <div 
                className="absolute right-0 top-full mt-2 w-64 rounded-2xl border-0 overflow-hidden z-50"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)'
                }}
              >
                <div className="p-4 border-b border-gray-100/60">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{
                        backgroundColor: '#4ECDC4'
                      }}
                    >
                      <span className="text-white font-bold">{userInitials}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{userDisplayName}</p>
                      <p className="text-sm text-gray-500">{userEmail}</p>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  {[
                    { icon: LogOut, label: "Sign Out", color: "#ef4444" }
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors duration-200 text-left"
                        onClick={() => {
                          if (item.label === 'Sign Out') {
                            // Use auth context logout
                            logout();
                            setShowUserMenu(false);
                          }
                        }}
                      >
                        <Icon
                          className="w-5 h-5"
                          style={{ color: item.color }}
                        />
                        <span className="font-medium text-gray-700">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}