import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/settlements - fetch settlements data for a given month
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monthStart = searchParams.get('monthStart');
    const monthEnd = searchParams.get('monthEnd');
    const type = searchParams.get('type'); // 'settlements' | 'payments' | 'early-requests' | 'payment-details'
    const societyId = searchParams.get('societyId');

    if (!monthStart || !monthEnd) {
      return NextResponse.json({ error: 'monthStart and monthEnd are required' }, { status: 400 });
    }

    // Fetch payment details for CSV download
    if (type === 'payment-details' && societyId) {
      const { data, error } = await supabaseAdmin
        .from('payments')
        .select(`
          id, amount, payment_method, status, razorpay_payment_id, razorpay_order_id,
          created_at, completed_at, payment_details,
          residents ( name, unit_number, email, phone ),
          maintenance_bills ( bill_number, bill_date, total_amount, month_year )
        `)
        .eq('society_id', societyId)
        .eq('status', 'completed')
        .not('razorpay_payment_id', 'is', null)
        .gte('created_at', monthStart)
        .lte('created_at', monthEnd + 'T23:59:59')
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ payments: data });
    }

    // Fetch all data for the settlements page
    const [societiesResult, paymentsResult, settlementsResult, earlyRequestsResult] = await Promise.all([
      supabaseAdmin
        .from('societies')
        .select('id, name, address')
        .order('name'),
      supabaseAdmin
        .from('payments')
        .select('society_id, amount, razorpay_payment_id')
        .eq('status', 'completed')
        .not('razorpay_payment_id', 'is', null)
        .gte('created_at', monthStart)
        .lte('created_at', monthEnd + 'T23:59:59'),
      supabaseAdmin
        .from('payment_settlements')
        .select('*, societies(id, name, address)')
        .gte('month_year', monthStart)
        .lte('month_year', monthEnd)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('early_settlement_requests')
        .select('*, societies(id, name, address)')
        .gte('month_year', monthStart)
        .lte('month_year', monthEnd)
        .order('created_at', { ascending: false }),
    ]);

    return NextResponse.json({
      societies: societiesResult.data || [],
      payments: paymentsResult.data || [],
      settlements: settlementsResult.data || [],
      earlyRequests: earlyRequestsResult.data || [],
      errors: {
        payments: paymentsResult.error?.message,
        settlements: settlementsResult.error?.message,
        earlyRequests: earlyRequestsResult.error?.message,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/settlements - create new settlement records
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { settlements } = body;

    if (!settlements || !Array.isArray(settlements) || settlements.length === 0) {
      return NextResponse.json({ error: 'No settlements to create' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('payment_settlements')
      .insert(settlements);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/settlements - update a settlement or review an early request
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, id, data: updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    if (type === 'early-request') {
      // Get current user for the reviewed_by field
      const { error } = await supabaseAdmin
        .from('early_settlement_requests')
        .update(updateData)
        .eq('id', id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // Default: update settlement
    const { error } = await supabaseAdmin
      .from('payment_settlements')
      .update(updateData)
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
