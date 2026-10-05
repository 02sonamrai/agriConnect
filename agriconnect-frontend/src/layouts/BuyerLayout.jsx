import React, { useContext, useState, useEffect, useCallback } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';
import { cartService } from '../services/api';
import { Leaf, LogOut, Menu, X, User, ShoppingBag, ShoppingCart, Receipt, UserCog, Scale } from 'lucide-react';

const BuyerLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // The layout owns the cart so the sidebar badge and every nested page stay in sync.
  const [cart, setCart] = useState(null);

  const refreshCart = useCallback(async () => {
    try {
      const data = await cartService.getCart();
      setCart(data);
      return data;
    } catch (err) {
      setCart(null);
      return null;
    }
  }, []);

  const addToCart = useCallback(async (cropId, quantity) => {
    const data = await cartService.addItem(cropId, quantity);
    setCart(data);
    return data;
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const cartCount = cart?.itemCount || 0;

  const menuItems = [
    {
      name: 'Marketplace',
      path: '/marketplace',
      icon: ShoppingBag,
      exact: true,
    },
    {
      name: 'My Cart',
      path: '/marketplace/cart',
      icon: ShoppingCart,
      badge: cartCount,
    },
    {
      name: 'My Orders',
      path: '/marketplace/orders',
      icon: Receipt,
      prefix: true,
    },
    {
      name: 'Edit Profile',
      path: '/marketplace/profile',
      icon: UserCog,
    },
    {
      name: 'Market Prices',
      path: '/marketplace/market-prices',
      icon: Scale,
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    if (item.prefix) return location.pathname === item.path || location.pathname.startsWith(item.path + '/');
    return location.pathname === item.path;
  };

  const renderNav = (item, mobile = false) => {
    const Icon = item.icon;
    const active = isActive(item);
    return (
      <Link
        key={item.name}
        to={item.path}
        onClick={mobile ? () => setMobileMenuOpen(false) : undefined}
        className={`flex items-center justify-between space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ease-in-out font-medium text-sm ${
          active
            ? 'bg-lime-600 text-white shadow-lg shadow-lime-900/20 hover:shadow-lime-900/30'
            : 'text-slate-400 hover:bg-slate-800/50 hover:text-white hover:scale-[1.01]'
        } ${mobile ? 'py-4 font-semibold text-base' : ''}`}
      >
        <span className="flex items-center space-x-3">
          <Icon className={mobile ? 'h-6 w-6' : 'h-5 w-5'} />
          <span>{item.name}</span>
        </span>
        {item.badge > 0 && (
          <span
            className={`flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-full text-[11px] font-black ${
              active ? 'bg-white text-lime-700' : 'bg-lime-500/15 text-lime-400 border border-lime-500/20'
            }`}
          >
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans animate-fade-in">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 p-6 flex-shrink-0">
        {/* Brand */}
        <div className="flex items-center space-x-3 mb-8">
          <div className="bg-lime-500/10 p-2 rounded-xl border border-lime-500/20">
            <Leaf className="h-6 w-6 text-lime-400" />
          </div>
          <span className="font-extrabold text-xl bg-gradient-to-r from-lime-400 to-emerald-400 bg-clip-text text-transparent">
            AgriConnect
          </span>
        </div>

        {/* User Card */}
        <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 mb-4 flex items-center space-x-3">
          <div className="bg-lime-500/10 p-2.5 rounded-xl border border-lime-500/20 text-lime-400">
            <User className="h-5 w-5" />
          </div>
          <div className="truncate">
            <p className="font-bold text-sm text-white truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-slate-500 truncate">Buyer</p>
          </div>
        </div>

        {/* Order confirmations, shipments and deliveries */}
        <div className="mb-8">
          <NotificationBell />
        </div>

        {/* Navigation Menu */}
        <nav className="flex-grow space-y-2">
          {menuItems.map((item) => renderNav(item))}
        </nav>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 rounded-xl transition font-medium text-sm text-rose-400 hover:bg-rose-500/10 w-full mt-auto"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </aside>

      {/* Header and Mobile Menu */}
      <div className="flex-grow flex flex-col min-w-0">
        <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center md:hidden">
          <div className="flex items-center space-x-3">
            <div className="bg-lime-500/10 p-2 rounded-xl border border-lime-500/20">
              <Leaf className="h-5 w-5 text-lime-400" />
            </div>
            <span className="font-extrabold text-lg bg-gradient-to-r from-lime-400 to-emerald-400 bg-clip-text text-transparent">
              AgriConnect
            </span>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-slate-400 hover:text-white p-2 rounded-lg"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </header>

        {/* Mobile Sidebar overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/95 flex flex-col p-6 md:hidden">
            <div className="flex justify-between items-center mb-8">
              <span className="font-extrabold text-xl bg-gradient-to-r from-lime-400 to-emerald-400 bg-clip-text text-transparent">
                AgriConnect Menu
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-lg"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <nav className="space-y-4 mb-8">
              {menuItems.map((item) => renderNav(item, true))}
            </nav>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="flex items-center space-x-3 px-4 py-4 rounded-xl transition font-semibold text-rose-400 hover:bg-rose-500/10 w-full mt-auto"
            >
              <LogOut className="h-6 w-6" />
              <span>Logout</span>
            </button>
          </div>
        )}

        {/* Page Content viewport */}
        <main className="flex-grow p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
          <Outlet context={{ cart, refreshCart, addToCart }} />
        </main>
      </div>
    </div>
  );
};

export default BuyerLayout;
