import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FaArrowRight, FaBriefcase, FaFileAlt, FaInbox, FaMicrophoneAlt, FaMoon, FaSignOutAlt, FaSun, FaSyncAlt, FaUserCheck, FaUserCircle, FaUsers } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { fetchBackendHealth, fetchUserNotifications } from '../lib/api';
import { clearCurrentUser, readCurrentUser } from '../lib/currentUser';

const Home = ({ theme, setTheme }) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [backendStatus, setBackendStatus] = useState({ state: 'checking', message: 'Connecting to backend...' });
  const [notificationCount, setNotificationCount] = useState(0);
  const profileMenuRef = useRef(null);
  const currentUser = useMemo(() => readCurrentUser(), []);
  const profileName = currentUser?.name || 'Your Account';

  const cardBase = isDark
    ? 'border border-emerald-500/15 bg-white/5 text-emerald-50 shadow-[0_24px_60px_rgba(0,0,0,0.28)]'
    : 'border border-emerald-100 bg-white/80 text-slate-800 shadow-[0_24px_60px_rgba(16,185,129,0.10)]';

  const toggleTheme = () => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    setIsReady(true);

    const handlePointerDown = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadBackendStatus = async () => {
      try {
        const data = await fetchBackendHealth();
        if (!ignore) {
          setBackendStatus({
            state: 'connected',
            message: data.message || 'Backend connected',
          });
        }
      } catch (error) {
        if (!ignore) {
          setBackendStatus({
            state: 'error',
            message: 'Backend not reachable. Start FastAPI with uvicorn backend.main:app --reload',
          });
        }
      }
    };

    loadBackendStatus();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!currentUser?.id) {
      setNotificationCount(0);
      return undefined;
    }

    let ignore = false;

    const loadNotifications = async () => {
      try {
        const data = await fetchUserNotifications(currentUser.id);
        if (!ignore) {
          setNotificationCount((data.notifications || []).filter((item) => item.status === 'pending').length);
        }
      } catch (error) {
        if (!ignore) {
          setNotificationCount(0);
        }
      }
    };

    loadNotifications();
    const interval = window.setInterval(loadNotifications, 10000);

    return () => {
      ignore = true;
      window.clearInterval(interval);
    };
  }, [currentUser?.id]);

  const handleSwitchAccount = () => {
    setIsProfileMenuOpen(false);
    clearCurrentUser();
    navigate('/login');
  };

  const handleOpenProfile = () => {
    setIsProfileMenuOpen(false);
    navigate('/profile');
  };

  const handleLogout = () => {
    setIsProfileMenuOpen(false);
    clearCurrentUser();
    navigate('/login');
  };

  return (
    <div className={`min-h-dvh w-full overflow-y-auto transition-colors duration-500 ${isDark ? 'bg-[#050f0a] text-white' : 'bg-[#f0fdf4] text-slate-900'}`}>
      <div
        className={`mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-5 py-5 transition-all duration-700 sm:px-8 sm:py-6 ${
          isReady ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}
      >
        <nav className={`flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] px-5 py-4 backdrop-blur-2xl sm:rounded-full ${isDark ? 'border border-emerald-500/15 bg-white/5' : 'border border-white/70 bg-white/75'}`}>
          <div>
            <p className={`text-xs font-bold uppercase tracking-[0.35em] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>SkillNet</p>
            <h1 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Career Prep Hub</h1>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${isDark ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-200' : 'border border-emerald-100 bg-white text-emerald-700 shadow-sm'}`}
            >
              {isDark ? <FaSun /> : <FaMoon />}
              {isDark ? 'Light' : 'Dark'}
            </button>

            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((current) => !current)}
                className={`inline-flex items-center gap-3 rounded-full px-4 py-2 text-sm font-semibold transition-all ${isDark ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-200' : 'border border-emerald-100 bg-white text-emerald-700 shadow-sm'}`}
              >
                <FaUserCircle className="text-lg" />
                Profile
              </button>

              {isProfileMenuOpen ? (
                <div
                  className={`absolute right-0 top-[calc(100%+0.75rem)] z-20 min-w-56 overflow-hidden rounded-2xl border backdrop-blur-2xl ${isDark ? 'border-emerald-500/20 bg-[#0b1711]/95 shadow-[0_24px_50px_rgba(0,0,0,0.35)]' : 'border-emerald-100 bg-white/95 shadow-[0_24px_50px_rgba(16,185,129,0.12)]'}`}
                >
                  <button type="button" onClick={handleOpenProfile} className={`flex w-full items-center gap-3 px-4 py-3 text-left ${isDark ? 'border-b border-white/10 text-emerald-100' : 'border-b border-emerald-100 text-slate-700'}`}>
                    <FaUserCircle className={`text-2xl ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`} />
                    <div>
                      <p className="text-sm font-bold">{profileName}</p>
                      <p className={`text-xs ${isDark ? 'text-emerald-100/60' : 'text-slate-500'}`}>Account</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleSwitchAccount}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold transition-colors ${isDark ? 'text-emerald-100 hover:bg-white/5' : 'text-slate-700 hover:bg-emerald-50'}`}
                  >
                    <FaSyncAlt className={isDark ? 'text-emerald-300' : 'text-emerald-700'} />
                    Switch Account
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold transition-colors ${isDark ? 'text-amber-200 hover:bg-white/5' : 'text-amber-700 hover:bg-amber-50'}`}
                  >
                    <FaSignOutAlt />
                    Logout
                  </button>
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => navigate('/inbox')}
              className={`relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${isDark ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-200' : 'border border-emerald-100 bg-white text-emerald-700 shadow-sm'}`}
            >
              <FaInbox />
              Inbox
              {notificationCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-black text-white">
                  {notificationCount}
                </span>
              ) : null}
            </button>
          </div>
        </nav>

        <main className="flex flex-1 items-start justify-center py-10 sm:py-12">
          <div className="w-full">
            <div className="mx-auto max-w-4xl text-center">
              <p className={`text-xs font-bold uppercase tracking-[0.35em] ${isDark ? 'text-emerald-300/80' : 'text-emerald-700'}`}>Choose Your Track</p>
              <h2 className={`mt-3 text-3xl font-black tracking-tight sm:text-5xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Start building the skills that move you forward.
              </h2>
            </div>

            <div className="mx-auto mt-10 grid max-w-6xl gap-6 lg:grid-cols-3">
              <button type="button" onClick={() => navigate('/job-roles')} className={`group rounded-[2rem] p-7 text-left transition-all hover:-translate-y-1 ${cardBase}`}>
                <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${isDark ? 'bg-violet-400/10 text-violet-300' : 'bg-violet-100 text-violet-700'}`}>
                  <FaBriefcase className="text-xl" />
                </div>
                <h3 className="text-xl font-black">Job Roles</h3>
                <p className={`mt-3 text-sm leading-6 ${isDark ? 'text-emerald-50/70' : 'text-slate-600'}`}>
                  Choose your branch and pick the job profile you want to target so your account stays aligned.
                </p>
                <div className={`mt-6 inline-flex items-center gap-2 text-sm font-bold ${isDark ? 'text-violet-300' : 'text-violet-700'}`}>
                  Explore track
                  <FaArrowRight className="transition-transform group-hover:translate-x-1" />
                </div>
              </button>

              <button type="button" onClick={() => navigate('/interview')} className={`group rounded-[2rem] p-7 text-left transition-all hover:-translate-y-1 ${cardBase}`}>
                <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${isDark ? 'bg-amber-400/10 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>
                  <FaMicrophoneAlt className="text-xl" />
                </div>
                <h3 className="text-xl font-black">Interview Skills</h3>
                <p className={`mt-3 text-sm leading-6 ${isDark ? 'text-emerald-50/70' : 'text-slate-600'}`}>
                  Prepare confidence, mock interviews, and structured answer delivery.
                </p>
                <div className={`mt-6 inline-flex items-center gap-2 text-sm font-bold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                  Explore track
                  <FaArrowRight className="transition-transform group-hover:translate-x-1" />
                </div>
              </button>

              <button type="button" onClick={() => navigate('/resume')} className={`group rounded-[2rem] p-7 text-left transition-all hover:-translate-y-1 ${cardBase}`}>
                <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${isDark ? 'bg-rose-400/10 text-rose-300' : 'bg-rose-100 text-rose-700'}`}>
                  <FaFileAlt className="text-xl" />
                </div>
                <h3 className="text-xl font-black">Resume</h3>
                <p className={`mt-3 text-sm leading-6 ${isDark ? 'text-emerald-50/70' : 'text-slate-600'}`}>
                  Build and refine a resume that presents your profile, skills, projects, and goals clearly.
                </p>
                <div className={`mt-6 inline-flex items-center gap-2 text-sm font-bold ${isDark ? 'text-rose-300' : 'text-rose-700'}`}>
                  Explore track
                  <FaArrowRight className="transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            </div>

            <div className="mx-auto mt-8 grid max-w-5xl gap-6 md:grid-cols-2">
              <button type="button" onClick={() => navigate('/interview/mock')} className={`group rounded-[2rem] p-7 text-left transition-all hover:-translate-y-1 ${cardBase}`}>
                <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${isDark ? 'bg-fuchsia-400/10 text-fuchsia-300' : 'bg-fuchsia-100 text-fuchsia-700'}`}>
                  <FaUserCheck className="text-xl" />
                </div>
                <h3 className="text-xl font-black">Mock Interview</h3>
                <p className={`mt-3 text-sm leading-6 ${isDark ? 'text-emerald-50/70' : 'text-slate-600'}`}>
                  Practice with AI or peers, record answers, and get feedback for your target role.
                </p>
                <div className={`mt-6 inline-flex items-center gap-2 text-sm font-bold ${isDark ? 'text-fuchsia-300' : 'text-fuchsia-700'}`}>
                  Start practice
                  <FaArrowRight className="transition-transform group-hover:translate-x-1" />
                </div>
              </button>

              <button type="button" onClick={() => navigate('/recommendations')} className={`group rounded-[2rem] p-7 text-left transition-all hover:-translate-y-1 ${cardBase}`}>
                <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${isDark ? 'bg-sky-400/10 text-sky-300' : 'bg-sky-100 text-sky-700'}`}>
                  <FaUsers className="text-xl" />
                </div>
                <h3 className="text-xl font-black">Peer Recommendations</h3>
                <p className={`mt-3 text-sm leading-6 ${isDark ? 'text-emerald-50/70' : 'text-slate-600'}`}>
                  Let you meet the best people to collaborate with based on goals, skills, interests, and mock interview fit.
                </p>
                <div className={`mt-6 inline-flex items-center gap-2 text-sm font-bold ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>
                  Explore track
                  <FaArrowRight className="transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            </div>

            <div className="mx-auto mt-10 max-w-3xl text-center">

              <p className={`text-sm leading-7 sm:text-base ${isDark ? 'text-emerald-50/75' : 'text-slate-600'}`}>
                Every strong career starts with one clear step. Choose your lane, stay consistent, and let your growth
                speak for itself.
              </p>

              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className={`mt-6 inline-flex items-center gap-3 rounded-full px-7 py-3.5 text-sm font-black uppercase tracking-[0.24em] transition-all ${isDark ? 'bg-gradient-to-r from-emerald-500 to-amber-400 text-emerald-950 shadow-[0_18px_40px_rgba(16,185,129,0.28)]' : 'bg-gradient-to-r from-emerald-600 to-green-400 text-white shadow-[0_18px_40px_rgba(16,185,129,0.22)]'}`}
              >
                Switch to Dashboard
                <FaArrowRight />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;
