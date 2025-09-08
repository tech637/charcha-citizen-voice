import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, ArrowLeft, Building2, Users, BarChart3 } from 'lucide-react';
import { isUserAdmin } from '@/lib/communities';
import { useAuth } from '@/contexts/AuthContext';
import CommunityManagement from './CommunityManagement';

const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user) {
        navigate('/');
        return;
      }

      try {
        const adminStatus = await isUserAdmin(user.id);
        setIsAdmin(adminStatus);
        
        if (!adminStatus) {
          navigate('/');
        }
      } catch (error) {
        console.error('Error checking admin access:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect to home
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600">Welcome to the administrative dashboard</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Welcome Card */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Shield className="h-6 w-6 text-blue-600" />
                Hello Admin! 👋
              </CardTitle>
              <CardDescription className="text-lg">
                You have successfully accessed the admin panel. This is where you can manage the platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <p className="text-gray-700">
                  <strong>Admin Access Confirmed!</strong> You are logged in as an administrator and have full access to the admin panel.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Admin Tabs */}
          <Tabs defaultValue="communities" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="communities" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Communities
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="communities" className="mt-6">
              <CommunityManagement />
            </TabsContent>

            <TabsContent value="users" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">User Management</CardTitle>
                  <CardDescription>Manage user accounts and roles</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Analytics</CardTitle>
                  <CardDescription>View platform statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;