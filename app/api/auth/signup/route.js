import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword, signToken, createSessionCookie } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, username, password, phone, address } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existingUser = await query(
      'SELECT id FROM users_customuser WHERE email = $1',
      [normalizedEmail]
    );

    if (existingUser.rowCount > 0) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Generate username from email if not provided
    let finalUsername = username?.trim();
    if (!finalUsername) {
      const baseUsername = normalizedEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
      finalUsername = baseUsername;

      // Ensure username uniqueness
      let counter = 1;
      while (true) {
        const usernameCheck = await query(
          'SELECT id FROM users_customuser WHERE username = $1',
          [finalUsername]
        );
        if (usernameCheck.rowCount === 0) break;
        finalUsername = `${baseUsername}_${counter}`;
        counter++;
      }
    } else {
      // Check provided username uniqueness
      const usernameCheck = await query(
        'SELECT id FROM users_customuser WHERE username = $1',
        [finalUsername]
      );
      if (usernameCheck.rowCount > 0) {
        return NextResponse.json(
          { error: 'This username is already taken' },
          { status: 409 }
        );
      }
    }

    const hashedPassword = hashPassword(password);
    const fullName = name?.trim() || '';
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const insertResult = await query(
      `INSERT INTO users_customuser 
        (password, last_login, is_superuser, username, first_name, last_name, is_staff, is_active, date_joined, name, email, phone, address, role)
       VALUES ($1, NOW(), false, $2, $3, $4, false, true, NOW(), $5, $6, $7, $8, 'customer')
       RETURNING id, email, name, username, role, is_staff, phone, address`,
      [hashedPassword, finalUsername, firstName, lastName, fullName, normalizedEmail, phone || '', address || '']
    );

    const user = insertResult.rows[0];
    const token = signToken(user);
    const cookie = createSessionCookie(token);

    const response = NextResponse.json(
      {
        message: 'Account created successfully',
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
      },
      { status: 201 }
    );

    response.headers.set('Set-Cookie', cookie);
    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
