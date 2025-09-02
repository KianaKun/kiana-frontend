# KianaKey Frontend

This is the **frontend** for **KianaKey**, a digital game key e-commerce platform built with [Next.js 15](https://nextjs.org) and [TypeScript](https://www.typescriptlang.org/).  
It connects to the **KianaKey Backend** (Express.js + MySQL) to provide product listings, cart management, checkout flow, and admin/customer dashboards.

## ✨ Features
- 🎮 Browse Steam games with prices in IDR.
- 🛒 Shopping cart with quantity management.
- 💳 Local payment methods (QRIS, BCA, SeaBank, etc.).
- 📩 Steam key delivery via WhatsApp/email.
- 🔒 Session-based authentication.
- 📱 Responsive UI with Tailwind CSS.
- 🎨 Animated UI using Framer Motion.

---

## 🚀 Getting Started

### 1. Install dependencies
```
npm install
# or
yarn install
# or
pnpm install
```
### 2. Configure environment variables

Create a .env.local file in the root folder:
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```
### 3. Run the development server
```
nodemon run dev
```

### 📂 Project Structure
```
kiana-frontend/
├── app/                  # App router pages
├── components/           # Reusable UI components
├── ui/                   # UI layout elements (Navbar, Footer, etc.)
├── public/               # Static assets
├── styles/               # Global styles
└── ...
```
