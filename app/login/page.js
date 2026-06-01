'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, useToast } from '../providers';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, loading, login, loginWithGoogle } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/shop');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        addToast('Welcome back! Login successful', 'success');
        router.push('/shop');
      } else {
        setError(result.error || 'Invalid email or password');
        addToast(result.error || 'Login failed', 'error');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      addToast('Something went wrong', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const result = await loginWithGoogle();
      if (!result.success) {
        setError(result.error || 'Failed to sign in with Google');
        addToast(result.error || 'Google sign-in failed', 'error');
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError('Something went wrong. Please try again.');
      addToast('Google sign-in failed', 'error');
    } finally {
      setGoogleLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-page">
        <div className="loading-spinner"><div className="spinner"></div></div>
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="auth-page">
      <div className="container-sm">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-icon">
              <i className="bi bi-box-arrow-in-right"></i>
            </div>
            <h2>Welcome Back</h2>
            <p>Sign in to your MediCart account</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="form-error" style={{
                background: '#fde8ea', padding: '12px 16px', borderRadius: 8,
                marginBottom: 18, fontSize: 13, fontWeight: 600, textAlign: 'center'
              }}>
                <i className="bi bi-exclamation-circle" style={{ marginRight: 6 }}></i>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-block"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span>
                  Signing in...
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right"></i> Sign In
                </>
              )}
            </button>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              margin: '24px 0 18px', 
              gap: 12 
            }}>
              <div style={{ flex: 1, height: 1, backgroundColor: '#e0e0e0' }}></div>
              <span style={{ color: '#999', fontSize: 13, fontWeight: 500 }}>OR</span>
              <div style={{ flex: 1, height: 1, backgroundColor: '#e0e0e0' }}></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="btn btn-outline btn-lg btn-block"
              style={{ 
                borderColor: '#e0e0e0',
                color: '#333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              {googleLoading ? (
                <>
                  <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span>
                  Signing in...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Sign in with Google
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            Don&apos;t have an account?{' '}
            <Link href="/signup">Create one here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
