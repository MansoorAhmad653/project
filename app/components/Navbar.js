'use client';

import Link from 'next/link';
import { useAuth } from '../providers';
import { useCart } from '../providers';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path) => pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-inner">
          <Link href="/" className="brand-logo">
            <div className="brand-icon"><i className="bi bi-heart-pulse-fill"></i></div>
            <div className="brand-text">
              <span className="brand-name">Medi<span className="accent">Cart</span></span>
              <span className="brand-tagline">Online Pharmacy</span>
            </div>
          </Link>

          <div className={`nav-links ${mobileOpen ? 'show' : ''}`}>
            <Link href="/" className={`nav-link ${isActive('/')}`}>
              <i className="bi bi-house"></i> Home
            </Link>
            <Link href="/shop" className={`nav-link ${isActive('/shop')}`}>
              <i className="bi bi-grid"></i> Medicines
            </Link>
            {user && (
              <>
                <Link href="/orders" className={`nav-link ${isActive('/orders')}`}>
                  <i className="bi bi-box-seam"></i> Orders
                </Link>
                <Link href="/prescriptions" className={`nav-link ${isActive('/prescriptions')}`}>
                  <i className="bi bi-file-earmark-medical"></i> Prescriptions
                </Link>
              </>
            )}
            {user && (user.role === 'admin' || user.is_staff) && (
              <Link href="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>
                <i className="bi bi-speedometer2"></i> Dashboard
              </Link>
            )}
          </div>

          <div className="nav-actions">
            <Link href="/cart" className="cart-btn" title="Shopping Cart">
              <i className="bi bi-cart3"></i>
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>

            {user ? (
              <div className="user-menu" ref={dropdownRef}>
                <button
                  className="user-btn"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <span className="user-avatar">
                    {(user.name || user.email || '?')[0].toUpperCase()}
                  </span>
                  <span>{user.name || user.email?.split('@')[0]}</span>
                  <i className={`bi bi-chevron-${dropdownOpen ? 'up' : 'down'}`} style={{ fontSize: 10 }}></i>
                </button>
                <div className={`dropdown-menu ${dropdownOpen ? 'show' : ''}`}>
                  <div className="dropdown-header">
                    {user.email}
                  </div>
                  <Link href="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <i className="bi bi-person"></i> My Profile
                  </Link>
                  <Link href="/orders" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <i className="bi bi-box-seam"></i> My Orders
                  </Link>
                  <Link href="/prescriptions" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <i className="bi bi-file-medical"></i> Prescriptions
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button
                    className="dropdown-item danger"
                    onClick={() => { logout(); setDropdownOpen(false); }}
                  >
                    <i className="bi bi-box-arrow-right"></i> Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link href="/login" className="btn btn-primary btn-sm">
                <i className="bi bi-box-arrow-in-right"></i> Login
              </Link>
            )}

            <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
              <i className={`bi bi-${mobileOpen ? 'x-lg' : 'list'}`}></i>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
