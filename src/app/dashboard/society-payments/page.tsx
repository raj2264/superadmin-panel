"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Building,
  Calendar,
  CircleDollarSign,
  Download,
  FileImage,
  Loader2,
  Search,
  Trash2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { buildProxyUrl } from "@/lib/storage-proxy";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Society {
  id: string;
  name: string;
  address?: string;
}

interface SocietyPaymentRecord {
  id: string;
  society_id: string;
  billing_frequency: "monthly" | "quarterly" | "bi_annually" | "annually";
  period_start: string | null;
  period_end: string | null;
  payment_amount: number;
  payment_mode: "upi" | "bank_transfer" | "cheque" | "cash" | "online" | "other";
  transaction_id: string | null;
  cheque_number: string | null;
  cheque_date: string | null;
  payment_date: string;
  reference_notes: string | null;
  proof_file_path: string | null;
  proof_file_name: string | null;
  created_at: string;
  societies?: Society | null;
}

const frequencyOptions = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "bi_annually", label: "Bi Annually" },
  { value: "annually", label: "Annually" },
];

const paymentModeOptions = [
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "cash", label: "Cash" },
  { value: "online", label: "Online" },
  { value: "other", label: "Other" },
];

function formatFrequency(value: string): string {
  return value.replace("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

export default function SocietyPaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [societies, setSocieties] = useState<Society[]>([]);
  const [records, setRecords] = useState<SocietyPaymentRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [societyFilter, setSocietyFilter] = useState("all");
  const [frequencyFilter, setFrequencyFilter] = useState("all");
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedProofFile, setSelectedProofFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    society_id: "",
    billing_frequency: "monthly",
    period_start: "",
    period_end: "",
    payment_amount: "",
    payment_mode: "bank_transfer",
    transaction_id: "",
    cheque_number: "",
    cheque_date: "",
    payment_date: new Date().toISOString().slice(0, 10),
    reference_notes: "",
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    try {
      setLoading(true);

      const [societyRes, recordsRes] = await Promise.all([
        supabase.from("societies").select("id, name, address").order("name"),
        fetch("/api/society-payments"),
      ]);

      if (societyRes.error) {
        throw new Error(societyRes.error.message);
      }

      const recordsJson = await recordsRes.json();
      if (!recordsRes.ok) {
        throw new Error(recordsJson.error || "Failed to load payment records");
      }

      setSocieties((societyRes.data || []) as Society[]);
      setRecords((recordsJson.records || []) as SocietyPaymentRecord[]);
    } catch (error) {
      console.error("Error loading society payments page:", error);
      setFormError(error instanceof Error ? error.message : "Failed to load records");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRecord(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!formData.society_id || !formData.billing_frequency || !formData.payment_mode || !formData.payment_date) {
      setFormError("Society, billing frequency, payment mode and payment date are required.");
      return;
    }

    const amount = Number(formData.payment_amount);
    if (Number.isNaN(amount) || amount < 0) {
      setFormError("Please enter a valid non-negative payment amount.");
      return;
    }

    if (formData.payment_mode === "cheque" && (!formData.cheque_number || !formData.cheque_date)) {
      setFormError("Cheque number and cheque date are required for cheque payments.");
      return;
    }

    try {
      setSubmitting(true);
      let proofFilePath: string | null = null;
      let proofFileName: string | null = null;

      if (selectedProofFile) {
        const fileExt = selectedProofFile.name.split(".").pop() || "png";
        const sanitizedFileName = selectedProofFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const filePath = `${formData.society_id}/${Date.now()}_${sanitizedFileName}`;

        const { error: uploadError } = await supabase.storage
          .from("society-payment-proofs")
          .upload(filePath, selectedProofFile, {
            contentType: selectedProofFile.type || `image/${fileExt}`,
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Failed to upload proof: ${uploadError.message}`);
        }

        proofFilePath = filePath;
        proofFileName = selectedProofFile.name;
      }

      const { data: authData } = await supabase.auth.getUser();

      const response = await fetch("/api/society-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          payment_amount: amount,
          period_start: formData.period_start || null,
          period_end: formData.period_end || null,
          transaction_id: formData.transaction_id || null,
          cheque_number: formData.cheque_number || null,
          cheque_date: formData.cheque_date || null,
          reference_notes: formData.reference_notes || null,
          proof_file_path: proofFilePath,
          proof_file_name: proofFileName,
          created_by: authData?.user?.id || null,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to create payment record");
      }

      setFormData({
        society_id: "",
        billing_frequency: "monthly",
        period_start: "",
        period_end: "",
        payment_amount: "",
        payment_mode: "bank_transfer",
        transaction_id: "",
        cheque_number: "",
        cheque_date: "",
        payment_date: new Date().toISOString().slice(0, 10),
        reference_notes: "",
      });
      setSelectedProofFile(null);
      await fetchInitialData();
    } catch (error) {
      console.error("Error creating society payment record:", error);
      setFormError(error instanceof Error ? error.message : "Failed to save payment record");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteRecord(id: string) {
    const confirmed = confirm("Delete this payment record? This action cannot be undone.");
    if (!confirmed) return;

    try {
      setDeletingId(id);
      const response = await fetch(`/api/society-payments?id=${id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to delete record");
      }
      setRecords((prev) => prev.filter((record) => record.id !== id));
    } catch (error) {
      console.error("Error deleting record:", error);
      alert(error instanceof Error ? error.message : "Failed to delete record");
    } finally {
      setDeletingId(null);
    }
  }

  function handleDownloadCsv(scope: "all" | "society") {
    if (scope === "society" && societyFilter === "all") {
      alert("Select a society first to download society-wise CSV.");
      return;
    }

    const query = new URLSearchParams({ download: "csv" });
    if (scope === "society") {
      query.set("societyId", societyFilter);
    }
    if (frequencyFilter !== "all") {
      query.set("frequency", frequencyFilter);
    }

    const href = `/api/society-payments?${query.toString()}`;
    window.open(href, "_blank");
  }

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const societyName = record.societies?.name?.toLowerCase() || "";
      const searchable = [
        societyName,
        record.transaction_id || "",
        record.cheque_number || "",
        record.reference_notes || "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !searchTerm || searchable.includes(searchTerm.toLowerCase());
      const matchesSociety = societyFilter === "all" || record.society_id === societyFilter;
      const matchesFrequency =
        frequencyFilter === "all" || record.billing_frequency === frequencyFilter;

      return matchesSearch && matchesSociety && matchesFrequency;
    });
  }, [records, searchTerm, societyFilter, frequencyFilter]);

  const totalAmount = useMemo(
    () => filteredRecords.reduce((sum, record) => sum + Number(record.payment_amount || 0), 0),
    [filteredRecords]
  );

  if (loading) {
    return (
      <div className="min-h-[360px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Society Payments</h1>
          <p className="text-muted-foreground">
            Track collections from societies by cycle, amount, mode and proof.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => handleDownloadCsv("all")}>
            <Download className="h-4 w-4 mr-2" />
            Download All CSV
          </Button>
          <Button
            variant="outline"
            disabled={societyFilter === "all"}
            onClick={() => handleDownloadCsv("society")}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Society CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-blue-100">Recorded Entries</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{filteredRecords.length}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-500 to-green-600 text-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-emerald-100">Total Amount</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatCurrency(totalAmount)}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-amber-100">Societies Covered</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {new Set(filteredRecords.map((record) => record.society_id)).size}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CircleDollarSign className="h-5 w-5 text-primary" />
            Add Society Payment Record
          </CardTitle>
          <CardDescription>
            Save monthly, quarterly, bi annual or annual payment details with proof file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleCreateRecord}>
            {formError && (
              <div className="rounded-md bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 p-3 text-sm">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Society</Label>
                <Select
                  value={formData.society_id}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, society_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select society" />
                  </SelectTrigger>
                  <SelectContent>
                    {societies.map((society) => (
                      <SelectItem key={society.id} value={society.id}>
                        {society.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select
                  value={formData.billing_frequency}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, billing_frequency: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {frequencyOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Payment Amount (INR)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.payment_amount}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, payment_amount: e.target.value }))
                  }
                  placeholder="e.g. 25000"
                />
              </div>

              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Select
                  value={formData.payment_mode}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, payment_mode: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentModeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Payment Date</Label>
                <Input
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, payment_date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Transaction ID / Reference</Label>
                <Input
                  value={formData.transaction_id}
                  onChange={(e) => setFormData((prev) => ({ ...prev, transaction_id: e.target.value }))}
                  placeholder="Transaction ID or bank reference"
                />
              </div>

              <div className="space-y-2">
                <Label>Cheque Number</Label>
                <Input
                  value={formData.cheque_number}
                  onChange={(e) => setFormData((prev) => ({ ...prev, cheque_number: e.target.value }))}
                  placeholder="Required for cheque mode"
                />
              </div>

              <div className="space-y-2">
                <Label>Cheque Date</Label>
                <Input
                  type="date"
                  value={formData.cheque_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, cheque_date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Period Start</Label>
                <Input
                  type="date"
                  value={formData.period_start}
                  onChange={(e) => setFormData((prev) => ({ ...prev, period_start: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Period End</Label>
                <Input
                  type="date"
                  value={formData.period_end}
                  onChange={(e) => setFormData((prev) => ({ ...prev, period_end: e.target.value }))}
                />
              </div>

              <div className="space-y-2 lg:col-span-3">
                <Label>Proof Screenshot / Document</Label>
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setSelectedProofFile(e.target.files?.[0] || null)}
                />
                {selectedProofFile && (
                  <p className="text-xs text-muted-foreground">Selected: {selectedProofFile.name}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea
                value={formData.reference_notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, reference_notes: e.target.value }))}
                placeholder="Any remarks or reconciliation notes"
              />
            </div>

            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save Payment Record
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            Society Payment Ledger
          </CardTitle>
          <CardDescription>
            Filter and review all society payment records, then export CSV for reporting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
              <Input
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by society, reference, cheque number"
              />
            </div>

            <div className="w-full lg:w-72">
              <Select value={societyFilter} onValueChange={setSocietyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by society" />
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
            </div>

            <div className="w-full lg:w-60">
              <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Frequencies</SelectItem>
                  {frequencyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="text-center py-14 border rounded-md bg-muted/20">
              <Calendar className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
              <p className="font-medium">No records found</p>
              <p className="text-sm text-muted-foreground">Try changing filters or create a new payment entry.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Society</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Proof</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="font-medium">{record.societies?.name || "Unknown"}</div>
                        <div className="text-xs text-muted-foreground">{record.societies?.address || ""}</div>
                      </TableCell>
                      <TableCell>{formatFrequency(record.billing_frequency)}</TableCell>
                      <TableCell className="text-sm">
                        {record.period_start || record.period_end
                          ? `${record.period_start || "-"} to ${record.period_end || "-"}`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(Number(record.payment_amount || 0))}
                      </TableCell>
                      <TableCell>{formatFrequency(record.payment_mode)}</TableCell>
                      <TableCell>
                        <div className="text-sm">{record.transaction_id || record.cheque_number || "-"}</div>
                        {record.cheque_date && (
                          <div className="text-xs text-muted-foreground">Cheque Date: {record.cheque_date}</div>
                        )}
                      </TableCell>
                      <TableCell>{record.payment_date}</TableCell>
                      <TableCell>
                        {record.proof_file_path ? (
                          <a
                            className="inline-flex items-center text-primary hover:underline text-sm"
                            href={buildProxyUrl("society-payment-proofs", record.proof_file_path)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <FileImage className="h-4 w-4 mr-1" />
                            View Proof
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">No file</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          onClick={() => handleDeleteRecord(record.id)}
                          disabled={deletingId === record.id}
                        >
                          {deletingId === record.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
