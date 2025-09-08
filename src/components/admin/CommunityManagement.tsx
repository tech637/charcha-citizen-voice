import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { createCommunity, getAllCommunities } from '@/lib/communities';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Plus, 
  MapPin, 
  Users, 
  Calendar, 
  Building2, 
  Edit, 
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

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

const CommunityManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    latitude: '',
    longitude: ''
  });

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const { data, error } = await getAllCommunities();
      if (error) {
        throw error;
      }
      setCommunities(data || []);
    } catch (error: any) {
      console.error('Error fetching communities:', error);
      toast({
        title: "Error",
        description: "Failed to fetch communities",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a community",
        variant: "destructive"
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Community name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsCreating(true);
      
      const communityData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        location: formData.location.trim() || undefined,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined
      };

      const { data, error } = await createCommunity(communityData, user.id);
      
      if (error) {
        throw error;
      }

      toast({
        title: "Success!",
        description: "Community created successfully",
      });

      // Reset form and refresh list
      setFormData({
        name: '',
        description: '',
        location: '',
        latitude: '',
        longitude: ''
      });
      setShowCreateForm(false);
      fetchCommunities();
      
    } catch (error: any) {
      console.error('Error creating community:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create community",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Community Management</h2>
          <p className="text-gray-600">Create and manage communities for users to join</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {showCreateForm ? 'Cancel' : 'Create Community'}
        </Button>
      </div>

      {/* Create Community Form */}
      {showCreateForm && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Building2 className="h-5 w-5" />
              Create New Community
            </CardTitle>
            <CardDescription>
              Fill in the details to create a new community that users can join
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Community Name *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Downtown Residents"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium">
                    Location
                  </Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g., Downtown Area, City Center"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the community and its purpose..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude" className="text-sm font-medium">
                    Latitude (Optional)
                  </Label>
                  <Input
                    id="latitude"
                    name="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    placeholder="28.6139"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="longitude" className="text-sm font-medium">
                    Longitude (Optional)
                  </Label>
                  <Input
                    id="longitude"
                    name="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    placeholder="77.2090"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isCreating || !formData.name.trim()}
                  className="flex items-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Create Community
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Communities List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Existing Communities</h3>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            {communities.length} Total
          </Badge>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading communities...</p>
          </div>
        ) : communities.length === 0 ? (
          <Card className="text-center py-8">
            <CardContent>
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Communities Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first community to get started
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Community
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {communities.map((community) => (
              <Card key={community.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">{community.name}</CardTitle>
                    </div>
                    <Badge variant={community.is_active ? "default" : "secondary"}>
                      {community.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {community.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {community.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  {community.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <MapPin className="h-3 w-3" />
                      <span>{community.location}</span>
                    </div>
                  )}
                  
                  {community.latitude && community.longitude && (
                    <div className="text-xs text-muted-foreground mb-3">
                      Coordinates: {community.latitude.toFixed(4)}, {community.longitude.toFixed(4)}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Created {formatDate(community.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>0 members</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityManagement;