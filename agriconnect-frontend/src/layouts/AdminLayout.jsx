import React, { useContext } from 'react';
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Leaf, LogOut, LayoutDashboard, Scale } from 'lucide-react';

const AdminLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { name: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Market Prices', path: '/admin/market-prices', icon: Scale },
  ];
 const isActive = (path) => location.pathname === path;

  return <div className="min-h-screen bg-slate-950 font-sans text-slate-100">
    <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-4">
      <div className="flex items-center gap-3"><Leaf className="h-6 w-6 text-lime-400" /><span className="text-lg font-extrabold">AgriConnect <span className="text-slate-500">Admin</span></span></div>
      <div className="flex items-center gap-4 text-sm"><span className="hidden text-slate-400 sm:inline">{user?.firstName} {user?.lastName}</span><button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-rose-300 hover:bg-rose-500/10"><LogOut className="h-4 w-4" />Sign out</button></div>
    </header>
    <nav className="flex items-center gap-2 border-b border-slate-800 bg-slate-900/60 px-6 py-2">
      {navItems.map(({ name, path, icon: Icon }) => <Link
        key={path}
        to={path}
        className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${isActive(path) ? 'bg-lime-500/15 text-lime-300' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
      >
        <Icon className="h-4 w-4" />{name}
      </Link>)}
    </nav>
    <main className="mx-auto max-w-7xl p-6 md:p-10"><Outlet /></main>
  </div>;
};


export default AdminLayout;
