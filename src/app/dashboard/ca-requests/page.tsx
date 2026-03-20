'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Loader2, RefreshCw, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type CARequest = {
  id: string;
  created_at: string;
  society_id: string;
  resident_id: string;
  request_type: 'accounting' | 'audit';
  name: string;
  email: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected';
  society: {
    name: string;
  };
  resident: {
    name: string;
    unit_number: string;
  };
};

export default function CARequestsPage() {
  const [requests, setRequests] = useState<CARequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No session found');
      }

      const { data, error } = await supabase
        .from('ca_requests')
        .select(`
          id, society_id, resident_id, status, request_type, name, email, phone, created_at,
          society:societies(name),
          resident:residents(name, unit_number)
        `)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setRequests((data as any) || []);
    } catch (error) {
      console.error('Error fetching CA requests:', error);
      toast.error('Failed to load CA requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleStatusUpdate = async (requestId: string, newStatus: 'approved' | 'rejected') => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('ca_requests')
        .update({ status: newStatus })
        .eq('id', requestId);

      if (error) throw error;

      setRequests(prev =>
        prev.map(request =>
          request.id === requestId ? { ...request, status: newStatus } : request
        )
      );

      toast.success(
        `Request ${newStatus === 'approved' ? 'approved' : 'rejected'} successfully`,
        {
          description: newStatus === 'approved' 
            ? 'The resident will be notified of the approval.'
            : 'The resident will be notified of the rejection.'
        }
      );
    } catch (error) {
      console.error('Error updating request status:', error);
      toast.error('Failed to update request status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getRequestTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">CA Requests</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setRefreshing(true);
            fetchRequests();
          }}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No CA requests found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Society</TableHead>
                  <TableHead>Resident</TableHead>
                  <TableHead>Service Type</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      {format(new Date(request.created_at), 'MMM d, yyyy h:mm a')}
                    </TableCell>
                    <TableCell>{request.society.name}</TableCell>
                    <TableCell>
                      {request.resident.name} ({request.resident.unit_number})
                    </TableCell>
                    <TableCell>{getRequestTypeLabel(request.request_type)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div>{request.name}</div>
                        <div className="text-sm text-muted-foreground">{request.email}</div>
                        <div className="text-sm text-muted-foreground">{request.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-right">
                      {request.status === 'pending' && (
                        <TooltipProvider>
                          <div className="flex justify-end gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950 dark:hover:text-green-400"
                                  onClick={() => handleStatusUpdate(request.id, 'approved')}
                                  disabled={loading}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                  <span className="sr-only">Approve</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Approve Request</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                                  onClick={() => handleStatusUpdate(request.id, 'rejected')}
                                  disabled={loading}
                                >
                                  <XCircle className="h-4 w-4" />
                                  <span className="sr-only">Reject</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Reject Request</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
                      )}
                      {request.status === 'approved' && (
                        <div className="flex items-center justify-end text-green-600 dark:text-green-400">
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          <span className="text-sm">Approved</span>
                        </div>
                      )}
                      {request.status === 'rejected' && (
                        <div className="flex items-center justify-end text-red-600 dark:text-red-400">
                          <XCircle className="h-4 w-4 mr-1" />
                          <span className="text-sm">Rejected</span>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 