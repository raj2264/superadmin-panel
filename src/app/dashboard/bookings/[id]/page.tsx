'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Clock,
  User,
  Store,
  Building2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock4,
  Wrench,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface Booking {
  id: string;
  service_id: string;
  resident_id: string;
  service_description: string;
  booking_date: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
  service: {
    id: string;
    name: string;
    category: string;
    description: string;
  };
  resident: {
    id: string;
    name: string;
    unit_number: string;
    phone: string;
    email: string;
    societies: {
      id: string;
      name: string;
    };
  };
}

export default function BookingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchBooking();
  }, [resolvedParams.id]);

  async function fetchBooking() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('service_bookings')
        .select(`
          *,
          service:services(
            id,
            name,
            category,
            description
          ),
          resident:residents(
            id,
            name,
            unit_number,
            phone,
            email,
            societies:society_id(id, name)
          )
        `)
        .eq('id', resolvedParams.id)
        .single();

      if (error) throw error;
      setBooking(data);
      setNotes(data.notes || '');
    } catch (error) {
      console.error('Error fetching booking:', error);
      toast({
        title: 'Error',
        description: 'Failed to load booking details',
        variant: 'destructive',
      });
      router.push('/dashboard/bookings');
    } finally {
      setLoading(false);
    }
  }

  async function updateBookingStatus(status: Booking['status']) {
    try {
      setUpdating(true);
      const { error } = await supabase
        .from('service_bookings')
        .update({ 
          status,
          notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', resolvedParams.id);

      if (error) throw error;

      setBooking(prev => prev ? { ...prev, status, notes } : null);
      toast({
        title: 'Success',
        description: 'Booking status updated successfully',
      });
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: 'Error',
        description: 'Failed to update booking status',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  }

  function getStatusBadgeColor(status: string) {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'pending':
        return <Clock4 className="h-5 w-5 text-yellow-600" />;
      case 'confirmed':
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold">Booking Not Found</h2>
        <p className="text-muted-foreground mt-2">
          The booking you're looking for doesn't exist or has been removed.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          asChild
        >
          <Link href="/dashboard/bookings">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Bookings
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <Link href="/dashboard/bookings">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Booking Details</h1>
            <p className="text-muted-foreground">
              View and manage booking information
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusBadgeColor(booking.status)}>
            {getStatusIcon(booking.status)}
            <span className="ml-1">
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </span>
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Booking Information</CardTitle>
            <CardDescription>Details about the service booking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Booking Date</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(booking.booking_date)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(booking.created_at)}
                </p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-1">Service Description</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {booking.service_description || booking.service?.description || 'No description available'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Notes</p>
              <Textarea
                placeholder="Add notes about this booking..."
                value={notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Information</CardTitle>
            <CardDescription>Details about the requested service</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Service Name</p>
                <p className="text-sm text-muted-foreground">
                  {booking.service?.name || 'Unknown'}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Category</p>
              <p className="text-sm text-muted-foreground">
                {booking.service?.category || 'Category'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Description</p>
              <p className="text-sm text-muted-foreground">
                {booking.service?.description || 'No description available'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resident Information</CardTitle>
            <CardDescription>Details about the service requester</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Resident Name</p>
                <p className="text-sm text-muted-foreground">
                  {booking.resident?.name || 'Unknown'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Society</p>
                <p className="text-sm text-muted-foreground">
                  {booking.resident?.societies?.name || 'Unknown'}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Unit Number</p>
              <p className="text-sm text-muted-foreground">
                {booking.resident?.unit_number || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Contact</p>
              <p className="text-sm text-muted-foreground">
                {booking.resident?.phone || 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground">
                {booking.resident?.email || 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Update Status</CardTitle>
            <CardDescription>Change the status of this booking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateBookingStatus('pending')}
                disabled={updating || booking.status === 'pending'}
              >
                <Clock4 className="mr-2 h-4 w-4" />
                Mark as Pending
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateBookingStatus('confirmed')}
                disabled={updating || booking.status === 'confirmed'}
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Mark as Confirmed
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateBookingStatus('completed')}
                disabled={updating || booking.status === 'completed'}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Mark as Completed
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateBookingStatus('cancelled')}
                disabled={updating || booking.status === 'cancelled'}
                className="text-red-600 hover:text-red-700"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Mark as Cancelled
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 