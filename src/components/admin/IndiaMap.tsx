import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, RefreshCw } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

// Interface for complaint data
interface Complaint {
  id: string;
  category: string;
  description: string;
  location_address?: string;
  latitude?: number;
  longitude?: number;
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  created_at: string;
  users: {
    full_name?: string;
  };
}

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons for different complaint statuses
const createCustomIcon = (status: string) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b'; // yellow
      case 'in_progress': return '#3b82f6'; // blue
      case 'resolved': return '#10b981'; // green
      case 'rejected': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  };

  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${getStatusColor(status)};
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: white;
      font-weight: bold;
    ">•</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

// Component for individual complaint markers
const ComplaintMarker: React.FC<{ complaint: Complaint }> = ({ complaint }) => {
  if (!complaint.latitude || !complaint.longitude) return null;

  const position: [number, number] = [complaint.latitude, complaint.longitude];
  const customIcon = createCustomIcon(complaint.status);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'in_progress': return 'In Progress';
      case 'resolved': return 'Resolved';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600';
      case 'in_progress': return 'text-blue-600';
      case 'resolved': return 'text-green-600';
      case 'rejected': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  return (
    <Marker position={position} icon={customIcon}>
      <Popup>
        <div className="p-2 min-w-[200px]">
          <div className="space-y-2">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-sm">
                {complaint.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h3>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(complaint.status)} bg-opacity-10`}>
                {getStatusText(complaint.status)}
              </span>
            </div>
            
            {/* Description */}
            <p className="text-sm text-gray-700 line-clamp-3">
              {complaint.description}
            </p>
            
            {/* Footer */}
            <div className="text-xs text-gray-500 border-t pt-2">
              <div className="flex items-center justify-between">
                <span>By: {complaint.users?.full_name || 'Anonymous'}</span>
                <span>{formatDate(complaint.created_at)}</span>
              </div>
              {complaint.location_address && (
                <div className="mt-1 text-xs text-gray-600">
                  📍 {complaint.location_address}
                </div>
              )}
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

// Component to set map view to India bounds
const SetMapView: React.FC = () => {
  const map = useMap();
  
  useEffect(() => {
    // India bounds: [south, west, north, east]
    const indiaBounds: L.LatLngBoundsExpression = [
      [6.0, 68.0], // Southwest corner
      [37.0, 97.0]  // Northeast corner
    ];
    
    // Fit the map to India bounds
    map.fitBounds(indiaBounds, { padding: [20, 20] });
  }, [map]);
  
  return null;
};

const IndiaMap: React.FC = () => {
  // India center coordinates
  const indiaCenter: [number, number] = [20.5937, 78.9629];
  const defaultZoom = 5;
  
  // State for complaints
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch complaints with latitude and longitude
  const fetchComplaints = async () => {
    try {
      setLoading(true);
      console.log('🗺️ Fetching complaints with coordinates...');
      
      const { data, error } = await supabase
        .from('complaints')
        .select(`
          id,
          category,
          description,
          location_address,
          latitude,
          longitude,
          status,
          created_at,
          users (
            full_name
          )
        `)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .eq('is_public', true);

      if (error) {
        throw error;
      }

      console.log('📍 Complaints with coordinates found:', data?.length || 0);
      console.log('🗂️ Full complaints data:', data);
      
      // Log each complaint individually for better visibility
      data?.forEach((complaint, index) => {
        console.log(`Complaint ${index + 1}:`, {
          id: complaint.id,
          category: complaint.category,
          status: complaint.status,
          coordinates: [complaint.latitude, complaint.longitude],
          location: complaint.location_address,
          user: complaint.users?.full_name,
          created: complaint.created_at
        });
      });

      setComplaints(data || []);
      
      toast({
        title: "Complaints Loaded",
        description: `Found ${data?.length || 0} complaints with coordinates`,
      });
    } catch (error: any) {
      console.error('❌ Error fetching complaints:', error);
      toast({
        title: "Error Loading Complaints",
        description: error.message || "Failed to load complaint data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch complaints on component mount
  useEffect(() => {
    fetchComplaints();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            India Map
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-600">
              {loading ? 'Loading...' : `${complaints.length} complaints`}
            </div>
            <button
              onClick={fetchComplaints}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
              title="Refresh complaints"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Map Container */}
          <div className="relative w-full h-[500px] rounded-lg overflow-hidden border-2 border-gray-200">
            <MapContainer
              center={indiaCenter}
              zoom={defaultZoom}
              style={{ height: '100%', width: '100%' }}
              className="z-0"
            >
              {/* OpenStreetMap tiles */}
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Set map view to India bounds */}
              <SetMapView />
              
              {/* Complaint Markers */}
              {complaints.map((complaint) => (
                <ComplaintMarker key={complaint.id} complaint={complaint} />
              ))}
            </MapContainer>
          </div>
          
          {/* Legend */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="font-medium text-sm text-gray-900 mb-2">Marker Legend:</p>
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500 border border-white shadow-sm"></div>
                <span>Pending ({complaints.filter(c => c.status === 'pending').length})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 border border-white shadow-sm"></div>
                <span>In Progress ({complaints.filter(c => c.status === 'in_progress').length})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 border border-white shadow-sm"></div>
                <span>Resolved ({complaints.filter(c => c.status === 'resolved').length})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 border border-white shadow-sm"></div>
                <span>Rejected ({complaints.filter(c => c.status === 'rejected').length})</span>
              </div>
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
};

export default IndiaMap;
