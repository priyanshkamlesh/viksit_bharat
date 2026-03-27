import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FaArrowRight, FaClipboardCheck, FaHome, FaMoon, FaSignOutAlt, FaSun, FaSyncAlt, FaUserCircle } from 'react-icons/fa';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { getSkillRoadmap } from '../data/skillRoadmaps';
import { clearCurrentUser, readCurrentUser } from '../lib/currentUser';

const MockTestPage = ({ theme, setTheme }) => {
  const navigate = useNavigate();
  const { skillId } = useParams();
  const [searchParams] = useSearchParams();
  const selectedLevel = searchParams.get('level');
  const isDark = theme === 'dark';
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const roadmap = useMemo(() => getSkillRoadmap(skillId, selectedLevel), [selectedLevel, skillId]);
  const currentUser = useMemo(() => readCurrentUser(), []);
  const profileName = currentUser?.name || 'Your Account';

  useEffect(() => {
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
    if (!roadmap) {
      navigate('/tech', { replace: true });
    }
  }, [navigate, roadmap]);

  if (!roadmap) {
    return null;
  }

  const toggleTheme = () => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'));
  };

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

  const cardBase = isDark
    ? 'border border-emerald-500/15 bg-white/5 text-emerald-50 shadow-[0_24px_60px_rgba(0,0,0,0.28)]'
    : 'border border-emerald-100 bg-white/85 text-slate-800 shadow-[0_24px_60px_rgba(16,185,129,0.10)]';

  return (
    <div className={`min-h-dvh w-full overflow-x-hidden overflow-y-auto transition-colors duration-500 ${isDark ? 'bg-[#050f0a] text-white' : 'bg-[#f0fdf4] text-slate-900'}`}>
      <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-5 py-5 sm:px-8">
        <nav className={`sticky top-5 z-10 flex items-center justify-between rounded-full px-5 py-4 backdrop-blur-2xl ${isDark ? 'border border-emerald-500/15 bg-[#07110c]/80' : 'border border-white/70 bg-white/85'}`}>
          <div>
            <p className={`text-xs font-bold uppercase tracking-[0.35em] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>SkillNet</p>
            <h1 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Mock Test</h1>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate('/home')} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${isDark ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-200' : 'border border-emerald-100 bg-white text-emerald-700 shadow-sm'}`}>
              <FaHome />
              Home
            </button>

            <button type="button" onClick={toggleTheme} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${isDark ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-200' : 'border border-emerald-100 bg-white text-emerald-700 shadow-sm'}`}>
              {isDark ? <FaSun /> : <FaMoon />}
              {isDark ? 'Light' : 'Dark'}
            </button>

            <div className="relative" ref={profileMenuRef}>
              <button type="button" onClick={() => setIsProfileMenuOpen((current) => !current)} className={`inline-flex items-center gap-3 rounded-full px-4 py-2 text-sm font-semibold transition-all ${isDark ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-200' : 'border border-emerald-100 bg-white text-emerald-700 shadow-sm'}`}>
                <FaUserCircle className="text-lg" />
                Profile
              </button>

              {isProfileMenuOpen ? (
                <div className={`absolute right-0 top-[calc(100%+0.75rem)] z-20 min-w-60 overflow-hidden rounded-2xl border backdrop-blur-2xl ${isDark ? 'border-emerald-500/20 bg-[#0b1711]/95 shadow-[0_24px_50px_rgba(0,0,0,0.35)]' : 'border-emerald-100 bg-white/95 shadow-[0_24px_50px_rgba(16,185,129,0.12)]'}`}>
                  <button type="button" onClick={handleOpenProfile} className={`flex w-full items-center gap-3 px-4 py-3 text-left ${isDark ? 'border-b border-white/10 text-emerald-100' : 'border-b border-emerald-100 text-slate-700'}`}>
                    <FaUserCircle className={`text-2xl ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`} />
                    <div>
                      <p className="text-sm font-bold">{profileName}</p>
                      <p className={`text-xs ${isDark ? 'text-emerald-100/60' : 'text-slate-500'}`}>Account</p>
                    </div>
                  </button>

                  <button type="button" onClick={handleSwitchAccount} className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold transition-colors ${isDark ? 'text-emerald-100 hover:bg-white/5' : 'text-slate-700 hover:bg-emerald-50'}`}>
                    <FaSyncAlt className={isDark ? 'text-emerald-300' : 'text-emerald-700'} />
                    Switch Account
                  </button>

                  <button type="button" onClick={handleLogout} className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold transition-colors ${isDark ? 'text-amber-200 hover:bg-white/5' : 'text-amber-700 hover:bg-amber-50'}`}>
                    <FaSignOutAlt />
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </nav>

        <main className="flex flex-1 items-center justify-center py-8">
          <div className={`w-full max-w-4xl rounded-[2rem] p-8 ${cardBase}`}>
            <div className="flex items-center gap-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${isDark ? 'bg-amber-400/10 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>
                <FaClipboardCheck />
              </div>
              <div>
                <p className={`text-xs font-bold uppercase tracking-[0.35em] ${isDark ? 'text-emerald-300/80' : 'text-emerald-700'}`}>{roadmap.track}</p>
                <h2 className="text-3xl font-black">{roadmap.mockTest.title}</h2>
                {roadmap.selectedLevel ? (
                  <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.28em] ${isDark ? 'bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-400/20' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'}`}>
                    {roadmap.selectedLevel} Level
                  </span>
                ) : null}
              </div>
            </div>

            <p className={`mt-6 text-base leading-7 ${isDark ? 'text-emerald-50/70' : 'text-slate-600'}`}>
              This section is ready for the next step. The mock test shell is created, and it will be based on these focus areas for {roadmap.title}.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {roadmap.mockTest.topics.map((topic) => (
                <span key={topic} className={`rounded-full px-4 py-2 text-sm font-semibold ${isDark ? 'bg-white/5 text-emerald-100 ring-1 ring-white/10' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'}`}>
                  {topic}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => navigate(`/roadmap/${skillId}${selectedLevel ? `?level=${selectedLevel}` : ''}`)}
                className={`inline-flex items-center gap-3 rounded-full px-6 py-3 text-sm font-black transition-all ${isDark ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-white text-slate-900 hover:bg-slate-50 ring-1 ring-emerald-100'}`}
              >
                <FaArrowRight className="rotate-180" />
                Back to Roadmap
              </button>

              <button
                type="button"
                className={`inline-flex items-center gap-3 rounded-full px-6 py-3 text-sm font-black transition-all ${isDark ? 'bg-emerald-400 text-[#052414]' : 'bg-emerald-600 text-white'}`}
              >
                Question Engine Coming Soon
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MockTestPage;
