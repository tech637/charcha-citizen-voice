
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getPublicComplaints } from '@/lib/complaints';
import { useAuth } from '@/contexts/AuthContext';
import { hasLocationData } from '@/lib/locationUtils';
import { useLocationFormat } from '@/hooks/useLocationFormat';

// Location display component for preview
const LocationDisplay: React.FC<{
  location_address?: string;
  latitude?: number;
  longitude?: number;
}> = ({ location_address, latitude, longitude }) => {
  const { formattedLocation, isLoading } = useLocationFormat(location_address, latitude, longitude);

  if (!hasLocationData(location_address, latitude, longitude)) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 bg-muted/30 rounded-md px-2 py-1">
      <MapPin className="h-3 w-3 text-primary" />
      <span className="font-medium text-xs">
        {formattedLocation}
        {isLoading && (
          <span className="ml-1 text-xs text-muted-foreground">(loading...)</span>
        )}
      </span>
    </div>
  );
};

const CommunityPreview = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [realComplaints, setRealComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real complaints when component mounts
  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        setLoading(true);
        const { data, error } = await getPublicComplaints();
        
        if (error) {
          console.error('CommunityPreview: Error fetching complaints:', error);
          // Fall back to sample data if API fails
          setRealComplaints([]);
        } else {
          // Take only first 3 complaints for preview
          setRealComplaints(data?.slice(0, 3) || []);
        }
      } catch (err) {
        console.error('CommunityPreview: Error in fetchComplaints:', err);
        setRealComplaints([]);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  // Sample complaints as fallback
  const sampleComplaints = [
    {
      id: 1,
      category: "Garbage",
      description: "Overflowing garbage bins at Green Park, causing health hazards...",
      location: "Green Park, Sector 15",
      status: "Open",
      timeAgo: "2 hours ago"
    },
    {
      id: 2,
      category: "Waterlogging", 
      description: "Severe waterlogging on Main Street after recent rains...",
      location: "Main Street, Downtown",
      status: "In Progress",
      timeAgo: "1 day ago"
    },
    {
      id: 3,
      category: "Street Lights",
      description: "Multiple street lights not working in residential area...",
      location: "Residential Area, Block A",
      status: "Open",
      timeAgo: "3 days ago"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'in_progress': return 'In Progress';
      case 'resolved': return 'Resolved';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Determine which complaints to show
  const complaintsToShow = realComplaints.length > 0 ? realComplaints : sampleComplaints;

  return (
    <div className="py-16 px-4 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Community Voice</h2>
          <p className="text-muted-foreground">See what issues your neighbors are reporting and join the conversation to make our city better.</p>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading community updates...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {complaintsToShow.map((complaint) => (
            <Card key={complaint.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <Badge variant="outline">
                    {complaint.category?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'General'}
                  </Badge>
                  <Badge className={getStatusColor(complaint.status)}>
                    {getStatusText(complaint.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Location */}
                {complaint.location_address || complaint.latitude ? (
                  <LocationDisplay 
                    location_address={complaint.location_address}
                    latitude={complaint.latitude}
                    longitude={complaint.longitude}
                  />
                ) : complaint.location ? (
                  <div className="space-y-2 text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-1 bg-muted/30 rounded-md px-2 py-1">
                      <MapPin className="h-3 w-3 text-primary" />
                      <span className="font-medium">{complaint.location}</span>
                    </div>
                  </div>
                ) : null}
                
                {/* Description */}
                <div className="bg-gradient-to-r from-muted/5 to-muted/10 border border-border/50 rounded-lg p-3 mb-3 hover:shadow-md transition-all duration-300">
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0 w-1.5 h-1.5 bg-primary rounded-full mt-1.5 animate-pulse"></div>
                    <div className="flex-1">
                      <h4 className="text-xs font-semibold text-muted-foreground mb-1">Complaint Description:</h4>
                      <p className="text-sm line-clamp-2 font-medium leading-relaxed">{complaint.description}</p>
                    </div>
                  </div>
                </div>
                
                {/* Date/Time */}
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {complaint.created_at ? formatDate(complaint.created_at) : complaint.timeAgo}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        )}

        <div className="text-center">
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => navigate('/community')}
          >
            View More →
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CommunityPreview;
