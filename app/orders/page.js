'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, useToast } from '../providers';

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      addToast('Please login to view orders', 'warning');
      router.push('/login');
    }
  }, [user, authLoading, router, addToast]);

  useEffect(() => {
    if (!user) return;
    async function fetchOrders() {
      try {
        const res = await fetch('/api/orders');
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        } else {
          addToast('Failed to load orders', 'error');
        }
      } catch (err) {
        addToast('Failed to load orders', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [user, addToast]);

  const getStatusClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'confirmed') return 'status-confirmed';
    if (s === 'packed') return 'status-packed';
    if (s === 'dispatched') return 'status-dispatched';
    if (s === 'delivered') return 'status-delivered';
    if (s === 'cancelled') return 'status-cancelled';
    return 'status-pending';
  };

  const getStatusIcon = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'confirmed') return 'bi-check-circle';
    if (s === 'packed') return 'bi-box-seam';
    if (s === 'dispatched') return 'bi-truck';
    if (s === 'delivered') return 'bi-check-all';
    if (s === 'cancelled') return 'bi-x-circle';
    return 'bi-clock';
  };

  if (authLoading) {
    return (
      <section className="section">
        <div className="container">
          <div className="loading-spinner"><div className="spinner"></div></div>
        </div>
      </section>
    );
  }

  if (!user) return null;

  return (
    <>
      <div className="page-header">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>My Orders</span>
          </div>
          <h1 className="page-title">My Orders</h1>
          <p className="page-sub">Track and manage your medicine orders</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          {loading ? (
            <div className="loading-spinner"><div className="spinner"></div></div>
          ) : orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <i className="bi bi-box-seam"></i>
              </div>
              <h3>No Orders Yet</h3>
              <p>You haven&apos;t placed any orders yet. Start shopping to see your orders here.</p>
              <Link href="/shop" className="btn btn-primary btn-lg">
                <i className="bi bi-grid"></i> Browse Medicines
              </Link>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="order-card"
                >
                  <div className="order-card-header">
                    <span className="order-id">Order #{order.id}</span>
                    <span className={`status-badge ${getStatusClass(order.status)}`}>
                      <i className={`bi ${getStatusIcon(order.status)}`}></i>
                      {order.status || 'Pending'}
                    </span>
                    <span className="text-muted" style={{ fontSize: 13, marginLeft: 'auto' }}>
                      <i className="bi bi-calendar3" style={{ marginRight: 4 }}></i>
                      {order.created_at
                        ? new Date(order.created_at).toLocaleDateString('en-PK', {
                            year: 'numeric', month: 'short', day: 'numeric'
                          })
                        : 'N/A'}
                    </span>
                  </div>

                  {order.items && order.items.length > 0 && (
                    <div className="order-items-preview">
                      {order.items.slice(0, 4).map((item, idx) => (
                        <span key={idx} className="order-item-chip">
                          {item.medicine_name || item.name || `Item ${idx + 1}`}
                          {item.quantity > 1 && ` ×${item.quantity}`}
                        </span>
                      ))}
                      {order.items.length > 4 && (
                        <span className="order-item-chip">+{order.items.length - 4} more</span>
                      )}
                    </div>
                  )}

                  <div className="order-card-footer">
                    <div className="d-flex align-center gap-16">
                      <span className="text-muted" style={{ fontSize: 13 }}>
                        <i className="bi bi-box" style={{ marginRight: 4 }}></i>
                        {order.item_count || order.items?.length || 0} items
                      </span>
                    </div>
                    <span className="fw-700" style={{ fontSize: 17, color: 'var(--primary)' }}>
                      Rs. {parseFloat(order.total || 0).toLocaleString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
