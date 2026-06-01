'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../providers';
import { useToast } from '../providers';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { addToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) fetchProfile();
  }, [user, authLoading]);

  async function fetchProfile() {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setForm({
          name: data.user.name || '',
          phone: data.user.phone || '',
          address: data.user.address || '',
        });
      }
    } catch {
      addToast('Failed to load profile', 'error');
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        addToast('Profile updated successfully!', 'success');
        setEditing(false);
        fetchProfile();
        refreshUser();
      } else {
        const data = await res.json();
        addToast(data.error || 'Update failed', 'error');
      }
    } catch {
      addToast('Update failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || !profile) {
    return <div className="loading-spinner" style={{ minHeight: '60vh' }}><div className="spinner"></div></div>;
  }

  return (
    <>
      <div className="page-header">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link><span>/</span><span>Profile</span>
          </div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-sub">Manage your account information</p>
        </div>
      </div>

      <div className="section">
        <div className="container">
          <div className="profile-layout">
            {/* Sidebar */}
            <div className="profile-sidebar">
              <div className="profile-avatar-large">
                {(profile.name || profile.email || '?')[0].toUpperCase()}
              </div>
              <div className="profile-name">{profile.name || 'User'}</div>
              <div className="profile-email">{profile.email}</div>

              <div className="profile-nav">
                <Link href="/profile" className="profile-nav-item active">
                  <i className="bi bi-person"></i> Profile Info
                </Link>
                <Link href="/orders" className="profile-nav-item">
                  <i className="bi bi-box-seam"></i> My Orders
                </Link>
                <Link href="/prescriptions" className="profile-nav-item">
                  <i className="bi bi-file-medical"></i> Prescriptions
                </Link>
                {(profile.role === 'admin' || profile.is_staff) && (
                  <Link href="/dashboard" className="profile-nav-item">
                    <i className="bi bi-speedometer2"></i> Dashboard
                  </Link>
                )}
              </div>
            </div>

            {/* Main Content */}
            <div>
              {/* Profile Info Card */}
              {!editing ? (
                <div className="profile-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="bi bi-person-circle" style={{ color: 'var(--primary)' }}></i> Account Information
                    </h3>
                    <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>
                      <i className="bi bi-pencil"></i> Edit
                    </button>
                  </div>

                  <div className="info-grid">
                    <div className="info-item">
                      <div className="info-label">Full Name</div>
                      <div className="info-value">{profile.name || '—'}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Email</div>
                      <div className="info-value">{profile.email}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Username</div>
                      <div className="info-value">{profile.username || '—'}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Phone</div>
                      <div className="info-value">{profile.phone || '—'}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Role</div>
                      <div className="info-value">
                        <span className={`badge ${profile.role === 'admin' ? 'badge-accent' : 'badge-primary'}`}>
                          {profile.role === 'admin' ? 'Admin' : 'Customer'}
                        </span>
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Member Since</div>
                      <div className="info-value">
                        {profile.date_joined ? new Date(profile.date_joined).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                      </div>
                    </div>
                  </div>

                  {profile.address && (
                    <div className="info-item mt-16" style={{ gridColumn: '1 / -1' }}>
                      <div className="info-label">Delivery Address</div>
                      <div className="info-value">{profile.address}</div>
                    </div>
                  )}
                </div>
              ) : (
                /* Edit Form */
                <div className="profile-card">
                  <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="bi bi-pencil-square" style={{ color: 'var(--primary)' }}></i> Edit Profile
                  </h3>

                  <form onSubmit={handleSave}>
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        value={profile.email}
                        disabled
                        style={{ opacity: 0.6 }}
                      />
                      <div className="form-help">Email cannot be changed</div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+92 300 000 0000"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Delivery Address</label>
                      <textarea
                        className="form-control"
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        placeholder="Enter your delivery address"
                        rows={3}
                      ></textarea>
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                      <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? (
                          <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div> Saving...</>
                        ) : (
                          <><i className="bi bi-check-lg"></i> Save Changes</>
                        )}
                      </button>
                      <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
