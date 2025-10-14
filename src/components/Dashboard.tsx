import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useComplaint } from "@/contexts/ComplaintContext";
import { getUserComplaints, createComplaint } from "@/lib/complaints";
import { getUserCommunities } from "@/lib/communities";
import { Complaint } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { FileText, Clock, CheckCircle, AlertCircle, Plus, LogOut, MapPin, Users, Home, Building2, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { hasLocationData } from "@/lib/locationUtils";
import { useLocationFormat } from "@/hooks/useLocationFormat";
import Navigation from "./Navigation";
import JoinRequestsTab from "./JoinRequestsTab";
import { LoginDialog } from "./LoginDialog";

// Mobile Bottom Navigation Component
const MobileBottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleHomeClick = async () => {
    if (!user) {
      navigate('/');
      return;
    }

    // For logged-in users, redirect to their community if they have joined one
    try {
      const { data: communities } = await getUserCommunities(user.id);
      if (communities && communities.length > 0) {
        const communityName = communities[0].communities?.name;
        if (communityName) {
          navigate(`/communities/${encodeURIComponent(communityName)}`);
          return;
        }
      }
    } catch (error) {
      console.error('Error fetching user communities:', error);
    }

    // If no community joined or error, stay on home page
    navigate('/');
  };

  const handleCommunitiesClick = async () => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }

    // For logged-in users, redirect to their specific community
    try {
      const { data: communities } = await getUserCommunities(user.id);
      if (communities && communities.length > 0) {
        const communityName = communities[0].communities?.name;
        if (communityName) {
          navigate(`/communities/${encodeURIComponent(communityName)}`);
        } else {
          alert("Please join a community first. You can join a community from the home page.");
        }
      } else {
        alert("Please join a community first. You can join a community from the home page.");
      }
    } catch (error) {
      console.error('Error fetching user communities:', error);
      alert("Please join a community first. You can join a community from the home page.");
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
      <div className="bg-white border-t border-gray-200 shadow-lg">
        <div className="flex items-center justify-around py-2">
                 {user ? (
                   // Logged in user: Show Communities (left) and Dashboard (right)
                   <>
                     <button
                       onClick={handleCommunitiesClick}
                       className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-colors ${
                         isActive('/communities') ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                       }`}
                     >
                       <Building2 className={`h-5 w-5 ${isActive('/communities') ? 'text-blue-600 fill-blue-600' : 'text-gray-500 fill-gray-500'}`} />
                       <span className="text-xs mt-1 font-medium">Communities</span>
                     </button>
                     
                     <button
                       onClick={() => navigate('/dashboard')}
                       className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-colors ${
                         isActive('/dashboard') ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                       }`}
                     >
                       <User className={`h-5 w-5 ${isActive('/dashboard') ? 'text-blue-600 fill-blue-600' : 'text-gray-500 fill-gray-500'}`} />
                       <span className="text-xs mt-1 font-medium">Dashboard</span>
                     </button>
                   </>
                 ) : (
            // Not logged in: Show Home, Communities, and Login
            <>
              <button
                onClick={handleHomeClick}
                className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-colors ${
                  isActive('/') ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Home className={`h-5 w-5 ${isActive('/') ? 'text-blue-600 fill-blue-600' : 'text-gray-500 fill-gray-500'}`} />
                <span className="text-xs mt-1 font-medium">Home</span>
              </button>
              
              <button
                onClick={handleCommunitiesClick}
                className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-colors ${
                  isActive('/communities') ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Building2 className={`h-5 w-5 ${isActive('/communities') ? 'text-blue-600 fill-blue-600' : 'text-gray-500 fill-gray-500'}`} />
                <span className="text-xs mt-1 font-medium">Communities</span>
              </button>
              
              <button
                onClick={() => setShowLoginDialog(true)}
                className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-colors ${
                  showLoginDialog ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <User className={`h-5 w-5 ${showLoginDialog ? 'text-blue-600 fill-blue-600' : 'text-gray-500 fill-gray-500'}`} />
                <span className="text-xs mt-1 font-medium">Login</span>
              </button>
            </>
          )}
        </div>
      </div>

      <LoginDialog 
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
      />
    </div>
  );
};

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
    <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
      <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
      <span className="font-medium">
        {formattedLocation}
        {isLoading && (
          <span className="ml-2 text-xs text-gray-500">(loading...)</span>
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
        return <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-200 px-3 py-1 rounded-full font-medium"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "in_progress":
        return <Badge className="bg-orange-100 text-orange-700 border border-orange-200 px-3 py-1 rounded-full font-medium"><AlertCircle className="w-3 h-3 mr-1" />In Progress</Badge>;
      case "resolved":
        return <Badge className="bg-green-100 text-green-700 border border-green-200 px-3 py-1 rounded-full font-medium"><CheckCircle className="w-3 h-3 mr-1" />Resolved</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 border border-gray-200 px-3 py-1 rounded-full font-medium">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-20 md:pb-8">
      {/* Desktop Navigation Only */}
      <div className="hidden md:block">
        <Navigation />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user.user_metadata?.full_name || user.email}</p>
            <p className="text-xs text-gray-500 mt-1">
              {user.user_metadata?.full_name && (
                <>
                  <span className="font-medium">Email:</span> {user.email}
                </>
              )}
            </p>
          </div>
          <Button variant="outline" onClick={handleSignOut} className="border-2 border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white rounded-2xl shadow-lg border-0 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-semibold text-gray-600">Total Complaints</CardTitle>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{complaints.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white rounded-2xl shadow-lg border-0 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-semibold text-gray-600">Pending</CardTitle>
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{pendingCount}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white rounded-2xl shadow-lg border-0 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-semibold text-gray-600">Resolved</CardTitle>
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{resolvedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100 rounded-xl p-1">
            <TabsTrigger value="complaints" className="flex items-center gap-2 rounded-lg font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <FileText className="h-4 w-4" />
              My Complaints
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2 rounded-lg font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Users className="h-4 w-4" />
              Join Requests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="complaints" className="space-y-6">
            {/* My Complaints List */}
            <div>
              <h2 className="text-xl font-semibold mb-6 text-gray-900">My Complaints</h2>
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mb-4">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600">Loading your complaints...</p>
                </div>
              ) : complaints.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mb-4">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Complaints Yet</h3>
                  <p className="text-gray-600 mb-6">You haven't filed any complaints yet.</p>
                  <Button onClick={() => navigate("/")} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                    <Plus className="h-4 w-4 mr-2" />
                    File Your First Complaint
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {complaints.map((complaint) => (
                    <Card key={complaint.id} className="bg-white rounded-2xl shadow-lg border-0 hover:shadow-xl transition-all duration-300">
                      <CardHeader className="pb-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <Badge className="bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1 rounded-full font-medium mb-2">
                              {complaint.category.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                            </Badge>
                            <p className="text-sm text-gray-500">
                              Filed on {new Date(complaint.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {getStatusBadge(complaint.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <LocationDisplay 
                          location_address={complaint.location_address}
                          latitude={complaint.latitude}
                          longitude={complaint.longitude}
                        />
                        <div className="bg-gray-50 rounded-xl p-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Complaint Description:</h4>
                          <p className="text-gray-900 leading-relaxed">
                            {complaint.description}
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <Button variant="outline" size="sm" className="border-2 border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50">
                            View Details
                          </Button>
                          {complaint.status === 'pending' && (
                            <Button variant="outline" size="sm" className="border-2 border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50">
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

      {/* Mobile Bottom Navigation */}
      <MobileBottomNavigation />
    </div>
  );
};

export default Dashboard;