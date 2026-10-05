import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import { Mail, Lock, ShieldAlert, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';

const Login = () => {
  const { login, isAuthenticated, user } = useContext(AuthContext);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      const userRole = user?.role || '';
      if (userRole === 'ROLE_FARMER' || userRole === 'FARMER') {
        navigate('/farmer/dashboard');
      } else if (userRole === 'ROLE_BUYER' || userRole === 'BUYER') {
        navigate('/marketplace');
      } else if (userRole === 'ROLE_MIDDLEMAN' || userRole === 'MIDDLEMAN') {
        navigate('/middleman/dashboard');
      } else if (userRole === 'ROLE_ADMIN' || userRole === 'ADMIN') {
        navigate('/admin/dashboard');
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
      } else if (userRole === 'ROLE_MIDDLEMAN' || userRole === 'MIDDLEMAN') {
        navigate('/middleman/dashboard');
      } else if (userRole === 'ROLE_ADMIN' || userRole === 'ADMIN') {
        navigate('/admin/dashboard');
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
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to reach your AgriConnect dashboard"
    >
      <form className="stagger space-y-5" onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="auth-error animate-scale-in" role="alert">
            <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label htmlFor="email" className="auth-label">
            Email Address
          </label>
          <div className="relative">
            <Mail className="auth-icon h-5 w-5 peer-focus-icon peer" aria-hidden="true" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="auth-input peer pl-10 pr-4"
              placeholder="name@example.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="auth-label">
            Password
          </label>
          <div className="relative">
            <Lock className="auth-icon h-5 w-5 peer-focus-icon peer" aria-hidden="true" />
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
              className="auth-input peer pl-10 pr-11"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition-all duration-200
                hover:text-lime-600 focus:outline-none hover:scale-110 active:scale-95
                dark:hover:text-lime-400"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Eye className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <div className="pt-1">
          <button type="submit" disabled={isSubmitting} className="auth-button group">
            {isSubmitting ? (
              <>
                <span className="auth-button-spinner" aria-hidden="true" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-8 border-t border-slate-200/80 pt-6 text-center text-sm text-slate-500 dark:border-slate-700/70 dark:text-slate-400">
        <span>New to AgriConnect? </span>
        <Link to="/register" className="auth-link">
          Create an account
        </Link>
      </div>
    </AuthLayout>
  );
};

export default Login;
