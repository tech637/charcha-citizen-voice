import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useComplaint } from "@/contexts/ComplaintContext";
import { getUserComplaints, createComplaint } from "@/lib/complaints";
import { Complaint } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { FileText, Clock, CheckCircle, AlertCircle, Plus, LogOut, MapPin, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import ComplaintForm from "./ComplaintForm";
import { hasLocationData } from "@/lib/locationUtils";
import { useLocationFormat } from "@/hooks/useLocationFormat";
import Navigation from "./Navigation";
import JoinRequestsTab from "./JoinRequestsTab";

// Location display component for Dashboard
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
    <div className="flex items-center space-x-2 text-sm text-muted-foreground bg-muted/30 rounded-md px-3 py-2 mb-4">
      <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
      <span className="font-medium">
        {formattedLocation}
        {isLoading && (
          <span className="ml-2 text-xs text-muted-foreground">(loading...)</span>
        )}
      </span>
    </div>
  );
};

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { pendingComplaint, clearPendingComplaint } = useComplaint();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("complaints");
  const [hasApprovedMembership, setHasApprovedMembership] = useState(false);
  const { toast } = useToast();

  // Initialize tab from URL parameters
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'requests') {
      setActiveTab('requests');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch complaints
        const { data: complaintsData, error: complaintsError } = await getUserComplaints(user.id);
        if (complaintsError) {
          console.error("Error fetching complaints:", complaintsError);
        } else {
          setComplaints(complaintsData || []);
        }

        // Check approved membership
        const { data: memberships, error: membershipsError } = await supabase
          .from('user_communities')
          .select('status')
          .eq('user_id', user.id)
          .eq('status', 'approved')
          .limit(1);
        if (!membershipsError) {
          setHasApprovedMembership((memberships || []).length > 0);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Realtime updates for user's own complaints
    const channel = supabase
      .channel(`complaints_user_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints', filter: `user_id=eq.${user.id}` }, async () => {
        const { data } = await getUserComplaints(user.id);
        setComplaints(data || []);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  // Handle pending complaint for OAuth users
  useEffect(() => {
    const submitPendingComplaint = async () => {
      if (user && pendingComplaint) {
        try {
          const { data, error } = await createComplaint(pendingComplaint, user.id);
          
          if (error) {
            throw error;
          }

          toast({
            title: "Complaint Submitted!",
            description: "Your complaint has been submitted successfully. You'll receive updates via email.",
          });

          clearPendingComplaint();
          
          // Refresh complaints list
          const { data: updatedComplaints } = await getUserComplaints(user.id);
          setComplaints(updatedComplaints || []);
        } catch (error: any) {
          toast({
            title: "Submission Failed",
            description: error.message || "Failed to submit complaint. Please try again.",
            variant: "destructive",
          });
        }
      }
    };

    submitPendingComplaint();
  }, [user, pendingComplaint, clearPendingComplaint, toast]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (!user) {
    return null;
  }

  const pendingCount = complaints.filter(c => c.status === 'pending').length;
  const resolvedCount = complaints.filter(c => c.status === 'resolved').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "in_progress":
        return <Badge className="bg-orange-500"><AlertCircle className="w-3 h-3 mr-1" />In Progress</Badge>;
      case "resolved":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Resolved</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.user_metadata?.full_name || user.email}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {user.user_metadata?.full_name && (
                <>
                  <span className="font-medium">Email:</span> {user.email}
                </>
              )}
            </p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{complaints.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resolvedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="complaints" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              My Complaints
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Join Requests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="complaints" className="space-y-6">
            {/* Quick Actions */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => navigate("/")}
                  className="flex items-center gap-2"
                  disabled={!hasApprovedMembership}
                  title={hasApprovedMembership ? undefined : 'Join request must be approved to file a complaint'}
                >
                  <Plus className="w-4 h-4" />
                  File New Complaint
                </Button>
                <Button variant="outline">
                  Track Existing Complaint
                </Button>
              </div>
            </div>

            {/* Quick file for approved users */}
            {hasApprovedMembership && (
              <div>
                <h2 className="text-xl font-semibold mb-4">File a Complaint</h2>
                <ComplaintForm />
              </div>
            )}

            {/* Recent Complaints */}
            <div>
              <h2 className="text-xl font-semibold mb-4">My Complaints</h2>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading your complaints...</p>
            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">You haven't filed any complaints yet.</p>
              <Button onClick={() => navigate("/")}>
                <Plus className="h-4 w-4 mr-2" />
                File Your First Complaint
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.map((complaint) => (
                <Card key={complaint.id} className="hover:shadow-lg transition-all duration-300 border-border/60 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg capitalize bg-primary/10 text-primary px-3 py-1 rounded-lg inline-block">
                          {complaint.category.replace('-', ' ')}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Filed on {new Date(complaint.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {getStatusBadge(complaint.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <LocationDisplay 
                      location_address={complaint.location_address}
                      latitude={complaint.latitude}
                      longitude={complaint.longitude}
                    />
                    <div className="bg-gradient-to-r from-muted/5 to-muted/10 border border-border/50 rounded-xl p-4 shadow-sm mb-4 hover:shadow-md transition-all duration-300 hover:border-primary/20">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2 animate-pulse"></div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-muted-foreground mb-2">Complaint Description:</h4>
                          <p className="text-foreground text-base leading-relaxed font-medium">
                            {complaint.description}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      {complaint.status === 'pending' && (
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
            </div>
          </TabsContent>

          <TabsContent value="requests">
            <JoinRequestsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;