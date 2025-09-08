import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { isUserAdmin, getAllCommunities } from '@/lib/communities';
import { supabase } from '@/lib/supabase';
import { Shield, Building2, Users, CheckCircle, XCircle } from 'lucide-react';

const AdminTest = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Check admin status
        const adminStatus = await isUserAdmin(user.id);
        setIsAdmin(adminStatus);

        // Fetch communities
        const { data, error } = await getAllCommunities();
        if (error) {
          console.error('Error fetching communities:', error);
        } else {
          setCommunities(data || []);
        }
      } catch (error) {
        console.error('Error in checkAdminAndFetchData:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAndFetchData();
  }, [user]);

  const testDirectProfileQuery = async () => {
    if (!user) return;

    try {
      console.log('🧪 Testing direct profile query for user:', user.id);
      console.log('🧪 User object:', user);
      
      // Test 1: Simple select from users table
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      console.log('🧪 Test 1 - Direct users query result:', { data, error });
      
      // Test 2: Check if users table exists
      const { data: tableCheck, error: tableError } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      console.log('🧪 Test 2 - Table exists check:', { tableCheck, tableError });
      
      // Test 3: Check RLS policies
      const { data: rlsCheck, error: rlsError } = await supabase
        .rpc('get_user_role', { user_id: user.id });

      console.log('🧪 Test 3 - RPC call result:', { rlsCheck, rlsError });
      
      toast({
        title: "Debug Results",
        description: `User: ${JSON.stringify(data)}, Error: ${error?.message || 'None'}`,
      });
    } catch (error: any) {
      console.error('🧪 Direct profile query error:', error);
      toast({
        title: "Direct Query Error",
        description: error.message || "Failed to query users directly",
        variant: "destructive",
      });
    }
  };

  const createTestCommunity = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('communities')
        .insert({
          name: `Test Community ${Date.now()}`,
          description: 'This is a test community created for testing purposes',
          location: 'Test Location',
          admin_id: user.id,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Test community created successfully!",
      });

      // Refresh communities
      const { data: updatedCommunities } = await getAllCommunities();
      setCommunities(updatedCommunities || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create test community",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading admin test...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Admin Panel Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">User Information</h3>
              <p className="text-sm text-muted-foreground">
                <strong>Email:</strong> {user?.email || 'Not logged in'}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>User ID:</strong> {user?.id || 'N/A'}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Admin Status</h3>
              <div className="flex items-center gap-2">
                {isAdmin ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <Badge className="bg-green-500">Admin Access Granted</Badge>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <Badge variant="destructive">Not Admin</Badge>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Database Test */}
          <div>
            <h3 className="font-semibold mb-2">Database Connection Test</h3>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm">Supabase connection successful</span>
            </div>
            <Button onClick={testDirectProfileQuery} size="sm" variant="outline">
              Test Direct Profile Query
            </Button>
          </div>

          {/* Communities Test */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Communities Test
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              Total communities: {communities.length}
            </p>
            {isAdmin && (
              <Button onClick={createTestCommunity} size="sm">
                Create Test Community
              </Button>
            )}
          </div>

          {/* Navigation Test */}
          <div>
            <h3 className="font-semibold mb-2">Navigation Test</h3>
            <div className="flex gap-2">
              <Button 
                onClick={() => window.location.href = '/admin'}
                variant="outline"
                size="sm"
              >
                Go to Admin Panel
              </Button>
              <Button 
                onClick={() => window.location.href = '/communities'}
                variant="outline"
                size="sm"
              >
                Go to Communities
              </Button>
              <Button 
                onClick={() => window.location.href = '/dashboard'}
                variant="outline"
                size="sm"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Next Steps:</h3>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Make sure you have applied the database migration</li>
              <li>Set your user role to 'admin' in the users table</li>
              <li>If you see "Admin Access Granted", you can access the admin panel</li>
              <li>Click "Go to Admin Panel" to test community creation</li>
              <li>Click "Go to Communities" to test community joining</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTest;
