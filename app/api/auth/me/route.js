import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const sessionUser = await getCurrentUser(request);

    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch fresh user data from the database
    const result = await query(
      'SELECT id, email, name, username, role, is_staff, phone, address, date_joined FROM users_customuser WHERE id = $1 AND is_active = true',
      [sessionUser.id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'User not found or deactivated' },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        role: user.role,
        is_staff: user.is_staff,
        phone: user.phone,
        address: user.address,
        date_joined: user.date_joined,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const sessionUser = await getCurrentUser(request);
    if (!sessionUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { name, phone, address } = await request.json();

    const result = await query(
      `UPDATE users_customuser SET name = $1, phone = $2, address = $3, first_name = $4 WHERE id = $5 RETURNING id, email, name, role, is_staff, phone, address`,
      [name || '', phone || '', address || '', (name || '').split(' ')[0], sessionUser.id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: result.rows[0], message: 'Profile updated' });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
