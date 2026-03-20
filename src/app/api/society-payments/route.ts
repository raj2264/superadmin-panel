import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

type PaymentRecord = {
  id: string;
  society_id: string;
  billing_frequency: 'monthly' | 'quarterly' | 'bi_annually' | 'annually';
  period_start: string | null;
  period_end: string | null;
  payment_amount: number;
  payment_mode: 'upi' | 'bank_transfer' | 'cheque' | 'cash' | 'online' | 'other';
  transaction_id: string | null;
  cheque_number: string | null;
  cheque_date: string | null;
  payment_date: string;
  reference_notes: string | null;
  proof_file_path: string | null;
  proof_file_name: string | null;
  created_at: string;
  societies?: {
    id: string;
    name: string;
    address?: string | null;
    city?: string | null;
    state?: string | null;
  } | null;
};

const FREQUENCIES = new Set(['monthly', 'quarterly', 'bi_annually', 'annually']);
const PAYMENT_MODES = new Set(['upi', 'bank_transfer', 'cheque', 'cash', 'online', 'other']);

function escapeCsv(value: unknown): string {
  const str = value == null ? '' : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsv(records: PaymentRecord[]): string {
  const headers = [
    'Society Name',
    'Society Address',
    'Frequency',
    'Period Start',
    'Period End',
    'Payment Amount',
    'Payment Mode',
    'Transaction ID',
    'Cheque Number',
    'Cheque Date',
    'Payment Date',
    'Reference Notes',
    'Proof File',
    'Created At',
  ];

  const rows = records.map((record) => {
    const society = record.societies;
    return [
      society?.name || 'Unknown',
      society?.address || '',
      record.billing_frequency,
      record.period_start || '',
      record.period_end || '',
      Number(record.payment_amount).toFixed(2),
      record.payment_mode,
      record.transaction_id || '',
      record.cheque_number || '',
      record.cheque_date || '',
      record.payment_date || '',
      record.reference_notes || '',
      record.proof_file_name || record.proof_file_path || '',
      record.created_at || '',
    ].map(escapeCsv);
  });

  return [headers.map(escapeCsv).join(','), ...rows.map((row) => row.join(','))].join('\n');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const societyId = searchParams.get('societyId');
    const frequency = searchParams.get('frequency');
    const download = searchParams.get('download');

    let query = supabaseAdmin
      .from('society_payment_records')
      .select('*, societies(id, name, address, city, state)')
      .order('payment_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (societyId && societyId !== 'all') {
      query = query.eq('society_id', societyId);
    }

    if (frequency && frequency !== 'all') {
      query = query.eq('billing_frequency', frequency);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const records = (data || []) as PaymentRecord[];

    if (download === 'csv') {
      const csv = buildCsv(records);
      const fileScope = societyId && societyId !== 'all' ? `society_${societyId}` : 'all_societies';
      const filename = `society_payments_${fileScope}.csv`;

      return new NextResponse('\uFEFF' + csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({ records });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      society_id,
      billing_frequency,
      period_start,
      period_end,
      payment_amount,
      payment_mode,
      transaction_id,
      cheque_number,
      cheque_date,
      payment_date,
      reference_notes,
      proof_file_path,
      proof_file_name,
      created_by,
    } = body;

    if (!society_id || !billing_frequency || payment_amount == null || !payment_mode || !payment_date) {
      return NextResponse.json(
        { error: 'society_id, billing_frequency, payment_amount, payment_mode and payment_date are required' },
        { status: 400 }
      );
    }

    if (!FREQUENCIES.has(billing_frequency)) {
      return NextResponse.json({ error: 'Invalid billing_frequency' }, { status: 400 });
    }

    if (!PAYMENT_MODES.has(payment_mode)) {
      return NextResponse.json({ error: 'Invalid payment_mode' }, { status: 400 });
    }

    if (payment_mode === 'cheque' && (!cheque_number || !cheque_date)) {
      return NextResponse.json(
        { error: 'cheque_number and cheque_date are required for cheque payment mode' },
        { status: 400 }
      );
    }

    const amount = Number(payment_amount);
    if (Number.isNaN(amount) || amount < 0) {
      return NextResponse.json({ error: 'payment_amount must be a valid non-negative number' }, { status: 400 });
    }

    const insertPayload = {
      society_id,
      billing_frequency,
      period_start: period_start || null,
      period_end: period_end || null,
      payment_amount: amount,
      payment_mode,
      transaction_id: transaction_id || null,
      cheque_number: cheque_number || null,
      cheque_date: cheque_date || null,
      payment_date,
      reference_notes: reference_notes || null,
      proof_file_path: proof_file_path || null,
      proof_file_name: proof_file_name || null,
      created_by: created_by || null,
    };

    const { data, error } = await supabaseAdmin
      .from('society_payment_records')
      .insert(insertPayload)
      .select('*, societies(id, name, address, city, state)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ record: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
    }

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('society_payment_records')
      .select('proof_file_path')
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const { error } = await supabaseAdmin
      .from('society_payment_records')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Best effort cleanup of proof file if present
    if (existing?.proof_file_path) {
      await supabaseAdmin.storage.from('society-payment-proofs').remove([existing.proof_file_path]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
