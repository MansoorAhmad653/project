'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, useToast } from '../providers';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { user, loading, login } = useAuth();
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
