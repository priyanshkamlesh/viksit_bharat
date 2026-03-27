import React, { useEffect, useMemo, useState } from 'react';
import { FaArrowRight, FaChartLine, FaClock, FaHome, FaMoon, FaStar, FaSun, FaTrophy, FaUsers } from 'react-icons/fa';
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

const clampScore = (value) => {
  const score = Number(value);
  if (Number.isNaN(score)) {
    return 0;
  }

  return Math.max(0, Math.min(100, score));
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

  const mockTestHistory = useMemo(() => readMockTestHistory(currentUser?.id), [currentUser?.id, historyVersion]);
  const connectionHistory = useMemo(() => readConnectionHistory(currentUser?.id), [currentUser?.id, historyVersion]);

  const stats = useMemo(() => {
    const attempts = mockTestHistory.length;
    const scores = mockTestHistory.map((item) => clampScore(item.score));
    const averageScore = attempts ? Math.round(scores.reduce((sum, score) => sum + score, 0) / attempts) : 0;
    const bestScore = attempts ? Math.max(...scores) : 0;
    const firstScore = attempts ? scores[scores.length - 1] : 0;
    const latestScore = attempts ? scores[0] : 0;
    const scoreTrend = attempts > 1 ? latestScore - firstScore : 0;
    const uniqueConnections = new Set(
      connectionHistory.map((item) => String(item.partnerId || item.partnerName || item.connectionId || item.id)),
    ).size;

    return [
      { label: 'Mock tests taken', value: attempts },
      { label: 'Average score', value: `${averageScore}%` },
      { label: 'Best score', value: `${bestScore}%` },
      { label: 'Connections made', value: uniqueConnections },
      { label: 'Score trend', value: `${scoreTrend >= 0 ? '+' : ''}${scoreTrend}%` },
      { label: 'Latest connection', value: connectionHistory[0] ? formatDateTime(connectionHistory[0].connectedAt) : 'None yet' },
    ];
  }, [connectionHistory, mockTestHistory]);

  const recentHistory = mockTestHistory.slice(0, 6);
  const recentConnections = connectionHistory.slice(0, 6);
  const overallProgress = recentHistory.length ? Math.round(recentHistory.reduce((sum, item) => sum + clampScore(item.score), 0) / recentHistory.length) : 0;

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
                  {currentUser?.name || 'Your'} learning dashboard
                </h2>
                <p className={`mt-4 max-w-2xl text-sm leading-7 sm:text-base ${isDark ? 'text-emerald-50/75' : 'text-slate-600'}`}>
                  See your mock test scores, learning progress, and the collaborators you have connected with over time.
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

            <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {stats.map((item) => (
                <div key={item.label} className={`rounded-3xl p-4 ${panelBase}`}>
                  <p className={`text-xs font-bold uppercase tracking-[0.28em] ${isDark ? 'text-emerald-200/70' : 'text-emerald-700/70'}`}>{item.label}</p>
                  <p className="mt-3 text-2xl font-black">{item.value}</p>
                </div>
              ))}
            </div>

            <div className={`mt-7 rounded-[1.75rem] p-5 ${isDark ? 'bg-white/5 ring-1 ring-white/10' : 'bg-emerald-50/80 ring-1 ring-emerald-100'}`}>
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isDark ? 'bg-emerald-400/10 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                  <FaTrophy />
                </div>
                <div>
                  <p className="text-sm font-black">Progress overview</p>
                  <p className={`text-sm ${isDark ? 'text-emerald-50/65' : 'text-slate-600'}`}>
                    Average score across your latest mock tests.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-black/10 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">Current progress</span>
                  <span className="font-black">{overallProgress}%</span>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/15">
                  <div
                    className={`h-full rounded-full ${isDark ? 'bg-gradient-to-r from-emerald-400 via-lime-300 to-amber-300' : 'bg-gradient-to-r from-emerald-600 via-lime-500 to-amber-400'}`}
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
                <p className={`mt-3 text-xs ${isDark ? 'text-emerald-50/60' : 'text-slate-600'}`}>
                  Track how your score changes after every attempt.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className={`rounded-[2rem] p-6 ${cardBase}`}>
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <p className={`text-xs font-bold uppercase tracking-[0.35em] ${isDark ? 'text-emerald-300/80' : 'text-emerald-700'}`}>History</p>
                  <h3 className="mt-2 text-2xl font-black">Mock test history</h3>
                </div>
                <div className={`rounded-full px-4 py-2 text-sm font-bold ${isDark ? 'bg-white/10' : 'bg-emerald-50'}`}>
                  {recentHistory.length} recent
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {recentHistory.length ? (
                  recentHistory.map((item) => (
                    <article
                      key={item.id}
                      className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-emerald-100 bg-white'}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-black">{item.skill}</p>
                          <p className={`mt-1 text-xs ${isDark ? 'text-emerald-50/60' : 'text-slate-500'}`}>{formatDateTime(item.createdAt)}</p>
                        </div>
                        <div className={`rounded-2xl px-4 py-3 text-right ${isDark ? 'bg-white/5' : 'bg-emerald-50'}`}>
                          <p className="text-[0.65rem] font-bold uppercase tracking-[0.28em] text-emerald-600">Score</p>
                          <p className="mt-1 text-2xl font-black">{clampScore(item.score)}%</p>
                        </div>
                      </div>

                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/10">
                        <div
                          className={`h-full rounded-full ${isDark ? 'bg-emerald-400' : 'bg-emerald-600'}`}
                          style={{ width: `${clampScore(item.score)}%` }}
                        />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                        <span className={`rounded-full px-3 py-1 ${isDark ? 'bg-white/10 text-emerald-100' : 'bg-emerald-50 text-emerald-800'}`}>
                          {item.correctCount}/{item.total} correct
                        </span>
                        {item.level ? (
                          <span className={`rounded-full px-3 py-1 ${isDark ? 'bg-white/10 text-emerald-100' : 'bg-emerald-50 text-emerald-800'}`}>
                            Level: {item.level}
                          </span>
                        ) : null}
                      </div>
                    </article>
                  ))
                ) : (
                  <div className={`rounded-2xl p-5 text-sm ${panelBase}`}>
                    No mock tests yet. Generate one from a skill roadmap to start tracking your score history.
                  </div>
                )}
              </div>
            </div>

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
