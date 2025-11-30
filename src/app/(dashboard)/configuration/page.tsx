"use client";

import { useSystemConfig } from '@/hooks/useApi';
import { useUpdateFeatureToggle, useUpdateSLASettings } from '@/hooks/useApi';
import { useState, useEffect } from 'react';
import {
  ToggleLeft,
  ToggleRight,
  Building2,
  Shield,
  Zap,
  Users,
  CheckCircle2,
  Globe
} from 'lucide-react';

export default function ConfigurationPage() {
  const { data: configData } = useSystemConfig();
  const { updateFeature } = useUpdateFeatureToggle();
  const { updateSLASettings } = useUpdateSLASettings();

  // Initialize state with default values
  const [features, setFeatures] = useState({
    sampleTypeQuantity: true,
    urgentDeliveryRollout: true,
    multiParcelManagement: true,
    riderHandoverSystem: true
  });

  const [slaSettings, setSlaSettings] = useState({
    pickupTime: 15,
    standardDeliveryTime: 90,
    urgentDeliveryTime: 45
  });

  const [integrations, setIntegrations] = useState<any[]>([]);

  // Process data when configData changes
  useEffect(() => {
    if (configData?.data) {
      const realConfigData = configData.data;

      // Process features data
      if (realConfigData.features) {
        const featuresObj: any = {};
        realConfigData.features.forEach((feature: any) => {
          if (feature?.key) {
            const key = feature.key.replace(/[_]/g, '');
            featuresObj[key] = feature.enabled;
          }
        });

        setFeatures({
          sampleTypeQuantity: featuresObj.sampletypequantitysharing ?? true,
          urgentDeliveryRollout: featuresObj.urgentdeliveryrollout ?? true,
          multiParcelManagement: featuresObj.multiparcelmanagement ?? true,
          riderHandoverSystem: featuresObj.riderhandoversystem ?? true
        });
      }

      // Process SLA data
      if (realConfigData.sla) {
        const slaObj: any = {};
        realConfigData.sla.forEach((sla: any) => {
          if (sla?.key === 'sla_pickup_time_minutes') {
            slaObj.pickupTime = parseInt(sla.value) || 15;
          } else if (sla?.key === 'sla_standard_delivery_minutes') {
            slaObj.standardDeliveryTime = parseInt(sla.value) || 90;
          } else if (sla?.key === 'sla_urgent_delivery_minutes') {
            slaObj.urgentDeliveryTime = parseInt(sla.value) || 45;
          }
        });

        setSlaSettings({
          pickupTime: slaObj.pickupTime ?? 15,
          standardDeliveryTime: slaObj.standardDeliveryTime ?? 90,
          urgentDeliveryTime: slaObj.urgentDeliveryTime ?? 45
        });
      }

      // Process integrations data
      if (realConfigData.integrations) {
        const processedIntegrations = realConfigData.integrations.map((integration: any) => {
          const name = integration.value?.provider || integration.key?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
          let icon = Globe;
          if (integration.key?.includes('sms')) icon = Zap;
          else if (integration.key?.includes('email')) icon = Shield;
          else if (integration.key?.includes('payment')) icon = CheckCircle2;

          return {
            name,
            status: integration.value?.status || 'Unknown',
            icon,
            color: getStatusColor(integration.value?.status || 'Unknown')
          };
        });

        setIntegrations(processedIntegrations);
      }
    }
  }, [configData]);

  const handleFeatureToggle = async (feature: string, enabled: boolean) => {
    try {
      // Map frontend feature names to backend keys
      const featureKeyMap: any = {
        'sampleTypeQuantity': 'sample_type_quantity_sharing',
        'urgentDeliveryRollout': 'urgent_delivery_rollout',
        'multiParcelManagement': 'multi_parcel_management',
        'riderHandoverSystem': 'rider_handover_system'
      };

      const backendKey = featureKeyMap[feature] || feature;
      await updateFeature(backendKey, enabled);
      setFeatures((prev: any) => ({ ...prev, [feature]: enabled }));
    } catch (error) {
      console.error('Feature toggle failed:', error);
    }
  };

  const handleSLAUpdate = async (settings: typeof slaSettings) => {
    try {
      await updateSLASettings(settings);
      setSlaSettings(settings);
    } catch (error) {
      console.error('SLA settings update failed:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Connected':
      case 'Active': return '#10b981';
      case 'Configured': return '#4ECDC4';
      case 'Pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <div className="space-y-8">
      {/* Global Feature Controls */}
      <div 
        className="rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
          border: '1px solid rgba(203, 213, 225, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)'
        }}
      >
        <div className="p-6 border-b border-gray-100/60">
          <h3 className="text-xl font-bold text-gray-800">Global Feature Controls</h3>
          <p className="text-sm text-gray-500 mt-1">System-wide feature toggles for all networks</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { key: 'sampleTypeQuantity', title: 'Sample Type & Quantity Sharing', description: 'Enable detailed sample information sharing across networks', icon: Building2 },
              { key: 'urgentDeliveryRollout', title: 'Urgent Delivery Rollout', description: 'System-wide urgent delivery capability for critical samples', icon: Zap },
              { key: 'multiParcelManagement', title: 'Multi-parcel Management', description: 'Enable delivery efficiency through combined orders', icon: Users },
              { key: 'riderHandoverSystem', title: 'Rider Handover System', description: 'Enable rider-to-rider capability for extended routes', icon: Shield }
            ].map((feature) => {
              const Icon = feature.icon;
              const isEnabled = features[feature.key as keyof typeof features];
              
              return (
                <div key={feature.key} className="p-4 rounded-2xl bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{
                          backgroundColor: isEnabled ? '#4ECDC4' + '20' : '#6b7280' + '20',
                          border: `2px solid ${isEnabled ? '#4ECDC4' : '#6b7280'}30`
                        }}
                      >
                        <Icon className="w-6 h-6" style={{ color: isEnabled ? '#4ECDC4' : '#6b7280' }} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">{feature.title}</h4>
                        <p className="text-sm text-gray-500 mt-1">{feature.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleFeatureToggle(feature.key, !isEnabled)}
                      className="transition-colors duration-300"
                    >
                      {isEnabled ? (
                        <ToggleRight className="w-8 h-8 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SLA & Operations Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div 
          className="rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
            border: '1px solid rgba(203, 213, 225, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div className="p-6 border-b border-gray-100/60">
            <h3 className="text-xl font-bold text-gray-800">SLA & Operations Settings</h3>
            <p className="text-sm text-gray-500 mt-1">Configure delivery time thresholds</p>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pickup Time (minutes)
                </label>
                <input
                  type="number"
                  value={slaSettings.pickupTime}
                  onChange={(e) => setSlaSettings(prev => ({ ...prev, pickupTime: parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-700"
                />
                <p className="text-xs text-gray-500 mt-1">Time from rider accepts order to pickup confirmation. Current: &lt;{slaSettings.pickupTime} minutes</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Standard Delivery Time (minutes)
                </label>
                <input
                  type="number"
                  value={slaSettings.standardDeliveryTime}
                  onChange={(e) => setSlaSettings(prev => ({ ...prev, standardDeliveryTime: parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-700"
                />
                <p className="text-xs text-gray-500 mt-1">Time from pickup to hospital delivery (standard orders). Current: &lt;{slaSettings.standardDeliveryTime} minutes</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Urgent Delivery Time (minutes)
                </label>
                <input
                  type="number"
                  value={slaSettings.urgentDeliveryTime}
                  onChange={(e) => setSlaSettings(prev => ({ ...prev, urgentDeliveryTime: parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-700"
                />
                <p className="text-xs text-gray-500 mt-1">Time from pickup to hospital delivery (urgent orders). Current: &lt;{slaSettings.urgentDeliveryTime} minutes</p>
              </div>
              <button
                onClick={() => handleSLAUpdate(slaSettings)}
                className="w-full px-4 py-3 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors"
              >
                Update SLA Settings
              </button>
            </div>
          </div>
        </div>

        {/* Integration Configuration */}
        <div 
          className="rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
            border: '1px solid rgba(203, 213, 225, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div className="p-6 border-b border-gray-100/60">
            <h3 className="text-xl font-bold text-gray-800">Integration Configuration</h3>
            <p className="text-sm text-gray-500 mt-1">External service status and configuration</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {integrations.length === 0 ? (
                <div className="text-center py-8">
                  <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No integrations configured</p>
                  <p className="text-sm text-gray-400 mt-1">External service integrations will appear here</p>
                </div>
              ) : (
                integrations.map((integration: any, index: number) => {
                  const Icon = integration.icon;
                  return (
                    <div key={index} className="p-4 rounded-2xl bg-gray-50/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{
                              backgroundColor: integration.color + '20',
                              border: `1px solid ${integration.color}30`
                            }}
                          >
                            <Icon className="w-5 h-5" style={{ color: integration.color }} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">{integration.name}</h4>
                            <p className="text-sm text-gray-500">External service integration</p>
                          </div>
                        </div>
                        <div
                          className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                          style={{ backgroundColor: getStatusColor(integration.status) }}
                        >
                          {integration.status}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}