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
  const [errors, setErrors] = useState({});
  const { user, loading, signup } = useAuth();
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
