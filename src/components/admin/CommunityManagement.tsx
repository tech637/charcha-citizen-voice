import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { createCommunity, getAllCommunities, deleteCommunity, enhancedDeleteCommunity, getPendingMembershipRequests, updateMembershipStatus, assignCommunityPresident } from '@/lib/communities';
import { assignCommunityLeader, removeCommunityLeader, getCommunityLeaders } from '@/lib/leaders';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Plus, 
  MapPin, 
  Users, 
  Calendar, 
  Building2, 
  Edit, 
  Trash2,
  CheckCircle,
  AlertCircle,
  Shield,
  User,
  X
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [activeCommunity, setActiveCommunity] = useState<Community | null>(null);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<Array<{
    id: string;
    user_id: string;
    role: string;
    address?: string;
    block_name?: string;
    blocks?: { name: string } | null;
    users?: { full_name?: string | null; email?: string | null } | null;
  }>>([]);
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);
  const [presidentEmails, setPresidentEmails] = useState<{ [key: string]: string }>({});
  const [assigningPresidentId, setAssigningPresidentId] = useState<string | null>(null);
  
  // Leader assignment state
  const [leaderEmails, setLeaderEmails] = useState<{ [key: string]: { mp: string; mla: string; councillor: string } }>({});
  const [assigningLeaderId, setAssigningLeaderId] = useState<string | null>(null);
  const [communityLeaders, setCommunityLeaders] = useState<{ [key: string]: any[] }>({});
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    latitude: '',
    longitude: '',
    leader_name: '',
    leader_email: '',
    leader_mobile: '',
    leader_address: ''
  });

  useEffect(() => {
    fetchCommunities();
  }, []);

  // Fetch leaders for each community
  useEffect(() => {
    if (communities.length > 0) {
      fetchAllCommunityLeaders();
    }
  }, [communities]);

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

  const handleDeleteCommunity = async (communityId: string, communityName: string) => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in', variant: 'destructive' });
      return;
    }

    const confirmed = window.confirm(`Remove community "${communityName}"? This will hide it from users.`);
    if (!confirmed) return;

    try {
      setDeletingId(communityId);
      
      // Try enhanced delete first, fallback to original delete
      console.log('🔄 Attempting enhanced delete...');
      let result = await enhancedDeleteCommunity(communityId, user.id);
      
      if (result.error) {
        console.log('🔄 Enhanced delete failed, trying original method...');
        result = await deleteCommunity(communityId, user.id);
      }
      
      if (result.error) throw result.error as any;
      
      // Enhanced feedback based on method used
      const message = result.data?.message || `Community ${communityName} deleted successfully.`;
      toast({ 
        title: 'Community Deleted', 
        description: message,
        variant: result.data?.method === 'enhanced' ? 'default' : 'default'
      });
      
      // Log cleanup steps if available
      if (result.data?.steps?.length > 0) {
        console.log('🧹 Cleanup steps completed:', result.data.steps);
      }
      
      fetchCommunities();
    } catch (error: any) {
      console.error('Delete community error:', error);
      toast({ 
        title: 'Delete Failed', 
        description: error.message || 'Failed to delete community. Please check console for details.',
        variant: 'destructive'
      });
    } finally {
      setDeletingId(null);
    }
  };

  const openRequests = async (community: Community) => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in', variant: 'destructive' });
      return;
    }
    setActiveCommunity(community);
    setRequestModalOpen(true);
    setLoadingRequests(true);
    try {
      const { data, error } = await getPendingMembershipRequests(community.id, user.id);
      if (error) throw error as any;
      // data already includes users and blocks per lib function
      setPendingRequests((data as any) || []);
    } catch (error: any) {
      console.error('Load requests error:', error);
      toast({ title: 'Error', description: error.message || 'Failed to load requests', variant: 'destructive' });
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleRequestUpdate = async (membershipId: string, status: 'approved' | 'rejected') => {
    if (!user || !activeCommunity) return;
    try {
      setUpdatingRequestId(membershipId);
      const { error } = await updateMembershipStatus(membershipId, status, user.id);
      if (error) throw error as any;
      toast({ title: `Request ${status}`, description: `Membership set to ${status}.` });
      setPendingRequests(prev => prev.filter(r => r.id !== membershipId));
    } catch (error: any) {
      console.error('Update request error:', error);
      toast({ title: 'Error', description: error.message || 'Failed to update request', variant: 'destructive' });
    } finally {
      setUpdatingRequestId(null);
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
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        leader_name: formData.leader_name.trim() || undefined,
        leader_email: formData.leader_email.trim() || undefined,
        leader_mobile: formData.leader_mobile.trim() || undefined,
        leader_address: formData.leader_address.trim() || undefined
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
        longitude: '',
        leader_name: '',
        leader_email: '',
        leader_mobile: '',
        leader_address: ''
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

  const handleAssignPresident = async (communityId: string) => {
    if (!user) return;
    const presidentEmail = presidentEmails[communityId] || '';
    if (!presidentEmail.trim()) {
      toast({ title: 'President email required', variant: 'destructive' });
      return;
    }
    try {
      setAssigningPresidentId(communityId);
      const { error } = await assignCommunityPresident(communityId, presidentEmail.trim(), user.id);
      if (error) throw error as any;
      toast({ title: 'President Assigned', description: `Assigned ${presidentEmail}` });
      setPresidentEmails(prev => ({ ...prev, [communityId]: '' }));
      fetchCommunities();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to assign president', variant: 'destructive' });
    } finally {
      setAssigningPresidentId(null);
    }
  };

  const fetchAllCommunityLeaders = async () => {
    try {
      const leadersData: { [key: string]: any[] } = {};
      await Promise.all(
        communities.map(async (community) => {
          const { data, error } = await getCommunityLeaders(community.id);
          if (!error && data) {
            leadersData[community.id] = data;
          }
        })
      );
      setCommunityLeaders(leadersData);
    } catch (error) {
      console.error('Error fetching community leaders:', error);
    }
  };

  const handleAssignLeader = async (communityId: string, leaderType: 'mp' | 'mla' | 'councillor') => {
    if (!user) return;
    const email = leaderEmails[communityId]?.[leaderType] || '';
    if (!email.trim()) {
      toast({ title: `${leaderType.toUpperCase()} email required`, variant: 'destructive' });
      return;
    }
    try {
      setAssigningLeaderId(communityId);
      const { error } = await assignCommunityLeader(communityId, email.trim(), leaderType, user.id);
      if (error) throw error as any;
      toast({ title: `${leaderType.toUpperCase()} Assigned`, description: `Assigned ${email}` });
      setLeaderEmails(prev => ({
        ...prev,
        [communityId]: {
          ...prev[communityId],
          [leaderType]: ''
        }
      }));
      fetchAllCommunityLeaders();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || `Failed to assign ${leaderType.toUpperCase()}`, variant: 'destructive' });
    } finally {
      setAssigningLeaderId(null);
    }
  };

  const handleRemoveLeader = async (leaderId: string, leaderType: string) => {
    if (!user) return;
    try {
      const { error } = await removeCommunityLeader(leaderId, user.id);
      if (error) throw error as any;
      toast({ title: `${leaderType.toUpperCase()} Removed`, description: 'Leader assignment removed successfully' });
      fetchAllCommunityLeaders();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to remove leader', variant: 'destructive' });
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

              {/* Leader Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="leader_name" className="text-sm font-medium">
                    Leader Name
                  </Label>
                  <Input
                    id="leader_name"
                    name="leader_name"
                    value={formData.leader_name}
                    onChange={handleInputChange}
                    placeholder="e.g., Ramesh Kumar"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leader_email" className="text-sm font-medium">
                    Leader Email
                  </Label>
                  <Input
                    id="leader_email"
                    name="leader_email"
                    type="email"
                    value={formData.leader_email}
                    onChange={handleInputChange}
                    placeholder="leader@example.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="leader_mobile" className="text-sm font-medium">
                    Leader Mobile
                  </Label>
                  <Input
                    id="leader_mobile"
                    name="leader_mobile"
                    value={formData.leader_mobile}
                    onChange={handleInputChange}
                    placeholder="+91XXXXXXXXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leader_address" className="text-sm font-medium">
                    Leader Address
                  </Label>
                  <Input
                    id="leader_address"
                    name="leader_address"
                    value={formData.leader_address}
                    onChange={handleInputChange}
                    placeholder="Leader office/residence"
                  />
                </div>
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
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => openRequests(community)}
                    >
                      Pending Requests
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      disabled={deletingId === community.id}
                      onClick={() => handleDeleteCommunity(community.id, community.name)}
                    >
                      {deletingId === community.id ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1" />
                          Removing...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-3 w-3 mr-1" />
                          Remove
                        </>
                      )}
                    </Button>
                  </div>

                {/* Assign President */}
                <div className="mt-3 border-t pt-3">
                  <div className="text-xs font-medium mb-1">Assign/Replace President</div>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="president@example.com"
                      value={presidentEmails[community.id] || ''}
                      onChange={(e) => setPresidentEmails(prev => ({...prev, [community.id]: e.target.value}))}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAssignPresident(community.id)}
                      disabled={assigningPresidentId === community.id}
                    >
                      {assigningPresidentId === community.id ? 'Assigning…' : 'Assign'}
                    </Button>
                  </div>
                </div>

                {/* Assign Leaders */}
                <div className="mt-3 border-t pt-3">
                  <div className="text-xs font-medium mb-2">Assign Leaders (MP, MLA, Councillor)</div>
                  
                  {/* Current Leaders */}
                  {communityLeaders[community.id] && communityLeaders[community.id].length > 0 && (
                    <div className="mb-3 space-y-1">
                      {communityLeaders[community.id].map((leader) => (
                        <div key={leader.leader_id} className="flex items-center justify-between bg-gray-50 p-2 rounded text-xs">
                          <div className="flex items-center gap-2">
                            <Badge className={
                              leader.leader_type === 'mp' ? 'bg-purple-100 text-purple-800' :
                              leader.leader_type === 'mla' ? 'bg-green-100 text-green-800' :
                              'bg-blue-100 text-blue-800'
                            }>
                              {leader.leader_type.toUpperCase()}
                            </Badge>
                            <span className="font-medium">{leader.user_name}</span>
                            <span className="text-gray-500">({leader.user_email})</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveLeader(leader.leader_id, leader.leader_type)}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Leader Assignment Inputs */}
                  <div className="space-y-2">
                    {/* MP Assignment */}
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="MP email"
                        value={leaderEmails[community.id]?.mp || ''}
                        onChange={(e) => setLeaderEmails(prev => ({
                          ...prev,
                          [community.id]: {
                            ...prev[community.id],
                            mp: e.target.value
                          }
                        }))}
                        className="flex-1 text-xs"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleAssignLeader(community.id, 'mp')}
                        disabled={assigningLeaderId === community.id}
                        className="text-xs px-2"
                      >
                        {assigningLeaderId === community.id ? '...' : 'MP'}
                      </Button>
                    </div>

                    {/* MLA Assignment */}
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="MLA email"
                        value={leaderEmails[community.id]?.mla || ''}
                        onChange={(e) => setLeaderEmails(prev => ({
                          ...prev,
                          [community.id]: {
                            ...prev[community.id],
                            mla: e.target.value
                          }
                        }))}
                        className="flex-1 text-xs"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleAssignLeader(community.id, 'mla')}
                        disabled={assigningLeaderId === community.id}
                        className="text-xs px-2"
                      >
                        {assigningLeaderId === community.id ? '...' : 'MLA'}
                      </Button>
                    </div>

                    {/* Councillor Assignment */}
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="Councillor email"
                        value={leaderEmails[community.id]?.councillor || ''}
                        onChange={(e) => setLeaderEmails(prev => ({
                          ...prev,
                          [community.id]: {
                            ...prev[community.id],
                            councillor: e.target.value
                          }
                        }))}
                        className="flex-1 text-xs"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleAssignLeader(community.id, 'councillor')}
                        disabled={assigningLeaderId === community.id}
                        className="text-xs px-2"
                      >
                        {assigningLeaderId === community.id ? '...' : 'Councillor'}
                      </Button>
                    </div>
                  </div>
                </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Pending Requests Dialog */}
      <Dialog open={requestModalOpen} onOpenChange={setRequestModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pending Join Requests {activeCommunity ? `– ${activeCommunity.name}` : ''}</DialogTitle>
            <p className="sr-only" id="pending-requests-desc">Review and manage pending membership requests.</p>
          </DialogHeader>
          {loadingRequests ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading requests...</p>
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">No pending requests.</div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div key={req.id} className="flex items-start justify-between border rounded-md p-3">
                  <div>
                    <div className="font-medium">{req.users?.full_name || req.users?.email || 'User'}</div>
                    <div className="text-sm text-muted-foreground">
                      Block: {req.block_name || req.blocks?.name || '—'} • Role: {req.role} {req.address ? `• ${req.address}` : ''}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={updatingRequestId === req.id} onClick={() => handleRequestUpdate(req.id, 'rejected')}>
                      {updatingRequestId === req.id ? '...' : 'Reject'}
                    </Button>
                    <Button size="sm" disabled={updatingRequestId === req.id} onClick={() => handleRequestUpdate(req.id, 'approved')}>
                      {updatingRequestId === req.id ? '...' : 'Approve'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommunityManagement;