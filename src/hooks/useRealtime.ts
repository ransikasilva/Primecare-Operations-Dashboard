"use client";

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Operations-specific socket events
interface OperationsSocketEvents {
  // System-wide events
  system_metrics_updated: {
    totalActiveOrders: number;
    onlineRiders: number;
    hospitalNetworks: number;
    systemHealth: number;
  };
  
  // Network events
  network_status_changed: {
    networkId: string;
    status: 'Active' | 'Warning' | 'Critical';
    activeOrders: number;
    ridersOnline: number;
  };
  
  // SLA events
  sla_breach_detected: {
    orderId: string;
    networkId: string;
    breachType: string;
    severity: 'warning' | 'critical';
    timestamp: string;
  };
  
  sla_metrics_updated: {
    nationalCompliance: number;
    systemAlerts: number;
    avgDeliveryTime: number;
    slaBreachesToday: number;
  };
  
  // Approval events
  new_approval_request: {
    type: 'hospital' | 'collection_center' | 'regional_hospital';
    itemId: string;
    applicantName: string;
    priority: 'High' | 'Normal' | 'Low';
  };
  
  approval_processed: {
    type: string;
    itemId: string;
    status: 'approved' | 'rejected';
    processedBy: string;
  };
  
  // Billing events
  payment_received: {
    networkId: string;
    amount: number;
    currency: string;
    timestamp: string;
  };
  
  invoice_generated: {
    networkId: string;
    invoiceId: string;
    amount: number;
    dueDate: string;
  };
  
  // System alerts
  system_alert_triggered: {
    id: string;
    type: 'error' | 'warning' | 'info' | 'success';
    title: string;
    message: string;
    timestamp: string;
    source: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
  
  // Performance events
  performance_threshold_exceeded: {
    metric: string;
    currentValue: number;
    threshold: number;
    region?: string;
    networkId?: string;
  };
}

export function useOperationsRealtime() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Temporarily disable socket.io connection until backend is properly configured
    // The backend is running on port 8000, not 3000, and doesn't have socket.io setup yet
    console.log('Socket.io connection disabled - backend not configured yet');
    return;
    
    /* Commented out until backend socket.io is configured
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8000';
    const newSocket = io(socketUrl, {
      auth: {
        token: localStorage.getItem('auth_token'),
      },
      path: '/operations-socket.io', // Separate path for operations
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Operations socket connected');
      
      // Join operations room for system-wide events
      newSocket.emit('join_operations_room');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Operations socket disconnected');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
    */
  }, []);

  const subscribe = <T extends keyof OperationsSocketEvents>(
    event: T,
    callback: (data: OperationsSocketEvents[T]) => void
  ) => {
    if (socket) {
      socket.on(event, callback);
      return () => socket.off(event, callback);
    }
    return () => {};
  };

  const emit = <T extends keyof OperationsSocketEvents>(
    event: T,
    data: OperationsSocketEvents[T]
  ) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    }
  };

  return {
    socket,
    isConnected,
    subscribe,
    emit,
  };
}

// Specific hooks for different real-time features

// System-wide metrics updates
export function useSystemMetricsUpdates() {
  const { subscribe } = useOperationsRealtime();
  const [metrics, setMetrics] = useState<{
    totalActiveOrders: number;
    onlineRiders: number;
    hospitalNetworks: number;
    systemHealth: number;
  } | null>(null);

  useEffect(() => {
    const unsubscribe = subscribe('system_metrics_updated', (newMetrics) => {
      setMetrics(newMetrics);
    });

    return unsubscribe;
  }, [subscribe]);

  return { metrics };
}

// Network status updates
export function useNetworkStatusUpdates() {
  const { subscribe } = useOperationsRealtime();
  const [networkUpdates, setNetworkUpdates] = useState<{ [networkId: string]: any }>({});

  useEffect(() => {
    const unsubscribe = subscribe('network_status_changed', (update) => {
      setNetworkUpdates(prev => ({
        ...prev,
        [update.networkId]: update,
      }));
    });

    return unsubscribe;
  }, [subscribe]);

  return { networkUpdates };
}

// SLA monitoring updates
export function useSLAUpdates() {
  const { subscribe } = useOperationsRealtime();
  const [slaMetrics, setSLAMetrics] = useState<any>(null);
  const [breaches, setBreaches] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribeSLA = subscribe('sla_metrics_updated', (metrics) => {
      setSLAMetrics(metrics);
    });

    const unsubscribeBreach = subscribe('sla_breach_detected', (breach) => {
      setBreaches(prev => [breach, ...prev.slice(0, 49)]); // Keep last 50 breaches
    });

    return () => {
      unsubscribeSLA();
      unsubscribeBreach();
    };
  }, [subscribe]);

  return { slaMetrics, breaches };
}

// Approval workflow updates
export function useApprovalUpdates() {
  const { subscribe } = useOperationsRealtime();
  const [newApprovals, setNewApprovals] = useState<any[]>([]);
  const [processedApprovals, setProcessedApprovals] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribeNew = subscribe('new_approval_request', (approval) => {
      setNewApprovals(prev => [approval, ...prev]);
    });

    const unsubscribeProcessed = subscribe('approval_processed', (approval) => {
      setProcessedApprovals(prev => [approval, ...prev]);
      // Remove from new approvals if it was there
      setNewApprovals(prev => prev.filter(a => a.itemId !== approval.itemId));
    });

    return () => {
      unsubscribeNew();
      unsubscribeProcessed();
    };
  }, [subscribe]);

  return { 
    newApprovals, 
    processedApprovals,
    pendingCount: newApprovals.length 
  };
}

// System alerts and notifications
export function useOperationsNotifications() {
  const { subscribe } = useOperationsRealtime();
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = subscribe('system_alert_triggered', (alert) => {
      setAlerts(prev => [alert, ...prev.slice(0, 99)]); // Keep last 100 alerts
    });

    return unsubscribe;
  }, [subscribe]);

  const markAsRead = (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, isRead: true }
          : alert
      )
    );
  };

  const clearAll = () => {
    setAlerts([]);
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  return {
    alerts,
    markAsRead,
    clearAll,
    dismissAlert,
    unreadCount: alerts.filter(alert => !alert.isRead).length,
    criticalCount: alerts.filter(alert => alert.severity === 'critical' && !alert.isRead).length,
  };
}

// Billing and payment updates
export function useBillingUpdates() {
  const { subscribe, isConnected } = useOperationsRealtime();
  const [payments, setPayments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    if (!isConnected) {
      // Return empty arrays when socket is not connected
      return;
    }

    const unsubscribePayments = subscribe('payment_received', (payment) => {
      setPayments(prev => [payment, ...prev.slice(0, 49)]);
    });

    const unsubscribeInvoices = subscribe('invoice_generated', (invoice) => {
      setInvoices(prev => [invoice, ...prev.slice(0, 49)]);
    });

    return () => {
      unsubscribePayments();
      unsubscribeInvoices();
    };
  }, [subscribe, isConnected]);

  return { 
    payments, 
    invoices,
    recentPayments: payments.slice(0, 10),
    recentInvoices: invoices.slice(0, 10)
  };
}

// Performance monitoring
export function usePerformanceMonitoring() {
  const { subscribe } = useOperationsRealtime();
  const [performanceAlerts, setPerformanceAlerts] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = subscribe('performance_threshold_exceeded', (alert) => {
      setPerformanceAlerts(prev => [alert, ...prev.slice(0, 19)]); // Keep last 20 alerts
    });

    return unsubscribe;
  }, [subscribe]);

  return { 
    performanceAlerts,
    activeAlerts: performanceAlerts.filter(alert => 
      Date.now() - new Date(alert.timestamp).getTime() < 300000 // Last 5 minutes
    )
  };
}

// Combined hook for dashboard real-time data
export function useOperationsDashboardRealtime() {
  const { metrics } = useSystemMetricsUpdates();
  const { networkUpdates } = useNetworkStatusUpdates();
  const { slaMetrics, breaches } = useSLAUpdates();
  const { newApprovals, pendingCount } = useApprovalUpdates();
  const { alerts, criticalCount, unreadCount } = useOperationsNotifications();
  const { recentPayments } = useBillingUpdates();
  const { activeAlerts } = usePerformanceMonitoring();

  return {
    // Dashboard metrics
    systemMetrics: metrics,
    networkUpdates,
    
    // SLA data
    slaMetrics,
    recentBreaches: breaches.slice(0, 10),
    
    // Approvals
    pendingApprovals: newApprovals.slice(0, 10),
    pendingCount,
    
    // Notifications
    alerts: alerts.slice(0, 20),
    unreadCount,
    criticalCount,
    
    // Billing
    recentPayments: recentPayments.slice(0, 5),
    
    // Performance  
    performanceAlerts: activeAlerts,
    
    // Overall health indicators
    isHealthy: criticalCount === 0 && activeAlerts.length === 0,
    needsAttention: pendingCount > 10 || criticalCount > 0,
  };
}