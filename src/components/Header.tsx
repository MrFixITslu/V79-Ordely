import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, useCartStore } from '../store';
import { ShoppingCart, LogOut, Package } from 'lucide-react';

export function Header() {
  const { user, logout } = useAuthStore();
  const cartItems = useCartStore((state) => state.items);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-slate-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-teal-400 flex items-center gap-2">
              <Package className="w-6 h-6" />
              Ordely
            </Link>
          </div>
          <nav className="flex items-center gap-6">
            {user ? (
              <>
                <span className="text-sm text-slate-300">Welcome, {user.name}</span>
                {user.role === 'customer' && (
                  <>
                    <Link to="/customer" className="hover:text-teal-400 transition">Vendors</Link>
                    <Link to="/orders" className="hover:text-teal-400 transition">My Orders</Link>
                    <Link to="/cart" className="relative hover:text-teal-400 transition">
                      <ShoppingCart className="w-6 h-6" />
                      {cartItems.length > 0 && (
                        <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                        </span>
                      )}
                    </Link>
                  </>
                )}
                {user.role === 'vendor' && (
                  <>
                    <Link to="/vendor" className="hover:text-teal-400 transition">Dashboard</Link>
                    <Link to="/orders" className="hover:text-teal-400 transition">Orders</Link>
                  </>
                )}
                <button onClick={handleLogout} className="flex items-center gap-2 hover:text-red-400 transition">
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-teal-400 transition">Login</Link>
                <Link to="/register" className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg font-medium transition">Get Started</Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
