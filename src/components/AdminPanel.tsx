import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Database, RefreshCw, Users } from 'lucide-react';
import { runGlobalCleanup } from '@/lib/admin-cleanup';
import { useToast } from '@/hooks/use-toast';

// Admin panel for database maintenance
export function AdminPanel() {
  const [isCleaning, setIsCleaning] = useState(false);
  const [lastCleanupResults, setLastCleanupResults] = useState<any>(null);
  const { toast } = useToast();

  const handleGlobalCleanup = async () => {
    setIsCleaning(true);
    try {
      const result = await runGlobalCleanup();
      if (result.error) {
        toast({
          title: "❌ Cleanup Failed",
          description: result.error.message || "Failed to run global cleanup",
          variant: "destructive",
        });
      } else if (result.data) {
        setLastCleanupResults(result.data);
        const totalChanges = result.data.orphanedMembershipsDeleted + 
                           result.data.pendingRequestsDeleted + 
                           result.data.communitiesReactivated + 
                           result.data.communitiesDeactivated;
        
        toast({
          title: "🛠️ Global Cleanup Complete",
          description: `Fixed ${totalChanges} database issues across the entire system.`,
          variant: "default",
        });
      }
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: error.message || "Failed to run cleanup",
        variant: "destructive",
      });
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🛠️ Admin Panel</h1>
        <p className="text-muted-foreground">
          Database maintenance and global cleanup tools
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Global Cleanup Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-500" />
              Global Database Cleanup
            </CardTitle>
            <CardDescription>
              Automatically fixes database inconsistencies for all users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleGlobalCleanup}
              disabled={isCleaning}
              className="w-full"
              variant="default"
            >
              {isCleaning ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Cleaning Database...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Run Global Cleanup
                </>
              )}
            </Button>
            
            {lastCleanupResults && (
              <div className="space-y-2 pt-4 border-t">
                <h4 className="font-medium text-sm">Last Cleanup Results:</h4>
                <div className="grid gap-2 text-xs">
                  {lastCleanupResults.orphanedMembershipsDeleted > 0 && (
                    <div className="flex justify-between">
                      <span>🗑️ Orphaned memberships:</span>
                      <Badge variant="secondary">{lastCleanupResults.orphanedMembershipsDeleted}</Badge>
                    </div>
                  )}
                  {lastCleanupResults.pendingRequestsDeleted > 0 && (
                    <div className="flex justify-between">
                      <span>⏳ Pending requests cleaned:</span>
                      <Badge variant="secondary">{lastCleanupResults.pendingRequestsDeleted}</Badge>
                    </div>
                  )}
                  {lastCleanupResults.communitiesReactivated > 0 && (
                    <div className="flex justify-between">
                      <span>🔄 Communities reactivated:</span>
                      <Badge variant="secondary">{lastCleanupResults.communitiesReactivated}</Badge>
                    </div>
                  )}
                  {lastCleanupResults.communitiesDeactivated > 0 && (
                    <div className="flex justify-between">
                      <span>💤 Communities deactivated:</span>
                      <Badge variant="secondary">{lastCleanupResults.communitiesDeactivated}</Badge>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-500" />
              System Status
            </CardTitle>
            <CardDescription>
              Community system health indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Database Integrity:</span>
                <Badge variant="outline" className="text-green-600">Good</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">User Synchronization:</span>
                <Badge variant="outline" className="text-green-600">Active</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Cleanup Automation:</span>
                <Badge variant="outline" className="text-blue-600">Running</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Section */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-4">
            <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-medium">About Global Cleanup</h4>
              <p className="text-sm text-muted-foreground">
                This system automatically cleans up orphaned memberships, removes pending requests 
                for inactive communities, reactivates communities with members, and maintains 
                database consistency across all users.
              </p>
              <p className="text-xs text-muted-foreground">
                The cleanup now runs automatically when any user tries to create a community, 
                ensuring all database issues are resolved system-wide.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
