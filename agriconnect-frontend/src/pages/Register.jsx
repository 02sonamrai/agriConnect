import React, { useState, useContext, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import {
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  ShieldAlert,
  ArrowRight,
  Eye,
  EyeOff,
  Sprout,
  ShoppingBasket,
  ClipboardList,
} from 'lucide-react';

const ROLE_OPTIONS = [
  {
    value: 'FARMER',
    label: 'Farmer',
    hint: 'List and sell your crops',
    icon: Sprout,
  },
  {
    value: 'BUYER',
    label: 'Buyer',
    hint: 'Browse the marketplace',
    icon: ShoppingBasket,
  },
  {
    value: 'MIDDLEMAN',
    label: 'Coordinator',
    hint: 'Record farmers in the field',
    icon: ClipboardList,
  },
];

/** Cheap heuristic strength read-out so users get feedback before submitting. */
const scorePassword = (value) => {
  let score = 0;
  if (value.length >= 6) score += 1;
  if (value.length >= 10) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  return Math.min(score, 4);
};

const STRENGTH_LABELS = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];

const STRENGTH_STYLES = [
  'w-0 bg-slate-300 dark:bg-slate-700',
  'w-1/4 bg-rose-500',
  'w-2/4 bg-amber-500',
  'w-3/4 bg-lime-500',
  'w-full bg-emerald-500',
];

const Register = () => {
  const { register, isAuthenticated, isFarmer } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
    password: '',
    role: 'FARMER',
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  const strength = useMemo(() => scorePassword(formData.password), [formData.password]);
  const showStrength = formData.password.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

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
      } else if (userRole === 'ROLE_MIDDLEMAN' || userRole === 'MIDDLEMAN') {
        navigate('/middleman/dashboard');
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
    <AuthLayout
      title="Create Account"
      subtitle="Join AgriConnect and connect directly with the market"
    >
      <form className="stagger space-y-5" onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="auth-error animate-scale-in" role="alert">
            <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="auth-label">
              First Name
            </label>
            <div className="relative">
              <User className="auth-icon h-[18px] w-[18px] peer-focus-icon peer" aria-hidden="true" />
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                value={formData.firstName}
                onChange={handleChange}
                className="auth-input peer pl-9 pr-3"
                placeholder="Ramesh"
              />
            </div>
          </div>

          <div>
            <label htmlFor="lastName" className="auth-label">
              Last Name
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              value={formData.lastName}
              onChange={handleChange}
              className="auth-input px-3"
              placeholder="Kumar"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="auth-label">
            Email Address
          </label>
          <div className="relative">
            <Mail className="auth-icon h-[18px] w-[18px] peer-focus-icon peer" aria-hidden="true" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="auth-input peer pl-9 pr-3"
              placeholder="ramesh@gmail.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="phoneNumber" className="auth-label">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="auth-icon h-[18px] w-[18px] peer-focus-icon peer" aria-hidden="true" />
            <input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              autoComplete="tel"
              required
              value={formData.phoneNumber}
              onChange={handleChange}
              className="auth-input peer pl-9 pr-3"
              placeholder="9876543210"
            />
          </div>
        </div>

        {/* Delivery address. Optional, and only used for buyers - it is copied onto each
            order at checkout so a seller knows where to deliver. */}
        {formData.role === 'BUYER' && (
          <>
            <div>
              <label htmlFor="addressLine" className="auth-label">
                Address
              </label>
              <div className="relative">
                <MapPin className="auth-icon h-[18px] w-[18px] peer-focus-icon peer" aria-hidden="true" />
                <input
                  id="addressLine"
                  name="addressLine"
                  type="text"
                  autoComplete="street-address"
                  maxLength={200}
                  value={formData.addressLine}
                  onChange={handleChange}
                  className="auth-input peer pl-9 pr-3"
                  placeholder="Flat 3, Shivaji Nagar"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="city" className="auth-label">
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  autoComplete="address-level2"
                  maxLength={60}
                  value={formData.city}
                  onChange={handleChange}
                  className="auth-input"
                  placeholder="Pune"
                />
              </div>

              <div>
                <label htmlFor="state" className="auth-label">
                  State
                </label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  autoComplete="address-level1"
                  maxLength={60}
                  value={formData.state}
                  onChange={handleChange}
                  className="auth-input"
                  placeholder="Maharashtra"
                />
              </div>

              <div>
                <label htmlFor="pincode" className="auth-label">
                  Pincode
                </label>
                <input
                  id="pincode"
                  name="pincode"
                  type="text"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={10}
                  value={formData.pincode}
                  onChange={handleChange}
                  className="auth-input"
                  placeholder="411005"
                />
              </div>
            </div>
          </>
        )}

        <div>
          <label htmlFor="password" className="auth-label">
            Password <span className="normal-case tracking-normal text-slate-400">(min 6 characters)</span>
          </label>
          <div className="relative">
            <Lock className="auth-icon h-[18px] w-[18px] peer-focus-icon peer" aria-hidden="true" />
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              className="auth-input peer pl-9 pr-11"
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

          {/* Strength meter animates its width as requirements are met. */}
          <div
            className={`mt-2.5 grid transition-all duration-500 ease-out ${
              showStrength ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            }`}
          >
            <div className="overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${STRENGTH_STYLES[strength]}`}
                  />
                </div>
                <span className="w-14 shrink-0 text-right text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {showStrength ? STRENGTH_LABELS[strength] : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ---- Role picker --------------------------------------------- */}
        <fieldset>
          <legend className="auth-label">Register As</legend>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {ROLE_OPTIONS.map(({ value, label, hint, icon: Icon }) => {
              const isActive = formData.role === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, role: value }))}
                  aria-pressed={isActive}
                  className={`group relative flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left
                    transition-all duration-300 ease-out
                    hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-lime-500/30 active:translate-y-0 active:scale-[0.98]
                    ${
                      isActive
                        ? 'border-lime-500 bg-lime-500/10 shadow-md shadow-lime-500/15 dark:bg-lime-500/10'
                        : 'border-slate-200 bg-white/60 hover:border-lime-400 hover:bg-white dark:border-slate-700 dark:bg-slate-950/40 dark:hover:border-slate-600 dark:hover:bg-slate-950/70'
                    }`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300
                      ${
                        isActive
                          ? 'bg-lime-500 text-white shadow-sm scale-100'
                          : 'bg-slate-100 text-slate-500 group-hover:scale-110 group-hover:bg-lime-500/15 group-hover:text-lime-600 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:text-lime-400'
                      }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {label}
                  </span>
                  <span className="text-[11px] leading-tight text-slate-500 dark:text-slate-400">
                    {hint}
                  </span>
                </button>
              );
            })}
          </div>
          {/* Kept in the DOM for native form semantics and autofill parity. */}
          <input type="hidden" name="role" value={formData.role} />
        </fieldset>

        <div className="pt-1">
          <button type="submit" disabled={isSubmitting} className="auth-button group">
            {isSubmitting ? (
              <>
                <span className="auth-button-spinner" aria-hidden="true" />
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-6 border-t border-slate-200/80 pt-5 text-center text-sm text-slate-500 dark:border-slate-700/70 dark:text-slate-400">
        <span>Already have an account? </span>
        <Link to="/login" className="auth-link">
          Sign In
        </Link>
      </div>
    </AuthLayout>
  );
};

export default Register;
