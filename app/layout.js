import './globals.css';
import { AuthProvider, CartProvider, ToastProvider } from './providers';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

export const metadata = {
  title: 'MediCart — Online Pharmacy & Medicine Delivery',
  description: 'Your trusted online pharmacy for genuine medicines, prescription management, and fast delivery across Pakistan. Browse medicines, upload prescriptions, and track orders.',
  keywords: 'online pharmacy, medicine delivery, prescription upload, MediCart, Pakistan pharmacy',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
      </head>
      <body>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <Navbar />
              <main>{children}</main>
              <Footer />
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
