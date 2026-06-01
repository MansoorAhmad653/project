'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from './providers';
import { useToast } from './providers';

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { addToast } = useToast();

  useEffect(() => {
    async function fetchData() {
      try {
        const [catRes, medRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/medicines?per_page=8'),
        ]);
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.categories || []);
        }
        if (medRes.ok) {
          const medData = await medRes.json();
          setMedicines(medData.medicines || []);
        }
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleAddToCart = (medicine) => {
    if (medicine.requires_prescription) {
      addToast('This medicine requires a prescription', 'warning');
      return;
    }
    if (medicine.stock_quantity <= 0) {
      addToast('This medicine is out of stock', 'error');
      return;
    }
    addToCart(medicine);
    addToast(`${medicine.name} added to cart`, 'success');
  };

  const categoryIcons = {
    'Pain Relief': 'bi-bandaid',
    'Antibiotics': 'bi-capsule',
    'Vitamins': 'bi-brightness-high',
    'Cardiac': 'bi-heart-pulse',
    'Diabetes': 'bi-droplet',
    'Respiratory': 'bi-lungs',
    'Digestive': 'bi-stomach',
    'Skin Care': 'bi-moisture',
    'Eye Care': 'bi-eye',
    'Allergy': 'bi-shield-exclamation',
  };

  const getCategoryIcon = (name) => {
    for (const key of Object.keys(categoryIcons)) {
      if (name && name.toLowerCase().includes(key.toLowerCase())) {
        return categoryIcons[key];
      }
    }
    return 'bi-capsule';
  };

  return (
    <>
      {/* ===================== HERO SECTION ===================== */}
      <section className="hero-section">
        <div className="hero-bg"></div>
        <div className="container">
          <div className="hero-content">
            <div>
              <div className="hero-badge">
                <i className="bi bi-shield-check" style={{ marginRight: 6 }}></i>
                Trusted Online Pharmacy
              </div>
              <h1 className="hero-title">
                Your Health,<br />Delivered <span className="text-accent">Right</span>
              </h1>
              <p className="hero-desc">
                Browse genuine medicines, upload prescriptions, and get fast delivery across Pakistan.
                Quality healthcare at your doorstep.
              </p>
              <div className="hero-actions">
                <Link href="/shop" className="btn btn-primary btn-lg">
                  <i className="bi bi-grid"></i> Browse Medicines
                </Link>
                <Link href="/prescriptions" className="btn btn-outline btn-lg">
                  <i className="bi bi-upload"></i> Upload Prescription
                </Link>
              </div>
              <div className="hero-stats">
                <div className="stat">
                  <span className="stat-num">500+</span>
                  <span className="stat-label">Medicines</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat">
                  <span className="stat-num">24/7</span>
                  <span className="stat-label">Delivery</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat">
                  <span className="stat-num">10K+</span>
                  <span className="stat-label">Customers</span>
                </div>
              </div>
            </div>
            <div className="hero-illustration">
              <div className="hero-circle-1"></div>
              <div className="hero-circle-2"></div>
              <div className="hero-icon-grid">
                <div className="hero-icon-card"><i className="bi bi-heart-pulse-fill"></i></div>
                <div className="hero-icon-card accent"><i className="bi bi-capsule"></i></div>
                <div className="hero-icon-card"><i className="bi bi-prescription2"></i></div>
                <div className="hero-icon-card"><i className="bi bi-shield-check"></i></div>
                <div className="hero-icon-card accent"><i className="bi bi-truck"></i></div>
                <div className="hero-icon-card"><i className="bi bi-clipboard2-pulse"></i></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FEATURES STRIP ===================== */}
      <section className="features-strip">
        <div className="container">
          <div className="features-row">
            <div className="feature-pill">
              <i className="bi bi-patch-check-fill"></i>
              <div className="feature-pill-text">
                <strong>Genuine Medicines</strong>
                <small>100% authentic products</small>
              </div>
            </div>
            <div className="feature-pill">
              <i className="bi bi-lightning-charge-fill"></i>
              <div className="feature-pill-text">
                <strong>Fast Delivery</strong>
                <small>Same-day in major cities</small>
              </div>
            </div>
            <div className="feature-pill">
              <i className="bi bi-shield-lock-fill"></i>
              <div className="feature-pill-text">
                <strong>Secure Payments</strong>
                <small>Cash on delivery available</small>
              </div>
            </div>
            <div className="feature-pill">
              <i className="bi bi-headset"></i>
              <div className="feature-pill-text">
                <strong>24/7 Support</strong>
                <small>We&apos;re always here to help</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== CATEGORIES ===================== */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Shop by Category</h2>
              <p className="section-sub">Find medicines across all health categories</p>
            </div>
            <Link href="/shop" className="btn btn-outline btn-sm">
              View All <i className="bi bi-arrow-right"></i>
            </Link>
          </div>
          {loading ? (
            <div className="loading-spinner"><div className="spinner"></div></div>
          ) : categories.length > 0 ? (
            <div className="categories-grid">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/shop?category=${cat.id}`}
                  className="category-card"
                >
                  <div className="category-icon">
                    <i className={`bi ${getCategoryIcon(cat.name)}`}></i>
                  </div>
                  {cat.name}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted">No categories found</p>
          )}
        </div>
      </section>

      {/* ===================== FEATURED MEDICINES ===================== */}
      <section className="section" style={{ background: 'var(--gray-50)' }}>
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Featured Medicines</h2>
              <p className="section-sub">Popular and essential medicines for your health needs</p>
            </div>
            <Link href="/shop" className="btn btn-outline btn-sm">
              View All <i className="bi bi-arrow-right"></i>
            </Link>
          </div>
          {loading ? (
            <div className="loading-spinner"><div className="spinner"></div></div>
          ) : medicines.length > 0 ? (
            <div className="medicines-grid">
              {medicines.map((med) => (
                <div key={med.id} className="medicine-card">
                  <Link href={`/shop/${med.id}`} className="medicine-img-wrap">
                    {med.image ? (
                      <img src={med.image} alt={med.name} className="medicine-img" />
                    ) : (
                      <div className="medicine-img-placeholder">
                        <i className="bi bi-capsule"></i>
                      </div>
                    )}
                    {med.requires_prescription && (
                      <span className="rx-badge"><i className="bi bi-prescription2"></i> Rx</span>
                    )}
                    {med.stock_quantity > 0 && med.stock_quantity <= 10 && (
                      <span className="stock-badge warning">Low Stock</span>
                    )}
                    {med.stock_quantity <= 0 && (
                      <div className="out-of-stock-overlay">OUT OF STOCK</div>
                    )}
                  </Link>
                  <div className="medicine-body">
                    {med.category_name && (
                      <span className="medicine-category">{med.category_name}</span>
                    )}
                    <Link href={`/shop/${med.id}`} className="medicine-name">
                      {med.name}
                    </Link>
                    {med.description && (
                      <p className="medicine-desc">{med.description}</p>
                    )}
                    <div className="medicine-bottom">
                      <span className="medicine-price">
                        Rs. {parseFloat(med.price).toLocaleString()}
                      </span>
                      <button
                        className="add-cart-btn"
                        title="Add to Cart"
                        disabled={med.stock_quantity <= 0 || med.requires_prescription}
                        onClick={() => handleAddToCart(med)}
                      >
                        <i className="bi bi-cart-plus"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted">No medicines available at the moment</p>
          )}
        </div>
      </section>

      {/* ===================== WHY CHOOSE US ===================== */}
      <section className="section">
        <div className="container">
          <div className="section-header" style={{ justifyContent: 'center', textAlign: 'center' }}>
            <div>
              <h2 className="section-title">Why Choose MediCart?</h2>
              <p className="section-sub">We deliver quality healthcare with trust and convenience</p>
            </div>
          </div>
          <div className="why-grid">
            <div className="why-card">
              <div className="why-icon"><i className="bi bi-patch-check-fill"></i></div>
              <h4>Verified Medicines</h4>
              <p>All medicines are sourced from licensed pharmacies and verified manufacturers to ensure authenticity.</p>
            </div>
            <div className="why-card">
              <div className="why-icon"><i className="bi bi-truck"></i></div>
              <h4>Quick Delivery</h4>
              <p>Fast and reliable delivery across Pakistan. Same-day delivery available in major cities.</p>
            </div>
            <div className="why-card">
              <div className="why-icon"><i className="bi bi-arrow-return-left"></i></div>
              <h4>Easy Returns</h4>
              <p>Hassle-free return policy. If you&apos;re not satisfied, we make returns simple and quick.</p>
            </div>
            <div className="why-card">
              <div className="why-icon"><i className="bi bi-file-earmark-medical"></i></div>
              <h4>Prescription Support</h4>
              <p>Upload your prescriptions easily and our pharmacists will verify and process your order quickly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== CTA SECTION ===================== */}
      <section className="cta-section">
        <div className="container">
          <h2 className="cta-title">Ready to Order Your Medicines?</h2>
          <p className="cta-sub">
            Join thousands of satisfied customers who trust MediCart for their healthcare needs.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/shop" className="btn btn-white btn-lg">
              <i className="bi bi-grid"></i> Browse Medicines
            </Link>
            <Link href="/signup" className="btn btn-accent btn-lg">
              <i className="bi bi-person-plus"></i> Create Account
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
