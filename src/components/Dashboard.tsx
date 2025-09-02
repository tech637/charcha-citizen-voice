import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useComplaint } from "@/contexts/ComplaintContext";
import { getUserComplaints, createComplaint } from "@/lib/complaints";
import { Complaint } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { FileText, Clock, CheckCircle, AlertCircle, Plus, LogOut } from "lucide-react";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { pendingComplaint, clearPendingComplaint } = useComplaint();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    const fetchComplaints = async () => {
      try {
        const { data, error } = await getUserComplaints(user.id);
        if (error) {
          console.error("Error fetching complaints:", error);
        } else {
          setComplaints(data || []);
        }
      } catch (error) {
        console.error("Error fetching complaints:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
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
      case "in-progress":
        return <Badge className="bg-orange-500"><AlertCircle className="w-3 h-3 mr-1" />In Progress</Badge>;
      case "resolved":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Resolved</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.user_metadata?.full_name || user.email}</p>
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

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={() => document.getElementById('complaint-form')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              File New Complaint
            </Button>
            <Button variant="outline">
              Track Existing Complaint
            </Button>
          </div>
        </div>

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
                <Card key={complaint.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg capitalize">{complaint.category.replace('-', ' ')}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Filed on {new Date(complaint.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {getStatusBadge(complaint.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{complaint.description}</p>
                    {complaint.location_address && (
                      <p className="text-sm text-muted-foreground mb-4">
                        <strong>Location:</strong> {complaint.location_address}
                      </p>
                    )}
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
      </div>
    </div>
  );
};

export default Dashboard;