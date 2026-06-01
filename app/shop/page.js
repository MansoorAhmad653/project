'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCart, useToast } from '../providers';

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="loading-spinner" style={{ minHeight: '60vh' }}><div className="spinner"></div></div>}>
      <ShopContent />
    </Suspense>
  );
}

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const { addToast } = useToast();

  const [categories, setCategories] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filter state from URL
  const currentPage = parseInt(searchParams.get('page') || '1');
  const currentCategory = searchParams.get('category') || '';
  const currentSearch = searchParams.get('q') || '';
  const currentMinPrice = searchParams.get('min_price') || '';
  const currentMaxPrice = searchParams.get('max_price') || '';
  const currentPrescription = searchParams.get('prescription') || '';

  // Local filter form state
  const [searchInput, setSearchInput] = useState(currentSearch);
  const [minPrice, setMinPrice] = useState(currentMinPrice);
  const [maxPrice, setMaxPrice] = useState(currentMaxPrice);

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    }
    fetchCategories();
  }, []);

  // Fetch medicines when URL params change
  const fetchMedicines = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentSearch) params.set('q', currentSearch);
      if (currentCategory) params.set('category', currentCategory);
      if (currentMinPrice) params.set('min_price', currentMinPrice);
      if (currentMaxPrice) params.set('max_price', currentMaxPrice);
      if (currentPrescription) params.set('prescription', currentPrescription);
      params.set('page', currentPage.toString());
      params.set('per_page', '12');

      const res = await fetch(`/api/medicines?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMedicines(data.medicines || []);
        setTotalPages(data.total_pages || 1);
        setTotalCount(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch medicines:', err);
      addToast('Failed to load medicines', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, currentCategory, currentSearch, currentMinPrice, currentMaxPrice, currentPrescription, addToast]);

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  // Build URL with params
  const buildUrl = (overrides = {}) => {
    const params = new URLSearchParams();
    const values = {
      q: currentSearch,
      category: currentCategory,
      min_price: currentMinPrice,
      max_price: currentMaxPrice,
      prescription: currentPrescription,
      page: '1',
      ...overrides,
    };
    Object.entries(values).forEach(([key, val]) => {
      if (val && val !== '') params.set(key, val);
    });
    return `/shop?${params.toString()}`;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    router.push(buildUrl({ q: searchInput, page: '1' }));
  };

  const handleCategoryChange = (catId) => {
    router.push(buildUrl({ category: catId, page: '1' }));
  };

  const handlePrescriptionChange = (val) => {
    router.push(buildUrl({ prescription: val, page: '1' }));
  };

  const handlePriceFilter = () => {
    router.push(buildUrl({ min_price: minPrice, max_price: maxPrice, page: '1' }));
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setMinPrice('');
    setMaxPrice('');
    router.push('/shop');
  };

  const handlePageChange = (page) => {
    router.push(buildUrl({ page: page.toString() }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  return (
    <>
      <div className="page-header">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>Medicines</span>
          </div>
          <h1 className="page-title">Browse Medicines</h1>
          <p className="page-sub">{totalCount} medicines available</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="d-flex gap-12 mb-32">
            <div style={{ flex: 1, position: 'relative' }}>
              <i className="bi bi-search" style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--gray-400)', fontSize: 16
              }}></i>
              <input
                type="text"
                className="form-control"
                placeholder="Search medicines by name, description..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{ paddingLeft: 42 }}
              />
            </div>
            <button type="submit" className="btn btn-primary">
              <i className="bi bi-search"></i> Search
            </button>
          </form>

          <div className="shop-layout">
            {/* Sidebar Filters */}
            <aside>
              <div className="filter-card">
                <div className="filter-header">
                  <span><i className="bi bi-funnel" style={{ marginRight: 8 }}></i>Filters</span>
                  <button className="clear-btn" onClick={handleClearFilters}>Clear All</button>
                </div>

                {/* Category Filter */}
                <div className="filter-section">
                  <span className="filter-label">Category</span>
                  <div className="filter-options">
                    <label className="filter-option">
                      <input
                        type="radio"
                        name="category"
                        checked={currentCategory === ''}
                        onChange={() => handleCategoryChange('')}
                      />
                      All Categories
                    </label>
                    {categories.map((cat) => (
                      <label key={cat.id} className="filter-option">
                        <input
                          type="radio"
                          name="category"
                          checked={currentCategory === String(cat.id)}
                          onChange={() => handleCategoryChange(String(cat.id))}
                        />
                        {cat.name}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="filter-section">
                  <span className="filter-label">Price Range (Rs.)</span>
                  <div className="price-inputs">
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      min="0"
                    />
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      min="0"
                    />
                  </div>
                  <button
                    className="btn btn-outline btn-sm btn-block mt-12"
                    onClick={handlePriceFilter}
                  >
                    Apply Price
                  </button>
                </div>

                {/* Prescription Filter */}
                <div className="filter-section">
                  <span className="filter-label">Prescription</span>
                  <div className="filter-options">
                    <label className="filter-option">
                      <input
                        type="radio"
                        name="prescription"
                        checked={currentPrescription === ''}
                        onChange={() => handlePrescriptionChange('')}
                      />
                      All
                    </label>
                    <label className="filter-option">
                      <input
                        type="radio"
                        name="prescription"
                        checked={currentPrescription === 'false'}
                        onChange={() => handlePrescriptionChange('false')}
                      />
                      Over the Counter
                    </label>
                    <label className="filter-option">
                      <input
                        type="radio"
                        name="prescription"
                        checked={currentPrescription === 'true'}
                        onChange={() => handlePrescriptionChange('true')}
                      />
                      Prescription Required
                    </label>
                  </div>
                </div>
              </div>
            </aside>

            {/* Medicines Grid */}
            <div>
              {loading ? (
                <div className="loading-spinner"><div className="spinner"></div></div>
              ) : medicines.length > 0 ? (
                <>
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

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="pagination">
                      <button
                        className="page-btn"
                        disabled={currentPage <= 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                      >
                        <i className="bi bi-chevron-left"></i>
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => {
                          if (totalPages <= 7) return true;
                          if (p === 1 || p === totalPages) return true;
                          if (Math.abs(p - currentPage) <= 1) return true;
                          return false;
                        })
                        .reduce((acc, p, i, arr) => {
                          if (i > 0 && p - arr[i - 1] > 1) {
                            acc.push('...' + p);
                          }
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((p) => {
                          if (typeof p === 'string') {
                            return <span key={p} className="page-btn" style={{ border: 'none', cursor: 'default' }}>…</span>;
                          }
                          return (
                            <button
                              key={p}
                              className={`page-btn ${currentPage === p ? 'active' : ''}`}
                              onClick={() => handlePageChange(p)}
                            >
                              {p}
                            </button>
                          );
                        })}
                      <button
                        className="page-btn"
                        disabled={currentPage >= totalPages}
                        onClick={() => handlePageChange(currentPage + 1)}
                      >
                        <i className="bi bi-chevron-right"></i>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">
                    <i className="bi bi-search"></i>
                  </div>
                  <h3>No Medicines Found</h3>
                  <p>Try adjusting your search or filter criteria to find what you need.</p>
                  <button className="btn btn-primary" onClick={handleClearFilters}>
                    <i className="bi bi-x-circle"></i> Clear All Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
