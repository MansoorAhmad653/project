'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../providers';
import { useToast } from '../../providers';

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) fetchOrder();
  }, [user, authLoading, id]);

  async function fetchOrder() {
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (!res.ok) {
        addToast('Order not found', 'error');
        router.push('/orders');
        return;
      }
      const data = await res.json();
      setOrder(data.order);
      setItems(data.items || []);
    } catch {
      addToast('Failed to load order', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast('Order cancelled successfully', 'success');
        fetchOrder();
      } else {
        addToast(data.error || 'Cannot cancel order', 'error');
      }
    } catch {
      addToast('Failed to cancel order', 'error');
    } finally {
      setCancelling(false);
    }
  }

  if (authLoading || loading) {
    return <div className="loading-spinner" style={{ minHeight: '60vh' }}><div className="spinner"></div></div>;
  }

  if (!order) return null;

  const steps = ['confirmed', 'packed', 'dispatched', 'delivered'];
  const currentStep = steps.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';
  const subtotal = parseFloat(order.total_price) - parseFloat(order.delivery_fee);

  return (
    <>
      <div className="page-header">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link><span>/</span>
            <Link href="/orders">My Orders</Link><span>/</span>
            <span>Order #{order.id}</span>
          </div>
          <h1 className="page-title">Order #{order.id}</h1>
          <p className="page-sub">
            Placed on {new Date(order.created_at).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      <div className="section">
        <div className="container">
          {/* Status Stepper */}
          {!isCancelled ? (
            <div className="order-detail-card mb-24">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="bi bi-truck"></i> Order Tracking
              </h3>
              <div className="status-stepper">
                {steps.map((step, i) => (
                  <div key={step} style={{ display: 'contents' }}>
                    <div className={`stepper-step ${i < currentStep ? 'done' : ''} ${i === currentStep ? 'active' : ''}`}>
                      <div className="step-circle">
                        <i className={`bi ${i < currentStep ? 'bi-check-lg' : step === 'confirmed' ? 'bi-check-circle' : step === 'packed' ? 'bi-box-seam' : step === 'dispatched' ? 'bi-truck' : 'bi-house-check'}`}></i>
                      </div>
                      <span className="stepper-label">{step.charAt(0).toUpperCase() + step.slice(1)}</span>
                    </div>
                    {i < steps.length - 1 && (
                      <div className={`step-connector ${i < currentStep ? 'done' : ''}`}></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="order-detail-card mb-24" style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fde8ea', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28, color: '#dc3545' }}>
                <i className="bi bi-x-circle-fill"></i>
              </div>
              <h3 style={{ fontSize: 18, marginBottom: 4, color: '#8b1a24' }}>Order Cancelled</h3>
              <p className="text-muted" style={{ fontSize: 14 }}>This order has been cancelled.</p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 30, alignItems: 'start' }}>
            {/* Order Items */}
            <div className="order-detail-card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="bi bi-bag"></i> Order Items ({items.length})
              </h3>
              {items.map((item, i) => (
                <div className="order-detail-item" key={i}>
                  <div className="order-detail-img" style={{ background: 'var(--gray-50)' }}>
                    <i className="bi bi-capsule" style={{ fontSize: 24, color: 'var(--primary)', opacity: 0.5 }}></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{item.medicine_name || 'Deleted Medicine'}</div>
                    <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>Qty: {item.quantity} × Rs. {parseFloat(item.price).toLocaleString()}</div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--primary)' }}>
                    Rs. {(item.quantity * parseFloat(item.price)).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Sidebar */}
            <div>
              {/* Price Summary */}
              <div className="summary-card mb-20">
                <div className="summary-title">Price Summary</div>
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span className="fw-600">Rs. {subtotal.toLocaleString()}</span>
                </div>
                <div className="summary-row">
                  <span>Delivery Fee</span>
                  <span className="fw-600">Rs. {parseFloat(order.delivery_fee).toLocaleString()}</span>
                </div>
                <div className="summary-divider"></div>
                <div className="summary-row total-row">
                  <span>Total</span>
                  <span style={{ color: 'var(--primary)' }}>Rs. {parseFloat(order.total_price).toLocaleString()}</span>
                </div>
                <div className="delivery-info">
                  <span className="payment-badge"><i className="bi bi-cash-stack"></i> Cash on Delivery</span>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="delivery-info-card mb-20">
                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="bi bi-geo-alt-fill" style={{ color: 'var(--primary)' }}></i> Delivery Details
                </h4>
                <div style={{ fontSize: 14, marginBottom: 8 }}>
                  <strong>Address:</strong><br />
                  {order.delivery_address}
                </div>
                <div style={{ fontSize: 14 }}>
                  <strong>Phone:</strong> {order.phone}
                </div>
              </div>

              {/* Actions */}
              {order.can_cancel && (
                <button
                  className="btn btn-outline-danger btn-block"
                  onClick={handleCancel}
                  disabled={cancelling}
                >
                  {cancelling ? (
                    <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div> Cancelling...</>
                  ) : (
                    <><i className="bi bi-x-circle"></i> Cancel Order</>
                  )}
                </button>
              )}

              {order.status === 'delivered' && (
                <Link href={`/feedback?order=${order.id}`} className="btn btn-primary btn-block mt-12">
                  <i className="bi bi-star"></i> Leave Feedback
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
