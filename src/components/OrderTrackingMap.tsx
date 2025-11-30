"use client";

import { useEffect, useRef, useState } from 'react';
import { MapPin, Truck, Flag, Navigation, AlertCircle } from 'lucide-react';

// Google Maps types
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

interface OrderTrackingMapProps {
  orderDetails: {
    order: {
      id: string;
      order_number: string;
      center_name: string;
      center_address: string;
      hospital_name: string;
      hospital_address: string;
      rider_name?: string;
      rider_phone?: string;
      pickup_location: {
        lat: number;
        lng: number;
      };
      delivery_location: {
        lat: number;
        lng: number;
      };
      status: string;
    };
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
  };
  onRefresh?: () => void;
}

export default function OrderTrackingMap({ orderDetails, onRefresh }: OrderTrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  const routeRenderer = useRef<any>(null);
  const [map, setMap] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Load Google Maps script (reuse existing pattern)
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
    script.id = 'google-maps-script-order-tracking';

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

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || map) return;

    try {
      // Center map between pickup and delivery locations
      const pickupLat = orderDetails.order.pickup_location.lat;
      const pickupLng = orderDetails.order.pickup_location.lng;
      const deliveryLat = orderDetails.order.delivery_location.lat;
      const deliveryLng = orderDetails.order.delivery_location.lng;

      const centerLat = (pickupLat + deliveryLat) / 2;
      const centerLng = (pickupLng + deliveryLng) / 2;

      const mapInstance = new window.google.maps.Map(mapRef.current, {
        zoom: 12,
        center: { lat: centerLat, lng: centerLng },
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP
      });

      // Add CSS for marker labels
      const style = document.createElement('style');
      style.textContent = `
        .order-tracking-label {
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
        mapInstance.setCenter({ lat: centerLat, lng: centerLng });
      }, 100);
    } catch (error) {
      console.error('Failed to initialize order tracking map:', error);
      setMapError('Failed to initialize map');
    }
  }, [isLoaded, map, orderDetails.order.pickup_location, orderDetails.order.delivery_location]);

  // Update markers and route when order data changes
  useEffect(() => {
    if (!map) return;

    // Clear existing markers and route
    markersRef.current.forEach(marker => marker.setMap(null));
    if (routeRenderer.current) {
      routeRenderer.current.setMap(null);
    }
    const newMarkers: any[] = [];

    // Add pickup location marker (Collection Center)
    const pickupMarker = new window.google.maps.Marker({
      position: orderDetails.order.pickup_location,
      map: map,
      title: `Pickup: ${orderDetails.order.center_name}`,
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
            <circle cx="18" cy="18" r="16" fill="#EA580C" stroke="#FFFFFF" stroke-width="2"/>
            <text x="18" y="23" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">🧪</text>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(36, 36),
        anchor: new window.google.maps.Point(18, 18),
      },
      label: {
        text: 'PICKUP',
        color: '#EA580C',
        fontSize: '12px',
        fontWeight: 'bold',
        className: 'order-tracking-label'
      }
    });

    // Pickup info window
    const pickupInfoWindow = new window.google.maps.InfoWindow({
      content: `
        <div class="p-3 min-w-48">
          <div class="flex items-center mb-2">
            <span class="text-2xl mr-2">🧪</span>
            <h3 class="font-bold text-gray-900">Pickup Location</h3>
          </div>
          <div class="space-y-1 text-sm">
            <div><strong>${orderDetails.order.center_name}</strong></div>
            <div class="text-gray-600">${orderDetails.order.center_address}</div>
            <div class="inline-block px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
              Collection Center
            </div>
          </div>
        </div>
      `,
      maxWidth: 250
    });

    pickupMarker.addListener('click', () => {
      pickupInfoWindow.open(map, pickupMarker);
    });

    newMarkers.push(pickupMarker);

    // Add delivery location marker (Hospital)
    const deliveryMarker = new window.google.maps.Marker({
      position: orderDetails.order.delivery_location,
      map: map,
      title: `Delivery: ${orderDetails.order.hospital_name}`,
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
            <circle cx="18" cy="18" r="16" fill="#2563EB" stroke="#FFFFFF" stroke-width="2"/>
            <text x="18" y="23" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">🏥</text>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(36, 36),
        anchor: new window.google.maps.Point(18, 18),
      },
      label: {
        text: 'DELIVERY',
        color: '#2563EB',
        fontSize: '12px',
        fontWeight: 'bold',
        className: 'order-tracking-label'
      }
    });

    // Delivery info window
    const deliveryInfoWindow = new window.google.maps.InfoWindow({
      content: `
        <div class="p-3 min-w-48">
          <div class="flex items-center mb-2">
            <span class="text-2xl mr-2">🏥</span>
            <h3 class="font-bold text-gray-900">Delivery Location</h3>
          </div>
          <div class="space-y-1 text-sm">
            <div><strong>${orderDetails.order.hospital_name}</strong></div>
            <div class="text-gray-600">${orderDetails.order.hospital_address}</div>
            <div class="inline-block px-2 py-1 bg-teal-100 text-teal-800 rounded text-xs font-medium">
              Hospital
            </div>
          </div>
        </div>
      `,
      maxWidth: 250
    });

    deliveryMarker.addListener('click', () => {
      deliveryInfoWindow.open(map, deliveryMarker);
    });

    newMarkers.push(deliveryMarker);

    // Add current rider location if available
    const latestLocation = orderDetails.location_tracking?.[0];
    if (latestLocation && orderDetails.order.rider_name) {
      const riderMarker = new window.google.maps.Marker({
        position: latestLocation.location,
        map: map,
        title: `Current Location: ${orderDetails.order.rider_name}`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="14" fill="#10B981" stroke="#FFFFFF" stroke-width="2"/>
              <text x="16" y="20" text-anchor="middle" fill="white" font-family="Arial" font-size="10" font-weight="bold">🏍️</text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 16),
        },
        label: {
          text: orderDetails.order.rider_name,
          color: '#10B981',
          fontSize: '12px',
          fontWeight: 'bold',
          className: 'order-tracking-label'
        }
      });

      // Rider info window
      const riderInfoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="p-3 min-w-48">
            <div class="flex items-center mb-2">
              <span class="text-2xl mr-2">🏍️</span>
              <h3 class="font-bold text-gray-900">Current Location</h3>
            </div>
            <div class="space-y-1 text-sm">
              <div><strong>${orderDetails.order.rider_name}</strong></div>
              ${orderDetails.order.rider_phone ? `<div class="text-gray-600">${orderDetails.order.rider_phone}</div>` : ''}
              <div class="text-gray-600">
                GPS: ${latestLocation.location.lat.toFixed(6)}, ${latestLocation.location.lng.toFixed(6)}
              </div>
              ${latestLocation.speed_kmh ? `
                <div class="text-gray-600">Speed: ${latestLocation.speed_kmh} km/h</div>
              ` : ''}
              ${latestLocation.accuracy_meters ? `
                <div class="text-gray-600">Accuracy: ±${latestLocation.accuracy_meters}m</div>
              ` : ''}
              <div class="text-xs text-gray-500">
                Last updated: ${new Date(latestLocation.recorded_at).toLocaleTimeString()}
              </div>
              <div class="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                Live Tracking
              </div>
            </div>
          </div>
        `,
        maxWidth: 280
      });

      riderMarker.addListener('click', () => {
        riderInfoWindow.open(map, riderMarker);
      });

      newMarkers.push(riderMarker);

      // Create route from current location to destination
      if (orderDetails.order.status === 'picked_up' || orderDetails.order.status === 'delivery_started') {
        // Route from current rider location to hospital
        const directionsService = new window.google.maps.DirectionsService();
        routeRenderer.current = new window.google.maps.DirectionsRenderer({
          suppressMarkers: true, // We have custom markers
          polylineOptions: {
            strokeColor: '#10B981',
            strokeWeight: 4,
            strokeOpacity: 0.8
          }
        });

        directionsService.route({
          origin: latestLocation.location,
          destination: orderDetails.order.delivery_location,
          travelMode: window.google.maps.TravelMode.DRIVING,
        }, (result: any, status: any) => {
          if (status === 'OK') {
            routeRenderer.current.setDirections(result);
            routeRenderer.current.setMap(map);
          }
        });
      } else if (orderDetails.order.status === 'assigned' || orderDetails.order.status === 'pickup_started') {
        // Route from current rider location to pickup
        const directionsService = new window.google.maps.DirectionsService();
        routeRenderer.current = new window.google.maps.DirectionsRenderer({
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: '#F59E0B',
            strokeWeight: 4,
            strokeOpacity: 0.8
          }
        });

        directionsService.route({
          origin: latestLocation.location,
          destination: orderDetails.order.pickup_location,
          travelMode: window.google.maps.TravelMode.DRIVING,
        }, (result: any, status: any) => {
          if (status === 'OK') {
            routeRenderer.current.setDirections(result);
            routeRenderer.current.setMap(map);
          }
        });
      }
    } else {
      // No rider location available - show route between pickup and delivery
      const directionsService = new window.google.maps.DirectionsService();
      routeRenderer.current = new window.google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#6B7280',
          strokeWeight: 3,
          strokeOpacity: 0.6,
          strokeStyle: 'dashed'
        }
      });

      directionsService.route({
        origin: orderDetails.order.pickup_location,
        destination: orderDetails.order.delivery_location,
        travelMode: window.google.maps.TravelMode.DRIVING,
      }, (result: any, status: any) => {
        if (status === 'OK') {
          routeRenderer.current.setDirections(result);
          routeRenderer.current.setMap(map);
        }
      });
    }

    markersRef.current = newMarkers;

    // Fit map to show all markers
    if (newMarkers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      newMarkers.forEach(marker => bounds.extend(marker.getPosition()));

      map.fitBounds(bounds, {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
      });

      // Set zoom constraints
      const listener = window.google.maps.event.addListener(map, 'idle', () => {
        const currentZoom = map.getZoom();
        if (currentZoom > 18) {
          map.setZoom(18);
        } else if (currentZoom < 10) {
          map.setZoom(10);
        }
        window.google.maps.event.removeListener(listener);
      });
    }

  }, [map, orderDetails]);

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-50 rounded-xl">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Google Maps API Key Required</h3>
          <p className="text-gray-600">Please configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable live tracking</p>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-50 rounded-xl">
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
      {/* Map Container */}
      <div
        ref={mapRef}
        className="h-96 w-full rounded-xl border"
        style={{
          minHeight: '384px',
          backgroundColor: '#f0f0f0'
        }}
      />

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-lg">
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>Pickup</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-teal-500"></div>
            <span>Delivery</span>
          </div>
          {orderDetails.location_tracking?.[0] && (
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Rider</span>
            </div>
          )}
        </div>
      </div>

      {/* Status info */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-lg">
        <div className="text-sm">
          <div className="font-medium text-gray-900">{orderDetails.order.order_number}</div>
          <div className="text-gray-600 capitalize">{orderDetails.order.status.replace('_', ' ')}</div>
          {orderDetails.location_tracking?.[0] && (
            <div className="text-xs text-green-600 mt-1">Live tracking active</div>
          )}
        </div>
      </div>

      {/* Refresh button */}
      {onRefresh && (
        <div className="absolute top-4 right-4">
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-3 py-2 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg hover:bg-white transition-colors"
          >
            <Navigation className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Refresh</span>
          </button>
        </div>
      )}
    </div>
  );
}