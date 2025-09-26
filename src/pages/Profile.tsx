import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Complaint } from "@/lib/supabase";
import { getUserComplaints } from "@/lib/complaints";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertCircle, FileText, PlusCircle } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Inbox } from "lucide-react";


export function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchComplaints = async () => {
        try {
          const { data, error } = await getUserComplaints(user.id);
          if (error) throw error;
          setComplaints(data || []);
        } catch (error) {
          console.error("Error fetching complaints:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchComplaints();
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800"><AlertCircle className="w-3 h-3 mr-1" />In Progress</Badge>;
      case "resolved":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Resolved</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>Your Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Full Name</span>
            <span className="font-medium">{user?.user_metadata?.full_name || "Not set"}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="font-medium">{user?.email}</span>
          </div>
        </CardContent>
      </Card>
      
      <Card>
         <CardHeader>
          <CardTitle>My Stats</CardTitle>
          <CardDescription>A summary of your filed complaints.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{complaints.length}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{complaints.filter(c => c.status === 'pending' || c.status === 'in_progress').length}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{complaints.filter(c => c.status === 'resolved').length}</p>
              <p className="text-sm text-muted-foreground">Resolved</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">My Complaint History</h2>
        {loading ? (
            <div className="text-center p-8">Loading complaints...</div>
        ) : complaints.length === 0 ? (
          <EmptyState
            Icon={Inbox}
            title="No Complaints Yet"
            description="You haven't filed any complaints. When you do, they'll show up here."
            action={
              <Button onClick={() => navigate('/new-complaint')}>
                <PlusCircle className="h-4 w-4 mr-2" />
                File Your First Complaint
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {complaints.map((complaint) => (
              <Card key={complaint.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                     </div>
                     <div>
                        <p className="font-semibold capitalize">{complaint.category.replace('-', ' ')}</p>
                        <p className="text-sm text-muted-foreground">
                          Filed on {new Date(complaint.created_at).toLocaleDateString()}
                        </p>
                     </div>
                  </div>
                  {getStatusBadge(complaint.status)}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
