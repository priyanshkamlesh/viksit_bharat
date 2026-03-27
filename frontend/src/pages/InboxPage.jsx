import React, { useEffect, useMemo, useState } from 'react';
import { FaArrowRight, FaChartLine, FaCheckCircle, FaHome, FaMoon, FaSun, FaInbox, FaClock, FaUserFriends } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

import { acceptConnectionInvite, declineConnectionInvite, fetchUserNotifications } from '../lib/api';
import { readCurrentUser } from '../lib/currentUser';

const InboxPage = ({ theme, setTheme }) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const [currentUser, setCurrentUser] = useState(() => readCurrentUser());
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [actionId, setActionId] = useState('');
  const [badgeCount, setBadgeCount] = useState(0);

  const toggleTheme = () => setTheme((current) => (current === 'light' ? 'dark' : 'light'));

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    const sync = () => setCurrentUser(readCurrentUser());
    sync();
    window.addEventListener('auth-change', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('auth-change', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    if (!currentUser?.id) {
      setNotifications([]);
      setBadgeCount(0);
      return undefined;
    }

    let ignore = false;

    const loadNotifications = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchUserNotifications(currentUser.id);
        if (!ignore) {
          const nextNotifications = data.notifications || [];
          setNotifications(nextNotifications);
          setBadgeCount(nextNotifications.filter((item) => item.status === 'pending').length);
        }
      } catch (err) {
        if (!ignore) {
          setError('Could not load your inbox from MongoDB.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadNotifications();
    return () => {
      ignore = true;
    };
  }, [currentUser?.id]);

  const pendingNotifications = useMemo(
    () => notifications.filter((item) => item.status === 'pending'),
    [notifications],
  );

  const acceptedNotifications = useMemo(
    () => notifications.filter((item) => item.status === 'accepted'),
    [notifications],
  );

  const declinedNotifications = useMemo(
    () => notifications.filter((item) => item.status === 'rejected'),
    [notifications],
  );

  const handleAccept = async (notification) => {
    setActionId(notification.id);
    setError('');
    setMessage('');

    try {
      const response = await acceptConnectionInvite(notification.id);
      if (response.error) {
        setError(response.error);
        return;
      }

      setMessage('Invite accepted. Opening the mock interview session...');
      const session = response.session || {};
      const senderId = notification.sender_id;
      const recipientId = notification.recipient_id;
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? { ...item, status: 'accepted', accepted_at: new Date().toISOString(), session_id: session.session_id || item.session_id }
            : item,
        ),
      );
      setBadgeCount((current) => Math.max(0, current - 1));
      navigate(`/interview/mock?sessionId=${encodeURIComponent(session.session_id || '')}&mode=peer`);
    } catch (err) {
      setError('Could not accept the invite.');
    } finally {
      setActionId('');
    }
  };

  const handleDecline = async (notification) => {
    setActionId(notification.id);
    setError('');
    setMessage('');

    try {
      const response = await declineConnectionInvite(notification.id);
      if (response.error) {
        setError(response.error);
        return;
      }

      setMessage('Invite declined.');
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? { ...item, status: 'rejected', rejected_at: new Date().toISOString() }
            : item,
        ),
      );
      setBadgeCount((current) => Math.max(0, current - 1));
    } catch (err) {
      setError('Could not decline the invite.');
    } finally {
      setActionId('');
    }
  };

  return (
    <div className={`min-h-dvh w-full transition-colors duration-500 ${isDark ? 'bg-[#050f0a] text-white' : 'bg-[#f0fdf4] text-slate-900'}`}>
      <div className={`mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-5 py-5 sm:px-8 ${isReady ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'} transition-all duration-700`}>
        <nav className={`flex items-center justify-between rounded-full px-5 py-4 backdrop-blur-2xl ${isDark ? 'border border-emerald-500/15 bg-white/5' : 'border border-white/70 bg-white/75'}`}>
          <div>
            <p className={`text-xs font-bold uppercase tracking-[0.35em] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>SkillNet</p>
            <h1 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Inbox</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${isDark ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-200' : 'border border-emerald-100 bg-white text-emerald-700 shadow-sm'}`}
            >
              {isDark ? <FaSun /> : <FaMoon />}
              {isDark ? 'Light' : 'Dark'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/home')}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${isDark ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-200' : 'border border-emerald-100 bg-white text-emerald-700 shadow-sm'}`}
            >
              <FaHome />
              Home
            </button>

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${isDark ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-200' : 'border border-emerald-100 bg-white text-emerald-700 shadow-sm'}`}
            >
              <FaChartLine />
              Dashboard
            </button>
          </div>
        </nav>

        <main className="flex-1 py-6">
          <section className={`rounded-[2rem] p-7 ${isDark ? 'border border-emerald-500/15 bg-white/5 text-emerald-50 shadow-[0_24px_60px_rgba(0,0,0,0.28)]' : 'border border-emerald-100 bg-white/85 text-slate-800 shadow-[0_24px_60px_rgba(16,185,129,0.10)]'}`}>
            <div className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
              <div>
                <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.28em] ${isDark ? 'bg-emerald-400/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}`}>
                  <FaInbox />
                  Connection inbox
                </div>
                <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
                  Requests waiting for your response
                </h2>
                <p className={`mt-4 max-w-2xl text-sm leading-7 sm:text-base ${isDark ? 'text-emerald-50/75' : 'text-slate-600'}`}>
                  These invites are stored in MongoDB, so they remain here even after logout. Accept one to open the communication session.
                </p>
              </div>
            </div>

            {message ? (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                {message}
              </div>
            ) : null}

            {error ? (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {error}
              </div>
            ) : null}

            <div className="mt-7 grid gap-6 lg:grid-cols-2">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black">Pending invites</h3>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${isDark ? 'bg-white/10' : 'bg-emerald-50'}`}>
                    {badgeCount}
                  </span>
                </div>

                <div className="mt-4 space-y-4">
                  {loading ? (
                    <div className={`rounded-2xl p-5 text-sm ${isDark ? 'bg-white/5' : 'bg-emerald-50/60'}`}>Loading inbox...</div>
                  ) : pendingNotifications.length ? (
                    pendingNotifications.map((notification) => (
                      <article key={notification.id} className={`rounded-2xl border p-5 ${isDark ? 'border-white/10 bg-white/5' : 'border-emerald-100 bg-white'}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-black">{notification.sender_name}</p>
                            <p className={`mt-1 text-xs ${isDark ? 'text-emerald-50/60' : 'text-slate-500'}`}>
                              Sent {new Date(notification.created_at).toLocaleString()}
                            </p>
                            <p className={`mt-3 text-sm ${isDark ? 'text-emerald-50/75' : 'text-slate-600'}`}>
                              Wants to connect with you for a mock interview session.
                            </p>
                          </div>
                          <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isDark ? 'bg-emerald-400/10 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                            <FaUserFriends />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAccept(notification)}
                          disabled={actionId === notification.id}
                          className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${isDark ? 'bg-emerald-400 text-slate-950 hover:bg-emerald-300' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}
                        >
                          {actionId === notification.id ? 'Accepting...' : 'Accept'}
                          <FaCheckCircle />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDecline(notification)}
                          disabled={actionId === notification.id}
                          className={`mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${isDark ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                        >
                          {actionId === notification.id ? 'Declining...' : 'Decline'}
                        </button>
                      </article>
                    ))
                  ) : (
                    <div className={`rounded-2xl p-5 text-sm ${isDark ? 'bg-white/5' : 'bg-emerald-50/60'}`}>
                      No pending invites right now.
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black">Accepted invites</h3>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${isDark ? 'bg-white/10' : 'bg-emerald-50'}`}>
                    {acceptedNotifications.length}
                  </span>
                </div>

                <div className="mt-4 space-y-4">
                  {acceptedNotifications.length ? (
                    acceptedNotifications.map((notification) => (
                      <article key={notification.id} className={`rounded-2xl border p-5 ${isDark ? 'border-white/10 bg-white/5' : 'border-emerald-100 bg-white'}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-black">{notification.sender_name}</p>
                            <p className={`mt-1 text-xs ${isDark ? 'text-emerald-50/60' : 'text-slate-500'}`}>
                              Accepted {notification.accepted_at ? new Date(notification.accepted_at).toLocaleString() : 'recently'}
                            </p>
                          </div>
                          <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isDark ? 'bg-emerald-400/10 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                            <FaClock />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => navigate(
                            notification.session_id
                              ? `/interview/mock?sessionId=${encodeURIComponent(notification.session_id)}&mode=peer`
                              : `/interview/mock?userId=${encodeURIComponent(currentUser.id)}&partnerId=${encodeURIComponent(notification.sender_id)}&mode=peer`,
                          )}
                          className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${isDark ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-white text-slate-900 ring-1 ring-emerald-100 hover:bg-slate-50'}`}
                        >
                          Open communication
                          <FaArrowRight />
                        </button>
                      </article>
                    ))
                  ) : (
                    <div className={`rounded-2xl p-5 text-sm ${isDark ? 'bg-white/5' : 'bg-emerald-50/60'}`}>
                      No accepted invites yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-7">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black">Declined invites</h3>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${isDark ? 'bg-white/10' : 'bg-emerald-50'}`}>
                  {declinedNotifications.length}
                </span>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {declinedNotifications.length ? (
                  declinedNotifications.map((notification) => (
                    <article key={notification.id} className={`rounded-2xl border p-5 ${isDark ? 'border-white/10 bg-white/5' : 'border-emerald-100 bg-white'}`}>
                      <p className="text-sm font-black">{notification.sender_name}</p>
                      <p className={`mt-1 text-xs ${isDark ? 'text-emerald-50/60' : 'text-slate-500'}`}>
                        Declined {notification.rejected_at ? new Date(notification.rejected_at).toLocaleString() : 'recently'}
                      </p>
                    </article>
                  ))
                ) : (
                  <div className={`rounded-2xl p-5 text-sm ${isDark ? 'bg-white/5' : 'bg-emerald-50/60'}`}>
                    No declined invites yet.
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default InboxPage;
