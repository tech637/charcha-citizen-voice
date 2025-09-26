import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResponsiveContainer, ResponsiveSection } from '../responsive/ResponsiveLayout';
import { Shield, ArrowLeft, Building2, Users, BarChart3, Settings } from 'lucide-react';
import { isUserAdmin } from '@/lib/communities';
import { useAuth } from '@/contexts/AuthContext';
import CommunityManagement from './CommunityManagement';
import UserManagement from './UserManagement';
import Analytics from './Analytics';

const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user) {
        console.log('No user found, redirecting to home');
        navigate('/');
        return;
      }

      console.log('Checking admin access for user:', user.id);
      
      try {
        const adminStatus = await isUserAdmin(user.id);
        console.log('Admin status:', adminStatus);
        setIsAdmin(adminStatus);
        
        if (!adminStatus) {
          console.log('User is not admin, redirecting to home');
          navigate('/');
        }
      } catch (error) {
        console.error('Error checking admin access:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to ensure user context is fully loaded
    const timeoutId = setTimeout(checkAdminAccess, 100);
    
    return () => clearTimeout(timeoutId);
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Checking Admin Access</h3>
            <p className="text-muted-foreground">Verifying your permissions...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect to home
  }

  return (
    <div className="min-h-screen bg-background">
      <ResponsiveContainer className="py-6 lg:py-8">
        {/* Modern Header */}
        <ResponsiveSection
          title="Admin Panel"
          description="Welcome to the administrative dashboard"
          spacing="lg"
          action={
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          }
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">Admin Panel</h1>
              <p className="text-muted-foreground">Manage communities, users, and analytics</p>
            </div>
          </div>
        </ResponsiveSection>

        {/* Enhanced Admin Tabs */}
        <ResponsiveSection spacing="lg">
          <Tabs defaultValue="communities" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-12 bg-muted/30">
              <TabsTrigger 
                value="communities" 
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Communities</span>
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="communities" className="mt-8">
              <CommunityManagement />
            </TabsContent>

            <TabsContent value="users" className="mt-8">
              <UserManagement />
            </TabsContent>

            <TabsContent value="analytics" className="mt-8">
              <Analytics />
            </TabsContent>
          </Tabs>
        </ResponsiveSection>
      </ResponsiveContainer>
    </div>
  );
};

export default AdminPanel;