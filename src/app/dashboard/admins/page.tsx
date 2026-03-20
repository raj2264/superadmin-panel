"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { formatDate } from "../../../lib/utils";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Plus, Search, Trash2, User, Building, Copy, Check, Phone, Mail, Eye, EyeOff, KeyRound, Pencil, X, Save } from "lucide-react";
import { Society } from "../../../lib/supabase";

interface Admin {
  id: string;
  user_id: string;
  society_id: string;
  email: string;
  name: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  societies: Society;
}

interface CreatedAdminInfo {
  name: string;
  email: string;
  password: string;
  societyName: string;
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [societies, setSocieties] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [createdAdmin, setCreatedAdmin] = useState<CreatedAdminInfo | null>(null);
  const [resettingPasswordId, setResettingPasswordId] = useState<string | null>(null);
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", society_id: "" });
  const [editError, setEditError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  
  const [newAdmin, setNewAdmin] = useState({
    email: "",
    name: "",
    phone: "",
    password: "",
    society_id: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch societies — only id and name for dropdown
      const { data: societiesData, error: societiesError } = await supabase
        .from("societies")
        .select("id, name")
        .order("name");

      if (societiesError) throw societiesError;
      setSocieties(societiesData || []);

      // Fetch admins with society name
      const { data: adminsData, error: adminsError } = await supabase
        .from("society_admins")
        .select("*, societies(id, name)")
        .order("created_at");

      if (adminsError) throw adminsError;
      setAdmins(adminsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function createAdmin(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setPasswordError(null);

    if (!newAdmin.email.trim() || !newAdmin.name.trim() || !newAdmin.phone.trim() || !newAdmin.society_id) {
      setFormError("Name, email, phone number and society selection are required");
      return;
    }

    // Email validation
    if (!newAdmin.email.includes('@') || !newAdmin.email.includes('.')) {
      setFormError("Please enter a valid email address");
      return;
    }

    // Password validation
    if (!newAdmin.password || newAdmin.password.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      return;
    }

    try {
      setCreatingAdmin(true);
      const email = newAdmin.email.trim().toLowerCase();
      const name = newAdmin.name.trim();
      const phone = newAdmin.phone.trim();
      
      // Call the API route to create the admin
      const response = await fetch('/api/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password: newAdmin.password,
          name,
          phone,
          society_id: newAdmin.society_id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create admin');
      }

      // Find society name for the success card
      const societyName = societies.find(s => s.id === newAdmin.society_id)?.name || "Unknown";

      // Show success with credentials
      setCreatedAdmin({
        name,
        email,
        password: newAdmin.password,
        societyName,
      });

      // Add the new admin to the list
      setAdmins([result.data, ...admins]);
      setFormError(null);
      setIsCreating(false);
      setCreatingAdmin(false);
    } catch (error) {
      console.error("Error creating admin:", error);
      setFormError("Failed to create admin: " + (error instanceof Error ? error.message : "Unknown error"));
      setCreatingAdmin(false);
    }
  }

  async function deleteAdmin(id: string) {
    if (!confirm("Are you sure you want to delete this admin?")) return;

    try {
      // Delete from admins table
      const { error: adminError } = await supabase
        .from("society_admins")
        .delete()
        .eq("id", id);

      if (adminError) throw adminError;
      
      setAdmins(admins.filter((admin) => admin.id !== id));
    } catch (error) {
      console.error("Error deleting admin:", error);
      alert("Failed to delete admin. Please try again.");
    }
  }

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  function openCreateForm() {
    setNewAdmin({
      email: "",
      name: "",
      phone: "",
      password: "",
      society_id: "",
    });
    setPasswordError(null);
    setFormError(null);
    setCreatedAdmin(null);
    setIsCreating(true);
  }

  // Reset a society admin's password back to their phone number
  async function resetAdminPassword(admin: Admin) {
    if (!admin.phone) {
      alert(`Cannot reset password: ${admin.name} has no phone number on file.`);
      return;
    }

    const confirmed = confirm(
      `Reset password for ${admin.name}?\n\nTheir password will be reset to their phone number: ${admin.phone}\nThey will be required to change it on their next login.`
    );
    if (!confirmed) return;

    setResettingPasswordId(admin.id);
    try {
      const response = await fetch("/api/admins", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_id: admin.id,
          action: "reset_password",
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to reset password");
      }

      alert(`Password for ${admin.name} has been reset to their phone number (${admin.phone}). They will need to change it on their next login.`);
    } catch (error) {
      console.error("Error resetting password:", error);
      alert("Failed to reset password: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setResettingPasswordId(null);
    }
  }

  function startEditing(admin: Admin) {
    setEditingAdminId(admin.id);
    setEditForm({
      name: admin.name || "",
      email: admin.email || "",
      phone: admin.phone || "",
      society_id: admin.society_id || "",
    });
    setEditError(null);
  }

  function cancelEditing() {
    setEditingAdminId(null);
    setEditForm({ name: "", email: "", phone: "", society_id: "" });
    setEditError(null);
  }

  async function saveAdmin() {
    if (!editingAdminId) return;
    setEditError(null);

    if (!editForm.name.trim() || !editForm.email.trim() || !editForm.phone.trim() || !editForm.society_id) {
      setEditError("Name, email, phone and society are all required.");
      return;
    }
    if (!editForm.email.includes("@") || !editForm.email.includes(".")) {
      setEditError("Please enter a valid email address.");
      return;
    }

    setSavingEdit(true);
    try {
      const response = await fetch("/api/admins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_id: editingAdminId,
          name: editForm.name.trim(),
          email: editForm.email.trim().toLowerCase(),
          phone: editForm.phone.trim(),
          society_id: editForm.society_id,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to update admin");
      }

      // Update the admin in the local list
      setAdmins(admins.map(a => a.id === editingAdminId ? result.data : a));
      setEditingAdminId(null);
    } catch (error) {
      console.error("Error updating admin:", error);
      setEditError("Failed to save: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setSavingEdit(false);
    }
  }

  const filteredAdmins = admins.filter(
    (admin) =>
      (admin.name && admin.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (admin.email && admin.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (admin.societies?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admins</h1>
        <Button onClick={openCreateForm}>
          <Plus className="mr-2 h-4 w-4" />
          Add Admin
        </Button>
      </div>

      {/* Success Card - shown after admin is created */}
      {createdAdmin && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-green-500 p-1">
                <Check className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-green-700 dark:text-green-400">Admin Created Successfully!</CardTitle>
            </div>
            <CardDescription className="text-green-600 dark:text-green-500">
              Share these login credentials with the admin. They can login immediately — no email confirmation needed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-green-200 dark:border-green-800 bg-white dark:bg-gray-900 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Name</p>
                  <p className="text-sm font-semibold">{createdAdmin.name}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Society</p>
                  <p className="text-sm font-semibold">{createdAdmin.societyName}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Email (Login ID)</p>
                  <p className="text-sm font-mono font-semibold">{createdAdmin.email}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(createdAdmin.email, 'email')}
                  className="h-8 px-2"
                >
                  {copiedField === 'email' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Password</p>
                  <p className="text-sm font-mono font-semibold">{createdAdmin.password}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(createdAdmin.password, 'password')}
                  className="h-8 px-2"
                >
                  {copiedField === 'password' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" onClick={() => setCreatedAdmin(null)}>
              Dismiss
            </Button>
          </CardFooter>
        </Card>
      )}

      {isCreating && (
        <Card>
          <form onSubmit={createAdmin}>
            <CardHeader>
              <CardTitle>Add New Society Admin</CardTitle>
              <CardDescription>Fill in the details below. The admin will be able to login immediately — no email confirmation required.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formError && (
                <div className="p-3 text-sm rounded-md bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400">
                  {formError}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Admin Name *</Label>
                  <Input
                    id="name"
                    value={newAdmin.name}
                    onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                    placeholder="Full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Admin Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                    placeholder="admin@example.com"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    This email will be used to login
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={newAdmin.phone}
                    onChange={(e) => {
                      const phone = e.target.value;
                      setNewAdmin({ ...newAdmin, phone, password: phone });
                    }}
                    placeholder="9876543210"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Phone number will be used as the default login password
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="society">Society *</Label>
                  <select
                    id="society"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={newAdmin.society_id}
                    onChange={(e) => setNewAdmin({ ...newAdmin, society_id: e.target.value })}
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Login Password</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={newAdmin.password}
                      onChange={(e) => {
                        setNewAdmin({ ...newAdmin, password: e.target.value });
                        setPasswordError(null);
                      }}
                      placeholder="Defaults to phone number"
                      className={`font-mono pr-10 ${passwordError ? 'border-red-500' : ''}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => copyToClipboard(newAdmin.password, 'formPassword')}
                    className="flex-shrink-0 px-3"
                  >
                    {copiedField === 'formPassword' ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {passwordError && (
                  <p className="text-sm text-red-500">{passwordError}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Defaults to the phone number. You can override it if needed (min 6 characters).
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => {
                setIsCreating(false);
                setFormError(null);
                setPasswordError(null);
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={creatingAdmin}>
                {creatingAdmin ? "Creating..." : "Create Admin"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      <div className="flex items-center space-x-2">
        <Search className="h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search admins..."
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
        ) : filteredAdmins.length > 0 ? (
          filteredAdmins.map((admin) => (
            <Card key={admin.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className="mr-2 rounded-full bg-primary/10 p-1 text-primary">
                      <User size={18} />
                    </div>
                    <CardTitle className="text-xl">
                      {admin.name || `Admin ${admin.id.substring(0, 8)}`}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    {editingAdminId !== admin.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 gap-1"
                        onClick={() => startEditing(admin)}
                        title="Edit admin details"
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="hidden sm:inline text-xs">Edit</span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20 gap-1"
                      onClick={() => resetAdminPassword(admin)}
                      disabled={resettingPasswordId === admin.id}
                      title="Reset password to phone number"
                    >
                      <KeyRound className={`h-4 w-4 ${resettingPasswordId === admin.id ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline text-xs">{resettingPasswordId === admin.id ? 'Resetting...' : 'Reset Password'}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => deleteAdmin(admin.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {editingAdminId === admin.id ? (
                  <div className="space-y-4">
                    {editError && (
                      <div className="p-3 text-sm rounded-md bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400">
                        {editError}
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs">Name</Label>
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          placeholder="Full name"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Email</Label>
                        <Input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          placeholder="admin@example.com"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Phone</Label>
                        <Input
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          placeholder="9876543210"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Society</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          value={editForm.society_id}
                          onChange={(e) => setEditForm({ ...editForm, society_id: e.target.value })}
                        >
                          <option value="">Select a society</option>
                          {societies.map((society) => (
                            <option key={society.id} value={society.id}>
                              {society.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Button size="sm" onClick={saveAdmin} disabled={savingEdit}>
                        <Save className="h-4 w-4 mr-1" />
                        {savingEdit ? "Saving..." : "Save"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEditing}>
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {admin.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Mail className="h-3.5 w-3.5" />
                        {admin.email}
                      </div>
                    )}
                    {admin.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Phone className="h-3.5 w-3.5" />
                        {admin.phone}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building className="h-4 w-4" />
                      {admin.societies?.name || "No society assigned"}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Created on {formatDate(admin.created_at)}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-32 border rounded-lg p-4 bg-muted/20">
            <p className="text-muted-foreground">No admins found</p>
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
    </div>
  );
} 