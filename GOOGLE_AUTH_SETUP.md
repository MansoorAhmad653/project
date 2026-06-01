# Google OAuth Setup Guide for MediCart

## What's Implemented

Google Sign-In/Sign-Up using Supabase authentication has been successfully integrated into your MediCart application:

- ✅ Login page with Google sign-in button
- ✅ Signup page with Google sign-up button  
- ✅ Supabase OAuth client integration
- ✅ OAuth callback handler
- ✅ Session management

## Required Setup in Supabase Console

### 1. Enable Google OAuth Provider

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: **ugtawlcsphxjbgarowjm**
3. Navigate to **Authentication > Providers**
4. Find **Google** and enable it
5. Add your Google OAuth credentials:
   - **Client ID**: (from Google Cloud Console)
   - **Client Secret**: (from Google Cloud Console)

### 2. Configure Google Cloud OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API**
4. Go to **Credentials** and create **OAuth 2.0 Client ID**
5. Set authorized redirect URIs:
   ```
   https://ugtawlcsphxjbgarowjm.supabase.co/auth/v1/callback?provider=google
   ```
6. Copy **Client ID** and **Client Secret** to Supabase

### 3. Configure Redirect URL in Supabase

In Supabase Dashboard → **Authentication > URL Configuration**:

Add Redirect URLs:
```
http://localhost:3000/api/auth/google-callback
https://your-domain.com/api/auth/google-callback
```

## Environment Variables

Your `.env.local` already has the required Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ugtawlcsphxjbgarowjm.supabase.co
NEXT_PUBLIC_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## How It Works

### Login Flow
1. User clicks "Sign in with Google" on login page
2. Redirected to Google sign-in
3. After authentication, redirected to `/api/auth/google-callback`
4. Session is created and stored
5. User is redirected to `/shop`

### Signup Flow
1. User clicks "Sign up with Google" on signup page
2. Same OAuth flow as login
3. User account is created in Supabase Auth
4. User is redirected to `/shop`

## Files Modified/Created

- **Created:**
  - `lib/supabase.js` - Supabase client initialization
  - `app/api/auth/google-callback/route.js` - OAuth callback handler
  - `GOOGLE_AUTH_SETUP.md` - This setup guide

- **Modified:**
  - `app/providers.js` - Added `loginWithGoogle` method to AuthContext
  - `app/login/page.js` - Added Google sign-in button
  - `app/signup/page.js` - Added Google sign-up button
  - `package.json` - Added `@supabase/supabase-js` dependency

## Testing

1. Start your dev server: `npm run dev`
2. Visit http://localhost:3000/login
3. Click "Sign in with Google"
4. Complete the Google authentication flow
5. You should be logged in and redirected to shop page

## Troubleshooting

### "Invalid Client ID" Error
- Verify Google OAuth credentials are correct in Supabase
- Check that the Redirect URI in Google Console matches Supabase configuration

### Redirect Loop
- Ensure `.env.local` has correct Supabase URL and key
- Check that redirect URL in Supabase includes `/api/auth/google-callback`

### User Not Logging In
- Check browser console for errors
- Verify Supabase project is active and Google provider is enabled
- Clear cookies and try again

## Security Notes

⚠️ **Important:**
- Keep your Supabase URL and Key private
- `NEXT_PUBLIC_*` variables are exposed to the browser (this is intentional for Supabase)
- Rotate JWT_SECRET in production
- Enable additional security features in Supabase (rate limiting, etc.)

## Next Steps

1. Complete Google OAuth setup in Supabase Console
2. Add Google credentials to Supabase
3. Test the sign-in/sign-up flow
4. Deploy and update production redirect URLs
