"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase, LICRequest, Society } from "../../../lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { FileCheck, ArrowLeft, Check, X, Eye, Mail, Phone, Copy } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "../../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";

// Define the extended LIC request type with society info
interface ExtendedLICRequest extends LICRequest {
  society_name?: string;
}

export default function LICRequestsPage() {
  const [licRequests, setLicRequests] = useState<ExtendedLICRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ExtendedLICRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [societies, setSocieties] = useState<Record<string, string>>({});
  const [societiesList, setSocietiesList] = useState<{ id: string; name: string }[]>([]);
  const [selectedSociety, setSelectedSociety] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<ExtendedLICRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchLICRequests();
    fetchSocieties();
  }, []);

  // Filter requests when society selection or search changes
  useEffect(() => {
    if (licRequests.length > 0) {
      let filtered = [...licRequests];
      
      // Filter by selected society
      if (selectedSociety !== "all") {
        filtered = filtered.filter(request => request.society_id === selectedSociety);
      }
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(request => 
          request.resident_name.toLowerCase().includes(query) ||
          (request.policy_number && request.policy_number.toLowerCase().includes(query)) ||
          request.request_type.toLowerCase().includes(query) ||
          (societies[request.society_id] && societies[request.society_id].toLowerCase().includes(query))
        );
      }
      
      setFilteredRequests(filtered);
    }
  }, [selectedSociety, searchQuery, licRequests, societies]);

  async function fetchLICRequests() {
    try {
      setLoading(true);
      
      // Fetch societies first (needed for both mapping and dropdown)
      const { data: societyData, error: societyError } = await supabase
        .from("societies")
        .select("id, name")
        .order("name");

      const societyMap: Record<string, string> = {};
      if (!societyError && societyData) {
        societyData.forEach(society => {
          societyMap[society.id] = society.name;
        });
        setSocieties(societyMap);
        setSocietiesList(societyData);
      }

      // Fetch LIC requests — select only needed columns
      const { data, error } = await supabase
        .from("lic_requests")
        .select("id, user_id, society_id, resident_name, request_type, policy_number, status, contact_phone, contact_email, description, created_at")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;

      if (data && data.length > 0) {
        const extendedData = data.map(item => ({
          ...item,
          society_name: societyMap[item.society_id] || 'Unknown Society'
        }));
        
        setLicRequests(extendedData as any);
        setFilteredRequests(extendedData as any);
      } else {
        setLicRequests([]);
        setFilteredRequests([]);
      }
    } catch (error) {
      console.error("Error fetching LIC requests:", error);
    } finally {
      setLoading(false);
    }
  }

  // fetchSocieties is now integrated into fetchLICRequests above
  async function fetchSocieties() {
    // No-op — societies are fetched inside fetchLICRequests to avoid duplicate query
  }

  async function updateRequestStatus(requestId: string, status: 'pending' | 'approved' | 'rejected') {
    try {
      const response = await fetch('/api/lic-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: requestId, status }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Error details:", result.error);
        alert(`Unable to update the request status. Please try again.`);
        throw new Error(result.error);
      }

      alert(`Request has been ${status} successfully.`);

      // Update the local state
      const updatedRequests = licRequests.map(request => 
        request.id === requestId ? { ...request, status } : request
      );
      setLicRequests(updatedRequests);
      setFilteredRequests(
        filteredRequests.map(request => 
          request.id === requestId ? { ...request, status } : request
        )
      );
      
      // Update selected request if it's currently shown in the dialog
      if (selectedRequest && selectedRequest.id === requestId) {
        setSelectedRequest({ ...selectedRequest, status });
      }
    } catch (error) {
      console.error("Error updating LIC request status:", error);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  function viewResidentDetails(request: ExtendedLICRequest) {
    setSelectedRequest(request);
    setIsDialogOpen(true);
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  }

  function sendEmail(email: string) {
    window.open(`mailto:${email}?subject=Regarding Your LIC Request`, '_blank');
  }

  function makePhoneCall(phone: string) {
    window.open(`tel:${phone}`, '_blank');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">LIC Requests</h1>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              <CardTitle>All LIC Requests</CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-[180px]">
                <Select
                  value={selectedSociety}
                  onValueChange={(value) => setSelectedSociety(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by society" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Societies</SelectItem>
                    {societiesList.map((society) => (
                      <SelectItem key={society.id} value={society.id}>
                        {society.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[250px]">
                <Input
                  placeholder="Search requests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          <CardDescription>
            View and manage LIC requests submitted by residents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-6">
              <p>Loading requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No LIC requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resident Name</TableHead>
                    <TableHead>Society</TableHead>
                    <TableHead>Request Type</TableHead>
                    <TableHead>Policy Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.resident_name}</TableCell>
                      <TableCell>{societies[request.society_id] || 'Unknown society'}</TableCell>
                      <TableCell>{request.request_type}</TableCell>
                      <TableCell>{request.policy_number || 'N/A'}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => viewResidentDetails(request)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          
                          {request.status === 'pending' && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 px-2 text-green-600"
                                onClick={() => updateRequestStatus(request.id, 'approved')}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 px-2 text-red-600"
                                onClick={() => updateRequestStatus(request.id, 'rejected')}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resident Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Resident Details</DialogTitle>
            <DialogDescription>
              Details for LIC request from {selectedRequest?.resident_name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="py-4">
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="font-semibold col-span-1">Name:</div>
                <div className="col-span-3">{selectedRequest.resident_name}</div>

                <div className="font-semibold col-span-1">Society:</div>
                <div className="col-span-3">{societies[selectedRequest.society_id] || 'Unknown'}</div>

                <div className="font-semibold col-span-1">Request:</div>
                <div className="col-span-3">{selectedRequest.request_type}</div>

                {selectedRequest.policy_number && (
                  <>
                    <div className="font-semibold col-span-1">Policy #:</div>
                    <div className="col-span-3 flex items-center">
                      {selectedRequest.policy_number}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 ml-2"
                        onClick={() => copyToClipboard(selectedRequest.policy_number || '')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}

                <div className="font-semibold col-span-1">Status:</div>
                <div className="col-span-3">{getStatusBadge(selectedRequest.status)}</div>

                <div className="font-semibold col-span-1">Date:</div>
                <div className="col-span-3">
                  {new Date(selectedRequest.created_at).toLocaleString()}
                </div>

                {selectedRequest.description && (
                  <>
                    <div className="font-semibold col-span-1">Details:</div>
                    <div className="col-span-3">{selectedRequest.description}</div>
                  </>
                )}
                
                <div className="font-semibold col-span-1">User ID:</div>
                <div className="col-span-3 text-xs text-gray-500">{selectedRequest.user_id}</div>
              </div>

              <div className="mt-6 border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
                {(selectedRequest.contact_email || selectedRequest.contact_phone) ? (
                  <div className="space-y-4">
                    {selectedRequest.contact_email && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{selectedRequest.contact_email}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => copyToClipboard(selectedRequest.contact_email || '')}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </Button>
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => sendEmail(selectedRequest.contact_email || '')}
                          >
                            <Mail className="h-4 w-4 mr-1" />
                            Email
                          </Button>
                        </div>
                      </div>
                    )}

                    {selectedRequest.contact_phone && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{selectedRequest.contact_phone}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => copyToClipboard(selectedRequest.contact_phone || '')}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </Button>
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => makePhoneCall(selectedRequest.contact_phone || '')}
                          >
                            <Phone className="h-4 w-4 mr-1" />
                            Call
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-muted-foreground mb-2">No contact information available</p>
                    <p className="text-xs text-gray-500">
                      This request was created before contact information was required.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            {selectedRequest && selectedRequest.status === 'pending' && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => updateRequestStatus(selectedRequest.id, 'rejected')}
                  className="text-red-600"
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button
                  onClick={() => updateRequestStatus(selectedRequest.id, 'approved')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 