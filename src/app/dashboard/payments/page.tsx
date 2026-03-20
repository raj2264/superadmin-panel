"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Building, CreditCard, Plus, Search, Trash2, AlertCircle } from "lucide-react";
import { formatDate } from "../../../lib/utils";

interface Society {
  id: string;
  name: string;
  address: string;
  razorpay_accounts: {
    id: string;
    account_id: string;
    key_id: string;
    is_active: boolean;
    created_at: string;
  }[];
}

export default function PaymentsPage() {
  const [societies, setSocieties] = useState<Society[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedSociety, setSelectedSociety] = useState<Society | null>(null);
  const [newAccount, setNewAccount] = useState({
    account_id: "",
    key_id: "",
    key_secret: "",
  });

  useEffect(() => {
    fetchSocieties();
  }, []);

  async function fetchSocieties() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("societies")
        .select(`
          id, name, address, city,
          razorpay_accounts (
            id,
            account_id,
            key_id,
            is_active,
            created_at
          )
        `)
        .order("name");

      if (error) throw error;
      setSocieties(data || []);
    } catch (error) {
      console.error("Error fetching societies:", error);
      setFormError("Failed to load societies");
    } finally {
      setLoading(false);
    }
  }

  async function createRazorpayAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSociety) return;

    try {
      setFormError(null);
      const { data, error } = await supabase.rpc("api_create_razorpay_account", {
        society_id: selectedSociety.id,
        account_id: newAccount.account_id,
        key_id: newAccount.key_id,
        key_secret: newAccount.key_secret,
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.message);
      }

      // Reset form and refresh data
      setNewAccount({ account_id: "", key_id: "", key_secret: "" });
      setSelectedSociety(null);
      setIsCreating(false);
      fetchSocieties();
    } catch (error) {
      console.error("Error creating Razorpay account:", error);
      setFormError(error instanceof Error ? error.message : "Failed to create Razorpay account");
    }
  }

  async function deleteRazorpayAccount(societyId: string, accountId: string) {
    if (!confirm("Are you sure you want to delete this Razorpay account?")) return;

    try {
      const { error } = await supabase
        .from("razorpay_accounts")
        .delete()
        .eq("id", accountId)
        .eq("society_id", societyId);

      if (error) throw error;
      fetchSocieties();
    } catch (error) {
      console.error("Error deleting Razorpay account:", error);
      setFormError("Failed to delete Razorpay account");
    }
  }

  const filteredSocieties = societies.filter((society) =>
    society.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Payment Accounts</h1>
        <Button onClick={() => setIsCreating(!isCreating)}>
          <Plus className="mr-2 h-4 w-4" />
          {isCreating ? "Cancel" : "Add Account"}
        </Button>
      </div>

      {isCreating && (
        <Card>
          <form onSubmit={createRazorpayAccount}>
            <CardHeader>
              <CardTitle>Add Razorpay Account</CardTitle>
              <CardDescription>Create a new Razorpay account for a society</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formError && (
                <div className="p-3 text-sm rounded-md bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400">
                  {formError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="society">Select Society</Label>
                <select
                  id="society"
                  className="w-full p-2 border rounded-md"
                  value={selectedSociety?.id || ""}
                  onChange={(e) => {
                    const society = societies.find((s) => s.id === e.target.value);
                    setSelectedSociety(society || null);
                  }}
                  required
                >
                  <option value="">Select a society</option>
                  {societies.map((society) => (
                    <option key={society.id} value={society.id}>
                      {society.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="account_id">Account ID</Label>
                <Input
                  id="account_id"
                  value={newAccount.account_id}
                  onChange={(e) => setNewAccount({ ...newAccount, account_id: e.target.value })}
                  placeholder="Enter Razorpay Account ID"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="key_id">Key ID</Label>
                <Input
                  id="key_id"
                  value={newAccount.key_id}
                  onChange={(e) => setNewAccount({ ...newAccount, key_id: e.target.value })}
                  placeholder="Enter Razorpay Key ID"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="key_secret">Key Secret</Label>
                <Input
                  id="key_secret"
                  type="password"
                  value={newAccount.key_secret}
                  onChange={(e) => setNewAccount({ ...newAccount, key_secret: e.target.value })}
                  placeholder="Enter Razorpay Key Secret"
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">
                Create Account
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

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="opacity-70">
                <CardHeader className="animate-pulse bg-muted h-12" />
                <CardContent className="animate-pulse h-10 bg-muted rounded" />
              </Card>
            ))}
          </div>
        ) : filteredSocieties.length > 0 ? (
          filteredSocieties.map((society) => (
            <Card key={society.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className="mr-2 rounded-full bg-primary/10 p-1 text-primary">
                      <Building size={18} />
                    </div>
                    <CardTitle className="text-xl">{society.name}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{society.address}</p>

                {society.razorpay_accounts && society.razorpay_accounts.length > 0 ? (
                  <div className="space-y-4">
                    {society.razorpay_accounts.map((account) => (
                      <div
                        key={account.id}
                        className="p-4 rounded-lg border bg-card"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center">
                            <div className="mr-2 rounded-full bg-primary/10 p-1 text-primary">
                              <CreditCard size={16} />
                            </div>
                            <div>
                              <p className="font-medium">Account ID: {account.account_id}</p>
                              <p className="text-sm text-muted-foreground">
                                Key ID: {account.key_id}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Status: {account.is_active ? "Active" : "Inactive"}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Created on {formatDate(account.created_at)}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => deleteRazorpayAccount(society.id, account.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-6 text-center border rounded-lg bg-muted/50">
                    <div className="space-y-2">
                      <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">
                        No Razorpay account configured
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedSociety(society);
                          setIsCreating(true);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Account
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No societies found</p>
          </div>
        )}
      </div>
    </div>
  );
} 