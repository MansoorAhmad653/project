# 💊 MediCart — Online Pharmacy & Medicine Delivery

A full-stack pharmacy web application built with **Next.js 15** and **Supabase PostgreSQL**, ready for deployment on **Netlify**.

## Features

- 🛒 **Browse & Search** — Filter medicines by category, price, prescription requirement
- 📋 **Prescription Management** — Upload prescriptions for pharmacist review
- 🛍️ **Shopping Cart** — Add medicines, adjust quantities, checkout
- 📦 **Order Tracking** — Visual status stepper (Confirmed → Packed → Dispatched → Delivered)
- 👤 **User Accounts** — Register, login, profile management
- 📊 **Admin Dashboard** — Analytics, order management, inventory tracking
- ⭐ **Reviews & Feedback** — Rate medicines and orders

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), React 19 |
| Backend | Next.js API Routes (Serverless) |
| Database | Supabase PostgreSQL |
| Auth | JWT Cookies + PBKDF2-SHA256 |
| Charts | Chart.js + react-chartjs-2 |
| Hosting | Netlify |

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

Create a `.env.local` file:

```env
DB_HOST=your-supabase-host
DB_PORT=6543
DB_NAME=postgres
DB_USER=your-db-user
DB_PASSWORD=your-db-password
JWT_SECRET=your-jwt-secret
```

## Deploy to Netlify

1. Push to GitHub
2. Connect repo in [Netlify Dashboard](https://app.netlify.com)
3. Add environment variables in Site Settings
4. Deploy — build settings auto-detected from `netlify.toml`

## Project Structure

```
medicart/
├── app/
│   ├── api/           # 14 serverless API routes
│   ├── components/    # Navbar, Footer
│   ├── shop/          # Medicine list & detail
│   ├── cart/          # Shopping cart
│   ├── checkout/      # Order placement
│   ├── orders/        # Order history & tracking
│   ├── prescriptions/ # Prescription upload
│   ├── dashboard/     # Admin analytics
│   ├── login/         # Authentication
│   ├── signup/        # Registration
│   ├── profile/       # User profile
│   ├── globals.css    # Design system
│   ├── layout.js      # Root layout
│   └── providers.js   # Auth, Cart, Toast contexts
├── lib/
│   ├── db.js          # PostgreSQL connection pool
│   └── auth.js        # JWT + password verification
├── netlify.toml       # Netlify build config
└── package.json
```

---

Made with ❤️ in Pakistan
