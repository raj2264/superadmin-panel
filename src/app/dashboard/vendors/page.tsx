'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Store,
  Search,
  Filter,
  Building2,
  Phone,
  Mail,
  MapPin,
  Plus,
  RefreshCw,
  Wrench,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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

interface Vendor {
  id: string;
  name: string;
  category: string;
  phone: string;
  email: string;
  address: string;
  description: string;
  service_hours: string;
  contact_person: string;
  is_available: boolean;
  society_id: string;
  created_at: string;
  updated_at: string;
  societies: {
    name: string;
  };
  services?: Service[];
}

interface FilterState {
  search: string;
  category: string;
  society: string;
  availability: string;
}

export default function VendorsPage() {
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [societies, setSocieties] = useState<{ id: string; name: string }[]>([]);
  const [expandedVendors, setExpandedVendors] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: 'all',
    society: 'all',
    availability: 'all'
  });
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchVendors();
    fetchSocieties();
  }, []);

  useEffect(() => {
    filterVendors();
  }, [vendors, filters]);

  async function fetchSocieties() {
    try {
      const { data, error } = await supabase
        .from('societies')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setSocieties(data || []);
    } catch (error) {
      console.error('Error fetching societies:', error);
      toast({
        title: 'Error',
        description: 'Failed to load societies',
        variant: 'destructive',
      });
    }
  }

  async function fetchVendors() {
    try {
      setLoading(true);
      
      // Fetch vendors with their society info
      const { data: vendorsData, error: vendorsError } = await supabase
        .from('vendors')
        .select(`
          id, name, phone, email, address, society_id, is_active, created_at,
          societies:society_id (name)
        `)
        .order('created_at', { ascending: false })
        .limit(200);
      
      if (vendorsError) {
        throw new Error(`Failed to fetch vendors: ${vendorsError.message}`);
      }

      if (!vendorsData) {
        throw new Error('No vendors data returned from the database');
      }

      // Fetch services for all vendors
      const { data: servicesData, error: servicesError } = await supabase
        .from('vendor_services')
        .select('id, vendor_id, name, price')
        .order('name');

      if (servicesError) {
        throw new Error(`Failed to fetch services: ${servicesError.message}`);
      }

      if (!servicesData) {
        throw new Error('No services data returned from the database');
      }

      // Combine vendors with their services
      const vendorsWithServices = vendorsData.map(vendor => ({
        ...vendor,
        services: servicesData.filter(service => service.vendor_id === vendor.id)
      }));
      
      setVendors(vendorsWithServices as any);
      setFilteredVendors(vendorsWithServices as any);
    } catch (error) {
      console.error('Error in fetchVendors:', error instanceof Error ? error.message : 'Unknown error', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load vendors and services',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function filterVendors() {
    let filtered = [...vendors];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(vendor => 
        vendor.name.toLowerCase().includes(searchLower) ||
        vendor.category.toLowerCase().includes(searchLower) ||
        vendor.description?.toLowerCase().includes(searchLower) ||
        vendor.societies?.name.toLowerCase().includes(searchLower) ||
        vendor.services?.some(service => 
          service.name.toLowerCase().includes(searchLower) ||
          service.description.toLowerCase().includes(searchLower)
        )
      );
    }

    // Apply category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(vendor => 
        vendor.category === filters.category ||
        vendor.services?.some(service => service.category === filters.category)
      );
    }

    // Apply society filter
    if (filters.society !== 'all') {
      filtered = filtered.filter(vendor => vendor.society_id === filters.society);
    }

    // Apply availability filter
    if (filters.availability !== 'all') {
      const isAvailable = filters.availability === 'available';
      filtered = filtered.filter(vendor => vendor.is_available === isAvailable);
    }

    setFilteredVendors(filtered);
  }

  const handleRefresh = () => {
    setRefreshing(true);
    fetchVendors();
  };

  const toggleVendorExpansion = (vendorId: string) => {
    setExpandedVendors(prev => {
      const next = new Set(prev);
      if (next.has(vendorId)) {
        next.delete(vendorId);
      } else {
        next.add(vendorId);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vendors & Services</h1>
          <p className="text-muted-foreground">
            Manage service providers and their services across all societies
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/dashboard/vendors/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Vendor
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter vendors and services by different criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vendors and services..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-8"
              />
            </div>
            <Select
              value={filters.category}
              onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="plumbing">Plumbing</SelectItem>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="carpentry">Carpentry</SelectItem>
                <SelectItem value="cleaning">Cleaning</SelectItem>
                <SelectItem value="painting">Painting</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.society}
              onValueChange={(value) => setFilters(prev => ({ ...prev, society: value }))}
            >
              <SelectTrigger>
                <Building2 className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by society" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Societies</SelectItem>
                {societies.map(society => (
                  <SelectItem key={society.id} value={society.id}>
                    {society.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.availability}
              onValueChange={(value) => setFilters(prev => ({ ...prev, availability: value }))}
            >
              <SelectTrigger>
                <Store className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>All Vendors & Services</CardTitle>
            <Badge variant="outline" className="ml-2">
              {filteredVendors.length} {filteredVendors.length === 1 ? 'vendor' : 'vendors'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="text-center py-8">
              <Store className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No vendors found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {filters.search || filters.category !== 'all' || filters.society !== 'all' || filters.availability !== 'all'
                  ? "No vendors match your current filters. Try adjusting your search criteria."
                  : "There are no vendors yet. Add your first vendor to get started."}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-24rem)]">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredVendors.map((vendor) => (
                  <Card key={vendor.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge variant={vendor.is_available ? "default" : "secondary"}>
                          {vendor.is_available ? 'Available' : 'Unavailable'}
                        </Badge>
                        <Badge variant="outline">{vendor.category}</Badge>
                      </div>
                      <CardTitle className="text-lg mt-2">{vendor.name}</CardTitle>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4 mr-1" />
                        {vendor.societies?.name || 'Unknown Society'}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{vendor.phone}</span>
                        </div>
                        {vendor.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{vendor.email}</span>
                          </div>
                        )}
                        {vendor.address && (
                          <div className="flex items-start gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                            <span>{vendor.address}</span>
                          </div>
                        )}
                        {vendor.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                            {vendor.description}
                          </p>
                        )}
                      </div>

                      {vendor.services && vendor.services.length > 0 && (
                        <Collapsible
                          open={expandedVendors.has(vendor.id)}
                          onOpenChange={() => toggleVendorExpansion(vendor.id)}
                          className="mt-4"
                        >
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="w-full justify-between">
                              <div className="flex items-center">
                                <Wrench className="h-4 w-4 mr-2" />
                                <span>Services ({vendor.services.length})</span>
                              </div>
                              {expandedVendors.has(vendor.id) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="space-y-2 mt-2">
                            <Separator />
                            {vendor.services.map(service => (
                              <div key={service.id} className="p-2 rounded-lg bg-muted/50">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{service.name}</span>
                                  <Badge variant={service.is_active ? "default" : "secondary"}>
                                    {service.is_active ? 'Active' : 'Inactive'}
                                  </Badge>
                                </div>
                                {service.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {service.description}
                                  </p>
                                )}
                                {service.price_range && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Price Range: {service.price_range}
                                  </p>
                                )}
                                <div className="flex gap-2 mt-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    asChild
                                  >
                                    <Link href={`/dashboard/vendors/${vendor.id}/services/${service.id}/edit`}>
                                      Edit Service
                                    </Link>
                                  </Button>
                                </div>
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mt-2"
                              asChild
                            >
                              <Link href={`/dashboard/vendors/${vendor.id}/services/new`}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Service
                              </Link>
                            </Button>
                          </CollapsibleContent>
                        </Collapsible>
                      )}

                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          asChild
                        >
                          <Link href={`/dashboard/vendors/${vendor.id}`}>
                            View Details
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          asChild
                        >
                          <Link href={`/dashboard/vendors/${vendor.id}/bookings`}>
                            Manage Bookings
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 