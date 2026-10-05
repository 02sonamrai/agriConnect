import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bell, BellOff, Check, CheckCheck, Loader2 } from 'lucide-react';
import { notificationService, getErrorMessage } from '../services/api';
import { NOTIFICATIONS_CHANGED } from '../components/NotificationBell';

const ROLE_PATH = {
  BUYER: '/marketplace/orders',
  FARMER: '/farmer/orders',
  MIDDLEMAN: '/middleman/orders',
};

const ICON_BY_TYPE = {
  ORDER_PLACED: '🛒',
  ORDER_CONFIRMED: '✅',
  ORDER_SHIPPED: '🚚',
  ORDER_DELIVERED: '📦',
  ORDER_CANCELLED: '✖️',
  ORDER_REJECTED: '⚠️',
};

const HOME_PATH = {
  BUYER: '/marketplace/orders',
  FARMER: '/farmer/dashboard',
  MIDDLEMAN: '/middleman/dashboard',
};

const formatWhen = (value) => {
  if (!value) return '';
  const [datePart, timePart = ''] = String(value).split('T');
  return datePart ? `${datePart} ${timePart.slice(0, 5)}` : timePart.slice(0, 5);
};

/**
 * The full notification history for the signed-in account, mirroring the bell dropdown.
 */
const Notifications = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await notificationService.getAll());
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load notifications.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // The bell lives in the layout, but this page is rendered as a sibling route so it has to say
  // when the badge should change too.
  const announceChange = () => window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));

  const markRead = async (notification) => {
    if (notification.read) return;
    setBusyId(notification.id);
    try {
      const updated = await notificationService.markRead(notification.id);
      setItems((current) => current.map((n) => (n.id === updated.id ? updated : n)));
      announceChange();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not mark that as read.'));
    } finally {
      setBusyId(null);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setItems((current) => current.map((n) => ({ ...n, read: true })));
      announceChange();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not mark everything as read.'));
    }
  };

  const role = String(JSON.parse(localStorage.getItem('agriconnect_user') || '{}').role || '')
    .replace(/^ROLE_/, '');

  const unread = items.filter((item) => !item.read).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8 font-sans">
      <div className="mx-auto max-w-3xl">
        <Link
          to={HOME_PATH[role] || '/login'}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-lime-400"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-lime-500/10 p-2.5 rounded-xl border border-lime-500/20">
              <Bell className="h-5 w-5 text-lime-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Notifications</h1>
              <p className="text-xs text-slate-500">
                {unread === 0 ? 'All caught up' : `${unread} unread`}
              </p>
            </div>
          </div>

          {unread > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3.5 py-2 text-sm font-semibold text-slate-300 transition hover:border-lime-500/40 hover:text-lime-400"
            >
              <CheckCheck className="h-4 w-4" /> Mark all read
            </button>
          )}
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-3 text-sm text-rose-300">
            {error}
          </p>
        )}

        <div className="mt-6 space-y-3">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading notifications...
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-slate-800 bg-slate-900 py-16 text-center">
              <BellOff className="h-8 w-8 text-slate-600" />
              <p className="text-sm text-slate-400">You have no notifications yet.</p>
              <p className="text-xs text-slate-600">
                Order updates and new orders will show up here.
              </p>
            </div>
          )}

          {!loading &&
            items.map((item) => (
              <div
                key={item.id}
                className={`flex items-start gap-3 rounded-2xl border p-4 transition ${
                  item.read
                    ? 'border-slate-800 bg-slate-950/40'
                    : 'border-lime-500/20 bg-slate-900'
                }`}
              >
                <span aria-hidden className="mt-0.5 text-xl leading-none">{ICON_BY_TYPE[item.type] || '🔔'}</span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className={`text-sm ${item.read ? 'text-slate-300' : 'font-semibold text-white'}`}>
                      {item.title}
                    </p>
                    <span className="text-[10px] text-slate-500">{formatWhen(item.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-slate-400">{item.message}</p>

                  <div className="mt-2.5 flex flex-wrap items-center gap-3">
                    {item.orderId && ROLE_PATH[role] && (
                      <Link
                        to={role === 'BUYER' ? `${ROLE_PATH[role]}/${item.orderId}` : ROLE_PATH[role]}
                        className="text-xs font-semibold text-lime-400 transition hover:text-lime-300"
                      >
                        View order
                      </Link>
                    )}
                    {!item.read && (
                      <button
                        type="button"
                        onClick={() => markRead(item)}
                        disabled={busyId === item.id}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-lime-400 disabled:opacity-50"
                      >
                        {busyId === item.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
