'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCart, useToast } from '../../providers';

export default function MedicineDetailPage() {
  const params = useParams();
  const { addToCart } = useCart();
  const { addToast } = useToast();

  const [medicine, setMedicine] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [canBuy, setCanBuy] = useState(true);
  const [prescriptionStatus, setPrescriptionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchMedicine() {
      try {
        const res = await fetch(`/api/medicines/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setMedicine(data.medicine);
          setReviews(data.reviews || []);
          setAvgRating(data.avg_rating || 0);
          setCanBuy(data.can_buy !== undefined ? data.can_buy : true);
          setPrescriptionStatus(data.prescription_status || null);
        } else {
          setError('Medicine not found');
        }
      } catch (err) {
        setError('Failed to load medicine details');
      } finally {
        setLoading(false);
      }
    }
    if (params.id) fetchMedicine();
  }, [params.id]);

  const handleAddToCart = () => {
    if (!medicine) return;
    if (medicine.requires_prescription && !canBuy) {
      addToast('You need an approved prescription to buy this medicine', 'warning');
      return;
    }
    if (medicine.stock_quantity <= 0) {
      addToast('This medicine is out of stock', 'error');
      return;
    }
    addToCart(medicine);
    addToast(`${medicine.name} added to cart`, 'success');
  };

  const renderStars = (rating) => {
    const stars = [];
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    for (let i = 1; i <= 5; i++) {
      if (i <= full) {
        stars.push(<i key={i} className="bi bi-star-fill"></i>);
      } else if (i === full + 1 && half) {
        stars.push(<i key={i} className="bi bi-star-half"></i>);
      } else {
        stars.push(<i key={i} className="bi bi-star-fill empty"></i>);
      }
    }
    return stars;
  };

  if (loading) {
    return (
      <>
        <div className="page-header">
          <div className="container">
            <div className="breadcrumb">
              <Link href="/">Home</Link>
              <span>/</span>
              <Link href="/shop">Medicines</Link>
              <span>/</span>
              <span>Loading...</span>
            </div>
            <h1 className="page-title">Loading...</h1>
          </div>
        </div>
        <section className="section">
          <div className="container">
            <div className="loading-spinner"><div className="spinner"></div></div>
          </div>
        </section>
      </>
    );
  }

  if (error || !medicine) {
    return (
      <>
        <div className="page-header">
          <div className="container">
            <div className="breadcrumb">
              <Link href="/">Home</Link>
              <span>/</span>
              <Link href="/shop">Medicines</Link>
            </div>
            <h1 className="page-title">Medicine Not Found</h1>
          </div>
        </div>
        <section className="section">
          <div className="container">
            <div className="empty-state">
              <div className="empty-icon"><i className="bi bi-exclamation-circle"></i></div>
              <h3>{error || 'Medicine not found'}</h3>
              <p>The medicine you&apos;re looking for doesn&apos;t exist or has been removed.</p>
              <Link href="/shop" className="btn btn-primary">
                <i className="bi bi-arrow-left"></i> Back to Shop
              </Link>
            </div>
          </div>
        </section>
      </>
    );
  }

  const isDisabled = medicine.stock_quantity <= 0 || (medicine.requires_prescription && !canBuy);

  return (
    <>
      <div className="page-header">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/shop">Medicines</Link>
            <span>/</span>
            <span>{medicine.name}</span>
          </div>
          <h1 className="page-title">{medicine.name}</h1>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="product-layout">
            {/* Product Image */}
            <div>
              <div className="product-image-card">
                {medicine.image ? (
                  <img src={medicine.image} alt={medicine.name} className="product-main-img" />
                ) : (
                  <div className="product-placeholder">
                    <i className="bi bi-capsule"></i>
                    <span>No image available</span>
                  </div>
                )}
                {medicine.requires_prescription && (
                  <div className="rx-banner">
                    <i className="bi bi-prescription2"></i> Prescription Required
                  </div>
                )}
              </div>
            </div>

            {/* Product Info */}
            <div>
              {medicine.category_name && (
                <span className="badge badge-primary mb-12">{medicine.category_name}</span>
              )}
              <h1 className="product-title">{medicine.name}</h1>

              <div className="d-flex align-center gap-12 mb-16">
                <div className="star-rating">{renderStars(avgRating)}</div>
                <span className="text-muted" style={{ fontSize: 14 }}>
                  ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                </span>
              </div>

              <div className="product-price">Rs. {parseFloat(medicine.price).toLocaleString()}</div>

              <div style={{ fontSize: 13, marginBottom: 20 }}>
                {medicine.stock_quantity > 0 ? (
                  <span className="text-success fw-600">
                    <i className="bi bi-check-circle-fill"></i> In Stock ({medicine.stock_quantity} available)
                  </span>
                ) : (
                  <span className="text-danger fw-600">
                    <i className="bi bi-x-circle-fill"></i> Out of Stock
                  </span>
                )}
              </div>

              {medicine.requires_prescription && (
                <div className="rx-notice">
                  <i className="bi bi-exclamation-triangle-fill" style={{ marginRight: 6 }}></i>
                  This medicine requires a valid prescription.
                  {prescriptionStatus === 'approved' ? (
                    <span className="text-success fw-600"> Your prescription has been approved.</span>
                  ) : prescriptionStatus === 'pending' ? (
                    <span> Your prescription is pending review.</span>
                  ) : (
                    <span> Please <Link href="/prescriptions">upload your prescription</Link> first.</span>
                  )}
                </div>
              )}

              {medicine.description && (
                <p className="product-desc">{medicine.description}</p>
              )}

              <div className="product-meta">
                {medicine.manufacturer && (
                  <div className="product-meta-item">
                    <i className="bi bi-building"></i>
                    <span><strong>Manufacturer:</strong> {medicine.manufacturer}</span>
                  </div>
                )}
                {medicine.dosage && (
                  <div className="product-meta-item">
                    <i className="bi bi-eyedropper"></i>
                    <span><strong>Dosage:</strong> {medicine.dosage}</span>
                  </div>
                )}
                {medicine.category_name && (
                  <div className="product-meta-item">
                    <i className="bi bi-tag"></i>
                    <span><strong>Category:</strong> {medicine.category_name}</span>
                  </div>
                )}
              </div>

              <div className="product-actions">
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleAddToCart}
                  disabled={isDisabled}
                  style={{ flex: 1 }}
                >
                  <i className="bi bi-cart-plus"></i>
                  {medicine.stock_quantity <= 0
                    ? 'Out of Stock'
                    : medicine.requires_prescription && !canBuy
                      ? 'Prescription Required'
                      : 'Add to Cart'}
                </button>
                <Link href="/shop" className="btn btn-outline btn-lg">
                  <i className="bi bi-arrow-left"></i> Back
                </Link>
              </div>

              <div className="product-guarantees">
                <div className="guarantee-item">
                  <i className="bi bi-shield-check text-primary"></i> Genuine
                </div>
                <div className="guarantee-item">
                  <i className="bi bi-truck text-primary"></i> Fast Delivery
                </div>
                <div className="guarantee-item">
                  <i className="bi bi-cash-coin text-primary"></i> COD Available
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="reviews-section">
            <h2 className="section-title mb-24">
              Customer Reviews
              <span className="text-muted fw-500" style={{ fontSize: 16, marginLeft: 8 }}>
                ({reviews.length})
              </span>
            </h2>

            {reviews.length > 0 ? (
              <div className="reviews-list">
                {reviews.map((review, index) => (
                  <div key={review.id || index} className="review-card">
                    <div className="review-header">
                      <div className="review-avatar">
                        {(review.user_name || review.user || 'U')[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="d-flex justify-between align-center">
                          <span className="review-name">{review.user_name || review.user || 'Anonymous'}</span>
                          <span className="review-date">
                            {review.created_at ? new Date(review.created_at).toLocaleDateString('en-PK', {
                              year: 'numeric', month: 'short', day: 'numeric'
                            }) : ''}
                          </span>
                        </div>
                        <div className="star-rating" style={{ marginTop: 2 }}>
                          {renderStars(review.rating || 0)}
                        </div>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="review-comment">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <div className="empty-icon"><i className="bi bi-chat-square-text"></i></div>
                <h3>No Reviews Yet</h3>
                <p>Be the first to review this medicine after placing an order.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
