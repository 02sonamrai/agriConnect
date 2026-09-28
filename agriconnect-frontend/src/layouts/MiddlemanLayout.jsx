import React, { useContext, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LayoutDashboard, UserPlus, Users, LogOut, Menu, X, User, ShieldCheck } from 'lucide-react';

const MiddlemanLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/middleman/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Add Farmer',
      path: '/middleman/farmers/add',
      icon: UserPlus,
    },
    {
      name: 'Collected Farmers',
      path: '/middleman/farmers',
      icon: Users,
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans selection:bg-emerald-500 selection:text-slate-900">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 p-6 flex-shrink-0">
        {/* Brand */}
        <div className="flex items-center space-x-3 mb-8">
          <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <span className="font-extrabold text-xl bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              AgriConnect
            </span>
            <span className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              Coordinator Portal
            </span>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 mb-8 flex items-center space-x-3">
          <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 text-emerald-400 shrink-0">
            <User className="h-5 w-5" />
          </div>
          <div className="truncate">
            <p className="font-bold text-sm text-white truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-emerald-400/90 font-medium truncate">Field Coordinator</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-grow space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition font-medium text-sm ${
                  active
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
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

      {/* Main Layout Area */}
      <div className="flex-grow flex flex-col min-w-0">
        {/* Mobile Navigation Header */}
        <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center md:hidden">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-lg bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Field Coordinator
            </span>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-slate-400 hover:text-white p-2 rounded-lg"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </header>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/95 flex flex-col p-6 md:hidden">
            <div className="flex justify-between items-center mb-8">
              <span className="font-extrabold text-xl bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Coordinator Menu
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-lg"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <nav className="space-y-4 mb-8">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-4 rounded-xl transition font-semibold ${
                      active ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
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

        {/* Viewport content */}
        <main className="flex-grow p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MiddlemanLayout;
