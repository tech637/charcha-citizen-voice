import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, Info } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pendingMemberships, setPendingMemberships] = useState<{ community_name: string }[]>([]);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    const fetchData = async () => {
      try {
        const { data: memberships, error: membershipsError } = await supabase
          .from('user_communities')
          .select('communities (name)')
          .eq('user_id', user.id)
          .eq('status', 'pending');
        
        if (membershipsError) throw membershipsError;
        
        const pending = memberships.map((m: any) => ({ community_name: m.communities.name }));
        setPendingMemberships(pending);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  if (loading) {
    return <div className="text-center p-8">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Home</h1>
          <p className="text-muted-foreground">Welcome back, {user.user_metadata?.full_name || user.email}</p>
        </div>
      </div>

      {pendingMemberships.length > 0 && (
        <Alert className="bg-orange-50 border-orange-200 text-orange-800">
          <Info className="h-4 w-4 !text-orange-800" />
          <AlertTitle>Approval Pending</AlertTitle>
          <AlertDescription>
            Your request to join {pendingMemberships.map(m => `"${m.community_name}"`).join(', ')} is pending approval. You'll gain full access once approved by the society admin.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full justify-between" onClick={() => navigate('/new-complaint')}>
            <span>File a New Complaint</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="secondary" className="w-full justify-between" onClick={() => navigate('/communities')}>
            <span>Explore Communities</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;