'use client';

import React, { useEffect, useState } from 'react';
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
  Wrench,
  Clock,
  ArrowLeft,
  Edit,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  price_range: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function ServiceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchService();
  }, [resolvedParams.id]);

  async function fetchService() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', resolvedParams.id)
        .single();

      if (error) {
        console.error('Error fetching service:', error);
        throw error;
      }
      setService(data);
    } catch (error) {
      console.error('Error fetching service:', error);
      toast({
        title: 'Error',
        description: 'Failed to load service details',
        variant: 'destructive',
      });
      router.push('/dashboard/services');
    } finally {
      setLoading(false);
    }
  }

  async function toggleServiceStatus() {
    if (!service) return;

    try {
      setUpdating(true);
      const { error } = await supabase
        .from('services')
        .update({ 
          is_active: !service.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', resolvedParams.id);

      if (error) throw error;

      setService(prev => prev ? { ...prev, is_active: !prev.is_active } : null);
      toast({
        title: 'Success',
        description: `Service ${service.is_active ? 'deactivated' : 'activated'} successfully`,
      });
    } catch (error) {
      console.error('Error updating service:', error);
      toast({
        title: 'Error',
        description: 'Failed to update service status',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  }

  async function deleteService() {
    try {
      setUpdating(true);
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', resolvedParams.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Service deleted successfully',
      });
      router.push('/dashboard/services');
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete service',
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold">Service Not Found</h2>
        <p className="text-muted-foreground mt-2">
          The service you're looking for doesn't exist or has been removed.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          asChild
        >
          <Link href="/dashboard/services">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Services
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
            <Link href="/dashboard/services">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Service Details</h1>
            <p className="text-muted-foreground">
              View and manage service information
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={service.is_active ? "default" : "secondary"}>
            {service.is_active ? 'Active' : 'Inactive'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <Link href={`/dashboard/services/${service.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the service
                  and remove it from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={deleteService}
                  disabled={updating}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {updating ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service Information</CardTitle>
          <CardDescription>Details about the service</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">Name</p>
            <p className="text-sm text-muted-foreground">
              {service.name}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Category</p>
            <p className="text-sm text-muted-foreground">
              {service.category}
            </p>
          </div>
          {service.price_range && (
            <div>
              <p className="text-sm font-medium">Price Range</p>
              <p className="text-sm text-muted-foreground">
                {service.price_range}
              </p>
            </div>
          )}
          <Separator />
          {service.description && (
            <div>
              <p className="text-sm font-medium mb-1">Description</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {service.description}
              </p>
            </div>
          )}
          <Separator />
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Created</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(service.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Last Updated</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(service.updated_at)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
          <CardDescription>Manage the service availability</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                {service.is_active
                  ? 'This service is currently active and available for bookings.'
                  : 'This service is currently inactive and not available for bookings.'}
              </p>
            </div>
            <Button
              variant={service.is_active ? "destructive" : "default"}
              size="sm"
              onClick={toggleServiceStatus}
              disabled={updating}
            >
              {service.is_active ? (
                <>
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Deactivate Service
                </>
              ) : (
                <>
                  <Wrench className="mr-2 h-4 w-4" />
                  Activate Service
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 