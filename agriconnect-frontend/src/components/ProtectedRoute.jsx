import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ShieldAlert, LogOut } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { user, loading, isAuthenticated, isFarmer, logout } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-slate-100">
        <div className="relative flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-lime-500"></div>
          <div className="absolute h-10 w-10 bg-slate-900 rounded-full"></div>
        </div>
        <p className="mt-4 text-slate-400 font-medium tracking-wide">Securing session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isFarmer) {
    return (
      <div className="min-h-screen bg-slate-950 flex justify-center items-center px-6 selection:bg-rose-500 selection:text-slate-900">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="bg-rose-500/10 p-4 rounded-full w-fit mx-auto mb-6 border border-rose-500/20">
            <ShieldAlert className="h-12 w-12 text-rose-500 animate-bounce" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight mb-2">Access Denied</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Only users registered with the <strong>FARMER</strong> role are authorized to access the Farmer marketplace dashboard. Your current role is <strong>{(user.role || '').replace('ROLE_', '')}</strong>.
          </p>
          <div className="flex flex-col space-y-3">
            <button
              onClick={logout}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 px-6 rounded-xl transition flex items-center justify-center space-x-2 w-full"
            >
              <LogOut className="h-4 w-4" />
              <span>Disconnect & Change Account</span>
            </button>
            <Navigate to="/" />
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
