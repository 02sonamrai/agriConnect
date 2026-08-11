import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Leaf, User, Mail, Lock, Phone, ShieldAlert, ArrowRight } from 'lucide-react';

const Register = () => {
  const { register, isAuthenticated, isFarmer } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    role: 'FARMER', // Default to farmer registration
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      if (isFarmer) {
        navigate('/farmer/dashboard');
      } else {
        navigate('/marketplace');
      }
    }
  }, [isAuthenticated, isFarmer, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phoneNumber || !formData.password) {
      setError('Please fill in all details.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await register(formData);
      const userRole = data.role || '';
      if (userRole === 'ROLE_BUYER' || userRole === 'BUYER') {
        navigate('/marketplace');
      } else {
        navigate('/farmer/dashboard');
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        (err.response?.data?.errors ? Object.values(err.response.data.errors).join(', ') : null) ||
        'Registration failed. Email or phone number might already be in use.'
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
        <h2 className="text-3xl font-black tracking-tight text-white">Create Account</h2>
        <p className="mt-2 text-sm text-slate-400">
          Join AgriConnect as a Farmer and sell crops directly
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 shadow-2xl rounded-3xl sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-start space-x-3 text-rose-400 text-sm">
                <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="h-4.5 w-4.5" />
                  </div>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="block w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 text-slate-100 placeholder-slate-600 transition text-sm"
                    placeholder="Ramesh"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="block w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 text-slate-100 placeholder-slate-600 transition text-sm"
                  placeholder="Kumar"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 text-slate-100 placeholder-slate-600 transition text-sm"
                  placeholder="ramesh@gmail.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Phone className="h-4.5 w-4.5" />
                </div>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  required
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="block w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 text-slate-100 placeholder-slate-600 transition text-sm"
                  placeholder="9876543210"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Password (min 6 characters)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4.5 w-4.5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 text-slate-100 placeholder-slate-600 transition text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Register As
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="block w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 text-slate-100 transition text-sm"
              >
                <option value="FARMER">Farmer (Sell crops)</option>
                <option value="BUYER">Buyer (Purchase crops)</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center space-x-2 py-3 px-4 bg-lime-600 hover:bg-lime-500 text-white font-bold rounded-xl transition shadow-lg shadow-lime-900/30 disabled:opacity-50 disabled:cursor-not-allowed group text-sm"
              >
                <span>{isSubmitting ? 'Registering...' : 'Register'}</span>
                {!isSubmitting && <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-800/80 pt-4 text-center text-sm text-slate-400">
            <span>Already have a farmer account? </span>
            <Link to="/login" className="font-semibold text-lime-400 hover:text-lime-300 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
