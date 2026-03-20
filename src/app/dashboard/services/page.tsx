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
  Wrench,
  Search,
  Filter,
  Download,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';

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

interface FilterState {
  search: string;
  category: string;
  status: string;
}

export default function ServicesPage() {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: 'all',
    status: 'all'
  });
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    filterServices();
  }, [services, filters]);

  async function fetchServices() {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('services')
        .select('id, name, category, description, price_range, is_active, created_at, updated_at')
        .order('name')
        .limit(200);
      
      if (error) {
        throw error;
      }
      
      setServices((data || []) as any);
      setFilteredServices((data || []) as any);

      // Extract unique categories
      const uniqueCategories = Array.from(new Set(data?.map(service => service.category) || []));
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error in fetchServices:', error);
      toast({
        title: 'Error',
        description: 'Failed to load services',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function filterServices() {
    let filtered = [...services];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(service => 
        service.name.toLowerCase().includes(searchLower) ||
        service.description.toLowerCase().includes(searchLower) ||
        service.category.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(service => service.category === filters.category);
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(service => 
        service.is_active === (filters.status === 'active')
      );
    }

    setFilteredServices(filtered);
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  }

  const handleRefresh = () => {
    setRefreshing(true);
    fetchServices();
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    toast({
      title: 'Coming Soon',
      description: 'Export functionality will be available soon',
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground">
            Manage services available to all residents
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
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExport}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button
            size="sm"
            asChild
          >
            <Link href="/dashboard/services/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Service
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter services by different criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
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
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <Wrench className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>All Services</CardTitle>
            <Badge variant="outline" className="ml-2">
              {filteredServices.length} {filteredServices.length === 1 ? 'service' : 'services'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No services found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {filters.search || filters.category !== 'all' || filters.status !== 'all'
                  ? "No services match your current filters. Try adjusting your search criteria."
                  : "There are no services yet. Add your first service to get started."}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-24rem)]">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredServices.map((service) => (
                  <Card key={service.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge variant={service.is_active ? "default" : "secondary"}>
                          {service.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">{service.category}</Badge>
                      </div>
                      <CardTitle className="text-lg mt-2">{service.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {service.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {service.description}
                          </p>
                        )}
                        {service.price_range && (
                          <div>
                            <p className="text-sm font-medium">Price Range</p>
                            <p className="text-sm text-muted-foreground">
                              {service.price_range}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium">Last Updated</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(service.updated_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          asChild
                        >
                          <Link href={`/dashboard/services/${service.id}`}>
                            View Details
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          asChild
                        >
                          <Link href={`/dashboard/services/${service.id}/edit`}>
                            Edit
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