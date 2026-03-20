"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  IndianRupee,
  Building,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw,
  Calendar,
  ArrowUpDown,
  Landmark,
  Ban,
  Download,
  Minus,
  SendHorizonal,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Badge } from "../../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { Textarea } from "../../../components/ui/textarea";
import { format, subMonths, addMonths, startOfMonth, endOfMonth } from "date-fns";

// ── Types ───────────────────────────────────────────────────────────────────

interface Society {
  id: string;
  name: string;
  address: string;
}

interface Settlement {
  id: string;
  society_id: string;
  month_year: string;
  razorpay_total: number;
  settlement_amount: number;
  platform_fee: number;
  status: "pending" | "processing" | "settled" | "disputed";
  settled_at: string | null;
  settlement_reference: string | null;
  notes: string | null;
  created_at: string;
  societies?: Society;
}

interface RazorpayPaymentSummary {
  society_id: string;
  society_name: string;
  total_amount: number;
  payment_count: number;
}

interface EarlySettlementRequest {
  id: string;
  society_id: string;
  settlement_id: string | null;
  month_year: string;
  requested_amount: number;
  reason: string | null;
  status: "pending" | "approved" | "rejected" | "processed";
  requested_by: string | null;
  reviewed_at: string | null;
  admin_notes: string | null;
  created_at: string;
  societies?: { id: string; name: string; address: string };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function getMonthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 6; i >= 1; i--) {
    const d = addMonths(now, i);
    options.push({ value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy") });
  }
  for (let i = 0; i <= 12; i++) {
    const d = subMonths(now, i);
    options.push({ value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy") });
  }
  return options;
}

const MONTH_OPTIONS = getMonthOptions();

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode; color: string }> = {
  pending: {
    label: "Pending",
    variant: "secondary",
    icon: <Clock className="h-3.5 w-3.5" />,
    color: "text-yellow-600 dark:text-yellow-400",
  },
  processing: {
    label: "Processing",
    variant: "outline",
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    color: "text-blue-600 dark:text-blue-400",
  },
  settled: {
    label: "Settled",
    variant: "default",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    color: "text-green-600 dark:text-green-400",
  },
  disputed: {
    label: "Disputed",
    variant: "destructive",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    color: "text-red-600 dark:text-red-400",
  },
};

// ── Component ───────────────────────────────────────────────────────────────

export default function SettlementsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [societies, setSocieties] = useState<Society[]>([]);
  const [razorpaySummaries, setRazorpaySummaries] = useState<RazorpayPaymentSummary[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [downloadingSocietyId, setDownloadingSocietyId] = useState<string | null>(null);
  const [earlyRequests, setEarlyRequests] = useState<EarlySettlementRequest[]>([]);

  // Early request review dialog
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewingRequest, setReviewingRequest] = useState<EarlySettlementRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSettlement, setEditingSettlement] = useState<Settlement | null>(null);
  const [dialogForm, setDialogForm] = useState({
    status: "pending" as string,
    settlement_reference: "",
    platform_fee: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      // Parse month
      const [year, month] = selectedMonth.split("-").map(Number);
      const monthStart = startOfMonth(new Date(year, month - 1));
      const monthEnd = endOfMonth(new Date(year, month - 1));

      const monthStartStr = format(monthStart, "yyyy-MM-dd");
      const monthEndStr = format(monthEnd, "yyyy-MM-dd");

      // Fetch all data via API route
      const response = await fetch(
        `/api/settlements?monthStart=${monthStartStr}&monthEnd=${monthEndStr}`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch data');
      }

      const societiesData = result.societies || [];
      const paymentsData = result.payments || [];
      const settlementsData = result.settlements || [];
      const earlyReqData = result.earlyRequests || [];

      setSocieties(societiesData);

      // Aggregate payments by society
      const summaryMap: Record<string, RazorpayPaymentSummary> = {};
      const socMap = new Map((societiesData || []).map((s: any) => [s.id, s.name]));

      for (const p of paymentsData || []) {
        if (!summaryMap[p.society_id]) {
          summaryMap[p.society_id] = {
            society_id: p.society_id,
            society_name: (socMap.get(p.society_id) as string) || "Unknown",
            total_amount: 0,
            payment_count: 0,
          };
        }
        summaryMap[p.society_id].total_amount += Number(p.amount);
        summaryMap[p.society_id].payment_count += 1;
      }

      setRazorpaySummaries(Object.values(summaryMap));
      setSettlements(settlementsData);
      setEarlyRequests(earlyReqData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ── Auto-create settlement records for societies with payments ────────

  const handleGenerateSettlements = async () => {
    try {
      setSaving(true);
      const [year, month] = selectedMonth.split("-").map(Number);
      const monthDate = format(new Date(year, month - 1, 1), "yyyy-MM-dd");

      const existingSocietyIds = new Set(settlements.map((s) => s.society_id));
      const newSettlements = razorpaySummaries
        .filter((s) => !existingSocietyIds.has(s.society_id))
        .map((s) => ({
          society_id: s.society_id,
          month_year: monthDate,
          razorpay_total: s.total_amount,
          settlement_amount: s.total_amount, // Full amount by default
          platform_fee: 0,
          status: "pending",
        }));

      if (newSettlements.length === 0) return;

      const response = await fetch('/api/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settlements: newSettlements }),
      });

      if (!response.ok) {
        const result = await response.json();
        console.error("Error creating settlements:", result.error);
        return;
      }

      await fetchData(true);
    } catch (error) {
      console.error("Error generating settlements:", error);
    } finally {
      setSaving(false);
    }
  };

  // ── Update settlement ─────────────────────────────────────────────────

  const openEditDialog = (settlement: Settlement) => {
    setEditingSettlement(settlement);
    setDialogForm({
      status: settlement.status,
      settlement_reference: settlement.settlement_reference || "",
      platform_fee: settlement.platform_fee?.toString() || "0",
      notes: settlement.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleUpdateSettlement = async () => {
    if (!editingSettlement) return;
    try {
      setSaving(true);

      const fee = parseFloat(dialogForm.platform_fee) || 0;
      const settlementAmount = editingSettlement.razorpay_total - fee;

      const updateData: any = {
        status: dialogForm.status,
        settlement_reference: dialogForm.settlement_reference || null,
        platform_fee: fee,
        settlement_amount: settlementAmount,
        notes: dialogForm.notes || null,
      };

      if (dialogForm.status === "settled" && !editingSettlement.settled_at) {
        updateData.settled_at = new Date().toISOString();
      }

      const { error } = await (async () => {
        const response = await fetch('/api/settlements', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'settlement', id: editingSettlement.id, data: updateData }),
        });
        if (!response.ok) {
          const result = await response.json();
          return { error: result.error };
        }
        return { error: null };
      })();

      if (error) {
        console.error("Error updating settlement:", error);
        return;
      }

      setIsDialogOpen(false);
      setEditingSettlement(null);
      await fetchData(true);
    } catch (error) {
      console.error("Error updating:", error);
    } finally {
      setSaving(false);
    }
  };

  // ── Review early settlement request ────────────────────────────────────

  const openReviewDialog = (req: EarlySettlementRequest) => {
    setReviewingRequest(req);
    setReviewNotes("");
    setIsReviewDialogOpen(true);
  };

  const handleReviewRequest = async (newStatus: "approved" | "rejected") => {
    if (!reviewingRequest) return;
    try {
      setReviewSaving(true);

      // Get current user
      const { data: sessionData } = await supabase.auth.getUser();

      const response = await fetch('/api/settlements', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'early-request',
          id: reviewingRequest.id,
          data: {
            status: newStatus,
            admin_notes: reviewNotes || null,
            reviewed_by: sessionData?.user?.id || null,
            reviewed_at: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        console.error("Error reviewing request:", result.error);
        return;
      }

      setIsReviewDialogOpen(false);
      setReviewingRequest(null);
      await fetchData(true);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setReviewSaving(false);
    }
  };

  // ── Derived data ──────────────────────────────────────────────────────

  const pendingEarlyRequests = useMemo(
    () => earlyRequests.filter((r) => r.status === "pending"),
    [earlyRequests]
  );

  // Build a unified row for every society
  const societyRows = useMemo(() => {
    const settlementMap = new Map(settlements.map((s) => [s.society_id, s]));
    const summaryMap = new Map(razorpaySummaries.map((s) => [s.society_id, s]));

    return societies.map((soc) => {
      const settlement = settlementMap.get(soc.id) || null;
      const summary = summaryMap.get(soc.id) || null;
      return { society: soc, settlement, summary };
    });
  }, [societies, settlements, razorpaySummaries]);

  const filteredRows = useMemo(() => {
    return societyRows.filter((row) => {
      const matchesSearch =
        !searchTerm ||
        row.society.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.society.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.settlement?.settlement_reference?.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesStatus = true;
      if (statusFilter === "no_payments") {
        matchesStatus = !row.summary;
      } else if (statusFilter === "no_settlement") {
        matchesStatus = !!row.summary && !row.settlement;
      } else if (statusFilter !== "all") {
        matchesStatus = row.settlement?.status === statusFilter;
      }

      return matchesSearch && matchesStatus;
    });
  }, [societyRows, searchTerm, statusFilter]);

  const totalRazorpayCollected = useMemo(
    () => razorpaySummaries.reduce((sum, s) => sum + s.total_amount, 0),
    [razorpaySummaries]
  );

  const totalSettled = useMemo(
    () =>
      settlements
        .filter((s) => s.status === "settled")
        .reduce((sum, s) => sum + Number(s.settlement_amount), 0),
    [settlements]
  );

  const totalPending = useMemo(
    () =>
      settlements
        .filter((s) => s.status === "pending" || s.status === "processing")
        .reduce((sum, s) => sum + Number(s.settlement_amount), 0),
    [settlements]
  );

  const unsettledSocieties = useMemo(() => {
    const existingIds = new Set(settlements.map((s) => s.society_id));
    return razorpaySummaries.filter((s) => !existingIds.has(s.society_id));
  }, [settlements, razorpaySummaries]);

  // ── Download detailed CSV for a society ────────────────────────────────

  const handleDownloadSocietyCSV = async (societyId: string, societyName: string) => {
    try {
      setDownloadingSocietyId(societyId);

      const [year, month] = selectedMonth.split("-").map(Number);
      const monthStart = startOfMonth(new Date(year, month - 1));
      const monthEnd = endOfMonth(new Date(year, month - 1));

      const { data: payments, error } = await (async () => {
        const response = await fetch(
          `/api/settlements?type=payment-details&societyId=${societyId}&monthStart=${format(monthStart, "yyyy-MM-dd")}&monthEnd=${format(monthEnd, "yyyy-MM-dd")}`
        );
        const result = await response.json();
        if (!response.ok) return { data: null, error: result.error };
        return { data: result.payments, error: null };
      })();

      if (error) {
        console.error("Error fetching payment details:", error);
        return;
      }

      if (!payments || payments.length === 0) {
        alert("No Razorpay payments found for this society in the selected month.");
        return;
      }

      const headers = [
        "Resident Name",
        "Unit / Flat",
        "Email",
        "Phone",
        "Bill Number",
        "Bill Date",
        "Bill Total",
        "Amount Paid",
        "Razorpay Payment ID",
        "Razorpay Order ID",
        "Payment Date",
        "Completed At",
      ];

      const escapeCSV = (val: string) => {
        if (val.includes(",") || val.includes('"') || val.includes("\n")) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      };

      const rows = payments.map((p: any) => {
        const resident = p.residents;
        const bill = p.maintenance_bills;
        return [
          resident?.name || "—",
          resident?.unit_number || "—",
          resident?.email || "—",
          resident?.phone || "—",
          bill?.bill_number || "—",
          bill?.bill_date ? format(new Date(bill.bill_date), "dd MMM yyyy") : "—",
          bill?.total_amount?.toString() || "—",
          Number(p.amount).toFixed(2),
          p.razorpay_payment_id || "—",
          p.razorpay_order_id || "—",
          p.created_at ? format(new Date(p.created_at), "dd MMM yyyy hh:mm a") : "—",
          p.completed_at ? format(new Date(p.completed_at), "dd MMM yyyy hh:mm a") : "—",
        ].map((v) => escapeCSV(String(v)));
      });

      // Add a summary row at the end
      const totalAmount = payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
      rows.push([]);
      rows.push(["TOTAL", "", "", "", "", "", "", totalAmount.toFixed(2), "", "", "", ""]);

      const csvContent = [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join("\n");
      const safeName = societyName.replace(/[^a-zA-Z0-9]/g, "_");
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${safeName}_razorpay_${selectedMonth}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading CSV:", error);
    } finally {
      setDownloadingSocietyId(null);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Payment Settlements
          </h1>
          <p className="text-muted-foreground">
            Track and manage Razorpay payment settlements to societies
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTH_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Razorpay Collected */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500 to-blue-700 text-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-blue-100 text-sm font-medium">
              Total Razorpay Collected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalRazorpayCollected)}</p>
            <p className="text-xs text-blue-200 mt-1">
              {razorpaySummaries.length} {razorpaySummaries.length === 1 ? "society" : "societies"} with payments
            </p>
          </CardContent>
        </Card>

        {/* Total Settled */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-500 to-emerald-700 text-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-emerald-100 text-sm font-medium">
              Total Settled
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalSettled)}</p>
            <p className="text-xs text-emerald-200 mt-1">
              {settlements.filter((s) => s.status === "settled").length} settlements completed
            </p>
          </CardContent>
        </Card>

        {/* Pending Settlement */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-amber-500 to-amber-700 text-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-amber-100 text-sm font-medium">
              Pending / Processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalPending)}</p>
            <p className="text-xs text-amber-200 mt-1">
              {settlements.filter((s) => s.status === "pending" || s.status === "processing").length} awaiting settlement
            </p>
          </CardContent>
        </Card>

        {/* Untracked */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-gray-500 to-gray-700 text-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-200 text-sm font-medium">
              Untracked Societies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{unsettledSocieties.length}</p>
            <p className="text-xs text-gray-300 mt-1">
              Societies with payments but no settlement record
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Generate settlements for untracked societies */}
      {unsettledSocieties.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                  {unsettledSocieties.length} {unsettledSocieties.length === 1 ? "society has" : "societies have"} Razorpay payments without a settlement record
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  {unsettledSocieties.map((s) => s.society_name).join(", ")}
                   — Total: {formatCurrency(unsettledSocieties.reduce((sum, s) => sum + s.total_amount, 0))}
                </p>
              </div>
              <Button
                onClick={handleGenerateSettlements}
                disabled={saving}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <IndianRupee className="h-4 w-4 mr-2" />
                )}
                Create Settlement Records
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settlements Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            Settlements
          </CardTitle>
          <CardDescription>
            Manage settlement status for each society's Razorpay collections
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by society name or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-52">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Societies</SelectItem>
                  <SelectItem value="no_payments">No Payments</SelectItem>
                  <SelectItem value="no_settlement">Payments — No Settlement</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="settled">Settled</SelectItem>
                  <SelectItem value="disputed">Disputed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Landmark className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <h3 className="text-lg font-semibold">No societies found</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Society</TableHead>
                    <TableHead className="text-right">Razorpay Total</TableHead>
                    <TableHead className="text-right">Platform Fee</TableHead>
                    <TableHead className="text-right">Settlement Amt</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Settled On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((row) => {
                    const { society, settlement, summary } = row;
                    const hasPayments = !!summary;
                    const hasSettlement = !!settlement;

                    const razorpayTotal = hasSettlement
                      ? Number(settlement.razorpay_total)
                      : hasPayments
                        ? summary.total_amount
                        : 0;

                    return (
                      <TableRow key={society.id} className={!hasPayments ? "opacity-60" : ""}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{society.name}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {society.address || ""}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {hasPayments || hasSettlement ? (
                            formatCurrency(razorpayTotal)
                          ) : (
                            <span className="text-muted-foreground">₹0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {hasSettlement
                            ? formatCurrency(Number(settlement.platform_fee))
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {hasSettlement
                            ? formatCurrency(Number(settlement.settlement_amount))
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {hasSettlement ? (
                            (() => {
                              const cfg =
                                STATUS_CONFIG[settlement.status] || STATUS_CONFIG.pending;
                              return (
                                <Badge variant={cfg.variant} className="gap-1">
                                  {cfg.icon}
                                  {cfg.label}
                                </Badge>
                              );
                            })()
                          ) : hasPayments ? (
                            <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300">
                              <Minus className="h-3 w-3" />
                              No Record
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <Minus className="h-3 w-3" />
                              No Payments
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {hasSettlement && settlement.settlement_reference ? (
                            settlement.settlement_reference
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {hasSettlement && settlement.settled_at ? (
                            format(new Date(settlement.settled_at), "dd MMM yyyy")
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {hasPayments && (
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Download payment breakdown CSV"
                                disabled={downloadingSocietyId === society.id}
                                onClick={() =>
                                  handleDownloadSocietyCSV(society.id, society.name)
                                }
                              >
                                {downloadingSocietyId === society.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Download className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            )}
                            {hasSettlement && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(settlement)}
                              >
                                <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
                                Update
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Early Settlement Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SendHorizonal className="h-5 w-5 text-primary" />
            Early Settlement Requests
            {pendingEarlyRequests.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingEarlyRequests.length} pending
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Review early settlement requests from society admins
          </CardDescription>
        </CardHeader>
        <CardContent>
          {earlyRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <h3 className="text-lg font-semibold">No early settlement requests</h3>
              <p className="text-muted-foreground text-sm mt-1">
                No society has requested early settlement for this month.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Society</TableHead>
                    <TableHead>Requested On</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Admin Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {earlyRequests.map((req) => {
                    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
                      pending: { label: "Pending", variant: "secondary", icon: <Clock className="h-3.5 w-3.5" /> },
                      approved: { label: "Approved", variant: "default", icon: <ThumbsUp className="h-3.5 w-3.5" /> },
                      rejected: { label: "Rejected", variant: "destructive", icon: <ThumbsDown className="h-3.5 w-3.5" /> },
                      processed: { label: "Processed", variant: "outline", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
                    };
                    const cfg = statusMap[req.status] || statusMap.pending;
                    return (
                      <TableRow key={req.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{req.societies?.name || "—"}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                              {req.societies?.address || ""}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(req.created_at), "dd MMM yyyy, hh:mm a")}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(Number(req.requested_amount))}
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">
                          {req.reason || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>
                          <Badge variant={cfg.variant} className="gap-1">
                            {cfg.icon}
                            {cfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">
                          {req.admin_notes || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          {req.status === "pending" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openReviewDialog(req)}
                            >
                              <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                              Review
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {req.reviewed_at
                                ? format(new Date(req.reviewed_at), "dd MMM")
                                : ""}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Early Settlement Request Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Early Settlement Request</DialogTitle>
            <DialogDescription>
              {reviewingRequest?.societies?.name} — {format(new Date(selectedMonth + "-01"), "MMMM yyyy")}
            </DialogDescription>
          </DialogHeader>

          {reviewingRequest && (
            <div className="space-y-5">
              {/* Request details */}
              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Requested Amount</span>
                  <span className="font-bold">{formatCurrency(Number(reviewingRequest.requested_amount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Requested On</span>
                  <span className="text-sm">{format(new Date(reviewingRequest.created_at), "dd MMM yyyy, hh:mm a")}</span>
                </div>
              </div>

              {reviewingRequest.reason && (
                <div className="rounded-lg border p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Reason from Society</p>
                  <p className="text-sm">{reviewingRequest.reason}</p>
                </div>
              )}

              {/* Admin Notes */}
              <div className="space-y-2">
                <Label>Admin Notes <span className="text-muted-foreground">(optional)</span></Label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about this decision..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleReviewRequest("rejected")}
              disabled={reviewSaving}
            >
              {reviewSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ThumbsDown className="h-4 w-4 mr-2" />}
              Reject
            </Button>
            <Button
              onClick={() => handleReviewRequest("approved")}
              disabled={reviewSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              {reviewSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ThumbsUp className="h-4 w-4 mr-2" />}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Settlement Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Settlement</DialogTitle>
            <DialogDescription>
              {editingSettlement?.societies?.name} — {format(new Date(selectedMonth + "-01"), "MMMM yyyy")}
            </DialogDescription>
          </DialogHeader>

          {editingSettlement && (
            <div className="space-y-5">
              {/* Razorpay total (read-only) */}
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground">Razorpay Total Collected</p>
                <p className="text-xl font-bold mt-1">
                  {formatCurrency(Number(editingSettlement.razorpay_total))}
                </p>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={dialogForm.status}
                  onValueChange={(v) => setDialogForm({ ...dialogForm, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">
                      <span className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-yellow-500" />
                        Pending
                      </span>
                    </SelectItem>
                    <SelectItem value="processing">
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 text-blue-500" />
                        Processing
                      </span>
                    </SelectItem>
                    <SelectItem value="settled">
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        Settled
                      </span>
                    </SelectItem>
                    <SelectItem value="disputed">
                      <span className="flex items-center gap-2">
                        <Ban className="h-3.5 w-3.5 text-red-500" />
                        Disputed
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Platform Fee */}
              <div className="space-y-2">
                <Label>Platform / Processing Fee (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={dialogForm.platform_fee}
                  onChange={(e) => setDialogForm({ ...dialogForm, platform_fee: e.target.value })}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">
                  Settlement amount will be:{" "}
                  <span className="font-semibold">
                    {formatCurrency(
                      Number(editingSettlement.razorpay_total) -
                        (parseFloat(dialogForm.platform_fee) || 0)
                    )}
                  </span>
                </p>
              </div>

              {/* Settlement Reference */}
              <div className="space-y-2">
                <Label>Settlement Reference / UTR Number</Label>
                <Input
                  value={dialogForm.settlement_reference}
                  onChange={(e) =>
                    setDialogForm({ ...dialogForm, settlement_reference: e.target.value })
                  }
                  placeholder="e.g. UTR/NEFT reference number"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={dialogForm.notes}
                  onChange={(e) => setDialogForm({ ...dialogForm, notes: e.target.value })}
                  placeholder="Any additional notes about this settlement..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSettlement} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
