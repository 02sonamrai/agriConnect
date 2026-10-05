import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Loader2, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { notificationService, getErrorMessage } from '../services/api';

/** Fired after a notification is read, so every mounted bell refreshes its badge at once. */
export const NOTIFICATIONS_CHANGED = 'agriconnect:notifications-changed';

const POLL_MS = 60000;

/** LocalDateTime has no timezone, so format the parts directly rather than via Date parsing. */
const formatWhen = (value) => {
  if (!value) return '';
  const [datePart, timePart = ''] = String(value).split('T');
  const time = timePart.slice(0, 5);
  if (!datePart) return time;

  const today = new Date().toISOString().slice(0, 10);
  if (datePart === today) return time;

  const [, month, day] = datePart.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${Number(day)} ${months[Number(month) - 1] || ''}`;
};

const ICON_BY_TYPE = {
  ORDER_PLACED: '🛒',
  ORDER_CONFIRMED: '✅',
  ORDER_SHIPPED: '🚚',
  ORDER_DELIVERED: '📦',
  ORDER_CANCELLED: '✖️',
  ORDER_REJECTED: '⚠️',
};

/** Roles are stored both as "ROLE_BUYER" and "BUYER" depending on where the session came from. */
const roleOf = (user) => String(user?.role || '').replace(/^ROLE_/, '');

/**
 * Only a buyer can open an individual order. A seller or coordinator is sent to the list that
 * holds their work, because the buyer-facing order page is not theirs.
 */
const ORDERS_PATH = {
  BUYER: '/marketplace/orders',
  FARMER: '/farmer/orders',
  MIDDLEMAN: '/middleman/orders',
};

/**
 * Bell plus unread badge with an inline dropdown.
 *
 * <p>Delivery is database-backed, so the count is refreshed on mount, when the panel is opened,
 * and on a slow poll. Opening the panel marks nothing automatically - a notification is only
 * dismissed deliberately.
 */
const NotificationBell = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const containerRef = useRef(null);

  const refreshCount = useCallback(async () => {
    try {
      setUnread(await notificationService.getUnreadCount());
    } catch {
      // A badge that cannot refresh must not break the page it sits on.
    }
  }, []);

  const loadPanel = useCallback(async () => {
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
    if (!user) return undefined;
    refreshCount();
    const timer = setInterval(refreshCount, POLL_MS);
    return () => clearInterval(timer);
  }, [user, refreshCount]);

  useEffect(() => {
    if (!user) return undefined;
    const onChanged = () => {
      refreshCount();
      if (open) loadPanel();
    };
    window.addEventListener(NOTIFICATIONS_CHANGED, onChanged);
    return () => window.removeEventListener(NOTIFICATIONS_CHANGED, onChanged);
  }, [user, open, refreshCount, loadPanel]);

  useEffect(() => {
    if (!open) return undefined;
    const onClickAway = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const onEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClickAway);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onClickAway);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) loadPanel();
  };

  const markRead = async (notification) => {
    if (notification.read) return;
    setBusyId(notification.id);
    try {
      const updated = await notificationService.markRead(notification.id);
      setItems((current) => current.map((n) => (n.id === updated.id ? updated : n)));
      setUnread((count) => Math.max(0, count - 1));
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
      setUnread(0);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not mark everything as read.'));
    }
  };

  const openOrder = (orderId) => {
    const role = roleOf(user);
    const base = ORDERS_PATH[role];
    if (!base) {
      setOpen(false);
      return;
    }
    navigate(role === 'BUYER' && orderId ? `${base}/${orderId}` : base);
    setOpen(false);
  };

  if (!user) return null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={toggle}
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
        className="relative w-full flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-lime-500/40 hover:text-lime-400"
      >
        <Bell className="h-5 w-5" />
        <span className="md:hidden">Notifications</span>
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-lime-500 px-1 text-[11px] font-bold text-slate-950">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-80 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/50 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <p className="text-sm font-bold text-white">Notifications</p>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  title="Mark all as read"
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-lime-400"
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                title="Close"
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading...
              </div>
            )}

            {!loading && error && (
              <p className="px-4 py-6 text-center text-sm text-rose-400">{error}</p>
            )}

            {!loading && !error && items.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-slate-500">Nothing yet.</p>
            )}

            {!loading &&
              !error &&
              items.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 border-b border-slate-800/60 px-4 py-3 last:border-0 ${
                    item.read ? 'opacity-60' : ''
                  }`}
                >
                  <span aria-hidden className="mt-1 text-base leading-none">{ICON_BY_TYPE[item.type] || '🔔'}</span>

                  <button
                    type="button"
                    onClick={() => openOrder(item.orderId)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span className={`text-sm ${item.read ? 'text-slate-300' : 'font-semibold text-white'}`}>
                        {item.title}
                      </span>
                      <span className="shrink-0 text-[10px] text-slate-500">{formatWhen(item.createdAt)}</span>
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-slate-400">{item.message}</span>
                  </button>

                  {!item.read && (
                    <button
                      type="button"
                      onClick={() => markRead(item)}
                      disabled={busyId === item.id}
                      title="Mark as read"
                      className="shrink-0 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-lime-400 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
          </div>

          <div className="border-t border-slate-800 px-4 py-2">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="block py-1.5 text-center text-xs font-semibold text-lime-400 transition hover:text-lime-300"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
