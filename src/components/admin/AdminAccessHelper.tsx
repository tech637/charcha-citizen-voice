import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ResponsiveContainer, ResponsiveSection } from '../responsive/ResponsiveLayout';
import { Shield, AlertCircle, CheckCircle, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const AdminAccessHelper = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        setMessage('Login successful! Redirecting to admin panel...');
        setMessageType('success');
        
        // Redirect to admin panel after successful login
        setTimeout(() => {
          window.location.href = '/admin';
        }, 1500);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setMessage(error.message || 'Login failed. Please check your credentials.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdminAccess = async () => {
    setLoading(true);
    setMessage('');

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setMessage('Please log in first before accessing admin features.');
        setMessageType('error');
        return;
      }

      // Check if user exists in users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', user.id)
        .single();

      if (userError) {
        setMessage('User not found in database. Please contact support.');
        setMessageType('error');
        return;
      }

      if (userData.role === 'admin') {
        setMessage('You already have admin access! Redirecting to admin panel...');
        setMessageType('success');
        setTimeout(() => {
          window.location.href = '/admin';
        }, 1500);
      } else {
        setMessage(`Your current role is: ${userData.role}. Only users with 'admin' role can access the admin panel.`);
        setMessageType('error');
      }
    } catch (error: any) {
      console.error('Error checking admin access:', error);
      setMessage('Error checking admin access. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsiveContainer className="py-8">
      <ResponsiveSection
        title="Admin Access Helper"
        description="Get help accessing the admin panel"
        spacing="lg"
      >
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Current Status */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Admin Access Status
              </CardTitle>
              <CardDescription>
                Check your current admin access and get help logging in
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleQuickAdminAccess}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Checking...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Check My Admin Access
                  </>
                )}
              </Button>

              {message && (
                <Alert className={messageType === 'error' ? 'border-destructive' : messageType === 'success' ? 'border-success' : ''}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Admin Login Form */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Admin Login
              </CardTitle>
              <CardDescription>
                Log in with an admin account to access the admin panel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Logging in...
                    </>
                  ) : (
                    'Login as Admin'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Available Admin Accounts */}
          <Card variant="outline">
            <CardHeader>
              <CardTitle className="text-lg">Available Admin Accounts</CardTitle>
              <CardDescription>
                These accounts have admin access in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="font-mono">tech@acharyaventures.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="font-mono">himanshu@acharyaventures.com</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Contact the system administrator for login credentials.
              </p>
            </CardContent>
          </Card>
        </div>
      </ResponsiveSection>
    </ResponsiveContainer>
  );
};

export default AdminAccessHelper;
