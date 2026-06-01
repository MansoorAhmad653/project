import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div className="brand-icon"><i className="bi bi-heart-pulse-fill"></i></div>
              <span className="brand-name" style={{ color: 'white' }}>Medi<span className="accent">Cart</span></span>
            </div>
            <p className="footer-brand-desc">
              Your trusted online pharmacy delivering genuine medicines with care.
              Fast delivery, verified prescriptions, and 24/7 support across Pakistan.
            </p>
            <div className="social-links">
              <a href="#" className="social-link"><i className="bi bi-facebook"></i></a>
              <a href="#" className="social-link"><i className="bi bi-twitter-x"></i></a>
              <a href="#" className="social-link"><i className="bi bi-instagram"></i></a>
              <a href="#" className="social-link"><i className="bi bi-whatsapp"></i></a>
            </div>
          </div>

          <div>
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-links">
              <li><Link href="/shop">Browse Medicines</Link></li>
              <li><Link href="/prescriptions">Upload Prescription</Link></li>
              <li><Link href="/orders">Track Orders</Link></li>
              <li><Link href="/login">My Account</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-heading">Categories</h4>
            <ul className="footer-links">
              <li><Link href="/shop?category=pain-relief">Pain Relief</Link></li>
              <li><Link href="/shop?category=antibiotics">Antibiotics</Link></li>
              <li><Link href="/shop?category=vitamins-supplements">Vitamins</Link></li>
              <li><Link href="/shop?category=cold-flu">Cold & Flu</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-heading">Contact</h4>
            <ul className="footer-contact">
              <li><i className="bi bi-geo-alt"></i> Rawalpindi, Punjab, Pakistan</li>
              <li><i className="bi bi-telephone"></i> +92 300 000 0000</li>
              <li><i className="bi bi-envelope"></i> support@medicart.pk</li>
              <li><i className="bi bi-clock"></i> Mon - Sat: 9 AM - 10 PM</li>
            </ul>
          </div>
        </div>

        <hr className="footer-divider" />

        <div className="footer-bottom">
          <p className="footer-bottom-text">© 2024 MediCart. All rights reserved.</p>
          <p className="footer-bottom-text">Made with ❤️ in Pakistan</p>
        </div>
      </div>
    </footer>
  );
}
