# Source ERP - Frontend (Next.js)

The interactive dashboard and management interface for the Source Coconut ERP, built with Next.js and React.

## ✨ Features
- **📊 Real-time Analytics**: Financial overview and production charts using Recharts.
- **📜 Land EMI Ledger**: Dedicated payment tracking system for gudhagai leases with balance-due validation.
- **🚜 Module Management**: Full CRUD for Lands, Employees, Vehicles, and Sales.
- **🛠️ Harvesting Work Logs**: Assign field workers and track coconut counts per harvest.
- **👤 User Profile**: Personal account management, password updates, and avatar uploads.
- **📱 Responsive UI**: Mobile-friendly sidebar and horizontal card layouts.

## 🚀 Technology Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: Vanilla CSS (Modern CSS variables and Flexbox/Grid)
- **Visuals**: Recharts & React Icons
- **State/Auth**: JWT-based session management in LocalStorage

## 🛠️ Local Setup

1. **Clone and Enter Directory**:
   ```bash
   cd Source-frontend
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

## ☁️ Deployment

### Vercel (Recommended)
This project is optimized for Vercel. Simply link the repository to your Vercel account. Ensure the `NEXT_PUBLIC_API_BASE_URL` points to your deployed backend URL.

## 📁 Project Structure
- `/app`: Next.js pages and routes.
- `/components`: Reusable UI components (AppShell, Forms, Charts).
- `/lib`: API client, session management, and utility functions.
- `/public`: Static assets and icons.

## 🛡️ License
Private Repository.
