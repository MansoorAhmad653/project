'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../providers';
import { useToast } from '../providers';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user && user.role !== 'admin' && !user.is_staff) {
      addToast('Admin access required', 'error');
      router.push('/');
      return;
    }
    if (user) fetchDashboard();
  }, [user, authLoading]);

  async function fetchDashboard() {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const d = await res.json();
        setData(d);
      } else {
        addToast('Failed to load dashboard', 'error');
        router.push('/');
      }
    } catch {
      addToast('Failed to load dashboard', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(orderId, status) {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        addToast(`Order #${orderId} updated to ${status}`, 'success');
        fetchDashboard();
      } else {
        const d = await res.json();
        addToast(d.error || 'Update failed', 'error');
      }
    } catch {
      addToast('Update failed', 'error');
    }
  }

  if (authLoading || loading) {
    return <div className="loading-spinner" style={{ minHeight: '60vh' }}><div className="spinner"></div></div>;
  }

  if (!data) return null;

  const chartData = {
    labels: data.week_labels || [],
    datasets: [{
      label: 'Orders',
      data: data.week_data || [],
      backgroundColor: 'rgba(15, 110, 86, 0.75)',
      borderColor: '#0F6E56',
      borderWidth: 2,
      borderRadius: 8,
      borderSkipped: false,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, font: { size: 12 } },
        grid: { color: 'rgba(0,0,0,0.04)' },
      },
      x: {
        ticks: { font: { size: 12 } },
        grid: { display: false },
      },
    },
  };

  const statusChoices = data.status_choices || [
    ['confirmed', 'Confirmed'],
    ['packed', 'Packed'],
    ['dispatched', 'Dispatched'],
    ['delivered', 'Delivered'],
    ['cancelled', 'Cancelled'],
  ];

  return (
    <>
      <div className="page-header">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link><span>/</span><span>Dashboard</span>
          </div>
          <h1 className="page-title"><i className="bi bi-speedometer2" style={{ color: 'var(--primary)' }}></i> Admin Dashboard</h1>
          <p className="page-sub">Overview of your pharmacy operations</p>
        </div>
      </div>

      <div className="section">
        <div className="container">
          {/* Stat Cards */}
          <div className="stats-grid">
            <div className="stat-card primary">
              <div className="stat-icon"><i className="bi bi-box-seam-fill"></i></div>
              <div className="stat-number">{data.total_orders ?? 0}</div>
              <div className="stat-card-label">Total Orders</div>
            </div>
            <div className="stat-card success">
              <div className="stat-icon"><i className="bi bi-currency-exchange"></i></div>
              <div className="stat-number">Rs. {(parseFloat(data.total_revenue) || 0).toLocaleString()}</div>
              <div className="stat-card-label">Total Revenue</div>
            </div>
            <div className="stat-card warning">
              <div className="stat-icon"><i className="bi bi-file-earmark-medical-fill"></i></div>
              <div className="stat-number">{data.pending_prescriptions ?? 0}</div>
              <div className="stat-card-label">Pending Prescriptions</div>
            </div>
            <div className="stat-card danger">
              <div className="stat-icon"><i className="bi bi-exclamation-triangle-fill"></i></div>
              <div className="stat-number">{data.low_stock ?? 0}</div>
              <div className="stat-card-label">Low Stock Items</div>
            </div>
          </div>

          <div className="dashboard-layout">
            {/* Weekly Chart */}
            <div className="dashboard-card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="bi bi-bar-chart-fill" style={{ color: 'var(--primary)' }}></i> Weekly Orders
              </h3>
              <div style={{ height: 260 }}>
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="dashboard-card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="bi bi-lightning-fill" style={{ color: 'var(--warning)' }}></i> Quick Stats
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  { label: 'Total Customers', value: data.total_users ?? 0, icon: 'bi-people-fill', color: 'var(--primary)' },
                  { label: 'Active Medicines', value: data.medicines?.length ?? 0, icon: 'bi-capsule', color: 'var(--success)' },
                  { label: 'Pending Rx', value: data.pending_prescriptions ?? 0, icon: 'bi-clock-history', color: 'var(--warning)' },
                  { label: 'Low Stock Alert', value: data.low_stock ?? 0, icon: 'bi-exclamation-diamond', color: 'var(--danger)' },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: i < 3 ? '1px solid var(--gray-100)' : 'none', fontSize: 14 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--gray-600)' }}>
                      <i className={`bi ${s.icon}`} style={{ color: s.color, fontSize: 16 }}></i> {s.label}
                    </span>
                    <span style={{ fontWeight: 800, color: 'var(--gray-900)' }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="dashboard-card mt-24">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="bi bi-clock-history" style={{ color: 'var(--primary)' }}></i> Recent Orders
              </span>
              <span style={{ fontSize: 13, color: 'var(--gray-400)', fontWeight: 500 }}>{data.recent_orders?.length || 0} orders</span>
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.recent_orders || []).map(order => (
                    <tr key={order.id}>
                      <td><Link href={`/orders/${order.id}`} style={{ fontWeight: 700 }}>#{order.id}</Link></td>
                      <td style={{ fontSize: 13 }}>{order.user_email}</td>
                      <td style={{ fontWeight: 700 }}>Rs. {parseFloat(order.total_price).toLocaleString()}</td>
                      <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                        {new Date(order.created_at).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })}
                      </td>
                      <td>
                        <span className={`status-badge status-${order.status}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <select
                          className="status-select"
                          value={order.status}
                          onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                        >
                          {statusChoices.map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Inventory */}
          <div className="dashboard-card mt-24">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="bi bi-boxes" style={{ color: 'var(--accent)' }}></i> Inventory Status
              </span>
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Medicine</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Level</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.medicines || []).map(med => {
                    const stock = med.stock_quantity;
                    const maxStock = 200;
                    const pct = Math.min((stock / maxStock) * 100, 100);
                    const level = stock === 0 ? 'empty' : stock <= 10 ? 'low' : 'good';
                    return (
                      <tr key={med.id}>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{med.name}</div>
                          {med.requires_prescription && <span className="badge badge-accent" style={{ fontSize: 10 }}>Rx Required</span>}
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>{med.category_name || '—'}</td>
                        <td style={{ fontWeight: 700 }}>Rs. {parseFloat(med.price).toLocaleString()}</td>
                        <td style={{ fontWeight: 700, color: level === 'empty' ? 'var(--danger)' : level === 'low' ? 'var(--warning)' : 'var(--gray-800)' }}>
                          {stock}
                        </td>
                        <td style={{ minWidth: 100 }}>
                          <div className="stock-indicator">
                            <div className={`stock-bar ${level}`} style={{ width: `${pct}%` }}></div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
