import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/societies - fetch societies with optional search and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '0');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = page * limit;

    let query = supabaseAdmin
      .from('societies')
      .select('*', { count: 'exact' })
      .order('name')
      .range(offset, offset + limit - 1);

    if (search) {
      query = supabaseAdmin
        .from('societies')
        .select('*', { count: 'exact' })
        .or(`name.ilike.%${search}%,address.ilike.%${search}%`)
        .order('name')
        .range(offset, offset + limit - 1);
    }

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, count });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/societies - create a new society
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, address, city, state, pincode } = body;

    if (!name?.trim() || !address?.trim() || !city?.trim() || !state?.trim() || !pincode?.trim()) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('societies')
      .insert({
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
      })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/societies - delete a society
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Society ID is required' }, { status: 400 });
    }

    // Check if there are admins assigned
    const { count } = await supabaseAdmin
      .from('admins')
      .select('*', { count: 'exact', head: true })
      .eq('society_id', id);

    if (count && count > 0) {
      return NextResponse.json(
        { error: `Cannot delete: There are ${count} admins assigned to this society. Reassign them first.` },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('societies')
      .delete()
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
