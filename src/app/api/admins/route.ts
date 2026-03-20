import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    const { email, password, name, phone, society_id } = requestData;

    // Validate required fields
    if (!email || !password || !name || !society_id) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, name, and society are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    let userId: string;
    let isNewUser = true;

    // Try to create the auth user directly (email_confirm: true = no verification email)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true, // Auto-confirm — no email verification needed
      user_metadata: { name, role: 'society_admin' }
    });

    if (authError) {
      // If user already exists, try to find them and reuse
      if (authError.message?.includes('already been registered') || authError.message?.includes('already exists')) {
        // User already exists, try to find them and reuse
        
        // Look up the existing user
        const { data: userList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) {
          return NextResponse.json(
            { error: 'Failed to look up existing user: ' + listError.message },
            { status: 500 }
          );
        }

        const existingUser = userList?.users?.find(u => u.email?.toLowerCase() === normalizedEmail);
        if (!existingUser) {
          return NextResponse.json(
            { error: 'User exists but could not be found. Please try again.' },
            { status: 500 }
          );
        }

        // Check if already a society admin
        const { data: existingAdmin } = await supabaseAdmin
          .from("society_admins")
          .select("id")
          .eq("user_id", existingUser.id)
          .maybeSingle();

        if (existingAdmin) {
          return NextResponse.json(
            { error: 'This email is already registered as a society admin' },
            { status: 400 }
          );
        }

        // Update their password so the superadmin-set password works
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          password,
          email_confirm: true,
          user_metadata: { ...existingUser.user_metadata, name, role: 'society_admin' }
        });

        userId = existingUser.id;
        isNewUser = false;
      } else {
        console.error('Auth error:', authError);
        return NextResponse.json(
          { error: authError.message },
          { status: 400 }
        );
      }
    } else {
      if (!authData.user) {
        return NextResponse.json(
          { error: 'Failed to create user account' },
          { status: 500 }
        );
      }
      userId = authData.user.id;
    }

    // Create the society_admins record
    const insertData: Record<string, unknown> = {
      user_id: userId,
      society_id,
      email: normalizedEmail,
      name
    };
    if (phone) insertData.phone = phone;

    const { data: adminData, error: adminError } = await supabaseAdmin
      .from("society_admins")
      .insert(insertData)
      .select("*, societies(*)")
      .single();

    if (adminError) {
      // Clean up auth user only if we just created it
      if (isNewUser) {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      }
      console.error('Admin record creation error:', adminError);
      return NextResponse.json(
        { error: adminError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      data: adminData,
      message: 'Society admin created successfully. They can login immediately.'
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT — Reset a society admin's password back to their phone number
export async function PUT(request: NextRequest) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing service role key' },
        { status: 500 }
      );
    }

    const data = await request.json();
    const { admin_id, action } = data;

    if (action !== 'reset_password') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (!admin_id) {
      return NextResponse.json({ error: 'admin_id is required' }, { status: 400 });
    }

    // Fetch the admin to get their phone number and user_id
    const { data: admin, error: fetchError } = await supabaseAdmin
      .from('society_admins')
      .select('user_id, phone, name, email')
      .eq('id', admin_id)
      .single();

    if (fetchError || !admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    if (!admin.phone) {
      return NextResponse.json(
        { error: 'Cannot reset password: this admin has no phone number on file.' },
        { status: 400 }
      );
    }

    // Reset password to the phone number via admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(admin.user_id, {
      password: admin.phone,
      user_metadata: { password_changed: false },
    });

    if (updateError) {
      console.error('Password reset error:', updateError);
      return NextResponse.json({ error: 'Failed to reset password: ' + updateError.message }, { status: 500 });
    }

    // Also update the society_admins table (best effort)
    await supabaseAdmin
      .from('society_admins')
      .update({ password_changed: false })
      .eq('id', admin_id);

    return NextResponse.json({
      success: true,
      message: `Password for ${admin.name} has been reset to their phone number (${admin.phone}).`,
    });
  } catch (error) {
    console.error('Unexpected error in admin password reset:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// PATCH — Update a society admin's details
export async function PATCH(request: NextRequest) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing service role key' },
        { status: 500 }
      );
    }

    const data = await request.json();
    const { admin_id, name, phone, society_id, email } = data;

    if (!admin_id) {
      return NextResponse.json({ error: 'admin_id is required' }, { status: 400 });
    }

    // Fetch current admin data
    const { data: currentAdmin, error: fetchError } = await supabaseAdmin
      .from('society_admins')
      .select('user_id, email, name, phone, society_id')
      .eq('id', admin_id)
      .single();

    if (fetchError || !currentAdmin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Build the update object for society_admins table
    const updateData: Record<string, unknown> = {};
    if (name !== undefined && name.trim()) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (society_id !== undefined && society_id) updateData.society_id = society_id;
    if (email !== undefined && email.trim()) updateData.email = email.trim().toLowerCase();

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // If email is changing, update auth user email too
    if (updateData.email && updateData.email !== currentAdmin.email) {
      const { error: authEmailError } = await supabaseAdmin.auth.admin.updateUserById(currentAdmin.user_id, {
        email: updateData.email as string,
        email_confirm: true,
        user_metadata: { name: updateData.name || currentAdmin.name },
      });

      if (authEmailError) {
        console.error('Error updating auth email:', authEmailError);
        return NextResponse.json(
          { error: 'Failed to update email: ' + authEmailError.message },
          { status: 500 }
        );
      }
    } else if (updateData.name) {
      // Just update name in user_metadata
      await supabaseAdmin.auth.admin.updateUserById(currentAdmin.user_id, {
        user_metadata: { name: updateData.name as string },
      });
    }

    // Update society_admins table
    const { data: updatedAdmin, error: updateError } = await supabaseAdmin
      .from('society_admins')
      .update(updateData)
      .eq('id', admin_id)
      .select('*, societies(id, name)')
      .single();

    if (updateError) {
      console.error('Error updating admin:', updateError);
      return NextResponse.json({ error: 'Failed to update admin: ' + updateError.message }, { status: 500 });
    }

    return NextResponse.json({ data: updatedAdmin });
  } catch (error) {
    console.error('Unexpected error updating admin:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}