"use client";

import { useBillingMetrics, useHospitalSubscriptions } from '@/hooks/useApi';
import { useBillingUpdates } from '@/hooks/useRealtime';
import { useUpdateSubscriptionPayment, useGenerateInvoice } from '@/hooks/useApi';
import { useState, useEffect, useRef } from 'react';
import { exportBillingDataToExcel, exportBillingDataToPDF } from '@/lib/exportUtils';
import { PaymentHistoryModal } from '@/components/modals/PaymentHistoryModal';
import operationsApi from '@/lib/api';
import {
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  Building2,
  FileText,
  Plus,
  X,
  Calendar,
  PowerOff,
  RefreshCw,
  CreditCard,
  Download,
  Search,
  Filter,
  ChevronDown,
  Eye
} from 'lucide-react';

export default function BillingManagementPage() {
  const { data: billingData, refetch: refetchBillingData } = useBillingMetrics();
  const { data: subscriptionsData, refetch: refetchSubscriptions } = useHospitalSubscriptions();
  const { recentPayments } = useBillingUpdates();
  const { updateSubscriptionPayment } = useUpdateSubscriptionPayment();
  const { generateInvoice } = useGenerateInvoice();

  // State management
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<any>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    subscriptionAmount: '75000',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Bank Transfer',
    subscriptionPeriod: '12',
    reference: '',
    notes: ''
  });
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Search and Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  // Data processing
  const metrics = billingData?.data || {
    subscriptionRevenue: 0,
    monthlyRevenue: 0,
    activeSubscriptions: 0,
    pendingSubscriptions: 0,
    avgSubscriptionFee: 0
  };

  const rawSubscriptions = subscriptionsData?.data;
  const subscriptions = Array.isArray(rawSubscriptions) ? rawSubscriptions : [];

  // Search and filter logic
  const filteredSubscriptions = subscriptions.filter((subscription: any) => {
    const networkName = (subscription.networkName || subscription.name || '').toLowerCase();
    const adminName = (subscription.adminName || subscription.admin_name || '').toLowerCase();
    const adminEmail = (subscription.adminEmail || subscription.admin_email || '').toLowerCase();
    
    const matchesSearch = !searchTerm || 
      networkName.includes(searchTerm.toLowerCase()) ||
      adminName.includes(searchTerm.toLowerCase()) ||
      adminEmail.includes(searchTerm.toLowerCase());
    
    const actualStatus = getActualSubscriptionStatus(subscription);
    const matchesStatus = statusFilter === 'all' || actualStatus === statusFilter;
    
    const paymentMethod = subscription.paymentMethod || subscription.payment_method || 'Bank Transfer';
    const matchesPaymentMethod = paymentMethodFilter === 'all' || paymentMethod === paymentMethodFilter;
    
    return matchesSearch && matchesStatus && matchesPaymentMethod;
  });

  const subscriptionCounts = filteredSubscriptions.reduce((acc: any, sub: any) => {
    const status = getActualSubscriptionStatus(sub);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const totalPages = Math.ceil(filteredSubscriptions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSubscriptions = filteredSubscriptions.slice(startIndex, startIndex + itemsPerPage);

  // Helper functions
  function getActualSubscriptionStatus(subscription: any): string {
    const endDate = subscription.subscriptionEnd;
    const status = subscription.subscriptionStatus || 'Active';
    
    if (!endDate) return status;
    
    const now = new Date();
    const end = new Date(endDate);
    
    if (status === 'Suspended') return 'Suspended';
    if (end < now) return 'Expired';
    
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 30 && daysLeft > 0) return 'Expiring Soon';
    
    return 'Active';
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800 border-green-200';
      case 'Suspended': return 'bg-red-100 text-red-800 border-red-200';
      case 'Expired': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Expiring Soon': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getDaysUntilExpiry = (endDate: string) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Get total revenue from either subscriptionRevenue or monthlyRevenue
  const totalRevenue = (metrics as any).subscriptionRevenue || (metrics as any).monthlyRevenue || 0;

  // Event handlers
  const handleViewPaymentHistory = async (subscription: any) => {
    setSelectedNetwork(subscription);
    setLoadingHistory(true);
    setShowPaymentHistoryModal(true);

    try {
      const response = await operationsApi.getPaymentHistory(subscription.id);
      if (response.success) {
        setPaymentHistory(response.data || []);
      } else {
        setPaymentHistory([]);
      }
    } catch (error) {
      console.error('Failed to load payment history:', error);
      setPaymentHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRecordPayment = (subscription: any) => {
    setSelectedNetwork(subscription);
    setPaymentForm({
      subscriptionAmount: '75000',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'Bank Transfer',
      subscriptionPeriod: '12',
      reference: '',
      notes: ''
    });
    setShowPaymentModal(true);
  };

  const handleSuspendService = async (subscription: any) => {
    if (!confirm(`⚠️ SUSPEND SERVICES FOR ${subscription.networkName}?\\n\\nThis will immediately disable all TransFleet services for this hospital network.\\n\\nAre you sure?`)) {
      return;
    }

    setActionLoading(subscription.id + '_suspend');
    try {
      const result = await updateSubscriptionPayment(subscription.id, {
        paymentStatus: 'Suspended',
        paymentDate: new Date().toISOString().split('T')[0],
        billingPeriod: new Date().toISOString().slice(0, 7),
        notes: `Service suspended due to non-payment - ${subscription.networkName}`
      });

      if (result.success) {
        alert(`✅ Services suspended for ${subscription.networkName}`);
        // Refetch data instead of reloading the page
        refetchBillingData();
        refetchSubscriptions();
      } else {
        throw new Error(result.error || 'Service suspension failed');
      }
    } catch (error: any) {
      console.error('Service suspension failed:', error);
      alert(`❌ Failed to suspend services: ${error.message || 'Please try again.'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivateService = async (subscription: any) => {
    if (!confirm(`✅ REACTIVATE SERVICES FOR ${subscription.networkName}?\\n\\nThis will restore all TransFleet services for this hospital network.\\n\\nAre you sure?`)) {
      return;
    }

    setActionLoading(subscription.id + '_reactivate');
    try {
      const result = await updateSubscriptionPayment(subscription.id, {
        paymentStatus: 'Active',
        paymentDate: new Date().toISOString().split('T')[0],
        billingPeriod: new Date().toISOString().slice(0, 7),
        notes: `Service reactivated - ${subscription.networkName}`
      });

      if (result.success) {
        alert(`✅ Services reactivated for ${subscription.networkName}`);
        // Refetch data instead of reloading the page
        refetchBillingData();
        refetchSubscriptions();
      } else {
        throw new Error(result.error || 'Service reactivation failed');
      }
    } catch (error: any) {
      console.error('Service reactivation failed:', error);
      alert(`❌ Failed to reactivate services: ${error.message || 'Please try again.'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);
    setPaymentSuccess(null);

    // Validation
    if (!paymentForm.subscriptionAmount || parseFloat(paymentForm.subscriptionAmount) <= 0) {
      setPaymentError('Please enter a valid subscription amount');
      return;
    }

    if (!paymentForm.paymentDate) {
      setPaymentError('Please select a payment date');
      return;
    }

    try {
      const result = await updateSubscriptionPayment(selectedNetwork?.id, {
        paymentStatus: 'Active',
        paymentAmount: parseFloat(paymentForm.subscriptionAmount),
        paymentDate: paymentForm.paymentDate,
        billingPeriod: `${paymentForm.subscriptionPeriod} months`,
        notes: `Subscription payment: Rs. ${parseFloat(paymentForm.subscriptionAmount).toLocaleString()} for ${paymentForm.subscriptionPeriod} months - ${paymentForm.paymentMethod}${paymentForm.reference ? ` - Ref: ${paymentForm.reference}` : ''}${paymentForm.notes ? ` - ${paymentForm.notes}` : ''}`
      });

      if (result.success) {
        setPaymentSuccess(`✅ Payment recorded successfully!\\nRs. ${parseFloat(paymentForm.subscriptionAmount).toLocaleString()} for ${selectedNetwork?.networkName}`);
        
        setTimeout(() => {
          setShowPaymentModal(false);
          setSelectedNetwork(null);
          setPaymentSuccess(null);
          // Trigger data refetch instead of page reload to prevent logout
          refetchBillingData();
          refetchSubscriptions();
        }, 2000);
      } else {
        throw new Error(result.error || 'Payment recording failed');
      }
    } catch (error: any) {
      console.error('Subscription payment failed:', error);
      setPaymentError(error.message || 'Failed to record subscription payment. Please try again.');
    }
  };

  const resetPaymentForm = () => {
    setShowPaymentModal(false);
    setSelectedNetwork(null);
    setPaymentError(null);
    setPaymentSuccess(null);
    setPaymentForm({
      subscriptionAmount: '75000',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'Bank Transfer',
      subscriptionPeriod: '12',
      reference: '',
      notes: ''
    });
  };

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

  // Export handlers
  const handleExportToExcel = () => {
    exportBillingDataToExcel(metrics, subscriptions);
    setShowExportMenu(false);
  };

  const handleExportToPDF = () => {
    exportBillingDataToPDF(metrics, subscriptions);
    setShowExportMenu(false);
  };

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, paymentMethodFilter]);

  return (
    <div className="space-y-8">
      {/* Header Section - Matching Dashboard Style */}
      <div 
        className="relative overflow-hidden rounded-3xl p-8"
        style={{
          background: 'linear-gradient(135deg, #4ECDC4 0%, #4A9BC7 100%)',
          boxShadow: '0 20px 40px rgba(78, 205, 196, 0.3)'
        }}
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <CreditCard className="w-8 h-8" />
                Hospital Billing Management
              </h1>
              <p className="text-white/90 text-lg mb-3">
                Manual subscription billing and payment management
              </p>
              <p className="text-white/80 text-base">
                Manage {formatCurrency(totalRevenue)} across {subscriptions.length} networks
              </p>
            </div>
            <div className="text-right flex items-center gap-4">
              <div className="relative" ref={exportMenuRef}>
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-300 font-medium border border-white/20"
                >
                  <Download className="w-5 h-5" />
                  Export Report
                </button>
                
                {showExportMenu && (
                  <div 
                    className="fixed right-4 top-20 w-64 rounded-2xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)',
                      border: '1px solid rgba(203, 213, 225, 0.3)',
                      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
                      zIndex: 9999
                    }}
                  >
                    <div className="p-4 space-y-3">
                      <div className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2">
                        Financial Reports for Company Owners
                      </div>
                      
                      <button
                        onClick={handleExportToExcel}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-green-50 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200">
                          <span className="text-sm font-bold text-green-700">XLS</span>
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-medium text-gray-800">Comprehensive Excel Report</div>
                          <div className="text-xs text-gray-500">Executive summary, subscriptions, revenue analysis</div>
                        </div>
                      </button>
                      
                      <button
                        onClick={handleExportToPDF}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center group-hover:bg-red-200">
                          <span className="text-sm font-bold text-red-700">PDF</span>
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-medium text-gray-800">Executive PDF Report</div>
                          <div className="text-xs text-gray-500">Professional report for stakeholders</div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => {
                  refetchBillingData();
                  refetchSubscriptions();
                }}
                className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-300 font-medium border border-white/20"
              >
                <RefreshCw className="w-5 h-5" />
                Refresh Data
              </button>
            </div>
          </div>
        </div>
        
        {/* Background pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            background: `
              radial-gradient(circle at 20% 20%, rgba(255,255,255,0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(255,255,255,0.2) 0%, transparent 50%)
            `
          }}
        />
      </div>

      {/* Billing Metrics Cards - Matching Dashboard Style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            title: 'Total Revenue',
            value: formatCurrency(totalRevenue),
            icon: DollarSign,
            gradient: ['#10b981', '#059669'],
            change: 'Manual subscription billing',
            changeColor: 'text-green-600'
          },
          { 
            title: 'Active Subscriptions', 
            value: subscriptionCounts['Active'] || 0, 
            icon: CheckCircle2, 
            gradient: ['#3b82f6', '#1d4ed8'],
            change: `${subscriptions.length} total networks`,
            changeColor: 'text-teal-600'
          },
          { 
            title: 'Need Attention', 
            value: (subscriptionCounts['Suspended'] || 0) + (subscriptionCounts['Expired'] || 0), 
            icon: AlertCircle, 
            gradient: ['#ef4444', '#dc2626'],
            change: 'Requires immediate action',
            changeColor: 'text-red-600'
          },
          { 
            title: 'Expiring Soon', 
            value: subscriptionCounts['Expiring Soon'] || 0, 
            icon: Clock, 
            gradient: ['#f59e0b', '#d97706'],
            change: 'Next 30 days',
            changeColor: 'text-yellow-600'
          }
        ].map((stat, index) => (
          <div 
            key={index} 
            className="rounded-3xl overflow-hidden transition-all duration-300 hover:transform hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
              border: '1px solid rgba(203, 213, 225, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${stat.gradient[0]} 0%, ${stat.gradient[1]} 100%)`,
                    boxShadow: `0 4px 16px ${stat.gradient[0]}30`
                  }}
                >
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                <p className="text-gray-700 font-semibold text-base mb-1">{stat.title}</p>
                <p className={`text-xs font-medium ${stat.changeColor}`}>{stat.change}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filter Section */}
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
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-bold text-gray-800">Search & Filter Networks</h3>
              <span className="text-sm text-gray-500">
                {filteredSubscriptions.length} of {subscriptions.length} networks shown
              </span>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                showFilters 
                  ? 'bg-teal-100 text-teal-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filters</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${
                showFilters ? 'rotate-180' : ''
              }`} />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by network name, admin name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-teal-500 text-sm"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.8) 100%)'
                }}
              />
            </div>
          </div>
          
          {/* Filters */}
          {showFilters && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subscription Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-teal-500 text-sm"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.8) 100%)'
                    }}
                  >
                    <option value="all">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Expiring Soon">Expiring Soon</option>
                    <option value="Expired">Expired</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
                
                {/* Payment Method Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethodFilter}
                    onChange={(e) => setPaymentMethodFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-teal-500 text-sm"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.8) 100%)'
                    }}
                  >
                    <option value="all">All Methods</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                
                {/* Quick Actions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quick Actions
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                        setPaymentMethodFilter('all');
                      }}
                      className="flex-1 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={() => setStatusFilter('Expired')}
                      className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                    >
                      Show Expired
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Filter Summary */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
                <span className="text-xs font-medium text-gray-500">Active Filters:</span>
                {searchTerm && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-700 rounded-full text-xs">
                    Search: "{searchTerm}"
                    <button onClick={() => setSearchTerm('')}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {statusFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                    Status: {statusFilter}
                    <button onClick={() => setStatusFilter('all')}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {paymentMethodFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                    Method: {paymentMethodFilter}
                    <button onClick={() => setPaymentMethodFilter('all')}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {searchTerm === '' && statusFilter === 'all' && paymentMethodFilter === 'all' && (
                  <span className="text-xs text-gray-400">No filters applied</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hospital Networks Subscription Management */}
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
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-gray-700" />
                Hospital Network Subscriptions ({subscriptions.length})
              </h2>
              <p className="text-gray-600 text-base">Manual subscription billing and service management</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-gray-500">Total Managed Revenue</div>
                <div className="text-xl font-bold text-gray-800">{formatCurrency(totalRevenue)}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {paginatedSubscriptions.map((subscription) => {
              const actualStatus = getActualSubscriptionStatus(subscription);
              const daysLeft = getDaysUntilExpiry(subscription.subscriptionEnd);
              const isExpiring = daysLeft !== null && daysLeft <= 30 && daysLeft > 0;
              
              return (
                <div 
                  key={subscription.id}
                  className="group rounded-3xl transition-all duration-300 hover:transform hover:scale-[1.01]"
                  style={{
                    background: actualStatus === 'Suspended' 
                      ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(220, 38, 38, 0.02) 100%)'
                      : isExpiring 
                      ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(217, 119, 6, 0.02) 100%)'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.8) 100%)',
                    border: actualStatus === 'Suspended'
                      ? '2px solid rgba(239, 68, 68, 0.2)'
                      : isExpiring
                      ? '2px solid rgba(245, 158, 11, 0.2)'
                      : '1px solid rgba(203, 213, 225, 0.3)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)'
                  }}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-4">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{
                            background: actualStatus === 'Active' 
                              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                              : actualStatus === 'Suspended'
                              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                              : actualStatus === 'Expired'
                              ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                              : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                          }}
                        >
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-2">{subscription.networkName}</h3>
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(actualStatus)}`}>
                              {actualStatus}
                            </span>
                            <div className="flex items-center gap-1 text-gray-600">
                              <Building2 className="w-3 h-3" />
                              <span className="text-sm">{subscription.hospitalCount || 0} hospitals</span>
                            </div>
                            {subscription.paymentCount > 0 && (
                              <div className="flex items-center gap-1 text-gray-600">
                                <CreditCard className="w-3 h-3" />
                                <span className="text-sm">{subscription.paymentCount} payments</span>
                              </div>
                            )}
                          </div>
                          
                          {subscription.subscriptionEnd && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <Calendar className="w-3 h-3" />
                              <span className="text-sm">
                                Expires: {new Date(subscription.subscriptionEnd).toLocaleDateString()}
                                {daysLeft !== null && (
                                  <span className={`ml-2 font-semibold text-xs ${daysLeft <= 30 ? 'text-yellow-600' : daysLeft > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ({daysLeft > 0 ? `${daysLeft} days left` : `${Math.abs(daysLeft)} days overdue`})
                                  </span>
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* View Payment History Button */}
                        <button
                          onClick={() => handleViewPaymentHistory(subscription)}
                          className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 hover:transform hover:scale-105"
                          style={{
                            background: 'linear-gradient(135deg, #4ECDC4 0%, #4A9BC7 100%)',
                            color: 'white',
                            boxShadow: '0 4px 12px rgba(78, 205, 196, 0.3)'
                          }}
                        >
                          <Eye className="w-4 h-4" />
                          View History
                        </button>

                        {/* Record Payment Button */}
                        <button
                          onClick={() => handleRecordPayment(subscription)}
                          className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 hover:transform hover:scale-105"
                          style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                          }}
                        >
                          <Plus className="w-4 h-4" />
                          Record Payment
                        </button>

                        {/* Suspend Service Button - Only show when Active */}
                        {actualStatus === 'Active' && (
                          <button
                            onClick={() => handleSuspendService(subscription)}
                            disabled={actionLoading === subscription.id + '_suspend'}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 hover:transform hover:scale-105 disabled:opacity-50"
                            style={{
                              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                              color: 'white',
                              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                            }}
                          >
                            {actionLoading === subscription.id + '_suspend' ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <PowerOff className="w-4 h-4" />
                            )}
                            Suspend
                          </button>
                        )}

                        {/* Reactivate Service Button - Only show when Suspended */}
                        {actualStatus === 'Suspended' && (
                          <button
                            onClick={() => handleReactivateService(subscription)}
                            disabled={actionLoading === subscription.id + '_reactivate'}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 hover:transform hover:scale-105 disabled:opacity-50"
                            style={{
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                            }}
                          >
                            {actionLoading === subscription.id + '_reactivate' ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                            Reactivate
                          </button>
                        )}
                        
                        {/* Generate Invoice */}
                        <button 
                          onClick={() => generateInvoice(subscription.id, '2024-02')}
                          className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 font-medium"
                          title="Generate Invoice"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-gray-600 font-medium text-sm">
                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, subscriptions.length)} of {subscriptions.length} networks
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg border disabled:opacity-50 hover:bg-gray-50 transition-all duration-300 font-medium text-sm"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${
                      currentPage === page
                        ? 'text-white'
                        : 'border hover:bg-gray-50'
                    }`}
                    style={currentPage === page ? {
                      background: 'linear-gradient(135deg, #4ECDC4 0%, #4A9BC7 100%)',
                      boxShadow: '0 2px 8px rgba(78, 205, 196, 0.3)'
                    } : {}}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg border disabled:opacity-50 hover:bg-gray-50 transition-all duration-300 font-medium text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div 
            className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%)',
              border: '1px solid rgba(203, 213, 225, 0.3)',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
            }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Record Payment</h3>
                <button onClick={resetPaymentForm} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                {/* Messages */}
                {paymentError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 font-medium">{paymentError}</p>
                  </div>
                )}
                
                {paymentSuccess && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 font-medium whitespace-pre-line">{paymentSuccess}</p>
                  </div>
                )}

                {/* Network Info */}
                <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
                  <p className="font-bold text-teal-900">{selectedNetwork?.networkName}</p>
                  <p className="text-teal-700 text-sm">TransFleet Platform Subscription</p>
                </div>

                {/* Payment Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Amount (LKR) *
                  </label>
                  <input
                    type="number"
                    value={paymentForm.subscriptionAmount}
                    onChange={(e) => setPaymentForm({...paymentForm, subscriptionAmount: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-bold"
                    placeholder="75000"
                    required
                  />
                </div>

                {/* Date and Period */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date *</label>
                    <input
                      type="date"
                      value={paymentForm.paymentDate}
                      onChange={(e) => setPaymentForm({...paymentForm, paymentDate: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
                    <select
                      value={paymentForm.subscriptionPeriod}
                      onChange={(e) => setPaymentForm({...paymentForm, subscriptionPeriod: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="1">1 Month</option>
                      <option value="3">3 Months</option>
                      <option value="6">6 Months</option>
                      <option value="12">12 Months</option>
                      <option value="24">24 Months</option>
                    </select>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({...paymentForm, paymentMethod: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Check">Check</option>
                    <option value="Online Payment">Online Payment</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
                </div>

                {/* Reference */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reference Number</label>
                  <input
                    type="text"
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm({...paymentForm, reference: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Transaction/Check reference"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional notes"
                    rows={3}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-lg"
                  >
                    Record Payment
                  </button>
                  <button
                    type="button"
                    onClick={resetPaymentForm}
                    className="px-6 py-4 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      <PaymentHistoryModal
        isOpen={showPaymentHistoryModal}
        onClose={() => {
          setShowPaymentHistoryModal(false);
          setSelectedNetwork(null);
          setPaymentHistory([]);
        }}
        networkName={selectedNetwork?.networkName || ''}
        payments={paymentHistory}
      />
    </div>
  );
}