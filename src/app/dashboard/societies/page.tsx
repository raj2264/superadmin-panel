"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { formatDate } from "../../../lib/utils";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Building, Plus, Search, Trash2, Edit, UserPlus } from "lucide-react";
import Link from "next/link";

interface Society {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  created_at: string;
  updated_at: string;
}

export default function SocietiesPage() {
  const [societies, setSocieties] = useState<Society[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [newSociety, setNewSociety] = useState({ 
    name: "", 
    address: "", 
    city: "", 
    state: "", 
    pincode: "" 
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();
  const ITEMS_PER_PAGE = 12;

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      fetchSocieties(0, searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  async function fetchSocieties(pageNum: number = 0, search: string = "") {
    setLoading(true);
    try {
      let query = supabase
        .from("societies")
        .select("id, name, address, city, state, pincode, created_at")
        .order("name")
        .range(pageNum * ITEMS_PER_PAGE, (pageNum + 1) * ITEMS_PER_PAGE - 1);

      // Add search filters if search term exists
      if (search.trim()) {
        query = supabase
          .from("societies")
          .select("id, name, address, city, state, pincode, created_at")
          .or(`name.ilike.%${search}%,address.ilike.%${search}%,city.ilike.%${search}%,state.ilike.%${search}%,pincode.ilike.%${search}%`)
          .order("name")
          .range(pageNum * ITEMS_PER_PAGE, (pageNum + 1) * ITEMS_PER_PAGE - 1);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Check if there are more results
      if (!search.trim() && pageNum === 0) {
        const { count } = await supabase
          .from("societies")
          .select("id", { count: "exact", head: true });
        setHasMore((data?.length || 0) < (count || 0));
      } else {
        setHasMore((data?.length || 0) >= ITEMS_PER_PAGE);
      }

      if (pageNum === 0) {
        setSocieties((data || []) as any);
      } else {
        setSocieties([...societies, ...(data || [])] as any);
      }
    } catch (error) {
      console.error("Error fetching societies:", error);
    } finally {
      setLoading(false);
    }
  }

  async function createSociety(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!newSociety.name.trim() || !newSociety.address.trim() || 
        !newSociety.city.trim() || !newSociety.state.trim() || 
        !newSociety.pincode.trim()) {
      setFormError("All fields are required");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/societies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSociety.name.trim(),
          address: newSociety.address.trim(),
          city: newSociety.city.trim(),
          state: newSociety.state.trim(),
          pincode: newSociety.pincode.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create society');
      }

      // On success, close the form and refresh the list
      setNewSociety({ name: "", address: "", city: "", state: "", pincode: "" });
      setIsFormOpen(false);
      setPage(0);
      fetchSocieties(0, searchTerm);
    } catch (error) {
      console.error("Error creating society:", error);
      setFormError("Failed to create society. Please check console for details.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteSociety(id: string) {
    if (!confirm("Are you sure you want to delete this society?")) return;

    try {
      const response = await fetch(`/api/societies?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete society');
      }

      setSocieties(societies.filter((society) => society.id !== id));
    } catch (error) {
      console.error("Error deleting society:", error);
      alert(error instanceof Error ? error.message : "Failed to delete society. Please try again.");
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Societies</h1>
        <Button onClick={() => setIsFormOpen(!isFormOpen)}>
          <Plus className="mr-2 h-4 w-4" />
          {isFormOpen ? "Cancel" : "Add Society"}
        </Button>
      </div>

      {isFormOpen && (
        <Card>
          <form onSubmit={createSociety}>
            <CardHeader>
              <CardTitle>Add New Society</CardTitle>
              <CardDescription>Create a new society in the system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formError && (
                <div className="p-3 text-sm rounded-md bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400">
                  {formError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Society Name</Label>
                <Input
                  id="name"
                  value={newSociety.name}
                  onChange={(e) => setNewSociety({ ...newSociety, name: e.target.value })}
                  placeholder="Enter society name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={newSociety.address}
                  onChange={(e) => setNewSociety({ ...newSociety, address: e.target.value })}
                  placeholder="Enter street address"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={newSociety.city}
                    onChange={(e) => setNewSociety({ ...newSociety, city: e.target.value })}
                    placeholder="Enter city name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={newSociety.state}
                    onChange={(e) => setNewSociety({ ...newSociety, state: e.target.value })}
                    placeholder="Enter state"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">PIN Code</Label>
                <Input
                  id="pincode"
                  value={newSociety.pincode}
                  onChange={(e) => setNewSociety({ ...newSociety, pincode: e.target.value })}
                  placeholder="Enter PIN code"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Society"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      <div className="flex items-center space-x-2">
        <Search className="h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search societies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading && page === 0 ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="opacity-70">
              <CardHeader className="animate-pulse bg-muted h-12" />
              <CardContent className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-3/4" />
              </CardContent>
            </Card>
          ))
        ) : societies.length > 0 ? (
          societies.map((society) => (
            <Card key={society.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className="mr-2 rounded-full bg-primary/10 p-1 text-primary">
                      <Building size={18} />
                    </div>
                    <CardTitle className="text-xl">{society.name}</CardTitle>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/dashboard/societies/${society.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => deleteSociety(society.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground">{society.address}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {society.city}{society.state && `, ${society.state}`} 
                  {society.pincode && ` - ${society.pincode}`}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Created on {formatDate(society.created_at)}
                </p>
              </CardContent>
              <CardFooter>
                <Link href={`/dashboard/societies/${society.id}/admins`} passHref>
                  <Button variant="outline" size="sm" className="w-full">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Manage Admins
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center h-32 border rounded-lg p-4 bg-muted/20">
            <p className="text-muted-foreground">No societies found</p>
            {searchTerm && (
              <Button
                variant="link"
                onClick={() => setSearchTerm("")}
                className="mt-2"
              >
                Clear search
              </Button>
            )}
          </div>
        )}
      </div>

      {hasMore && societies.length > 0 && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => {
              setPage(page + 1);
              fetchSocieties(page + 1, searchTerm);
            }}
            disabled={loading}
          >
            {loading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
} 