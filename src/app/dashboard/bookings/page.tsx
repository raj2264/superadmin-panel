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
  Calendar,
  Clock,
  User,
  Store,
  Search,
  Filter,
  Download,
  RefreshCw,
  Building2,
  Wrench,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Booking {
  id: string;
  service_id: string;
  resident_id: string;
  service_description: string;
  booking_date: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at?: string;
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
    societies: {
      id: string;
      name: string;
    };
  };
}

interface FilterState {
  search: string;
  status: string;
  dateRange: string;
  society: string;
}

export default function BookingsPage() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [societies, setSocieties] = useState<{ id: string; name: string }[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    dateRange: 'all',
    society: 'all'
  });
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchBookings();
    fetchSocieties();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, filters]);

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

  async function fetchBookings() {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('service_bookings')
        .select(`
          id, service_id, resident_id, service_description, booking_date,
          status, notes, created_at,
          service:services( id, name, category ),
          resident:residents( id, name, unit_number, societies:society_id( id, name ) )
        `)
        .order('booking_date', { ascending: false })
        .limit(200);
      
      if (error) {
        console.error('Error fetching bookings:', error);
        throw error;
      }
      
      setBookings((data as any) || []);
      setFilteredBookings((data as any) || []);
    } catch (error) {
      console.error('Error in fetchBookings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load bookings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function filterBookings() {
    let filtered = [...bookings];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.service?.name?.toLowerCase().includes(searchLower) ||
        booking.resident?.name?.toLowerCase().includes(searchLower) ||
        booking.service_description?.toLowerCase().includes(searchLower) ||
        booking.resident?.unit_number?.toLowerCase().includes(searchLower) ||
        booking.resident?.societies?.name?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(booking => booking.status === filters.status);
    }

    // Apply society filter
    if (filters.society !== 'all') {
      filtered = filtered.filter(booking => 
        booking.resident?.societies?.id === filters.society
      );
    }

    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(booking => {
        const bookingDate = new Date(booking.booking_date);
        switch (filters.dateRange) {
          case 'today':
            return bookingDate >= today;
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return bookingDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return bookingDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    setFilteredBookings(filtered);
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

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBookings();
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
          <h1 className="text-2xl font-bold tracking-tight">Service Bookings</h1>
          <p className="text-muted-foreground">
            Manage service bookings across all societies
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
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter bookings by different criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bookings..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-8"
              />
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
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
              value={filters.dateRange}
              onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
            >
              <SelectTrigger>
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>All Bookings</CardTitle>
            <Badge variant="outline" className="ml-2">
              {filteredBookings.length} {filteredBookings.length === 1 ? 'booking' : 'bookings'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No bookings found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {filters.search || filters.status !== 'all' || filters.society !== 'all' || filters.dateRange !== 'all'
                  ? "No bookings match your current filters. Try adjusting your search criteria."
                  : "There are no service bookings yet."}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-24rem)]">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredBookings.map((booking) => (
                  <Card key={booking.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge className={getStatusBadgeColor(booking.status)}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </Badge>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Building2 className="h-4 w-4 mr-1" />
                          {booking.resident?.societies?.name || 'Unknown Society'}
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {booking.service?.name || 'Unknown Service'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {booking.service?.category || 'Category'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {booking.resident?.name || 'Unknown'} 
                            {booking.resident?.unit_number && (
                              <span className="text-muted-foreground">
                                {' '}({booking.resident.unit_number})
                              </span>
                            )}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(booking.booking_date)}</span>
                        </div>
                        
                        <p className="text-sm line-clamp-2 mt-2">
                          {booking.service_description || booking.service?.description || 'No description available'}
                        </p>
                      </div>
                    </CardContent>
                    <div className="border-t bg-muted/50 px-4 py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        asChild
                      >
                        <Link href={`/dashboard/bookings/${booking.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
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