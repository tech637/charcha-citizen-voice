import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

const UserDebug: React.FC = () => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const testQueries = async () => {
    setLoading(true);
    const testResults: any[] = [];

    try {
      // Test 1: Direct users table query
      console.log('Test 1: Direct users table query');
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*');
      
      testResults.push({
        test: 'Direct users table',
        success: !usersError,
        count: usersData?.length || 0,
        error: usersError?.message,
        data: usersData
      });

      // Test 2: RPC function
      console.log('Test 2: RPC function');
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_all_users');
      
      testResults.push({
        test: 'RPC get_all_users',
        success: !rpcError,
        count: rpcData?.length || 0,
        error: rpcError?.message,
        data: rpcData
      });

      // Test 3: Auth users query (this won't work from client)
      console.log('Test 3: Auth users query');
      const { data: authData, error: authError } = await supabase
        .from('auth.users')
        .select('*');
      
      testResults.push({
        test: 'Auth users table',
        success: !authError,
        count: authData?.length || 0,
        error: authError?.message,
        data: authData
      });

      // Test 4: Simple count query
      console.log('Test 4: Count query');
      const { count, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      testResults.push({
        test: 'Count query',
        success: !countError,
        count: count || 0,
        error: countError?.message
      });

    } catch (error) {
      console.error('Test error:', error);
      testResults.push({
        test: 'General Error',
        success: false,
        count: 0,
        error: error.message
      });
    }

    setResults(testResults);
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Query Debug</CardTitle>
        <Button onClick={testQueries} disabled={loading}>
          {loading ? 'Testing...' : 'Run Tests'}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {results.map((result, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{result.test}</h3>
                <span className={`px-2 py-1 rounded text-xs ${
                  result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {result.success ? 'SUCCESS' : 'FAILED'}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Count: {result.count} users
              </p>
              {result.error && (
                <p className="text-sm text-red-600">
                  Error: {result.error}
                </p>
              )}
              {result.data && (
                <details className="mt-2">
                  <summary className="text-sm cursor-pointer">View Data</summary>
                  <pre className="text-xs bg-gray-100 p-2 mt-2 rounded overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserDebug;
