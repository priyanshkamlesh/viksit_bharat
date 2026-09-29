import React, { useEffect, useMemo, useState } from 'react';
import { FaArrowRight, FaChartLine, FaClipboardCheck, FaHome, FaMoon, FaSun, FaUsers } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

import { readCurrentUser } from '../lib/currentUser';
import { readConnectionHistory, readMockTestHistory } from '../lib/dashboardStorage';

const formatDateTime = (value) => {
  if (!value) {
    return 'Unknown time';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown time';
  }

  return date.toLocaleString();
};

const DashboardPage = ({ theme, setTheme }) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const [currentUser, setCurrentUser] = useState(() => readCurrentUser());
  const [historyVersion, setHistoryVersion] = useState(0);

  const cardBase = isDark
    ? 'border border-emerald-500/15 bg-white/5 text-emerald-50 shadow-[0_24px_60px_rgba(0,0,0,0.28)]'
    : 'border border-emerald-100 bg-white/85 text-slate-800 shadow-[0_24px_60px_rgba(16,185,129,0.10)]';

  const panelBase = isDark
    ? 'border border-white/10 bg-[#0b1711]/90 text-emerald-50'
    : 'border border-emerald-100 bg-white/90 text-slate-800';

  const toggleTheme = () => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    const syncUser = () => setCurrentUser(readCurrentUser());
    syncUser();
    window.addEventListener('auth-change', syncUser);
    window.addEventListener('storage', syncUser);

    return () => {
      window.removeEventListener('auth-change', syncUser);
      window.removeEventListener('storage', syncUser);
    };
  }, []);

  useEffect(() => {
    const refreshDashboard = () => {
      setCurrentUser(readCurrentUser());
      setHistoryVersion((current) => current + 1);
    };

    window.addEventListener('dashboard-change', refreshDashboard);
    window.addEventListener('storage', refreshDashboard);
    window.addEventListener('focus', refreshDashboard);

    return () => {
      window.removeEventListener('dashboard-change', refreshDashboard);
      window.removeEventListener('storage', refreshDashboard);
      window.removeEventListener('focus', refreshDashboard);
    };
  }, []);

  const connectionHistory = useMemo(() => readConnectionHistory(currentUser?.id), [currentUser?.id, historyVersion]);
  const mockTestHistory = useMemo(() => readMockTestHistory(currentUser?.id), [currentUser?.id, historyVersion]);

  const stats = useMemo(() => {
    const uniqueConnections = new Set(
      connectionHistory.map((item) => String(item.partnerId || item.partnerName || item.connectionId || item.id)),
    ).size;
    const averageTestScore = mockTestHistory.length
      ? Math.round(mockTestHistory.reduce((sum, item) => sum + Number(item.percentage || 0), 0) / mockTestHistory.length)
      : 'N/A';

    return [
      { label: 'Connections made', value: uniqueConnections },
      { label: 'Latest connection', value: connectionHistory[0] ? formatDateTime(connectionHistory[0].connectedAt) : 'None yet' },
      { label: 'Mock tests completed', value: mockTestHistory.length },
      { label: 'Average test score', value: averageTestScore === 'N/A' ? averageTestScore : `${averageTestScore}%` },
      { label: 'Profile', value: currentUser?.name || 'Active' },
    ];
  }, [connectionHistory, currentUser?.name, mockTestHistory]);

  const recentConnections = connectionHistory.slice(0, 6);

  return (
    <div className={`min-h-dvh w-full transition-colors duration-500 ${isDark ? 'bg-[#050f0a] text-white' : 'bg-[#f0fdf4] text-slate-900'}`}>
      <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-5 py-5 sm:px-8">
        <nav className={`flex items-center justify-between rounded-full px-5 py-4 backdrop-blur-2xl ${isDark ? 'border border-emerald-500/15 bg-white/5' : 'border border-white/70 bg-white/75'}`}>
          <div>
            <p className={`text-xs font-bold uppercase tracking-[0.35em] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>SkillNet</p>
            <h1 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Dashboard</h1>
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
          </div>
        </nav>

        <main className="flex-1 py-6">
          <section className={`rounded-[2rem] p-7 ${cardBase}`}>
            <div className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.28em] ${isDark ? 'bg-emerald-400/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}`}>
                  <FaChartLine />
                  Progress center
                </div>
                <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
                  {currentUser?.name || 'Your'} collaboration dashboard
                </h2>
                <p className={`mt-4 max-w-2xl text-sm leading-7 sm:text-base ${isDark ? 'text-emerald-50/75' : 'text-slate-600'}`}>
                  See your profile activity and the collaborators you have connected with over time.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/recommendations')}
                className={`inline-flex items-center gap-2 self-start rounded-full px-4 py-2 text-sm font-bold transition-all ${isDark ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-white text-slate-900 ring-1 ring-emerald-100 hover:bg-slate-50'}`}
              >
                View recommendations
                <FaArrowRight />
              </button>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {stats.map((item) => (
                <div key={item.label} className={`rounded-3xl p-4 ${panelBase}`}>
                  <p className={`text-xs font-bold uppercase tracking-[0.28em] ${isDark ? 'text-emerald-200/70' : 'text-emerald-700/70'}`}>{item.label}</p>
                  <p className="mt-3 text-2xl font-black">{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6">
            <div className={`rounded-[2rem] p-6 ${cardBase}`}>
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <p className={`text-xs font-bold uppercase tracking-[0.35em] ${isDark ? 'text-emerald-300/80' : 'text-emerald-700'}`}>Mock tests</p>
                  <h3 className="mt-2 text-2xl font-black">Your recent test scores</h3>
                </div>
                <button type="button" onClick={() => navigate('/interview/mock-test')} className={`rounded-full px-4 py-2 text-sm font-bold ${isDark ? 'bg-white/10 text-emerald-100' : 'bg-emerald-50 text-emerald-700'}`}>
                  Take a test
                </button>
              </div>

              <div className="mt-6 space-y-4">
                {mockTestHistory.slice(0, 6).map((item) => (
                  <article key={item.id} className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-emerald-100 bg-white'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isDark ? 'bg-emerald-400/10 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}><FaClipboardCheck /></div>
                      <div>
                        <p className="text-sm font-black">{item.category || 'Mock Test'}{item.skill ? `: ${item.skill}` : ''}</p>
                        <p className={`mt-1 text-xs ${isDark ? 'text-emerald-50/60' : 'text-slate-500'}`}>Completed {formatDateTime(item.completedAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-emerald-600">{item.percentage}%</p>
                      <p className={`text-xs font-semibold ${isDark ? 'text-emerald-50/60' : 'text-slate-500'}`}>{item.correct}/{item.total} correct</p>
                    </div>
                  </article>
                ))}
                {!mockTestHistory.length ? <div className={`rounded-2xl p-5 text-sm ${panelBase}`}>No mock tests completed yet. Take an Aptitude, Reasoning, or Technical test to see your score here.</div> : null}
              </div>
            </div>
          </section>

          <section className="mt-6">
            <div className={`rounded-[2rem] p-6 ${cardBase}`}>
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <p className={`text-xs font-bold uppercase tracking-[0.35em] ${isDark ? 'text-emerald-300/80' : 'text-emerald-700'}`}>Connections</p>
                  <h3 className="mt-2 text-2xl font-black">People you connected with</h3>
                </div>
                <div className={`rounded-full px-4 py-2 text-sm font-bold ${isDark ? 'bg-white/10' : 'bg-emerald-50'}`}>
                  {recentConnections.length} recent
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {recentConnections.length ? (
                  recentConnections.map((item) => (
                    <article
                      key={item.id}
                      className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-emerald-100 bg-white'}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-black">{item.partnerName || item.name || 'Collaborator'}</p>
                          <p className={`mt-1 text-xs ${isDark ? 'text-emerald-50/60' : 'text-slate-500'}`}>
                            Connected on {formatDateTime(item.connectedAt)}
                          </p>
                        </div>
                        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isDark ? 'bg-emerald-400/10 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                          <FaUsers />
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                        {item.sessionId ? (
                          <span className={`rounded-full px-3 py-1 ${isDark ? 'bg-white/10 text-emerald-100' : 'bg-emerald-50 text-emerald-800'}`}>
                            Session #{item.sessionId}
                          </span>
                        ) : null}
                        {item.mode ? (
                          <span className={`rounded-full px-3 py-1 ${isDark ? 'bg-white/10 text-emerald-100' : 'bg-emerald-50 text-emerald-800'}`}>
                            {item.mode}
                          </span>
                        ) : null}
                      </div>
                    </article>
                  ))
                ) : (
                  <div className={`rounded-2xl p-5 text-sm ${panelBase}`}>
                    No connections recorded yet. Start a mock interview session to track when you connected with collaborators.
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

export default DashboardPage;
