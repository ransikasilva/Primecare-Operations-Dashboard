"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import operationsApi from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      if (!isAuthenticated || authLoading) {
        if (!authLoading) {
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const result = await apiCall();

        if (!isCancelled) {
          setData(result);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'An error occurred');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, authLoading, ...dependencies]);

  const refetch = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiCall, isAuthenticated]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}

// Mutation hooks for API calls that modify data
export function useApiMutation<TData, TVariables = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TData | null>(null);

  const mutate = async (
    apiCall: (variables: TVariables) => Promise<TData>,
    variables: TVariables
  ) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall(variables);
      setData(result);
      return { success: true, data: result };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    mutate,
    loading,
    error,
    data,
  };
}

// Operations Dashboard Specific API hooks

// Dashboard & Overview
export function useOperationsDashboard() {
  return useApi(
    () => operationsApi.getOperationsDashboard(),
    []
  );
}

export function useHospitalNetworks() {
  return useApi(
    () => operationsApi.getHospitalNetworks(),
    []
  );
}

export function useSystemHealth() {
  return useApi(
    () => operationsApi.getSystemHealth(),
    []
  );
}

export function useNetworkMapData() {
  return useApi(
    () => operationsApi.getNetworkMapData(),
    []
  );
}

// SLA Monitoring
export function useSLAMetrics(period?: string) {
  return useApi(
    () => operationsApi.getSLAMetrics(period),
    [period]
  );
}

export function useSystemAlerts() {
  return useApi(
    () => operationsApi.getSystemAlerts(),
    []
  );
}

export function useSLATrends(period?: string) {
  return useApi(
    () => operationsApi.getSLATrends(period),
    [period]
  );
}

export function useSLAPerformance(period?: string) {
  return useApi(
    () => operationsApi.getSLAPerformance(period),
    [period]
  );
}

export function useSLAAlerts(period?: string) {
  return useApi(
    () => operationsApi.getSLAAlerts(period),
    [period]
  );
}

// Approvals Management
export function useOperationsPendingApprovals() {
  return useApi(
    () => operationsApi.getOperationsPendingApprovals(),
    []
  );
}

export function usePendingFeatureRequests() {
  return useApi(
    () => operationsApi.getPendingFeatureRequests(),
    []
  );
}

// System Configuration
export function useSystemConfig() {
  return useApi(
    () => operationsApi.getSystemConfig(),
    []
  );
}

export function useCenterConfiguration(centerId?: string) {
  return useApi(
    () => operationsApi.getCenterConfiguration(centerId),
    [centerId]
  );
}

// Billing & Subscriptions
export function useBillingMetrics() {
  return useApi(
    () => operationsApi.getBillingMetrics(),
    []
  );
}

export function useHospitalSubscriptions() {
  return useApi(
    () => operationsApi.getHospitalSubscriptions(),
    []
  );
}

// Analytics & Reports
export function useBusinessMetrics(period?: string) {
  return useApi(
    () => operationsApi.getBusinessMetrics(period),
    [period]
  );
}

export function useNetworkPerformance(period?: string) {
  return useApi(
    () => operationsApi.getNetworkPerformance(period),
    [period]
  );
}

export function useDeliveryVolumeData(period?: string) {
  return useApi(
    () => operationsApi.getDeliveryVolumeData(period),
    [period]
  );
}

// Mutation hooks for operations actions

export function useApproveHospitalNetwork() {
  const { mutate, loading, error } = useApiMutation<any, { networkId: string; notes?: string }>();

  const approveNetwork = (networkId: string, notes?: string) => {
    return mutate(
      ({ networkId, notes }) => operationsApi.approveHospitalNetwork(networkId, notes),
      { networkId, notes }
    );
  };

  return { approveNetwork, loading, error };
}

export function useApproveCollectionCenterFinal() {
  const { mutate, loading, error } = useApiMutation<any, { centerId: string; notes?: string }>();

  const approveCenter = (centerId: string, notes?: string) => {
    return mutate(
      ({ centerId, notes }) => operationsApi.approveCollectionCenterFinal(centerId, notes),
      { centerId, notes }
    );
  };

  return { approveCenter, loading, error };
}

export function useBulkApprove() {
  const { mutate, loading, error } = useApiMutation<any, { type: string; itemIds: string[]; notes?: string }>();

  const bulkApprove = (type: string, itemIds: string[], notes?: string) => {
    return mutate(
      ({ type, itemIds, notes }) => operationsApi.bulkApprove(type, itemIds, notes),
      { type, itemIds, notes }
    );
  };

  return { bulkApprove, loading, error };
}

export function useRejectApproval() {
  const { mutate, loading, error } = useApiMutation<any, { type: string; itemId: string; reason: string; notes?: string }>();

  const rejectApproval = (type: string, itemId: string, reason: string, notes?: string) => {
    return mutate(
      ({ type, itemId, reason, notes }) => operationsApi.rejectApproval(type, itemId, reason, notes),
      { type, itemId, reason, notes }
    );
  };

  return { rejectApproval, loading, error };
}

export function useApproveFeatureRequest() {
  const { mutate, loading, error } = useApiMutation<any, { centerId: string; featureId: string; approved: boolean; notes?: string }>();

  const approveFeatureRequest = (centerId: string, featureId: string, approved: boolean, notes?: string) => {
    return mutate(
      ({ centerId, featureId, approved, notes }) => operationsApi.approveFeatureRequest(centerId, featureId, approved, notes),
      { centerId, featureId, approved, notes }
    );
  };

  return { approveFeatureRequest, loading, error };
}

export function useUpdateFeatureToggle() {
  const { mutate, loading, error } = useApiMutation<any, { feature: string; enabled: boolean }>();

  const updateFeature = (feature: string, enabled: boolean) => {
    return mutate(
      ({ feature, enabled }) => operationsApi.updateFeatureToggle(feature, enabled),
      { feature, enabled }
    );
  };

  return { updateFeature, loading, error };
}

export function useUpdateCenterFeatures() {
  const { mutate, loading, error } = useApiMutation<any, { centerId: string; features: any }>();

  const updateCenterFeatures = (centerId: string, features: any) => {
    return mutate(
      ({ centerId, features }) => operationsApi.updateCenterFeatures(centerId, features),
      { centerId, features }
    );
  };

  return { updateCenterFeatures, loading, error };
}

export function useUpdateSLASettings() {
  const { mutate, loading, error } = useApiMutation<any, any>();

  const updateSLASettings = (settings: any) => {
    return mutate(
      (settings) => operationsApi.updateSLASettings(settings),
      settings
    );
  };

  return { updateSLASettings, loading, error };
}

export function useUpdateSubscriptionStatus() {
  const { mutate, loading, error } = useApiMutation<any, { networkId: string; status: string }>();

  const updateSubscription = (networkId: string, status: string) => {
    return mutate(
      ({ networkId, status }) => operationsApi.updateSubscriptionStatus(networkId, status),
      { networkId, status }
    );
  };

  return { updateSubscription, loading, error };
}

export function useUpdateSubscriptionPayment() {
  const { mutate, loading, error } = useApiMutation<any, { 
    networkId: string; 
    paymentData: {
      paymentStatus: string;
      paymentAmount?: number;
      paymentDate?: string;
      billingPeriod?: string;
      notes?: string;
    } 
  }>();

  const updateSubscriptionPayment = (networkId: string, paymentData: {
    paymentStatus: string;
    paymentAmount?: number;
    paymentDate?: string;
    billingPeriod?: string;
    notes?: string;
  }) => {
    return mutate(
      ({ networkId, paymentData }) => operationsApi.updateSubscriptionPayment(networkId, paymentData),
      { networkId, paymentData }
    );
  };

  return { updateSubscriptionPayment, loading, error };
}

export function useGenerateInvoice() {
  const { mutate, loading, error } = useApiMutation<any, { networkId: string; period: string }>();

  const generateInvoice = (networkId: string, period: string) => {
    return mutate(
      ({ networkId, period }) => operationsApi.generateInvoice(networkId, period),
      { networkId, period }
    );
  };

  return { generateInvoice, loading, error };
}

export function useGenerateReport() {
  const { mutate, loading, error } = useApiMutation<any, { type: string; period?: string }>();

  const generateReport = (type: string, period?: string) => {
    return mutate(
      ({ type, period }) => operationsApi.generateOperationsReport(type, period),
      { type, period }
    );
  };

  return { generateReport, loading, error };
}

export function useExportReport() {
  const { mutate, loading, error } = useApiMutation<any, { reportType: 'pdf' | 'excel' | 'csv'; period?: string }>();

  const exportReport = (reportType: 'pdf' | 'excel' | 'csv', period?: string) => {
    return mutate(
      ({ reportType, period }) => operationsApi.exportReport(reportType, period),
      { reportType, period }
    );
  };

  return { exportReport, loading, error };
}

// Additional hooks for new features


// QR Code Management & Chain of Custody
export function useQRCodeLogs(params?: { period?: string; type?: string; limit?: number }) {
  return useApi(
    () => operationsApi.getQRCodeLogs(params),
    [params?.period, params?.type, params?.limit]
  );
}

export function useChainOfCustody(qrId: string) {
  return useApi(
    () => operationsApi.getChainOfCustody(qrId),
    [qrId]
  );
}

export function useQRComplianceMetrics() {
  return useApi(
    () => operationsApi.getQRComplianceMetrics(),
    []
  );
}

export function useHandoverLogs() {
  return useApi(
    () => operationsApi.getHandoverLogs(),
    []
  );
}

// Hospital Network Details
export function useHospitalNetworkDetails(networkId: string) {
  return useApi(
    () => operationsApi.getHospitalNetworkDetails(networkId),
    [networkId]
  );
}

export function useNetworkHospitals(networkId: string) {
  return useApi(
    () => operationsApi.getNetworkHospitals(networkId),
    [networkId]
  );
}

export function useNetworkRiders(networkId: string) {
  return useApi(
    () => operationsApi.getNetworkRiders(networkId),
    [networkId]
  );
}

export function useIndividualNetworkPerformance(networkId: string, period?: string) {
  return useApi(
    () => operationsApi.getIndividualNetworkPerformance(networkId, period),
    [networkId, period]
  );
}

// Collection Center Management
export function useAllCollectionCenters() {
  return useApi(
    () => operationsApi.getAllCollectionCenters(),
    []
  );
}

export function useCollectionCenterDetails(centerId: string) {
  return useApi(
    () => operationsApi.getCollectionCenterDetails(centerId),
    [centerId]
  );
}

export function useCenterRelationships() {
  return useApi(
    () => operationsApi.getCenterRelationships(),
    []
  );
}

export function useSystemOverview() {
  return useApi(
    () => operationsApi.getSystemOverview(),
    []
  );
}

export function useFeatureUsageAnalytics() {
  return useApi(
    () => operationsApi.getFeatureUsageAnalytics(),
    []
  );
}

// Advanced Analytics
export function useMarketPenetration() {
  return useApi(
    () => operationsApi.getMarketPenetration(),
    []
  );
}

export function useGrowthAnalytics() {
  return useApi(
    () => operationsApi.getGrowthAnalytics(),
    []
  );
}

export function useRegionalAnalytics() {
  return useApi(
    () => operationsApi.getRegionalAnalytics(),
    []
  );
}

export function useEfficiencyMetrics() {
  return useApi(
    () => operationsApi.getEfficiencyMetrics(),
    []
  );
}

// System Configuration
export function useIntegrationStatus() {
  return useApi(
    () => operationsApi.getIntegrationStatus(),
    []
  );
}

export function useGlobalFeatureSettings() {
  return useApi(
    () => operationsApi.getGlobalFeatureSettings(),
    []
  );
}

// Notifications
export function useNotificationCenter() {
  return useApi(
    () => operationsApi.getNotificationCenter(),
    []
  );
}

// Mutation hooks for new features

export function useUpdateNetworkStatus() {
  const { mutate, loading, error } = useApiMutation<any, { networkId: string; status: string; notes?: string }>();

  const updateNetworkStatus = (networkId: string, status: string, notes?: string) => {
    return mutate(
      ({ networkId, status, notes }) => operationsApi.updateNetworkStatus(networkId, status, notes),
      { networkId, status, notes }
    );
  };

  return { updateNetworkStatus, loading, error };
}

export function useEnableCenterFeature() {
  const { mutate, loading, error } = useApiMutation<any, { centerId: string; feature: string; enabled: boolean; notes?: string }>();

  const enableCenterFeature = (centerId: string, feature: string, enabled: boolean, notes?: string) => {
    return mutate(
      ({ centerId, feature, enabled, notes }) => operationsApi.enableCenterFeature(centerId, feature, enabled, notes),
      { centerId, feature, enabled, notes }
    );
  };

  return { enableCenterFeature, loading, error };
}

export function useBulkUpdateCenterFeatures() {
  const { mutate, loading, error } = useApiMutation<any, { updates: Array<{ centerId: string; feature: string; enabled: boolean }> }>();

  const bulkUpdateFeatures = (updates: Array<{ centerId: string; feature: string; enabled: boolean }>) => {
    return mutate(
      ({ updates }) => operationsApi.bulkUpdateCenterFeatures(updates),
      { updates }
    );
  };

  return { bulkUpdateFeatures, loading, error };
}

export function useUpdateSystemFeatures() {
  const { mutate, loading, error } = useApiMutation<any, { features: Record<string, boolean> }>();

  const updateSystemFeatures = (features: Record<string, boolean>) => {
    return mutate(
      ({ features }) => operationsApi.updateSystemFeatures(features),
      { features }
    );
  };

  return { updateSystemFeatures, loading, error };
}

export function useMarkNotificationRead() {
  const { mutate, loading, error } = useApiMutation<any, { notificationId: string }>();

  const markNotificationRead = (notificationId: string) => {
    return mutate(
      ({ notificationId }) => operationsApi.markNotificationRead(notificationId),
      { notificationId }
    );
  };

  return { markNotificationRead, loading, error };
}

export function useMarkAllNotificationsRead() {
  const { mutate, loading, error } = useApiMutation<any, {}>();

  const markAllNotificationsRead = () => {
    return mutate(
      () => operationsApi.markAllNotificationsRead(),
      {}
    );
  };

  return { markAllNotificationsRead, loading, error };
}

// Orders Management - Operations Dashboard specific
export function useAllOrders(params?: {
  status?: string;
  urgency?: string;
  search?: string;
  hospital_id?: string;
  center_id?: string;
  rider_id?: string;
  limit?: number;
  offset?: number;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}) {
  return useApi(
    () => operationsApi.getAllOrders(params),
    [params?.status, params?.urgency, params?.search, params?.hospital_id, params?.center_id, params?.rider_id, params?.limit, params?.offset, params?.date_from, params?.date_to, params?.sort_by, params?.sort_order]
  );
}

export function useOrderDetails(orderId: string) {
  return useApi(
    () => operationsApi.getOrderDetails(orderId),
    [orderId]
  );
}

export function useActiveRidersWithLocation() {
  return useApi(
    () => operationsApi.getActiveRidersWithLocation(),
    []
  );
}

export function useOrderLocationTracking(orderId: string) {
  return useApi(
    () => operationsApi.getOrderLocationTracking(orderId),
    [orderId]
  );
}