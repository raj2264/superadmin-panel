"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DebugPage() {
  const [licRequests, setLicRequests] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch LIC requests
        const { data: licData, error: licError } = await supabase
          .from("lic_requests")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10);
          
        if (licError) throw licError;
        setLicRequests(licData || []);
        
        // Fetch residents
        const { data: resData, error: resError } = await supabase
          .from("residents")
          .select("*")
          .limit(10);
          
        if (resError) throw resError;
        setResidents(resData || []);
        
      } catch (err: any) {
        setError(err.message || JSON.stringify(err));
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => router.push("/dashboard")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Database Debug</h1>
      </div>

      {error && (
        <Card className="bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap bg-red-100 p-4 rounded text-red-900">
              {error}
            </pre>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p>Loading data...</p>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>LIC Requests (First 10)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">ID</th>
                      <th className="border p-2 text-left">User ID</th>
                      <th className="border p-2 text-left">Resident Name</th>
                      <th className="border p-2 text-left">Society ID</th>
                      <th className="border p-2 text-left">Request Type</th>
                      <th className="border p-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {licRequests.length > 0 ? (
                      licRequests.map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50">
                          <td className="border p-2">{request.id}</td>
                          <td className="border p-2 font-mono text-xs">{request.user_id}</td>
                          <td className="border p-2">{request.resident_name}</td>
                          <td className="border p-2 font-mono text-xs">{request.society_id}</td>
                          <td className="border p-2">{request.request_type}</td>
                          <td className="border p-2">
                            <span className={`inline-block px-2 py-1 rounded text-xs ${
                              request.status === 'approved' ? 'bg-green-100 text-green-800' :
                              request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {request.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="border p-2 text-center">No LIC requests found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Residents (First 10)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">ID</th>
                      <th className="border p-2 text-left">Name</th>
                      <th className="border p-2 text-left">Email</th>
                      <th className="border p-2 text-left">Phone</th>
                      <th className="border p-2 text-left">Unit</th>
                      <th className="border p-2 text-left">Society ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {residents.length > 0 ? (
                      residents.map((resident) => (
                        <tr key={resident.id} className="hover:bg-gray-50">
                          <td className="border p-2 font-mono text-xs">{resident.id}</td>
                          <td className="border p-2">{resident.name || 'N/A'}</td>
                          <td className="border p-2">{resident.email || 'N/A'}</td>
                          <td className="border p-2">{resident.phone || 'N/A'}</td>
                          <td className="border p-2">{resident.unit_number || 'N/A'}</td>
                          <td className="border p-2 font-mono text-xs">{resident.society_id || 'N/A'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="border p-2 text-center">No residents found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Connection Check</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={async () => {
                    try {
                      const { data: licData, error: licError } = await supabase
                        .from("lic_requests")
                        .select("count()")
                        .single();
                        
                      const { data: resData, error: resError } = await supabase
                        .from("residents")
                        .select("count()")
                        .single();
                      
                      if (licError) throw licError;
                      if (resError) throw resError;
                      
                      alert(`Database connection successful!\nLIC Requests: ${licData.count}\nResidents: ${resData.count}`);
                    } catch (err: any) {
                      alert(`Error: ${err.message || JSON.stringify(err)}`);
                    }
                  }}
                >
                  Test Database Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
} 
