import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Building2, 
  MapPin, 
  Users, 
  Shield, 
  User,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  FileText
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getCommunityLeaders } from '@/lib/leaders';
import { LeaderType, CommunityLeader } from '@/lib/leaders';
import { useToast } from '@/hooks/use-toast';

interface LeaderCommunityInfoProps {
  communityId: string;
  leaderType: LeaderType;
}

interface CommunityInfo {
  id: string;
  name: string;
  description: string;
  location: string;
  locality_data?: any;
  created_at: string;
  admin_id: string;
  admin_name?: string;
  admin_email?: string;
  total_members: number;
  total_complaints: number;
  total_transactions: number;
  total_amount: number;
}

const LeaderCommunityInfo: React.FC<LeaderCommunityInfoProps> = ({ communityId, leaderType }) => {
  const [communityInfo, setCommunityInfo] = useState<CommunityInfo | null>(null);
  const [leaders, setLeaders] = useState<CommunityLeader[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCommunityInfo();
  }, [communityId]);

  const fetchCommunityInfo = async () => {
    try {
      setLoading(true);
      
      // Fetch community details
      const { data: community, error: communityError } = await supabase
        .from('communities')
        .select(`
          id,
          name,
          description,
          location,
          locality_data,
          created_at,
          admin_id,
          users!communities_admin_id_fkey (
            full_name,
            email
          )
        `)
        .eq('id', communityId)
        .single();

      if (communityError) {
        throw communityError;
      }

      // Fetch community members count
      const { count: membersCount } = await supabase
        .from('user_communities')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId)
        .eq('status', 'approved');

      // Fetch complaints count
      const { count: complaintsCount } = await supabase
        .from('complaints')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId);

      // Fetch finance summary
      const { data: transactions, error: transactionsError } = await supabase
        .from('community_transactions')
        .select('amount, transaction_type')
        .eq('community_id', communityId);

      if (transactionsError) {
        console.warn('Error fetching transactions:', transactionsError);
      }

      const totalAmount = transactions?.reduce((sum, t) => {
        return sum + (t.transaction_type === 'income' ? t.amount : -t.amount);
      }, 0) || 0;

      // Fetch community leaders
      const { data: leadersData, error: leadersError } = await getCommunityLeaders(communityId);
      
      if (leadersError) {
        console.warn('Error fetching leaders:', leadersError);
      }

      setCommunityInfo({
        id: community.id,
        name: community.name,
        description: community.description,
        location: community.location,
        locality_data: community.locality_data,
        created_at: community.created_at,
        admin_id: community.admin_id,
        admin_name: community.users?.full_name,
        admin_email: community.users?.email,
        total_members: membersCount || 0,
        total_complaints: complaintsCount || 0,
        total_transactions: transactions?.length || 0,
        total_amount: totalAmount
      });

      setLeaders(leadersData || []);

    } catch (error) {
      console.error('Error fetching community info:', error);
      toast({
        title: "Error",
        description: "Failed to fetch community information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getLeaderTypeLabel = (type: string) => {
    switch (type) {
      case 'mp': return 'MP';
      case 'mla': return 'MLA';
      case 'councillor': return 'Councillor';
      default: return type.toUpperCase();
    }
  };

  const getLeaderTypeColor = (type: string) => {
    switch (type) {
      case 'mp': return 'bg-purple-100 text-purple-800';
      case 'mla': return 'bg-green-100 text-green-800';
      case 'councillor': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading community information...</p>
      </div>
    );
  }

  if (!communityInfo) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Community Not Found</h3>
          <p className="text-muted-foreground">
            The requested community information could not be loaded.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Community Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Community Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{communityInfo.name}</h3>
            <p className="text-gray-600 mt-1">{communityInfo.description}</p>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{communityInfo.location}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Created on {formatDate(communityInfo.created_at)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Community Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{communityInfo.total_members}</div>
            <p className="text-xs text-muted-foreground">
              Active community members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{communityInfo.total_complaints}</div>
            <p className="text-xs text-muted-foreground">
              All complaints filed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finance Summary</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{communityInfo.total_amount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {communityInfo.total_transactions} transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Community President */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Community President
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback>
                {getInitials(communityInfo.admin_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">
                {communityInfo.admin_name || 'Unknown'}
              </h4>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <span>{communityInfo.admin_email}</span>
                </div>
              </div>
            </div>
            <Badge className="bg-blue-100 text-blue-800">
              President
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Community Leaders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Community Leaders
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leaders.length === 0 ? (
            <div className="text-center py-6">
              <User className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No leaders assigned yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {leaders.map((leader) => (
                <div key={leader.leader_id} className="flex items-center gap-4 p-3 border rounded-lg">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {getInitials(leader.user_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {leader.user_name}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span>{leader.user_email}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Assigned {new Date(leader.assigned_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={getLeaderTypeColor(leader.leader_type)}>
                    {getLeaderTypeLabel(leader.leader_type)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Locality Information */}
      {communityInfo.locality_data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Locality Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {communityInfo.locality_data.ward && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-1">Ward</h4>
                  <p className="text-sm text-gray-600">{communityInfo.locality_data.ward}</p>
                </div>
              )}
              {communityInfo.locality_data.mla && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-1">MLA Constituency</h4>
                  <p className="text-sm text-gray-600">{communityInfo.locality_data.mla}</p>
                </div>
              )}
              {communityInfo.locality_data.mp && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-1">MP Constituency</h4>
                  <p className="text-sm text-gray-600">{communityInfo.locality_data.mp}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LeaderCommunityInfo;
