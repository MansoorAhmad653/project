import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyDjangoPassword, signToken, createSessionCookie } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const result = await query(
      'SELECT id, password, email, name, username, role, is_staff, is_active, phone, address FROM users_customuser WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Your account has been deactivated. Please contact support.' },
        { status: 401 }
      );
    }

    const passwordValid = verifyDjangoPassword(password, user.password);
    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update last_login
    await query('UPDATE users_customuser SET last_login = NOW() WHERE id = $1', [user.id]);

    const token = signToken(user);
    const cookie = createSessionCookie(token);

    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        role: user.role,
        is_staff: user.is_staff,
        phone: user.phone,
        address: user.address,
      },
    });

    response.headers.set('Set-Cookie', cookie);
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
