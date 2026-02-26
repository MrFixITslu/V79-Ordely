import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';
import { Header } from './components/Header';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { VendorDashboard } from './pages/VendorDashboard';
import { VendorStore } from './pages/VendorStore';
import { Cart } from './pages/Cart';
import { Orders } from './pages/Orders';

function ProtectedRoute({ children, role }: { children: React.ReactNode, role?: string }) {
  const user = useAuthStore((state) => state.user);
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return <>{children}</>;
}

export default function App() {
  const user = useAuthStore((state) => state.user);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={!user ? <Landing /> : (user.role === 'vendor' ? <Navigate to="/vendor" /> : <Navigate to="/customer" />)} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/customer" element={<ProtectedRoute role="customer"><CustomerDashboard /></ProtectedRoute>} />
            <Route path="/vendor/:id" element={<ProtectedRoute role="customer"><VendorStore /></ProtectedRoute>} />
            <Route path="/cart" element={<ProtectedRoute role="customer"><Cart /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            
            <Route path="/vendor" element={<ProtectedRoute role="vendor"><VendorDashboard /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
