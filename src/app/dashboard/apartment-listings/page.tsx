'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Search, Filter, Home, Building2, Phone, Mail, Calendar, IndianRupee, ArrowUpDown, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ApartmentListing {
  id: string;
  society_id: string;
  resident_id: string;
  apartment_number: string;
  listing_type: 'sale' | 'rent';
  title: string;
  description: string | null;
  price: number;
  contact_phone: string | null;
  contact_email: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  societies: {
    name: string;
  };
  residents: {
    name: string;
    email: string;
    unit_number: string;
  };
}

export default function ApartmentListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<ApartmentListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [societyFilter, setSocietyFilter] = useState<string | null>(null);
  const [listingTypeFilter, setListingTypeFilter] = useState<string | null>(null);
  const [societies, setSocieties] = useState<{ id: string; name: string }[]>([]);

  // Fetch all societies for the filter dropdown
  useEffect(() => {
    const fetchSocieties = async () => {
      const { data, error } = await supabase
        .from('societies')
        .select('id, name')
        .order('name');

      if (!error && data) {
        setSocieties(data);
      }
    };

    fetchSocieties();
  }, []);

  // Fetch apartment listings
  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('apartment_listings')
          .select(`
            *,
            societies:society_id (name),
            residents:resident_id (name, email, unit_number)
          `);
        
        if (societyFilter) {
          query = query.eq('society_id', societyFilter);
        }
        
        if (listingTypeFilter) {
          query = query.eq('listing_type', listingTypeFilter);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching apartment listings:', error);
        } else {
          setListings(data as ApartmentListing[]);
        }
      } catch (error) {
        console.error('Error in fetchListings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [societyFilter, listingTypeFilter]);

  // Filter listings by search query
  const filteredListings = listings.filter((listing) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      listing.title.toLowerCase().includes(searchLower) ||
      listing.apartment_number.toLowerCase().includes(searchLower) ||
      listing.societies.name.toLowerCase().includes(searchLower) ||
      listing.residents.name.toLowerCase().includes(searchLower) ||
      listing.residents.email.toLowerCase().includes(searchLower) ||
      (listing.description && listing.description.toLowerCase().includes(searchLower))
    );
  });

  // Format price with Indian Rupee symbol
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Home className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Apartment Listings</h1>
              <p className="text-muted-foreground">
                View and manage apartment listings from residents
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="px-3 py-1">
              {filteredListings.length} {filteredListings.length === 1 ? 'Listing' : 'Listings'}
            </Badge>
          </div>
        </div>
        <Separator />
      </div>

      {/* Filters Section */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Filters</CardTitle>
              <CardDescription>
                Filter apartment listings by society, type, or search by keywords
              </CardDescription>
            </div>
            {(searchQuery || societyFilter || listingTypeFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSocietyFilter(null);
                  setListingTypeFilter(null);
                }}
                className="h-8"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search listings..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              value={societyFilter || 'all'}
              onValueChange={(value) => setSocietyFilter(value === 'all' ? null : value)}
            >
              <SelectTrigger>
                <div className="flex items-center">
                  <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Filter by Society" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Societies</SelectItem>
                {societies.map((society) => (
                  <SelectItem key={society.id} value={society.id}>
                    {society.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={listingTypeFilter || 'all'}
              onValueChange={(value) => setListingTypeFilter(value === 'all' ? null : value)}
            >
              <SelectTrigger>
                <div className="flex items-center">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Listing Type" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sale">For Sale</SelectItem>
                <SelectItem value="rent">For Rent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Listings Section */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading listings...</p>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-3 mb-4">
                <Home className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No apartment listings found</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {searchQuery || societyFilter || listingTypeFilter
                  ? 'Try adjusting your filters to see more results'
                  : 'Residents have not created any apartment listings yet'}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-24rem)]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {filteredListings.map((listing) => (
                  <Card key={listing.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge variant={listing.listing_type === 'sale' ? 'destructive' : 'secondary'}>
                          {listing.listing_type === 'sale' ? 'FOR SALE' : 'FOR RENT'}
                        </Badge>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-sm text-muted-foreground">
                                {formatDate(listing.created_at)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Listed on {formatDate(listing.created_at)}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <CardTitle className="text-lg mt-2 line-clamp-2">{listing.title}</CardTitle>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4 mr-1" />
                        {listing.societies.name}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm">
                            <Home className="h-4 w-4 mr-1 text-muted-foreground" />
                            Unit {listing.apartment_number}
                          </div>
                          <div className="font-semibold text-lg text-primary">
                            {formatPrice(listing.price)}
                          </div>
                        </div>
                        {listing.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {listing.description}
                          </p>
                        )}
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="truncate">{listing.contact_email}</span>
                          </div>
                          {listing.contact_phone && (
                            <div className="flex items-center text-sm">
                              <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>{listing.contact_phone}</span>
                            </div>
                          )}
                          <div className="flex items-center text-sm">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>Listed by {listing.residents.name}</span>
                          </div>
                        </div>
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