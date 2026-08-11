import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Leaf, Mail, Lock, ShieldAlert, ArrowRight } from 'lucide-react';

const Login = () => {
  const { login, isAuthenticated, isFarmer, user } = useContext(AuthContext);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      const userRole = user?.role || '';
      if (userRole === 'ROLE_FARMER' || userRole === 'FARMER') {
        navigate('/farmer/dashboard');
      } else if (userRole === 'ROLE_BUYER' || userRole === 'BUYER') {
        navigate('/marketplace');
      } else {
        setError('Unknown user role.');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Please provide email and password.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const data = await login(formData);
      const userRole = data.role || '';
      if (userRole === 'ROLE_FARMER' || userRole === 'FARMER') {
        navigate('/farmer/dashboard');
      } else if (userRole === 'ROLE_BUYER' || userRole === 'BUYER') {
        navigate('/marketplace');
      } else {
        setError('Access denied: Unknown user role.');
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || 'Login failed. Please check credentials and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-lime-500 selection:text-slate-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex bg-lime-500/10 p-3 rounded-2xl border border-lime-500/20 mb-4 text-lime-400">
          <Leaf className="h-8 w-8 animate-pulse" />
        </div>
        <h2 className="text-3xl font-black tracking-tight text-white">Welcome Back</h2>
        <p className="mt-2 text-sm text-slate-400">
          Access your AgriConnect Farmer Dashboard
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 shadow-2xl rounded-3xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-start space-x-3 text-rose-400 text-sm">
                <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 text-slate-100 placeholder-slate-600 transition text-sm"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 text-slate-100 placeholder-slate-600 transition text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center space-x-2 py-3.5 px-4 bg-lime-600 hover:bg-lime-500 text-white font-bold rounded-xl transition shadow-lg shadow-lime-900/30 disabled:opacity-50 disabled:cursor-not-allowed group text-sm"
              >
                <span>{isSubmitting ? 'Authenticating...' : 'Sign In'}</span>
                {!isSubmitting && <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />}
              </button>
            </div>
          </form>

          <div className="mt-8 border-t border-slate-800/80 pt-6 text-center text-sm text-slate-400">
            <span>Don't have a farmer account? </span>
            <Link to="/register" className="font-semibold text-lime-400 hover:text-lime-300 hover:underline">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
