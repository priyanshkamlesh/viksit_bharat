import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FaArrowRight,
  FaHandshake,
  FaHome,
  FaMoon,
  FaPeopleArrows,
  FaSignOutAlt,
  FaSun,
  FaSyncAlt,
  FaUserCircle,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { clearCurrentUser, readCurrentUser } from '../lib/currentUser';

const WHAT_YOU_NEED = [
  'Strong listening so you understand teammates, interviewers, and feedback clearly.',
  'Empathy to respond thoughtfully and work well with different personalities.',
  'Teamwork mindset that shows respect, collaboration, and shared ownership.',
  'Conflict-handling ability so you can stay calm and solution-oriented.',
  'Professional behavior, adaptability, and positive communication in group settings.',
];

const WHAT_TO_IMPROVE = [
  'Avoid interrupting others and practice listening before responding.',
  'Improve how you give and receive feedback without becoming defensive.',
  'Work on reading social cues and adjusting your tone in different situations.',
  'Practice explaining disagreements in a respectful and constructive way.',
  'Build stronger collaboration habits during group tasks and discussions.',
];

const InterpersonalSkillsPage = ({ theme, setTheme }) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const currentUser = useMemo(() => readCurrentUser(), []);
  const profileName = currentUser?.name || 'Your Account';

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const cardBase = isDark
    ? 'border border-emerald-500/15 bg-white/5 text-emerald-50 shadow-[0_24px_60px_rgba(0,0,0,0.28)]'
    : 'border border-emerald-100 bg-white/85 text-slate-800 shadow-[0_24px_60px_rgba(16,185,129,0.10)]';

  const toggleTheme = () => setTheme((current) => (current === 'light' ? 'dark' : 'light'));

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
    <div className={`min-h-dvh w-full overflow-x-hidden overflow-y-auto transition-colors duration-500 ${isDark ? 'bg-[#050f0a] text-white' : 'bg-[#f0fdf4] text-slate-900'}`}>
      <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-5 py-5 sm:px-8">
        <nav className={`sticky top-5 z-10 flex items-center justify-between rounded-full px-5 py-4 backdrop-blur-2xl ${isDark ? 'border border-emerald-500/15 bg-[#07110c]/80' : 'border border-white/70 bg-white/85'}`}>
          <div>
            <p className={`text-xs font-bold uppercase tracking-[0.35em] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>SkillNet</p>
            <h1 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Interpersonal Skill</h1>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate('/home')} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${isDark ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-200' : 'border border-emerald-100 bg-white text-emerald-700 shadow-sm'}`}>
              <FaHome />
              Home
            </button>

            <button type="button" onClick={() => navigate('/interview')} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${isDark ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-200' : 'border border-emerald-100 bg-white text-emerald-700 shadow-sm'}`}>
              <FaArrowRight />
              Dashboard
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

        <main className="flex flex-1 items-start justify-center py-8">
          <div className="w-full space-y-6">
            <section className={`rounded-[2rem] p-8 ${cardBase}`}>
              <p className={`text-xs font-bold uppercase tracking-[0.35em] ${isDark ? 'text-emerald-300/80' : 'text-emerald-700'}`}>Interview Skills</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Build stronger interpersonal presence for interviews.</h2>
              <p className={`mt-4 max-w-3xl text-base leading-7 ${isDark ? 'text-emerald-50/75' : 'text-slate-600'}`}>
                This track focuses on how you collaborate, listen, handle feedback, and present yourself as someone others can work with confidently.
              </p>
            </section>

            <section className="grid gap-5 xl:grid-cols-2">
              <article className={`rounded-[2rem] p-6 ${cardBase}`}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isDark ? 'bg-amber-400/10 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>
                    <FaPeopleArrows />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black">What You Need</h3>
                    <p className={isDark ? 'text-emerald-50/65' : 'text-slate-600'}>Core interpersonal traits expected in interviews and team settings.</p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {WHAT_YOU_NEED.map((item) => (
                    <div key={item} className={`rounded-2xl border px-4 py-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-emerald-100 bg-emerald-50/40'}`}>
                      <p className={`text-sm leading-6 ${isDark ? 'text-emerald-50/78' : 'text-slate-600'}`}>{item}</p>
                    </div>
                  ))}
                </div>
              </article>

              <article className={`rounded-[2rem] p-6 ${cardBase}`}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isDark ? 'bg-sky-400/10 text-sky-300' : 'bg-sky-100 text-sky-700'}`}>
                    <FaHandshake />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black">What To Improve</h3>
                    <p className={isDark ? 'text-emerald-50/65' : 'text-slate-600'}>Focus areas that help you work and communicate better with others.</p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {WHAT_TO_IMPROVE.map((item) => (
                    <div key={item} className={`rounded-2xl border px-4 py-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-emerald-100 bg-emerald-50/40'}`}>
                      <p className={`text-sm leading-6 ${isDark ? 'text-emerald-50/78' : 'text-slate-600'}`}>{item}</p>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default InterpersonalSkillsPage;
