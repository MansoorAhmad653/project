'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, useCart, useToast } from '../providers';

const DELIVERY_FEE = 150;

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const { cartItems, subtotal, clearCart } = useCart();
  const { addToast } = useToast();
  const router = useRouter();

  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(2); // 1=Cart, 2=Details, 3=Confirm

  const total = subtotal + DELIVERY_FEE;

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      addToast('Please login to checkout', 'warning');
      router.push('/login');
    }
  }, [user, authLoading, router, addToast]);

  // Pre-fill from user profile
  useEffect(() => {
    if (user) {
      setAddress(user.address || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0 && !submitting) {
      router.push('/cart');
    }
  }, [cartItems, router, submitting]);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!address.trim()) {
      addToast('Please enter a delivery address', 'error');
      return;
    }
    if (!phone.trim()) {
      addToast('Please enter a phone number', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const items = cartItems.map((item) => ({
        medicine_id: item.id,
        quantity: item.quantity,
      }));

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delivery_address: address,
          phone,
          items,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        clearCart();
        addToast('Order placed successfully!', 'success');
        router.push(`/orders/${data.order?.id || ''}`);
      } else {
        addToast(data.error || 'Failed to place order', 'error');
      }
    } catch (err) {
      addToast('Something went wrong. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
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

  if (!user || cartItems.length === 0) return null;

  return (
    <>
      {/* Checkout Steps */}
      <div className="checkout-steps">
        <div className="container">
          <div className="steps-row">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>
              <div className="step-num"><i className="bi bi-cart3"></i></div>
              <span>Cart</span>
            </div>
            <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>
              <div className="step-num"><i className="bi bi-person-lines-fill"></i></div>
              <span>Details</span>
            </div>
            <div className={`step-line ${step >= 3 ? 'active' : ''}`}></div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>
              <div className="step-num"><i className="bi bi-check-lg"></i></div>
              <span>Confirm</span>
            </div>
          </div>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <form onSubmit={handlePlaceOrder}>
            <div className="checkout-layout">
              {/* Left: Forms */}
              <div>
                {/* Delivery Info */}
                <div className="checkout-card mb-24">
                  <h3 className="checkout-section-title">
                    <i className="bi bi-geo-alt-fill text-primary"></i>
                    Delivery Information
                  </h3>
                  <div className="form-group">
                    <label className="form-label">Delivery Address</label>
                    <textarea
                      className="form-control"
                      placeholder="Enter your full delivery address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={3}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="e.g. 03001234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                    <div className="form-help">We&apos;ll call this number for delivery coordination</div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="checkout-card">
                  <h3 className="checkout-section-title">
                    <i className="bi bi-bag-check-fill text-primary"></i>
                    Order Items ({cartItems.length})
                  </h3>
                  {cartItems.map((item) => (
                    <div key={item.id} className="checkout-item">
                      <div className="checkout-item-img">
                        {item.image ? (
                          <img src={item.image} alt={item.name} />
                        ) : (
                          <div className="cart-img-placeholder">
                            <i className="bi bi-capsule"></i>
                          </div>
                        )}
                        <span className="checkout-qty-badge">{item.quantity}</span>
                      </div>
                      <span className="checkout-item-name">{item.name}</span>
                      <span className="checkout-item-price">
                        Rs. {(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Summary */}
              <div>
                <div className="summary-card">
                  <h3 className="summary-title">Order Summary</h3>
                  <div className="summary-row">
                    <span className="text-muted">Subtotal ({cartItems.length} items)</span>
                    <span className="fw-600">Rs. {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="summary-row">
                    <span className="text-muted">Delivery Fee</span>
                    <span className="fw-600">Rs. {DELIVERY_FEE.toLocaleString()}</span>
                  </div>
                  <div className="summary-divider"></div>
                  <div className="summary-row total-row">
                    <span>Total</span>
                    <span className="text-primary">Rs. {total.toLocaleString()}</span>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg btn-block mt-20"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span>
                        Placing Order...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle"></i> Place Order
                      </>
                    )}
                  </button>

                  <div className="delivery-info">
                    <div className="d-flex align-center gap-8 mb-8">
                      <i className="bi bi-shield-check text-primary"></i>
                      <span>Secure Checkout</span>
                    </div>
                    <div className="d-flex align-center gap-8">
                      <i className="bi bi-cash-coin text-primary"></i>
                      <span className="payment-badge">Cash on Delivery</span>
                    </div>
                  </div>
                </div>

                <Link href="/cart" className="btn btn-ghost btn-block mt-16">
                  <i className="bi bi-arrow-left"></i> Back to Cart
                </Link>
              </div>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
