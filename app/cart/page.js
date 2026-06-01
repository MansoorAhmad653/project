'use client';

import Link from 'next/link';
import { useCart, useToast } from '../providers';

const DELIVERY_FEE = 150;

export default function CartPage() {
  const { cartItems, cartCount, subtotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const { addToast } = useToast();
  const total = subtotal + (cartItems.length > 0 ? DELIVERY_FEE : 0);

  const handleRemove = (item) => {
    removeFromCart(item.id);
    addToast(`${item.name} removed from cart`, 'info');
  };

  const handleClear = () => {
    clearCart();
    addToast('Cart cleared', 'info');
  };

  return (
    <>
      <div className="page-header">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>Shopping Cart</span>
          </div>
          <h1 className="page-title">Shopping Cart</h1>
          <p className="page-sub">{cartCount} {cartCount === 1 ? 'item' : 'items'} in your cart</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          {cartItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <i className="bi bi-cart-x"></i>
              </div>
              <h3>Your Cart is Empty</h3>
              <p>Looks like you haven&apos;t added any medicines to your cart yet.</p>
              <Link href="/shop" className="btn btn-primary btn-lg">
                <i className="bi bi-grid"></i> Browse Medicines
              </Link>
            </div>
          ) : (
            <div className="cart-layout">
              <div>
                <div className="cart-table-card">
                  <div className="cart-table-header">
                    <span>Product</span>
                    <span>Price</span>
                    <span>Quantity</span>
                    <span>Total</span>
                    <span></span>
                  </div>
                  {cartItems.map((item) => (
                    <div key={item.id} className="cart-item">
                      <div className="cart-item-product">
                        <div className="cart-item-img">
                          {item.image ? (
                            <img src={item.image} alt={item.name} />
                          ) : (
                            <div className="cart-img-placeholder">
                              <i className="bi bi-capsule"></i>
                            </div>
                          )}
                        </div>
                        <div>
                          <Link href={`/shop/${item.id}`} className="cart-item-name">
                            {item.name}
                          </Link>
                          {item.requires_prescription && (
                            <div style={{ marginTop: 4 }}>
                              <span className="badge badge-accent" style={{ fontSize: 10 }}>
                                <i className="bi bi-prescription2"></i> Rx Required
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="cart-item-price">
                        Rs. {item.price.toLocaleString()}
                      </div>
                      <div className="qty-controls">
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          −
                        </button>
                        <span className="qty-val">{item.quantity}</span>
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(item.id, 1)}
                          disabled={item.quantity >= item.stock_quantity}
                        >
                          +
                        </button>
                      </div>
                      <div className="cart-item-total fw-700">
                        Rs. {(item.price * item.quantity).toLocaleString()}
                      </div>
                      <button
                        className="remove-btn"
                        onClick={() => handleRemove(item)}
                        title="Remove item"
                      >
                        <i className="bi bi-trash3"></i>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="d-flex justify-between mt-20">
                  <Link href="/shop" className="btn btn-ghost">
                    <i className="bi bi-arrow-left"></i> Continue Shopping
                  </Link>
                  <button className="btn btn-outline-danger btn-sm" onClick={handleClear}>
                    <i className="bi bi-trash3"></i> Clear Cart
                  </button>
                </div>
              </div>

              <div className="summary-card">
                <h3 className="summary-title">Order Summary</h3>
                <div className="summary-row">
                  <span className="text-muted">Subtotal ({cartCount} items)</span>
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

                <Link href="/checkout" className="btn btn-primary btn-lg btn-block mt-20">
                  <i className="bi bi-lock"></i> Proceed to Checkout
                </Link>

                <div className="delivery-info">
                  <div className="d-flex align-center gap-8 mb-8">
                    <i className="bi bi-truck text-primary"></i>
                    <span>Delivery within 1-3 business days</span>
                  </div>
                  <div className="d-flex align-center gap-8">
                    <i className="bi bi-cash-coin text-primary"></i>
                    <span className="payment-badge">Cash on Delivery</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
