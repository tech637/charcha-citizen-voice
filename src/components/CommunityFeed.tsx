import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getAllCommunities } from '@/lib/communities';
import { getCommunityMembers } from '@/lib/communities';
import { useNavigate } from 'react-router-dom';
import { Building2, MapPin, Users, Calendar, Plus } from 'lucide-react';

interface Community {
  id: string;
  name: string;
  description: string;
  location: string;
  latitude?: number;
  longitude?: number;
  admin_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const CommunityFeed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const { data, error } = await getAllCommunities();
      if (error) {
        console.error('Error fetching communities:', error);
      } else {
        setCommunities(data || []);
        
        // Fetch member counts for each community
        const counts: Record<string, number> = {};
        for (const community of data || []) {
          try {
            const { data: members } = await getCommunityMembers(community.id);
            counts[community.id] = members?.length || 0;
          } catch (error) {
            console.error(`Error fetching members for ${community.name}:`, error);
            counts[community.id] = 0;
          }
        }
        setMemberCounts(counts);
      }
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading communities...</p>
          </div>
        </div>
      </div>
    );
  }

    return (
    <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Communities</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Join communities to connect with others and share local issues. All users are automatically part of the India community.
          </p>
        </div>

        {/* Communities Grid */}
        {communities.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Communities Yet</h3>
              <p className="text-muted-foreground mb-6">
                Communities will appear here once they are created by administrators.
              </p>
              {user && (
                <Button onClick={() => window.location.href = '/dashboard'}>
                  <Plus className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((community) => (
              <Card key={community.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{community.name}</CardTitle>
                      </div>
                    <Badge variant={community.is_active ? "default" : "secondary"}>
                      {community.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  {community.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {community.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  {community.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <MapPin className="h-4 w-4" />
                      <span>{community.location}</span>
                      </div>
                    )}

                  {community.latitude && community.longitude && (
                    <div className="text-xs text-muted-foreground mb-3 bg-gray-100 p-2 rounded">
                      📍 {community.latitude.toFixed(4)}, {community.longitude.toFixed(4)}
              </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                      <span>Created {formatDate(community.created_at)}</span>
                          </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{memberCounts[community.id] || 0} members</span>
                        </div>
                      </div>

                          <div className="space-y-2">
                    {community.name === 'India' ? (
                      <Button className="w-full bg-green-600 hover:bg-green-700">
                        <Users className="h-4 w-4 mr-2" />
                        You're Already a Member
                      </Button>
                    ) : (
                      <Button className="w-full" disabled={!community.is_active}>
                        {community.is_active ? 'Join Community' : 'Community Inactive'}
                      </Button>
                    )}
                    {user && (
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        size="sm"
                        onClick={() => {
                          navigate(`/communities/${community.name.toLowerCase()}`);
                        }}
                      >
                        View Community Feed
                      </Button>
                    )}
                                </div>
                </CardContent>
              </Card>
                              ))}
                          </div>
                        )}

        {/* Call to Action */}
        {user && communities.length > 0 && (
          <div className="text-center mt-12">
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="py-8">
                <h3 className="text-xl font-semibold mb-2">Want to Create a Community?</h3>
                <p className="text-muted-foreground mb-4">
                  Only administrators can create new communities. Contact your local admin to request a new community.
                </p>
                <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
                  <Plus className="h-4 w-4 mr-2" />
                  Go to Dashboard
                            </Button>
              </CardContent>
            </Card>
                  </div>
              )}
      </div>
    </div>
  );
};

export default CommunityFeed;
