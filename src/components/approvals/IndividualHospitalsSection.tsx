import { Hospital, Network, Building, Clock, Eye, Check } from 'lucide-react';

// Individual Hospitals Section Component
export function IndividualHospitalsSection({ 
  hospitals, 
  onViewDetails 
}: {
  hospitals: any[];
  onViewDetails: (hospital: any) => void;
}) {
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
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
              <Hospital className="w-6 h-6 text-blue-600" />
              Individual Hospitals ({hospitals.length})
            </h2>
            <p className="text-gray-600 text-base">Hospitals pending individual or network-level HQ approval</p>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="space-y-4">
          {hospitals.length === 0 ? (
            <div className="text-center py-12">
              <Hospital className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">No Individual Hospitals Pending</p>
              <p className="text-gray-400">Individual hospital applications will appear here</p>
            </div>
          ) : (
            hospitals.map((hospital: any) => (
              <div 
                key={hospital.id}
                className="group rounded-3xl transition-all duration-300 hover:transform hover:scale-[1.01]"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.8) 100%)',
                  border: '1px solid rgba(203, 213, 225, 0.3)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)'
                }}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{
                          background: hospital.is_main_hospital 
                            ? 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)'
                            : 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                        }}
                      >
                        <Hospital className="w-6 h-6 text-white" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">{hospital.name}</h3>
                          {hospital.is_main_hospital && (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                              Main Hospital
                            </span>
                          )}
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            hospital.current_status === 'pending_hq_approval' 
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                              : hospital.current_status === 'pending_network_approval'
                              ? 'bg-orange-100 text-orange-800 border-orange-200'
                              : 'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                            {hospital.current_status === 'pending_network_approval' ? 'Pending Network Approval' : 'Pending HQ Approval'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Network className="w-4 h-4" />
                            <span className="text-sm">Network: {hospital.network_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Building className="w-4 h-4" />
                            <span className="text-sm">Type: {hospital.hospital_type}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">Applied: {new Date(hospital.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Admin:</span>
                            <div className="font-medium text-gray-800">{hospital.admin_name}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Email:</span>
                            <div className="font-medium text-gray-800">{hospital.admin_email}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Phone:</span>
                            <div className="font-medium text-gray-800">{hospital.phone}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Network Status:</span>
                            <div className={`font-medium ${
                              hospital.network_status === 'approved' ? 'text-green-800' :
                              hospital.network_status === 'pending_hq_approval' ? 'text-yellow-800' :
                              'text-gray-800'
                            }`}>
                              {hospital.network_status}
                            </div>
                          </div>
                        </div>

                        {hospital.current_status === 'pending_network_approval' && (
                          <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                            <p className="text-xs text-orange-800">
                              <strong>Note:</strong> This hospital requires approval because its parent network "{hospital.network_name}" is pending HQ approval.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => onViewDetails(hospital)}
                        className="p-3 hover:bg-blue-50 rounded-xl transition-colors"
                        title="View Hospital Details"
                      >
                        <Eye className="w-4 h-4 text-blue-600" />
                      </button>
                      
                      <button 
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 hover:transform hover:scale-105"
                        style={{
                          background: hospital.current_status === 'pending_network_approval'
                            ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                            : 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                          color: 'white',
                          boxShadow: hospital.current_status === 'pending_network_approval'
                            ? '0 4px 12px rgba(245, 158, 11, 0.3)'
                            : '0 4px 12px rgba(59, 130, 246, 0.3)'
                        }}
                      >
                        <Check className="w-4 h-4" />
                        {hospital.current_status === 'pending_network_approval' ? 'Approve via Network' : 'Approve Hospital'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}