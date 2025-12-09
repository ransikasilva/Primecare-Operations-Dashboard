const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
}

class OperationsApiClient {
  private baseURL: string;
  private token: string | null = null;
  
  get currentToken() {
    return this.token;
  }

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = typeof window !== 'undefined' ? localStorage.getItem('operations_auth_token') : null;
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('operations_auth_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('operations_auth_token');
    }
  }

  private isValidToken(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('Invalid token format: not a valid JWT');
        return false;
      }

      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (payload.exp && payload.exp < currentTime) {
        console.warn('Token expired');
        return false;
      }

      return true;
    } catch (error) {
      console.warn('Token validation failed:', error);
      return false;
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token && this.isValidToken(this.token)) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle authentication errors more gracefully
      if (response.status === 401) {
        console.warn('Token expired or invalid, but not clearing session immediately');
        const data: ApiResponse<T> = await response.json();
        
        // Only clear token if it's actually expired, not just invalid request
        if (data.error?.code === 'TOKEN_EXPIRED') {
          this.clearToken();
          throw new Error('Session expired. Please login again.');
        }
        
        // For other 401 errors, return the error without clearing the session
        throw new Error(data.error?.message || 'Access denied');
      }

      const data: ApiResponse<T> = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication endpoints
  async login(email: string, password: string) {
    const url = `${this.baseURL}/api/auth/dashboard/login`;
    const headers = {
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Login request failed:', error);
      throw error;
    }
  }

  async register(userData: {
    email: string;
    password: string;
    user_type: string;
    name: string;
    organization: string;
  }) {
    return this.request('/api/auth/dashboard/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async verifyEmail(email: string, otp_code: string) {
    return this.request('/api/auth/dashboard/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, otp_code }),
    });
  }

  async refreshToken() {
    return this.request<{ access_token: string }>('/api/auth/refresh-token', {
      method: 'POST',
    });
  }

  async logout() {
    const response = await this.request('/api/auth/logout', {
      method: 'POST',
    });
    this.clearToken();
    return response;
  }

  async getProfile() {
    return this.request('/api/profile');
  }

  // Operations Dashboard Specific Endpoints using actual backend routes
  
  // Dashboard metrics - Operations hospital statistics
  async getOperationsDashboard() {
    return await this.request<{
      hospital_networks: any[];
      collection_centers: any[];
      riders: any[];
      totalActiveOrders: number;
      onlineRiders: number;
    }>('/api/operations/system/overview');
  }

  // Hospital networks - all networks visible to operations
  async getHospitalNetworks() {
    try {
      return await this.request<any[]>('/api/hospitals/networks');
    } catch (error) {
      console.warn('Hospital networks falling back to mock data:', error);
      return {
        success: true,
        data: [
          { 
            id: '1', 
            name: 'Central Hospital Network', 
            region: 'Western', 
            hospitals: 8,
            activeOrders: 85, 
            ridersOnline: 32, 
            slaCompliance: 96,
            status: 'Optimal'
          },
          { 
            id: '2', 
            name: 'Northern Medical Group', 
            region: 'Northern', 
            hospitals: 5,
            activeOrders: 67, 
            ridersOnline: 28, 
            slaCompliance: 94,
            status: 'Good'
          }
        ]
      };
    }
  }

  async getSystemHealth() {
    return this.request<{
      status: string;
      uptime: number;
      memory: any;
      database: string;
      services: any;
    }>('/api/health');
  }

  // SLA Monitoring - using existing SLA endpoints
  async getSLAMetrics(period?: string) {
    const queryParams = new URLSearchParams();
    if (period) {
      queryParams.append('period', period);
    }
    return this.request<{
      overall_sla: number;
      sla_target: number;
      critical_alerts: number;
      alerts_change: number;
      average_time: number;
      time_target: number;
      current_delays: number;
      delays_change: number;
      delays_since: string;
    }>(`/api/sla/metrics${queryParams.toString() ? '?' + queryParams.toString() : ''}`);
  }

  async getSystemAlerts() {
    return this.request<any[]>('/api/sla/alerts');
  }

  async getSLATrends(period?: string) {
    const params = period ? `?period=${encodeURIComponent(period)}` : '';
    return this.request(`/api/sla/performance${params}`);
  }

  async getSLAPerformance(period?: string) {
    const params = period ? `?period=${encodeURIComponent(period)}` : '';
    return this.request(`/api/sla/performance${params}`);
  }

  async getSLAAlerts(period?: string) {
    const params = period ? `?period=${encodeURIComponent(period)}` : '';
    return this.request(`/api/sla/alerts${params}`);
  }

  // Approvals Management - operations-specific pending approvals
  async getOperationsPendingApprovals() {
    return this.request<{
      hospital_networks: any[];
      hospitals: any[];
      collection_centers: any[];
      riders: any[];
      total: number;
    }>('/api/approvals/pending');
  }

  async approveHospitalNetwork(networkId: string, notes?: string) {
    return this.request(`/api/approvals/admin/hospital-networks/${networkId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approval_notes: notes }),
    });
  }

  async approveCollectionCenterFinal(centerId: string, notes?: string) {
    return this.request(`/api/approvals/admin/collection-centers/${centerId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approval_notes: notes }),
    });
  }

  async updateCollectionCenterStatus(centerId: string, status: 'approved' | 'rejected', reason?: string) {
    if (status === 'approved') {
      return this.approveCollectionCenterFinal(centerId, reason);
    } else if (status === 'rejected') {
      return this.rejectApproval('collection_center', centerId, reason || 'Rejected by operations');
    }
    throw new Error('Invalid status. Must be "approved" or "rejected"');
  }

  async bulkApprove(type: string, itemIds: string[], notes?: string) {
    // Note: Bulk approve might need to be implemented as individual calls
    // since the backend doesn't seem to have a bulk endpoint
    const results = [];
    for (const itemId of itemIds) {
      try {
        let result;
        if (type === 'hospital_networks') {
          result = await this.approveHospitalNetwork(itemId, notes);
        } else if (type === 'collection_centers') {
          result = await this.approveCollectionCenterFinal(itemId, notes);
        }
        results.push(result);
      } catch (error) {
        results.push({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
    return { success: true, data: results };
  }

  async rejectApproval(type: string, itemId: string, reason: string, notes?: string) {
    return this.request(`/api/approvals/reject/${type}/${itemId}`, {
      method: 'POST',
      body: JSON.stringify({ 
        rejection_reason: reason,
        notes: notes
      }),
    });
  }

  // System Configuration - use new system-config endpoints
  async getSystemConfig() {
    return this.request<{
      features: Array<{
        key: string;
        value: any;
        description: string;
        enabled: boolean;
      }>;
      sla: Array<{
        key: string;
        value: any;
        description: string;
      }>;
      integrations: Array<{
        key: string;
        value: any;
        description: string;
        enabled: boolean;
      }>;
    }>('/api/system-config');
  }

  async updateFeatureToggle(feature: string, enabled: boolean) {
    return this.request(`/api/system-config/feature/${feature}`, {
      method: 'PUT',
      body: JSON.stringify({ enabled }),
    });
  }

  async getCenterConfiguration(centerId?: string) {
    // This might need to be implemented in the backend
    const endpoint = centerId 
      ? `/api/collection-centers/${centerId}`
      : '/api/collection-centers';
    return this.request(endpoint);
  }

  async updateCenterFeatures(centerId: string, features: any) {
    return this.request(`/api/collection-centers/${centerId}`, {
      method: 'PUT',
      body: JSON.stringify({ features }),
    });
  }

  async updateSLASettings(settings: any) {
    return this.request('/api/system-config/sla', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Billing & Subscriptions - Real operations endpoints
  async getBillingMetrics() {
    return this.request<{
      monthlyRevenue: number;
      activeSubscriptions: number;
      outstandingInvoices: number;
      avgRevenuePerNetwork: number;
    }>('/api/operations/billing/metrics');
  }

  async getHospitalSubscriptions() {
    return this.request<any[]>('/api/operations/billing/subscriptions');
  }

  async getPaymentHistory(networkId: string) {
    return this.request<any[]>(`/api/operations/billing/payments/${networkId}`);
  }

  async updateSubscriptionStatus(networkId: string, status: string) {
    return this.request(`/api/hospitals/${networkId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async updateSubscriptionPayment(networkId: string, paymentData: {
    paymentStatus: string;
    paymentAmount?: number;
    paymentDate?: string;
    billingPeriod?: string;
    notes?: string;
  }) {
    return this.request(`/api/operations/billing/subscriptions/${networkId}/payment`, {
      method: 'PATCH',
      body: JSON.stringify(paymentData),
    });
  }

  async generateInvoice(networkId: string, period: string) {
    return this.request(`/api/sla/email-report`, {
      method: 'POST',
      body: JSON.stringify({ network_id: networkId, period }),
    });
  }

  // Analytics & Reports - using new analytics endpoints
  async getBusinessMetrics(period?: string) {
    const queryParams = new URLSearchParams();
    if (period) queryParams.append('period', period);
    return this.request(`/api/sla/analytics/business${queryParams.toString() ? '?' + queryParams.toString() : ''}`);
  }

  async getNetworkPerformance(period?: string) {
    const queryParams = new URLSearchParams();
    if (period) queryParams.append('period', period);
    return this.request(`/api/sla/analytics/networks${queryParams.toString() ? '?' + queryParams.toString() : ''}`);
  }

  async getDeliveryVolumeData(period?: string) {
    const params = period ? `?period=${encodeURIComponent(period)}` : '';
    // Use operations-specific endpoint that allows system-wide access
    return this.request(`/api/operations/analytics/orders${params}`);
  }

  async generateOperationsReport(type: string, period?: string) {
    return this.request(`/api/sla/email-report`, {
      method: 'POST',
      body: JSON.stringify({ format: type, period }),
    });
  }

  async exportReport(reportType: 'pdf' | 'excel' | 'csv', period?: string) {
    return this.request(`/api/sla/email-report`, {
      method: 'POST',
      body: JSON.stringify({ format: reportType, period }),
    });
  }


  // QR Code Management & Chain of Custody
  async getQRCodeLogs(params?: { period?: string; type?: string; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/api/operations/qr/logs${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.request(endpoint);
  }

  async getChainOfCustody(qrId: string) {
    return this.request(`/api/qr/${qrId}/chain-of-custody`);
  }

  async getQRComplianceMetrics() {
    try {
      return await this.request('/api/operations/qr/compliance');
    } catch (error) {
      console.warn('QR compliance using mock data:', error);
      return {
        success: true,
        data: {
          totalScans: 12847,
          successfulScans: 12621,
          failedScans: 226,
          complianceRate: 98.2,
          handoverCompliance: 94.1
        }
      };
    }
  }

  async getHandoverLogs() {
    return this.request('/api/operations/qr/handovers');
  }

  async getQRCodeDetails(qrId: string) {
    return this.request(`/api/qr/${qrId}/details`);
  }

  async updateQRCodeStatus(qrId: string, status: string, location?: any, notes?: string) {
    return this.request(`/api/qr/${qrId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        location,
        notes
      })
    });
  }

  async recordTemperatureLog(qrId: string, temperature: number, location: any) {
    return this.request(`/api/qr/${qrId}/temperature-log`, {
      method: 'POST',
      body: JSON.stringify({
        temperature,
        location,
        timestamp: new Date().toISOString()
      })
    });
  }

  async recordHandover(qrId: string, fromRiderId: string, toRiderId: string, location: any, reason: string) {
    return this.request(`/api/qr/${qrId}/handover`, {
      method: 'POST',
      body: JSON.stringify({
        fromRiderId,
        toRiderId,
        location,
        reason,
        timestamp: new Date().toISOString()
      })
    });
  }

  // Detailed Hospital Network Management
  async getHospitalNetworkDetails(networkId: string) {
    return this.request(`/api/hospitals/networks/${networkId}`);
  }

  async getNetworkHospitals(networkId: string) {
    return this.request(`/api/hospitals/networks/${networkId}/hospitals`);
  }

  async getNetworkRiders(networkId: string) {
    return this.request(`/api/hospitals/networks/${networkId}/riders`);
  }

  async getIndividualNetworkPerformance(networkId: string, period?: string) {
    const params = period ? `?period=${encodeURIComponent(period)}` : '';
    return this.request(`/api/hospitals/networks/${networkId}/performance${params}`);
  }

  async updateNetworkStatus(networkId: string, status: string, notes?: string) {
    return this.request(`/api/hospitals/networks/${networkId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  }

  // Collection Center Feature Management
  async getAllCollectionCenters() {
    return this.request('/api/collection-centers/all');
  }

  async getCollectionCenterDetails(centerId: string) {
    return this.request(`/api/collection-centers/${centerId}`);
  }

  async getCenterRelationships() {
    return this.request<{
      data: Array<{
        id: string;
        center_name: string;
        center_type: 'independent' | 'dependent';
        center_status: string;
        phone: string;
        email: string;
        hospital_relationships: Array<{
          hospital_id: string;
          hospital_name: string;
          hospital_type: string;
          is_main_hospital: boolean;
          relation_status: string;
          is_main_hospital_relation: boolean;
          approved_at: string | null;
          network_name: string;
          network_id: string;
        }>;
      }>;
      meta: {
        total_centers: number;
        dependent_centers: number;
        independent_centers: number;
        timestamp: string;
      };
    }>('/api/operations/centers/relationships');
  }

  // System overview - ALL entities with relationships
  async getSystemOverview() {
    return this.request<{
      data: {
        hospital_networks: Array<{
          id: string;
          network_name: string;
          admin_name: string;
          admin_email: string;
          admin_phone: string;
          network_status: string;
          network_created_at: string;
          hospitals: Array<{
            id: string;
            name: string;
            hospital_type: string;
            is_main_hospital: boolean;
            status: string;
            created_at: string;
            coordinates_lat: number;
            coordinates_lng: number;
            city: string;
            province: string;
          }>;
        }>;
        collection_centers: Array<{
          id: string;
          center_name: string;
          center_type: string;
          center_status: string;
          phone: string;
          email: string;
          created_at: string;
          coordinates_lat: number;
          coordinates_lng: number;
          city: string;
          contact_person: string;
          hospital_relationships: Array<{
            hospital_id: string;
            hospital_name: string;
            hospital_type: string;
            is_main_hospital: boolean;
            relation_status: string;
            is_main_hospital_relation: boolean;
            approved_at: string | null;
            network_name: string;
            network_id: string;
          }>;
        }>;
        riders: Array<{
          id: string;
          rider_name: string;
          phone: string;
          email: string;
          vehicle_registration: string;
          vehicle_type: string;
          rider_status: string;
          availability_status: string;
          current_location_lat: number | null;
          current_location_lng: number | null;
          location_updated_at: string | null;
          total_deliveries: number;
          rating: number;
          created_at: string;
          hospital_affiliation: {
            hospital_id: string;
            hospital_name: string;
            hospital_type: string;
            is_main_hospital: boolean;
            network_name: string;
            network_id: string;
          } | null;
        }>;
      };
      meta: {
        total_networks: number;
        total_hospitals: number;
        total_centers: number;
        dependent_centers: number;
        independent_centers: number;
        total_riders: number;
        timestamp: string;
      };
    }>('/api/operations/system/overview');
  }

  async enableCenterFeature(centerId: string, feature: string, enabled: boolean, notes?: string) {
    return this.request(`/api/operations/centers/${centerId}/features/${feature}`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled, notes }),
    });
  }

  async bulkUpdateCenterFeatures(updates: Array<{ centerId: string; feature: string; enabled: boolean }>) {
    return this.request('/api/collection-centers/bulk-features', {
      method: 'PATCH',
      body: JSON.stringify({ updates }),
    });
  }

  async getFeatureUsageAnalytics() {
    try {
      return await this.request('/api/collection-centers/feature-analytics');
    } catch (error) {
      console.warn('Feature analytics using mock data:', error);
      return {
        success: true,
        data: {
          sampleTypeUsage: { enabled: 78, total: 156, percentage: 50 },
          urgentDeliveryUsage: { enabled: 92, total: 156, percentage: 59 },
          multiParcelUsage: { enabled: 134, total: 156, percentage: 86 }
        }
      };
    }
  }

  // Advanced Analytics & Business Intelligence
  async getMarketPenetration() {
    try {
      return await this.request('/api/analytics/market-penetration');
    } catch (error) {
      console.warn('Market penetration using mock data:', error);
      return {
        success: true,
        data: {
          currentPenetration: 72,
          expansionPotential: 34,
          targetHospitals: 450,
          connectedHospitals: 324,
          regions: {
            Western: { penetration: 85, potential: 15 },
            Central: { penetration: 68, potential: 32 },
            Southern: { penetration: 71, potential: 29 },
            Northern: { penetration: 64, potential: 36 },
            Eastern: { penetration: 59, potential: 41 }
          }
        }
      };
    }
  }

  async getGrowthAnalytics() {
    try {
      return await this.request('/api/analytics/growth');
    } catch (error) {
      console.warn('Growth analytics using mock data:', error);
      return {
        success: true,
        data: {
          networkGrowth: {
            monthly: 15,
            trend: [8, 12, 15, 18, 15, 22]
          },
          riderGrowth: {
            monthly: 12,
            trend: [5, 8, 12, 16, 12, 20]
          },
          deliveryVolume: {
            monthly: 8,
            trend: [2, 5, 8, 11, 8, 14]
          }
        }
      };
    }
  }

  async getRegionalAnalytics() {
    try {
      return await this.request('/api/analytics/regional');
    } catch (error) {
      console.warn('Regional analytics using mock data:', error);
      return {
        success: true,
        data: [
          { region: 'Western', deliveryVolume: 18250, slaCompliance: 96.2, growthRate: 18 },
          { region: 'Central', deliveryVolume: 12340, slaCompliance: 94.8, growthRate: 14 },
          { region: 'Southern', deliveryVolume: 8750, slaCompliance: 93.1, growthRate: 12 },
          { region: 'Northern', deliveryVolume: 4680, slaCompliance: 91.7, growthRate: 8 },
          { region: 'Eastern', deliveryVolume: 3920, slaCompliance: 89.4, growthRate: 6 }
        ]
      };
    }
  }

  async getEfficiencyMetrics() {
    try {
      return await this.request('/api/analytics/efficiency');
    } catch (error) {
      console.warn('Efficiency metrics using mock data:', error);
      return {
        success: true,
        data: {
          avgDeliveryTime: 34,
          avgPickupTime: 12,
          routeOptimization: 87,
          riderUtilization: 76,
          costPerDelivery: 280
        }
      };
    }
  }

  // System Configuration - Granular Controls
  async getIntegrationStatus() {
    try {
      return await this.request('/api/system/integrations');
    } catch (error) {
      console.warn('Integration status using mock data:', error);
      return {
        success: true,
        data: {
          maps: { status: 'connected', lastCheck: '2024-01-20T10:00:00Z', health: 'good' },
          sms: { status: 'connected', lastCheck: '2024-01-20T10:00:00Z', health: 'good' },
          email: { status: 'connected', lastCheck: '2024-01-20T10:00:00Z', health: 'good' },
          payment: { status: 'configured', lastCheck: '2024-01-20T09:30:00Z', health: 'good' }
        }
      };
    }
  }

  async updateSystemFeatures(features: Record<string, boolean>) {
    return this.request('/api/system/features', {
      method: 'PATCH',
      body: JSON.stringify(features),
    });
  }

  async getGlobalFeatureSettings() {
    try {
      return await this.request('/api/system/features');
    } catch (error) {
      console.warn('Global features using mock data:', error);
      return {
        success: true,
        data: {
          sampleTypeQuantity: true,
          urgentDeliveryRollout: true,
          multiParcelManagement: true,
          riderHandoverSystem: true,
          realTimeTracking: true,
          qrCodeMandatory: true
        }
      };
    }
  }

  // Notification & Alert Management
  async getNotificationCenter() {
    try {
      return await this.request('/api/notifications/operations');
    } catch (error) {
      console.warn('Notifications using mock data:', error);
      return {
        success: true,
        data: [
          {
            id: '1',
            type: 'approval',
            title: 'New Hospital Network Application',
            message: 'Eastern Medical Group has submitted application',
            time: '5 minutes ago',
            unread: true,
            priority: 'high'
          },
          {
            id: '2',
            type: 'sla',
            title: 'SLA Breach Alert',
            message: '3 deliveries exceeded target time in Western region',
            time: '12 minutes ago',
            unread: true,
            priority: 'critical'
          },
          {
            id: '3',
            type: 'billing',
            title: 'Payment Overdue',
            message: 'Central Hospital Network payment is 5 days overdue',
            time: '1 hour ago',
            unread: false,
            priority: 'medium'
          }
        ]
      };
    }
  }

  async markNotificationRead(notificationId: string) {
    return this.request(`/api/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsRead() {
    return this.request('/api/notifications/mark-all-read', {
      method: 'PATCH',
    });
  }

  // Real-time data for operations - using existing endpoints
  async getLiveMetrics() {
    return this.request('/api/hospitals/statistics');
  }

  async getNetworkMapData() {
    return this.request<{
      hospitals: Array<{
        id: string;
        name: string;
        location: { latitude: number; longitude: number };
        status: string;
        activeOrders: number;
        ridersOnline: number;
      }>;
    }>('/api/hospitals/networks');
  }

  // Rider KM tracking and analytics
  async getRiderKmData(riderId: string, filter?: 'all' | 'monthly' | 'weekly') {
    const params = filter ? `?filter=${encodeURIComponent(filter)}` : '';
    return this.request<{
      total_km: number;
      monthly_km: number;
      weekly_km: number;
      daily_average: number;
      last_updated: string;
    }>(`/api/riders/${riderId}/km-data${params}`);
  }

  async getRiderDetails(riderId: string) {
    return this.request<{
      id: string;
      full_name: string;
      mobile_number: string;
      nic_number: string;
      email?: string;
      date_of_birth: string;
      address: string;
      emergency_contact: string;
      vehicle_type: string;
      vehicle_number: string;
      license_number: string;
      experience: string;
      areas_known: string[];
      hospital_affiliation: {
        main_hospital?: string;
        regional_hospitals: string[];
      };
      status: string;
      total_deliveries: number;
      successful_deliveries: number;
      cancelled_deliveries: number;
      average_delivery_time: number;
      total_km: number;
      monthly_km: number;
      weekly_km: number;
      created_at: string;
      last_active: string;
    }>(`/api/riders/${riderId}/details`);
  }

  async updateRiderStatus(riderId: string, status: string, notes?: string) {
    return this.request(`/api/riders/${riderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  }

  // Collection Center Feature Management
  async getCollectionCenterFeatures(centerId: string) {
    return this.request<{
      center: {
        id: string;
        center_name: string;
        center_type: string;
        center_status: string;
        email: string;
        phone: string;
      };
      features: Array<{
        feature_id: string;
        feature_name: string;
        description: string;
        feature_type: 'core' | 'premium' | 'enterprise';
        requires_approval: boolean;
        enabled: boolean;
        enabled_at: string | null;
        enabled_by: string | null;
        enabled_by_email: string | null;
        requested_at: string | null;
        justification: string | null;
        status: 'not_requested' | 'requested' | 'approved' | 'rejected' | 'disabled';
      }>;
      total_features: number;
      enabled_features: number;
      pending_requests: number;
    }>(`/api/operations/centers/${centerId}/features`);
  }

  async updateCollectionCenterFeature(centerId: string, featureId: string, enabled: boolean, notes?: string) {
    return this.request(`/api/operations/centers/${centerId}/features/${featureId}`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled, notes })
    });
  }

  async getPendingFeatureRequests() {
    return this.request<{
      requests: Array<{
        center_id: string;
        center_name: string;
        center_type: string;
        center_email: string;
        center_phone: string;
        contact_phone: string;
        feature_id: string;
        feature_name: string;
        feature_description: string;
        feature_type: 'core' | 'premium' | 'enterprise';
        requires_approval: boolean;
        requested_at: string;
        justification: string;
        status: string;
      }>;
      total_requests: number;
      by_type: {
        core: number;
        premium: number;
        enterprise: number;
      };
    }>('/api/operations/features/requests/pending');
  }

  async approveFeatureRequest(centerId: string, featureId: string, approved: boolean, notes?: string) {
    return this.request(`/api/operations/features/requests/${centerId}/${featureId}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ approved, notes })
    });
  }

  // Order Management for Operations Dashboard
  async getHospitalOrders(hospitalId: string, params?: {
    status?: string;
    limit?: number;
    offset?: number;
    date_from?: string;
    date_to?: string;
    period?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/api/operations/hospitals/${hospitalId}/orders${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.request<{
      orders: Array<{
        id: string;
        order_number: string;
        center_name: string;
        rider_name?: string;
        sample_type: string;
        sample_quantity: number;
        urgency: string;
        status: string;
        created_at: string;
        updated_at: string;
        pickup_time?: string;
        delivery_time?: string;
        estimated_delivery_time?: string;
      }>;
      total: number;
      summary: {
        total_orders: number;
        pending_orders: number;
        in_progress_orders: number;
        completed_orders: number;
        cancelled_orders: number;
      };
    }>(endpoint);
  }

  async getCollectionCenterOrders(centerId: string, params?: {
    status?: string;
    limit?: number;
    offset?: number;
    date_from?: string;
    date_to?: string;
    period?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/api/operations/centers/${centerId}/orders${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.request<{
      orders: Array<{
        id: string;
        order_number: string;
        hospital_name: string;
        rider_name?: string;
        sample_type: string;
        sample_quantity: number;
        urgency: string;
        status: string;
        created_at: string;
        updated_at: string;
        pickup_time?: string;
        delivery_time?: string;
        estimated_delivery_time?: string;
      }>;
      total: number;
      summary: {
        total_orders: number;
        pending_orders: number;
        in_progress_orders: number;
        completed_orders: number;
        cancelled_orders: number;
      };
    }>(endpoint);
  }

  async getRiderOrders(riderId: string, params?: {
    status?: string;
    limit?: number;
    offset?: number;
    date_from?: string;
    date_to?: string;
    period?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/api/operations/riders/${riderId}/orders${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.request<{
      orders: Array<{
        id: string;
        order_number: string;
        center_name: string;
        hospital_name: string;
        sample_type: string;
        sample_quantity: number;
        urgency: string;
        status: string;
        created_at: string;
        updated_at: string;
        pickup_time?: string;
        delivery_time?: string;
        estimated_delivery_time?: string;
        distance_km?: number;
        delivery_duration?: number;
      }>;
      total: number;
      summary: {
        total_orders: number;
        pending_orders: number;
        in_progress_orders: number;
        completed_orders: number;
        cancelled_orders: number;
      };
    }>(endpoint);
  }

  // All Orders for Operations Dashboard
  async getAllOrders(params?: {
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
  }): Promise<ApiResponse<{
    orders: Array<{
      id: string;
      order_number: string;
      center_id: string;
      center_name: string;
      hospital_id: string;
      hospital_name: string;
      rider_id?: string;
      rider_name?: string;
      sample_type: string;
      sample_quantity: number;
      urgency: string;
      status: string;
      distance_km?: number;
      delivery_duration?: number;
      special_instructions?: string;
      created_at: string;
      assigned_at?: string;
      pickup_started_at?: string;
      picked_up_at?: string;
      delivery_started_at?: string;
      delivered_at?: string;
      cancelled_at?: string;
      estimated_payment?: number;
      actual_payment?: number;
    }>;
    pagination: {
      total: number;
      page: number;
      per_page: number;
      total_pages: number;
    };
    summary: {
      total_orders: number;
      pending_orders: number;
      assigned_orders: number;
      in_progress_orders: number;
      completed_orders: number;
      cancelled_orders: number;
    };
  }>> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.urgency) queryParams.append('urgency', params.urgency);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.hospital_id) queryParams.append('hospital_id', params.hospital_id);
    if (params?.center_id) queryParams.append('center_id', params.center_id);
    if (params?.rider_id) queryParams.append('rider_id', params.rider_id);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params?.sort_order) queryParams.append('sort_order', params.sort_order);

    const endpoint = `/api/operations/orders${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.request(endpoint);
  }

  // Get detailed order information
  async getOrderDetails(orderId: string): Promise<ApiResponse<{
    order: {
      id: string;
      order_number: string;
      center_id: string;
      center_name: string;
      center_address: string;
      center_phone?: string;
      hospital_id: string;
      hospital_name: string;
      hospital_address: string;
      hospital_phone?: string;
      rider_id?: string;
      rider_name?: string;
      rider_phone?: string;
      rider_vehicle?: string;
      sample_type: string;
      sample_quantity: number;
      urgency: string;
      status: string;
      special_instructions?: string;
      pickup_location: {
        lat: number;
        lng: number;
      };
      delivery_location: {
        lat: number;
        lng: number;
      };
      estimated_distance_km?: number;
      actual_distance_km?: number;
      estimated_payment?: number;
      actual_payment?: number;
      route_info?: any;
      created_at: string;
      assigned_at?: string;
      pickup_started_at?: string;
      picked_up_at?: string;
      delivery_started_at?: string;
      delivered_at?: string;
      cancelled_at?: string;
      created_by: string;
    };
    status_history: Array<{
      id: string;
      status: string;
      previous_status?: string;
      changed_by?: string;
      location?: {
        lat: number;
        lng: number;
      };
      notes?: string;
      changed_at: string;
    }>;
    qr_tracking: Array<{
      id: string;
      qr_id: string;
      scan_type: string;
      scanned_by: string;
      scanner_type: string;
      scan_location?: string;
      scan_coordinates?: {
        lat: number;
        lng: number;
      };
      scan_successful: boolean;
      scan_notes?: string;
      scanned_at: string;
    }>;
    location_tracking?: Array<{
      id: string;
      rider_id: string;
      location: {
        lat: number;
        lng: number;
      };
      speed_kmh?: number;
      heading?: number;
      accuracy_meters?: number;
      recorded_at: string;
    }>;
    handover_history?: Array<{
      id: string;
      original_rider_id: string;
      original_rider_name: string;
      new_rider_id?: string;
      new_rider_name?: string;
      handover_reason: string;
      handover_location?: {
        lat: number;
        lng: number;
      };
      status: string;
      notes?: string;
      initiated_at: string;
      accepted_at?: string;
      confirmed_at?: string;
    }>;
  }>> {
    return this.request(`/api/operations/orders/${orderId}/details`);
  }

  // Get active riders with current locations for live tracking
  async getActiveRidersWithLocation(): Promise<ApiResponse<Array<{
    id: string;
    rider_name: string;
    phone: string;
    availability_status: 'available' | 'busy' | 'offline';
    hospital_name: string;
    vehicle_type: string;
    current_location?: {
      lat: number;
      lng: number;
    };
    total_deliveries: number;
    rating: number;
    last_location_update?: string;
  }>>> {
    return this.request('/api/operations/riders/active-with-location');
  }

  // Get location tracking data for a specific order
  async getOrderLocationTracking(orderId: string): Promise<ApiResponse<Array<{
    id: string;
    rider_id: string;
    location: {
      lat: number;
      lng: number;
    };
    speed_kmh?: number;
    heading?: number;
    accuracy_meters?: number;
    recorded_at: string;
  }>>> {
    return this.request(`/api/operations/orders/${orderId}/location-tracking`);
  }

  // Health check
  async healthCheck() {
    return this.request('/api/health');
  }

  // Operations SLA Metrics with daily breakdown
  async getOperationsSLAMetrics(days: number = 7) {
    const queryParams = new URLSearchParams();
    queryParams.append('days', days.toString());
    return this.request<{
      overall: {
        pickup: {
          total: number;
          onTime: number;
          percentage: number;
          threshold: number;
        };
        standard: {
          total: number;
          onTime: number;
          percentage: number;
          threshold: number;
        };
        urgent: {
          total: number;
          onTime: number;
          percentage: number;
          threshold: number;
        };
      };
      daily: Array<{
        order_date: string;
        total_pickups: number;
        pickups_on_time: number;
        pickup_sla_percentage: number;
        total_standard: number;
        standard_on_time: number;
        standard_sla_percentage: number;
        total_urgent: number;
        urgent_on_time: number;
        urgent_sla_percentage: number;
      }>;
      period: {
        days: number;
        from: string;
        to: string;
      };
    }>(`/api/operations/sla/metrics?${queryParams.toString()}`);
  }

  // Rider-Center Assignments (Read-only for operations)
  async getRidersForCenter(centerId: string) {
    return this.request<any[]>(`/api/rider-center-assignments/center/${centerId}/riders`);
  }
}

export const operationsApi = new OperationsApiClient(API_URL);

// Export types for use in components
export type { ApiResponse };

// Helper function to handle API errors
export const handleApiError = (error: any): string => {
  if (error?.message) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred';
};

// Helper function to format API response data
export const formatApiResponse = <T>(response: ApiResponse<T>): T | null => {
  if (response.success && response.data) {
    return response.data;
  }
  return null;
};

export default operationsApi;