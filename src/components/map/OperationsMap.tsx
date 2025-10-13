"use client";

import { useEffect, useRef, useState, useMemo } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useSystemOverview, useHospitalNetworks, useAllCollectionCenters } from '@/hooks/useApi';

// Google Maps types
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

interface Hospital {
  id: string;
  name: string;
  network_name: string;
  hospital_type: 'main' | 'regional';
  city: string;
  province: string;
  coordinates_lat: number;
  coordinates_lng: number;
  status: string;
  active_orders?: number;
  total_riders?: number;
}

interface CollectionCenter {
  id: string;
  center_name: string;
  center_type: 'dependent' | 'independent';
  contact_person: string;
  phone: string;
  city: string;
  status: string;
  coordinates_lat: number;
  coordinates_lng: number;
  active_orders: number;
  hospital_affiliations?: string[];
}

interface Rider {
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
}

interface OperationsMapProps {
  selectedFilter: 'all' | 'hospitals' | 'centers' | 'riders';
  showActiveOnly: boolean;
  isFullscreen: boolean;
  onExitFullscreen: () => void;
}

export default function OperationsMap({ 
  selectedFilter, 
  showActiveOnly, 
  isFullscreen, 
  onExitFullscreen 
}: OperationsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  const [map, setMap] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    hospitals: Hospital[];
    collectionCenters: CollectionCenter[];
    riders: Rider[];
  }>({
    hospitals: [],
    collectionCenters: [],
    riders: []
  });

  // Load Google Maps script
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google) {
      setIsLoaded(true);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      const checkLoaded = () => {
        if (window.google) {
          setIsLoaded(true);
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
      return;
    }

    const script = document.createElement('script');
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry&callback=initMap`;
    script.async = true;
    script.defer = true;
    script.id = 'google-maps-script';
    
    // Add global callback
    (window as any).initMap = () => {
      setIsLoaded(true);
    };
    
    script.onload = () => {
      setIsLoaded(true);
    };
    
    script.onerror = (error) => {
      console.error('Failed to load Google Maps script:', error);
      setMapError('Failed to load Google Maps. Please check your API key and network connection.');
    };
    
    document.head.appendChild(script);

    return () => {
      // Don't remove script on cleanup to avoid reloading
    };
  }, []);

  // Use existing API hooks to fetch operations data
  const { data: systemOverviewData, loading: systemLoading } = useSystemOverview();
  const { data: hospitalNetworksData, loading: networksLoading } = useHospitalNetworks();
  const { data: allCollectionCentersData, loading: centersLoading } = useAllCollectionCenters();
  
  // Process data from API hooks
  useEffect(() => {
    console.log('🗺️ OperationsMap - RAW API DATA:', {
      systemOverviewData: systemOverviewData,
      hospitalNetworksData: hospitalNetworksData,
      allCollectionCentersData: allCollectionCentersData,
      systemLoading,
      networksLoading,
      centersLoading
    });

    // More detailed logging
    if (systemOverviewData) {
      console.log('🏥 SystemOverview structure:', JSON.stringify(systemOverviewData, null, 2));
    }
    if (hospitalNetworksData) {
      console.log('🏨 HospitalNetworks structure:', JSON.stringify(hospitalNetworksData, null, 2));
    }
    if (allCollectionCentersData) {
      console.log('🧪 CollectionCenters structure:', JSON.stringify(allCollectionCentersData, null, 2));
    }

    const systemData = systemOverviewData?.data || {};
    
    // Extract hospitals from system overview or hospital networks data
    let hospitals: Hospital[] = [];
    
    // Try to get hospitals from system overview first
    if (systemData.hospital_networks) {
      hospitals = systemData.hospital_networks.flatMap((network: any) => 
        (network.hospitals || []).map((hospital: any) => ({
          id: hospital.id,
          name: hospital.name,
          network_name: network.network_name,
          hospital_type: hospital.hospital_type || hospital.type || 'main',
          city: hospital.city,
          province: hospital.province,
          coordinates_lat: hospital.coordinates_lat,
          coordinates_lng: hospital.coordinates_lng,
          status: hospital.status,
          active_orders: hospital.active_orders || 0,
          total_riders: hospital.total_riders || 0
        }))
      );
    }
    
    // If no hospitals from system overview, try hospital networks data
    if (hospitals.length === 0 && hospitalNetworksData?.data?.hospital_networks) {
      hospitals = hospitalNetworksData.data.hospital_networks.flatMap((network: any) => 
        (network.hospitals || []).map((hospital: any) => ({
          id: hospital.id,
          name: hospital.name,
          network_name: network.network_name,
          hospital_type: hospital.hospital_type || hospital.type || 'main',
          city: hospital.city,
          province: hospital.province,
          coordinates_lat: hospital.coordinates_lat,
          coordinates_lng: hospital.coordinates_lng,
          status: hospital.status,
          active_orders: hospital.active_orders || 0,
          total_riders: hospital.total_riders || 0
        }))
      );
    }

    // Extract collection centers
    let collectionCenters: CollectionCenter[] = [];
    
    // Try system overview data first
    if (systemData.collection_centers) {
      collectionCenters = systemData.collection_centers.map((center: any) => ({
        id: center.id,
        center_name: center.center_name,
        center_type: center.center_type,
        contact_person: center.contact_person,
        phone: center.phone,
        city: center.city,
        status: center.status,
        coordinates_lat: center.coordinates_lat,
        coordinates_lng: center.coordinates_lng,
        active_orders: center.active_orders || 0,
        hospital_affiliations: center.hospital_relationships?.map((rel: any) => rel.network_name) || []
      }));
    }
    
    // Try collection centers data if no data from system overview
    if (collectionCenters.length === 0 && allCollectionCentersData?.data) {
      const centersData = allCollectionCentersData.data;
      collectionCenters = (Array.isArray(centersData) ? centersData : centersData.collection_centers || []).map((center: any) => ({
        id: center.id,
        center_name: center.center_name,
        center_type: center.center_type,
        contact_person: center.contact_person,
        phone: center.phone,
        city: center.city,
        status: center.status,
        coordinates_lat: center.coordinates_lat,
        coordinates_lng: center.coordinates_lng,
        active_orders: center.active_orders || 0,
        hospital_affiliations: center.hospital_relationships?.map((rel: any) => rel.network_name) || []
      }));
    }

    // Extract riders with GPS locations
    let riders: Rider[] = [];
    
    if (systemData.riders) {
      console.log('🏍️ RAW RIDERS DATA:', systemData.riders);
      console.log('🏍️ First 3 riders detailed:', systemData.riders.slice(0, 3));
      
      // Check what fields exist in the riders
      if (systemData.riders.length > 0) {
        console.log('🏍️ Rider fields available:', Object.keys(systemData.riders[0]));
      }
      
      riders = systemData.riders
        .filter((rider: any) => {
          const hasLocation = rider.current_location_lat && rider.current_location_lng;
          console.log(`🏍️ Rider ${rider.rider_name}: has GPS = ${hasLocation}, lat=${rider.current_location_lat}, lng=${rider.current_location_lng}`);
          return hasLocation;
        })
        .map((rider: any) => ({
          id: rider.id,
          rider_name: rider.rider_name,
          phone: rider.phone,
          availability_status: rider.availability_status,
          hospital_name: rider.hospital_name || 'Unknown Hospital',
          vehicle_type: rider.vehicle_type,
          current_location: {
            lat: parseFloat(rider.current_location_lat),
            lng: parseFloat(rider.current_location_lng)
          },
          total_deliveries: rider.total_deliveries || 0,
          rating: rider.rating || 0
        }));
    } else {
      console.log('🏍️ No riders data found in systemData');
    }

    console.log('🗺️ OperationsMap - Processed data:', {
      hospitals: hospitals.length,
      collectionCenters: collectionCenters.length,
      riders: riders.length
    });

    // Debug GPS coordinates
    console.log('🏥 Hospitals with GPS:', hospitals.filter(h => h.coordinates_lat && h.coordinates_lng).length);
    console.log('🧪 Centers with GPS:', collectionCenters.filter(c => c.coordinates_lat && c.coordinates_lng).length);
    
    // Log first few hospitals and centers to see coordinate data
    if (hospitals.length > 0) {
      console.log('🏥 First 2 hospitals GPS data:', hospitals.slice(0, 2).map(h => ({
        name: h.name,
        lat: h.coordinates_lat,
        lng: h.coordinates_lng,
        hasGPS: !!(h.coordinates_lat && h.coordinates_lng)
      })));
    }
    
    if (collectionCenters.length > 0) {
      console.log('🧪 First 2 centers GPS data:', collectionCenters.slice(0, 2).map(c => ({
        name: c.center_name,
        lat: c.coordinates_lat,
        lng: c.coordinates_lng,
        hasGPS: !!(c.coordinates_lat && c.coordinates_lng)
      })));
    }

    // If no data from APIs, use fallback mock data for development
    if (hospitals.length === 0 && collectionCenters.length === 0 && riders.length === 0) {
      console.log('🗺️ No data from APIs - using fallback mock data');
      setData({
        hospitals: [
          {
            id: '1',
            name: 'Apollo Hospital Colombo',
            network_name: 'Apollo Network',
            hospital_type: 'main',
            city: 'Colombo',
            province: 'Western',
            coordinates_lat: 6.9271,
            coordinates_lng: 79.8612,
            status: 'active',
            active_orders: 15,
            total_riders: 8
          },
          {
            id: '2',
            name: 'Nawaloka Hospital',
            network_name: 'Nawaloka Network',
            hospital_type: 'main',
            city: 'Colombo',
            province: 'Western',
            coordinates_lat: 6.8860,
            coordinates_lng: 79.8742,
            status: 'active',
            active_orders: 12,
            total_riders: 6
          },
          {
            id: '3',
            name: 'Asiri Medical Kandy',
            network_name: 'Asiri Network',
            hospital_type: 'regional',
            city: 'Kandy',
            province: 'Central',
            coordinates_lat: 7.2906,
            coordinates_lng: 80.6337,
            status: 'active',
            active_orders: 8,
            total_riders: 4
          }
        ],
        collectionCenters: [
          {
            id: '1',
            center_name: 'Elite Medical Labs',
            center_type: 'independent',
            contact_person: 'Dr. Silva',
            phone: '+94771234567',
            city: 'Colombo',
            status: 'active',
            coordinates_lat: 6.9030,
            coordinates_lng: 79.8536,
            active_orders: 5,
            hospital_affiliations: ['Apollo Network', 'Nawaloka Network']
          },
          {
            id: '2',
            center_name: 'HealthGuard Diagnostics',
            center_type: 'dependent',
            contact_person: 'Ms. Fernando',
            phone: '+94712345678',
            city: 'Mount Lavinia',
            status: 'active',
            coordinates_lat: 6.8344,
            coordinates_lng: 79.8754,
            active_orders: 3,
            hospital_affiliations: ['Apollo Network']
          },
          {
            id: '3',
            center_name: 'MediCare Central',
            center_type: 'independent',
            contact_person: 'Dr. Perera',
            phone: '+94723456789',
            city: 'Kandy',
            status: 'active',
            coordinates_lat: 7.2734,
            coordinates_lng: 80.6007,
            active_orders: 7,
            hospital_affiliations: ['Asiri Network']
          }
        ],
        riders: [
          {
            id: '1',
            rider_name: 'Kamal Silva',
            phone: '+94771111111',
            availability_status: 'available',
            hospital_name: 'Apollo Hospital Colombo',
            vehicle_type: 'motorcycle',
            current_location: { lat: 6.9145, lng: 79.8440 },
            total_deliveries: 156,
            rating: 4.8
          },
          {
            id: '2',
            rider_name: 'Priya Fernando',
            phone: '+94772222222',
            availability_status: 'busy',
            hospital_name: 'Nawaloka Hospital',
            vehicle_type: 'motorcycle',
            current_location: { lat: 6.8705, lng: 79.8850 },
            total_deliveries: 203,
            rating: 4.9
          },
          {
            id: '3',
            rider_name: 'Nuwan Perera',
            phone: '+94773333333',
            availability_status: 'available',
            hospital_name: 'Asiri Medical Kandy',
            vehicle_type: 'car',
            current_location: { lat: 7.2820, lng: 80.6350 },
            total_deliveries: 89,
            rating: 4.6
          },
          {
            id: '4',
            rider_name: 'Saman Rajapaksa',
            phone: '+94774444444',
            availability_status: 'offline',
            hospital_name: 'Apollo Hospital Colombo',
            vehicle_type: 'motorcycle',
            current_location: { lat: 6.9200, lng: 79.8500 },
            total_deliveries: 234,
            rating: 4.7
          }
        ]
      });
    } else {
      setData({
        hospitals: hospitals.filter(h => h.coordinates_lat && h.coordinates_lng),
        collectionCenters: collectionCenters.filter(c => c.coordinates_lat && c.coordinates_lng),
        riders
      });
    }
    
    setLoading(systemLoading || networksLoading || centersLoading);
  }, [systemOverviewData, hospitalNetworksData, allCollectionCentersData, systemLoading, networksLoading, centersLoading]);

  // Filter data based on selected filter and active status
  const filteredData = useMemo(() => {
    let hospitals = data.hospitals;
    let centers = data.collectionCenters;
    let riders = data.riders;

    // Filter by active status
    if (showActiveOnly) {
      hospitals = hospitals.filter(h => h.status === 'active');
      centers = centers.filter(c => c.status === 'active' && c.active_orders > 0);
      riders = riders.filter(r => r.availability_status !== 'offline');
    }

    // Filter by selected type
    switch (selectedFilter) {
      case 'hospitals':
        return { hospitals, collectionCenters: [], riders: [] };
      case 'centers':
        return { hospitals: [], collectionCenters: centers, riders: [] };
      case 'riders':
        return { hospitals: [], collectionCenters: [], riders };
      default:
        return { hospitals, collectionCenters: centers, riders };
    }
  }, [data, selectedFilter, showActiveOnly]);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || map) return;

    try {
      // Default to Sri Lanka center
      const defaultCenter = { lat: 7.8731, lng: 80.7718 };
      
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        zoom: 8,
        center: defaultCenter,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: !isFullscreen,
        zoomControl: true,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP
      });

      // Add CSS for marker labels
      const style = document.createElement('style');
      style.textContent = `
        .operations-marker-label {
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 4px 8px;
          font-size: 12px !important;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          white-space: nowrap;
        }
      `;
      document.head.appendChild(style);

      setMap(mapInstance);
      setMapError(null);
      
      // Trigger map resize
      setTimeout(() => {
        window.google.maps.event.trigger(mapInstance, 'resize');
        mapInstance.setCenter(defaultCenter);
      }, 100);
    } catch (error) {
      console.error('Failed to initialize map:', error);
      setMapError('Failed to initialize map');
    }
  }, [isLoaded, map, isFullscreen]);

  // Update markers when data or filters change
  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    const newMarkers: any[] = [];

    // Add hospital markers
    filteredData.hospitals.forEach((hospital) => {
      if (!hospital.coordinates_lat || !hospital.coordinates_lng) return;

      const lat = parseFloat(hospital.coordinates_lat.toString());
      const lng = parseFloat(hospital.coordinates_lng.toString());
      
      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: map,
        title: `${hospital.name} (${hospital.hospital_type})`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="14" fill="#2563EB" stroke="#FFFFFF" stroke-width="2"/>
              <text x="16" y="20" text-anchor="middle" fill="white" font-family="Arial" font-size="10" font-weight="bold">🏥</text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 16),
        },
        label: {
          text: hospital.name,
          color: '#1F2937',
          fontSize: '12px',
          fontWeight: 'bold',
          className: 'operations-marker-label'
        }
      });

      // Create info window for hospital
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="p-4 min-w-64">
            <div class="flex items-center mb-3">
              <span class="text-2xl mr-2">🏥</span>
              <h3 class="font-bold text-gray-900 text-lg">${hospital.name}</h3>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex items-center">
                <span class="w-20 text-gray-600">Network:</span>
                <span class="font-medium">${hospital.network_name}</span>
              </div>
              <div class="flex items-center">
                <span class="w-20 text-gray-600">Type:</span>
                <span class="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">${hospital.hospital_type}</span>
              </div>
              <div class="flex items-center">
                <span class="w-20 text-gray-600">Location:</span>
                <span class="font-medium">${hospital.city}, ${hospital.province}</span>
              </div>
              <div class="flex items-center">
                <span class="w-20 text-gray-600">Orders:</span>
                <span class="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">${hospital.active_orders || 0} active</span>
              </div>
              <div class="flex items-center">
                <span class="w-20 text-gray-600">Riders:</span>
                <span class="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">${hospital.total_riders || 0} total</span>
              </div>
              <div class="flex items-center">
                <span class="w-20 text-gray-600">Status:</span>
                <span class="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">${hospital.status}</span>
              </div>
            </div>
          </div>
        `,
        maxWidth: 300
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      newMarkers.push(marker);
    });

    // Add collection center markers
    filteredData.collectionCenters.forEach((center) => {
      if (!center.coordinates_lat || !center.coordinates_lng) return;

      const lat = parseFloat(center.coordinates_lat.toString());
      const lng = parseFloat(center.coordinates_lng.toString());
      
      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: map,
        title: `${center.center_name} (${center.center_type})`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="14" fill="#EA580C" stroke="#FFFFFF" stroke-width="2"/>
              <text x="16" y="20" text-anchor="middle" fill="white" font-family="Arial" font-size="10" font-weight="bold">🧪</text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 16),
        },
        label: {
          text: center.center_name,
          color: '#1F2937',
          fontSize: '12px',
          fontWeight: 'bold',
          className: 'operations-marker-label'
        }
      });

      // Create info window for collection center
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="p-4 min-w-64">
            <div class="flex items-center mb-3">
              <span class="text-2xl mr-2">🧪</span>
              <h3 class="font-bold text-gray-900 text-lg">${center.center_name}</h3>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex items-center">
                <span class="w-20 text-gray-600">Contact:</span>
                <span class="font-medium">${center.contact_person}</span>
              </div>
              <div class="flex items-center">
                <span class="w-20 text-gray-600">Phone:</span>
                <span class="font-medium">${center.phone}</span>
              </div>
              <div class="flex items-center">
                <span class="w-20 text-gray-600">Location:</span>
                <span class="font-medium">${center.city}</span>
              </div>
              <div class="flex items-center">
                <span class="w-20 text-gray-600">Type:</span>
                <span class="inline-block px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">${center.center_type}</span>
              </div>
              <div class="flex items-center">
                <span class="w-20 text-gray-600">Orders:</span>
                <span class="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">${center.active_orders} active</span>
              </div>
              <div class="flex items-center">
                <span class="w-20 text-gray-600">Status:</span>
                <span class="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">${center.status}</span>
              </div>
              ${center.hospital_affiliations ? `
                <div class="flex items-start">
                  <span class="w-20 text-gray-600">Networks:</span>
                  <div class="flex flex-wrap gap-1">
                    ${center.hospital_affiliations.map(network => `
                      <span class="inline-block px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">${network}</span>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
        `,
        maxWidth: 320
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      newMarkers.push(marker);
    });

    // Add rider markers
    filteredData.riders.forEach((rider) => {
      if (!rider.current_location) return;

      const { lat, lng } = rider.current_location;
      
      // Choose marker color based on status
      let markerColor = '#6B7280'; // gray for offline
      if (rider.availability_status === 'available') {
        markerColor = '#10B981'; // green
      } else if (rider.availability_status === 'busy') {
        markerColor = '#2563EB'; // blue
      }

      const vehicleEmoji = rider.vehicle_type === 'motorcycle' ? '🏍️' : '🚗';

      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: map,
        title: `${rider.rider_name} - ${rider.availability_status}`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
              <circle cx="14" cy="14" r="12" fill="${markerColor}" stroke="#FFFFFF" stroke-width="2"/>
              <text x="14" y="18" text-anchor="middle" fill="white" font-family="Arial" font-size="8" font-weight="bold">${vehicleEmoji}</text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(28, 28),
          anchor: new window.google.maps.Point(14, 14),
        }
      });

      // Create info window for rider
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="p-4 min-w-48">
            <div class="flex items-center mb-3">
              <span class="text-2xl mr-2">${vehicleEmoji}</span>
              <h3 class="font-bold text-gray-900 text-lg">${rider.rider_name}</h3>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex items-center">
                <span class="w-20 text-gray-600">Phone:</span>
                <span class="font-medium">${rider.phone}</span>
              </div>
              <div class="flex items-center">
                <span class="w-20 text-gray-600">Status:</span>
                <span class="inline-block px-2 py-1 ${
                  rider.availability_status === 'available' ? 'bg-green-100 text-green-800' :
                  rider.availability_status === 'busy' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                } rounded text-xs font-medium">
                  ${rider.availability_status.charAt(0).toUpperCase() + rider.availability_status.slice(1)}
                </span>
              </div>
              <div class="flex items-center">
                <span class="w-20 text-gray-600">Hospital:</span>
                <span class="font-medium text-xs">${rider.hospital_name}</span>
              </div>
              <div class="flex items-center">
                <span class="w-20 text-gray-600">Vehicle:</span>
                <span class="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">${rider.vehicle_type}</span>
              </div>
              <div class="flex items-center">
                <span class="w-20 text-gray-600">Deliveries:</span>
                <span class="font-medium">${rider.total_deliveries}</span>
              </div>
              <div class="flex items-center">
                <span class="w-20 text-gray-600">Rating:</span>
                <span class="font-medium">${rider.rating} ⭐</span>
              </div>
              <div class="flex items-center">
                <span class="w-20 text-gray-600">Location:</span>
                <span class="text-xs text-gray-500">${lat.toFixed(4)}, ${lng.toFixed(4)}</span>
              </div>
            </div>
          </div>
        `,
        maxWidth: 280
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      newMarkers.push(marker);
    });

    markersRef.current = newMarkers;

    // Fit map to show all markers if there are any
    if (newMarkers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      newMarkers.forEach(marker => bounds.extend(marker.getPosition()));
      
      map.fitBounds(bounds, {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50
      });
      
      // Set zoom constraints
      const listener = window.google.maps.event.addListener(map, 'idle', () => {
        const currentZoom = map.getZoom();
        if (currentZoom > 16) {
          map.setZoom(16);
        } else if (currentZoom < 6) {
          map.setZoom(6);
        }
        window.google.maps.event.removeListener(listener);
      });
    }

  }, [map, filteredData]);

  // Handle fullscreen mode
  useEffect(() => {
    if (map && isFullscreen) {
      // Trigger resize when entering fullscreen
      setTimeout(() => {
        window.google.maps.event.trigger(map, 'resize');
      }, 100);
    }
  }, [map, isFullscreen]);

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Google Maps API Key Required</h3>
          <p className="text-gray-600">Please configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable map view</p>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Map Error</h3>
          <p className="text-gray-600">{mapError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Fullscreen Exit Button */}
      {isFullscreen && (
        <button
          onClick={onExitFullscreen}
          className="absolute top-4 right-4 z-10 flex items-center gap-2 px-4 py-2 rounded-2xl transition-all duration-300 hover:transform hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
            border: '1px solid rgba(203, 213, 225, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
          }}
        >
          <X className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Exit Fullscreen</span>
        </button>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading map data...</p>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div 
        ref={mapRef} 
        className={`w-full border ${isFullscreen ? 'h-screen' : 'h-[600px]'}`}
        style={{ 
          minHeight: isFullscreen ? '100vh' : '600px',
          backgroundColor: '#f0f0f0'
        }}
      />
      
      {/* Status Bar */}
      {!isFullscreen && (
        <div className="p-4 bg-gray-50 border-t text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <div>
              Showing: {filteredData.hospitals.length} hospitals, {filteredData.collectionCenters.length} centers, {filteredData.riders.length} riders
            </div>
            <div>
              {loading ? 'Updating...' : 'Live data • Last updated: now'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}