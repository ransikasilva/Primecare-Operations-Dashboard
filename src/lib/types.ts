// Operations Dashboard Types
export interface DashboardMetrics {
  totalActiveOrders: number;
  onlineRiders: number;
  hospitalNetworks: number;
  systemHealth: number;
}

export interface HospitalNetwork {
  id: string;
  name: string;
  region: string;
  activeOrders: number;
  ridersOnline: number;
  status: 'Active' | 'Warning' | 'Critical';
  location: {
    latitude: number;
    longitude: number;
  };
}

export interface SLAMetrics {
  nationalCompliance: number;
  systemAlerts: number;
  avgDeliveryTime: number;
  slaBreachesToday: number;
}

export interface NetworkSLA {
  networkName: string;
  region: string;
  slaPercentage: number;
  avgTime: number;
  breaches: number;
  status: 'Good' | 'Watch' | 'Risk' | 'Excellent';
}

export interface ApprovalItem {
  id: string;
  type: 'hospital' | 'collection_center' | 'regional_hospital';
  applicantName: string;
  appliedDate: string;
  requestingNetwork: string;
  priority: 'High' | 'Normal' | 'Low';
  status: 'Pending' | 'Under Review' | 'Approved' | 'Rejected';
}

export interface SystemFeatures {
  sampleTypeQuantity: boolean;
  urgentDeliveryRollout: boolean;
  multiParcelManagement: boolean;
  riderHandoverSystem: boolean;
}

export interface CenterConfig {
  centerId: string;
  centerName: string;
  network: string;
  features: {
    sampleType: boolean;
    multiParcel: boolean;
    urgent: boolean;
  };
  status: 'Active' | 'Pending' | 'Restricted';
}

export interface BillingMetrics {
  monthlyRevenue: number;
  activeSubscriptions: number;
  outstandingInvoices: number;
  avgRevenuePerNetwork: number;
}

export interface HospitalSubscription {
  networkName: string;
  subscriptionType: 'Standard' | 'Premium' | 'Enterprise';
  monthlyFee: number;
  paymentStatus: 'Paid' | 'Pending' | 'Overdue';
  nextBilling: string;
  features: string[];
}

export interface BusinessMetrics {
  totalDeliveries: number;
  systemSLA: number;
  activeNetworks: number;
  totalRiders: number;
  collectionCenters: number;
}

export interface RegionalPerformance {
  region: 'Western' | 'Central' | 'Southern' | 'Northern' | 'Eastern';
  deliveryVolume: number;
  slaCompliance: number;
  growthRate: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  user_type: 'operations';
  status: 'active';
}