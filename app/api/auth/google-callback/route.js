import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return new Response(JSON.stringify({ error: 'No authorization code' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth error:', error);
      return new Response(
        JSON.stringify({ error: error.message || 'Authentication failed' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Set session cookie
    const cookieStore = await cookies();
    if (data.session) {
      cookieStore.set('supabase_session', JSON.stringify(data.session), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });
    }

    // Redirect to dashboard or home
    return new Response(null, {
      status: 302,
      headers: {
        location: '/shop',
      },
    });
  } catch (error) {
    console.error('Google callback error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
