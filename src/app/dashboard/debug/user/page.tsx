"use client";

import { useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "../../../../components/ui/input";

export default function UserDebugPage() {
  const [userId, setUserId] = useState("b2e911bd-1a90-4c22-88bd-aab3e2373f6f");
  const [userData, setUserData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function lookupUser() {
    setLoading(true);
    setError(null);
    setUserData(null);
    
    try {
      // Check for LIC requests by this user
      const { data: licData, error: licError } = await supabase
        .from("lic_requests")
        .select("*")
        .eq("user_id", userId);
      
      // Look in the residents table by id
      const { data: residentByIdData, error: residentByIdError } = await supabase
        .from("residents")
        .select("*")
        .eq("id", userId)
        .single();
        
      // Also look in residents by auth_id
      const { data: residentByAuthData, error: residentByAuthError } = await supabase
        .from("residents")
        .select("*")
        .eq("auth_id", userId)
        .single();
      
      // Look in the users table by id
      const { data: userByIdData, error: userByIdError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();
      
      // Also look in users by auth_id
      const { data: userByAuthData, error: userByAuthError } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", userId)
        .single();
      
      // Look in profiles table
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      
      // Get database schema to understand table structure
      const { data: tableInfo, error: tableError } = await supabase
        .rpc('get_table_info', { table_name: 'residents' });
      
      // Compile all the data
      setUserData({
        resident: {
          byId: residentByIdError ? null : residentByIdData,
          byAuthId: residentByAuthError ? null : residentByAuthData
        },
        user: {
          byId: userByIdError ? null : userByIdData,
          byAuthId: userByAuthError ? null : userByAuthData
        },
        profile: profileError ? null : profileData,
        licRequests: licError ? [] : licData,
        tableInfo: tableError ? null : tableInfo
      });
      
    } catch (err: any) {
      setError(err.message || JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => router.push("/dashboard/debug")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">User Debug</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Look Up User</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input 
              value={userId} 
              onChange={(e) => setUserId(e.target.value)} 
              placeholder="User ID" 
              className="flex-1"
            />
            <Button onClick={lookupUser} disabled={loading}>
              {loading ? "Searching..." : "Look Up"}
            </Button>
          </div>
          
          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-800 rounded">
              <p className="font-bold">Error:</p>
              <p>{error}</p>
            </div>
          )}
          
          {userData && (
            <div className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resident Record by ID</CardTitle>
                </CardHeader>
                <CardContent>
                  {userData.resident.byId ? (
                    <pre className="p-4 bg-gray-100 rounded overflow-auto max-h-60">
                      {JSON.stringify(userData.resident.byId, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-red-600">No resident record found with this ID as the primary key!</p>
                  )}
                </CardContent>
              </Card>
              
              {userData.resident.byAuthId && (
                <Card>
                  <CardHeader>
                    <CardTitle>Resident Record by Auth ID</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="p-4 bg-gray-100 rounded overflow-auto max-h-60">
                      {JSON.stringify(userData.resident.byAuthId, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
              
              {userData.user.byId && (
                <Card>
                  <CardHeader>
                    <CardTitle>User Record by ID</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="p-4 bg-gray-100 rounded overflow-auto max-h-60">
                      {JSON.stringify(userData.user.byId, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
              
              {userData.user.byAuthId && (
                <Card>
                  <CardHeader>
                    <CardTitle>User Record by Auth ID</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="p-4 bg-gray-100 rounded overflow-auto max-h-60">
                      {JSON.stringify(userData.user.byAuthId, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
              
              {userData.profile && (
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Record</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="p-4 bg-gray-100 rounded overflow-auto max-h-60">
                      {JSON.stringify(userData.profile, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
              
              <Card>
                <CardHeader>
                  <CardTitle>LIC Requests ({userData.licRequests.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {userData.licRequests.length > 0 ? (
                    <pre className="p-4 bg-gray-100 rounded overflow-auto max-h-60">
                      {JSON.stringify(userData.licRequests, null, 2)}
                    </pre>
                  ) : (
                    <p>No LIC requests found for this user.</p>
                  )}
                </CardContent>
              </Card>
              
              {userData.tableInfo && (
                <Card>
                  <CardHeader>
                    <CardTitle>Residents Table Structure</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="p-4 bg-gray-100 rounded overflow-auto max-h-60">
                      {JSON.stringify(userData.tableInfo, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
