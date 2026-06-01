'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, useToast } from '../providers';

export default function SignupPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    phone: '',
    address: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { user, loading, signup, loginWithGoogle } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/shop');
    }
  }, [user, loading, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email address';
    if (!form.username.trim()) errs.username = 'Username is required';
    if (!form.password.trim()) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (!form.phone.trim()) errs.phone = 'Phone number is required';
    if (!form.address.trim()) errs.address = 'Address is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      const result = await signup(form);
      if (result.success) {
        addToast('Account created successfully! Welcome to MediCart', 'success');
        router.push('/shop');
      } else {
        addToast(result.error || 'Signup failed', 'error');
        setErrors({ general: result.error || 'Signup failed. Please try again.' });
      }
    } catch (err) {
      addToast('Something went wrong', 'error');
      setErrors({ general: 'Something went wrong. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    setErrors({});
    try {
      const result = await loginWithGoogle();
      if (!result.success) {
        setErrors({ general: result.error || 'Failed to sign up with Google' });
        addToast(result.error || 'Google sign-up failed', 'error');
      }
    } catch (err) {
      console.error('Google sign-up error:', err);
      setErrors({ general: 'Something went wrong. Please try again.' });
      addToast('Google sign-up failed', 'error');
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
              <i className="bi bi-person-plus-fill"></i>
            </div>
            <h2>Create Account</h2>
            <p>Join MediCart and start shopping for medicines</p>
          </div>

          <form onSubmit={handleSubmit}>
            {errors.general && (
              <div className="form-error" style={{
                background: '#fde8ea', padding: '12px 16px', borderRadius: 8,
                marginBottom: 18, fontSize: 13, fontWeight: 600, textAlign: 'center'
              }}>
                <i className="bi bi-exclamation-circle" style={{ marginRight: 6 }}></i>
                {errors.general}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="name"
                className="form-control"
                placeholder="Enter your full name"
                value={form.name}
                onChange={handleChange}
              />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
              />
              {errors.email && <div className="form-error">{errors.email}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                name="username"
                className="form-control"
                placeholder="Choose a username"
                value={form.username}
                onChange={handleChange}
              />
              {errors.username && <div className="form-error">{errors.username}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="form-control"
                  placeholder="Create a password (min 6 chars)"
                  value={form.password}
                  onChange={handleChange}
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
              {errors.password && <div className="form-error">{errors.password}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                name="phone"
                className="form-control"
                placeholder="e.g. 03001234567"
                value={form.phone}
                onChange={handleChange}
              />
              {errors.phone && <div className="form-error">{errors.phone}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Delivery Address</label>
              <textarea
                name="address"
                className="form-control"
                placeholder="Enter your full address"
                value={form.address}
                onChange={handleChange}
                rows={3}
              />
              {errors.address && <div className="form-error">{errors.address}</div>}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-block"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span>
                  Creating Account...
                </>
              ) : (
                <>
                  <i className="bi bi-person-plus"></i> Create Account
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
              onClick={handleGoogleSignUp}
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
                  Signing up...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Sign up with Google
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account?{' '}
            <Link href="/login">Sign in here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
