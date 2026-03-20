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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Save,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  price_range: string;
  is_active: boolean;
  vendor_id: string;
  created_at: string;
  updated_at: string;
}

interface VendorData {
  id: string;
  name: string;
  societies: {
    id: string;
    name: string;
  } | null;
}

interface Vendor {
  id: string;
  name: string;
  societies: {
    id: string;
    name: string;
  } | null;
}

export default function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const [service, setService] = useState<Service | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchService();
    fetchVendors();
  }, [resolvedParams.id]);

  async function fetchService() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vendor_services')
        .select('*')
        .eq('id', resolvedParams.id)
        .single();

      if (error) throw error;
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

  async function fetchVendors() {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select(`
          id,
          name,
          societies:society_id(id, name)
        `)
        .order('name')
        .returns<VendorData[]>();

      if (error) throw error;
      const transformedData = (data || []).map(vendor => ({
        id: vendor.id,
        name: vendor.name,
        societies: vendor.societies
      }));
      setVendors(transformedData);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast({
        title: 'Error',
        description: 'Failed to load vendors',
        variant: 'destructive',
      });
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!service) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('vendor_services')
        .update({
          name: service.name,
          description: service.description,
          category: service.category,
          price_range: service.price_range,
          vendor_id: service.vendor_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', resolvedParams.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Service updated successfully',
      });
      router.push(`/dashboard/services/${resolvedParams.id}`);
    } catch (error) {
      console.error('Error updating service:', error);
      toast({
        title: 'Error',
        description: 'Failed to update service',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
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
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          asChild
        >
          <Link href={`/dashboard/services/${resolvedParams.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Service</h1>
          <p className="text-muted-foreground">
            Update service information
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
            <CardDescription>
              Update the service information below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Service Name</Label>
              <Input
                id="name"
                value={service.name}
                onChange={(e) => setService(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="Enter service name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor</Label>
              <Select
                value={service.vendor_id}
                onValueChange={(value) => setService(prev => prev ? { ...prev, vendor_id: value } : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map(vendor => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name} {vendor.societies ? `(${vendor.societies.name})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={service.category}
                onChange={(e) => setService(prev => prev ? { ...prev, category: e.target.value } : null)}
                placeholder="Enter service category"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_range">Price Range</Label>
              <Input
                id="price_range"
                value={service.price_range}
                onChange={(e) => setService(prev => prev ? { ...prev, price_range: e.target.value } : null)}
                placeholder="Enter price range (e.g., $50-$100)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={service.description}
                onChange={(e) => setService(prev => prev ? { ...prev, description: e.target.value } : null)}
                placeholder="Enter service description"
                className="min-h-[100px]"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                asChild
              >
                <Link href={`/dashboard/services/${resolvedParams.id}`}>
                  Cancel
                </Link>
              </Button>
              <Button
                type="submit"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
} 
