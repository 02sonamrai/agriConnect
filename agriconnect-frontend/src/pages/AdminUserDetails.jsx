import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminService } from '../services/api';
import {
  ArrowLeft,
  AlertCircle,
  Mail,
  Phone,
  User,
  ShieldCheck,
  CalendarDays,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

const formatDate = (value) =>
  value ? new Date(value).toLocaleString() : 'Not recorded';

/**
 * Read-only detail view for a single account.
 *
 * The admin list endpoint already returns every field rendered here, so this
 * reuses it rather than adding a new backend endpoint — the detail is selected
 * by id from the same payload the dashboard table uses.
 */
const AdminUserDetails = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const users = await adminService.getUsers();
        if (cancelled) return;
        const match = users.find((candidate) => String(candidate.id) === String(id));
        if (!match) {
          setError('That account could not be found.');
        } else {
          setUser(match);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.message || 'Could not load this account.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const details = user
    ? [
        { label: 'Account ID', value: user.id, icon: User },
        { label: 'Email address', value: user.email, icon: Mail },
        { label: 'Phone number', value: user.phoneNumber || 'Not recorded', icon: Phone },
        { label: 'Role', value: (user.role || '').replace(/^ROLE_/, ''), icon: ShieldCheck },
        {
          label: 'Status',
          value: user.isActive ? 'Active' : 'Inactive',
          icon: user.isActive ? ToggleRight : ToggleLeft,
        },
        { label: 'Registered', value: formatDate(user.createdAt), icon: CalendarDays },
        { label: 'Last updated', value: formatDate(user.updatedAt), icon: CalendarDays },
      ]
    : [];

  return (
    <div className="space-y-8">
      <Link
        to="/admin/dashboard"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-lime-400"
      >
        <ArrowLeft className="h-4 w-4" /> Back to overview
      </Link>

      {error && (
        <div role="alert" className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
          <AlertCircle className="h-5 w-5 flex-shrink-0" /> {error}
        </div>
      )}

      {loading && <p className="text-sm text-slate-400">Loading account…</p>}

      {!loading && user && (
        <>
          <header>
            <p className="text-sm font-semibold uppercase tracking-widest text-lime-400">Administration</p>
            <h1 className="mt-2 text-3xl font-black text-white">
              {user.firstName} {user.lastName}
            </h1>
            <p className="mt-2 text-sm text-slate-400">Account record #{user.id}</p>
          </header>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {details.map(({ label, value, icon: Icon }) => (
              <article key={label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-700">
                <div className="flex items-center gap-2 text-slate-400">
                  <Icon className="h-4 w-4 text-lime-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
                </div>
                <p className="mt-3 break-words text-sm font-bold text-white">{value}</p>
              </article>
            ))}
          </section>

          <p className="text-xs text-slate-500">
            Read-only view. Account changes are handled outside the admin console.
          </p>
        </>
      )}
    </div>
  );
};

export default AdminUserDetails;
