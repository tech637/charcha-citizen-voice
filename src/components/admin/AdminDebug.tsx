import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ResponsiveContainer, ResponsiveSection } from '../responsive/ResponsiveLayout';
import { Shield, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { isUserAdmin } from '@/lib/communities';

const AdminDebug = () => {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDebugCheck = async () => {
    setLoading(true);
    setDebugInfo(null);

    try {
      const info: any = {
        timestamp: new Date().toISOString(),
        authUser: null,
        dbUser: null,
        isAdminResult: false,
        errors: []
      };

      // Check auth user
      if (user) {
        info.authUser = {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        };

        // Check database user
        try {
          const { data: dbUser, error: dbError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

          if (dbError) {
            info.errors.push(`Database user error: ${dbError.message}`);
          } else {
            info.dbUser = dbUser;
          }
        } catch (error: any) {
          info.errors.push(`Database query error: ${error.message}`);
        }

        // Check admin status
        try {
          info.isAdminResult = await isUserAdmin(user.id);
        } catch (error: any) {
          info.errors.push(`Admin check error: ${error.message}`);
        }
      } else {
        info.errors.push('No authenticated user found');
      }

      setDebugInfo(info);
    } catch (error: any) {
      setDebugInfo({
        timestamp: new Date().toISOString(),
        errors: [`General error: ${error.message}`]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDebugCheck();
  }, []);

  return (
    <ResponsiveContainer className="py-8">
      <ResponsiveSection
        title="Admin Debug Tool"
        description="Debug admin access issues"
        spacing="lg"
      >
        <div className="max-w-4xl mx-auto space-y-6">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Debug Information
              </CardTitle>
              <CardDescription>
                Check authentication and admin status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={runDebugCheck}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Running Debug Check...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Run Debug Check
                  </>
                )}
              </Button>

              {debugInfo && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Auth User */}
                    <Card variant="outline">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-success" />
                          Auth User
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {debugInfo.authUser ? (
                          <div className="space-y-2 text-sm">
                            <div><strong>ID:</strong> {debugInfo.authUser.id}</div>
                            <div><strong>Email:</strong> {debugInfo.authUser.email}</div>
                            <div><strong>Created:</strong> {new Date(debugInfo.authUser.created_at).toLocaleString()}</div>
                          </div>
                        ) : (
                          <div className="text-muted-foreground">No authenticated user</div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Database User */}
                    <Card variant="outline">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          {debugInfo.dbUser ? (
                            <CheckCircle className="h-4 w-4 text-success" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                          Database User
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {debugInfo.dbUser ? (
                          <div className="space-y-2 text-sm">
                            <div><strong>ID:</strong> {debugInfo.dbUser.id}</div>
                            <div><strong>Email:</strong> {debugInfo.dbUser.email}</div>
                            <div><strong>Role:</strong> 
                              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                                debugInfo.dbUser.role === 'admin' 
                                  ? 'bg-success text-success-foreground' 
                                  : 'bg-muted text-muted-foreground'
                              }`}>
                                {debugInfo.dbUser.role}
                              </span>
                            </div>
                            <div><strong>Full Name:</strong> {debugInfo.dbUser.full_name || 'N/A'}</div>
                          </div>
                        ) : (
                          <div className="text-muted-foreground">No database user record</div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Admin Status */}
                  <Card variant="outline">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        {debugInfo.isAdminResult ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                        Admin Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-lg font-semibold ${
                        debugInfo.isAdminResult ? 'text-success' : 'text-destructive'
                      }`}>
                        {debugInfo.isAdminResult ? 'ADMIN ACCESS GRANTED' : 'ADMIN ACCESS DENIED'}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Errors */}
                  {debugInfo.errors && debugInfo.errors.length > 0 && (
                    <Card variant="outline" className="border-destructive">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                          <AlertCircle className="h-4 w-4" />
                          Errors
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {debugInfo.errors.map((error: string, index: number) => (
                            <div key={index} className="text-sm text-destructive">
                              • {error}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Raw Debug Info */}
                  <Card variant="outline">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Raw Debug Data</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs bg-muted p-4 rounded overflow-auto">
                        {JSON.stringify(debugInfo, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ResponsiveSection>
    </ResponsiveContainer>
  );
};

export default AdminDebug;
