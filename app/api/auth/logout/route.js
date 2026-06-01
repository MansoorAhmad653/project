import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

export async function POST() {
  try {
    const cookie = clearSessionCookie();
    const response = NextResponse.json({ message: 'Logged out successfully' });
    response.headers.set('Set-Cookie', cookie);
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
