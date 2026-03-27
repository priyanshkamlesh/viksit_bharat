import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FaArrowRight,
  FaBullhorn,
  FaComments,
  FaHome,
  FaMoon,
  FaSignOutAlt,
  FaSun,
  FaSyncAlt,
  FaUserCircle,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { clearCurrentUser, readCurrentUser } from '../lib/currentUser';

const WHAT_YOU_NEED = [
  'Clarity in speaking so your ideas are easy to understand.',
  'Confidence while introducing yourself, answering questions, and asking follow-ups.',
  'Structured communication with a clear beginning, middle, and conclusion.',
  'Active listening so you respond to what the interviewer actually asks.',
  'Professional vocabulary, tone, and body-language awareness.',
];

const WHAT_TO_IMPROVE = [
  'Reduce filler words like "um", "like", and repeated pauses.',
  'Practice concise answers instead of over-explaining every point.',
  'Improve pronunciation and pace so your speech feels natural and controlled.',
  'Use examples and short stories to make answers more convincing.',
  'Build comfort with common interview questions through repeated mock practice.',
];

const APPROACH_FLOW = [
  {
    title: 'Understand The Question',
    description: 'Listen carefully, identify what the interviewer is really asking, and avoid jumping into an answer too quickly.',
  },
  {
    title: 'Structure Your Answer',
    description: 'Break the response into a simple flow: direct answer, short explanation, and one example when needed.',
  },
  {
    title: 'Speak Clearly',
    description: 'Use calm pacing, confident tone, and simple language so your answer is easy to follow.',
  },
  {
    title: 'Support With Examples',
    description: 'Add one relevant real-life example, project, or situation to make the answer stronger and more believable.',
  },
  {
    title: 'Close Professionally',
    description: 'End with a crisp final line that reinforces your point and shows confidence.',
  },
];

const CommunicationSkillsPage = ({ theme, setTheme }) => {
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
            <h1 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Communication Skills</h1>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate('/home')} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${isDark ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-200' : 'border border-emerald-100 bg-white text-emerald-700 shadow-sm'}`}>
              <FaHome />
              Home
            </button>

            <button type="button" onClick={() => navigate('/dashboard')} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${isDark ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-200' : 'border border-emerald-100 bg-white text-emerald-700 shadow-sm'}`}>
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
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Build strong communication for interviews.</h2>
              <p className={`mt-4 max-w-3xl text-base leading-7 ${isDark ? 'text-emerald-50/75' : 'text-slate-600'}`}>
                This track focuses on how you speak, present ideas, answer clearly, and create a strong impression during interview conversations.
              </p>
            </section>

            <section className="grid gap-5 xl:grid-cols-2">
              <article className={`rounded-[2rem] p-6 ${cardBase}`}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isDark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                    <FaComments />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black">What You Need</h3>
                    <p className={isDark ? 'text-emerald-50/65' : 'text-slate-600'}>Core abilities expected in interview communication.</p>
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
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isDark ? 'bg-amber-400/10 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>
                    <FaBullhorn />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black">What To Improve</h3>
                    <p className={isDark ? 'text-emerald-50/65' : 'text-slate-600'}>Focus areas that make your communication stronger.</p>
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

            <section className={`rounded-[2rem] p-6 ${cardBase}`}>
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isDark ? 'bg-cyan-400/10 text-cyan-300' : 'bg-cyan-100 text-cyan-700'}`}>
                  <FaArrowRight />
                </div>
                <div>
                  <h3 className="text-2xl font-black">How To Approach The Solution</h3>
                  <p className={isDark ? 'text-emerald-50/65' : 'text-slate-600'}>
                    Follow this flow whenever you answer communication-based questions in an interview.
                  </p>
                </div>
              </div>

              <div className={`mt-6 overflow-hidden rounded-[2rem] border p-4 ${isDark ? 'border-white/10 bg-[#07110c]' : 'border-emerald-100 bg-emerald-50/30'}`}>
                <div className="hidden lg:block">
                  <div className="relative mx-auto h-[680px] max-w-6xl">
                    <svg
                      viewBox="0 0 1200 680"
                      className="absolute inset-0 h-full w-full"
                      aria-hidden="true"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <marker id="flow-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
                          <path d="M0,0 L10,5 L0,10 Z" fill={isDark ? '#6ee7b7' : '#059669'} />
                        </marker>
                      </defs>
                      <path
                        d="M300 160 L405 160"
                        stroke={isDark ? '#6ee7b7' : '#059669'}
                        strokeWidth="4"
                        strokeLinecap="round"
                        fill="none"
                        markerEnd="url(#flow-arrow)"
                      />
                      <path
                        d="M700 160 L805 160"
                        stroke={isDark ? '#6ee7b7' : '#059669'}
                        strokeWidth="4"
                        strokeLinecap="round"
                        fill="none"
                        markerEnd="url(#flow-arrow)"
                      />
                      <path
                        d="M1040 240 C1068 275 1068 330 1010 360"
                        stroke={isDark ? '#6ee7b7' : '#059669'}
                        strokeWidth="4"
                        strokeLinecap="round"
                        fill="none"
                        markerEnd="url(#flow-arrow)"
                      />
                      <path
                        d="M780 390 L605 390"
                        stroke={isDark ? '#6ee7b7' : '#059669'}
                        strokeWidth="4"
                        strokeLinecap="round"
                        fill="none"
                        markerEnd="url(#flow-arrow)"
                      />
                      <path
                        d="M410 420 C340 420 280 435 250 470 C230 495 230 525 285 548"
                        stroke={isDark ? '#6ee7b7' : '#059669'}
                        strokeWidth="4"
                        strokeLinecap="round"
                        fill="none"
                        markerEnd="url(#flow-arrow)"
                      />
                    </svg>

                    {APPROACH_FLOW.map((step, index) => {
                      const positions = [
                        'left-[4%] top-[50px]',
                        'left-[37%] top-[50px]',
                        'left-[70%] top-[50px]',
                        'left-[54%] top-[300px]',
                        'left-[13%] top-[500px]',
                      ];

                      return (
                        <article
                          key={step.title}
                          className={`absolute w-[27%] min-w-[250px] rounded-[1.75rem] border p-5 ${positions[index]} ${isDark ? 'border-white/10 bg-white/5 shadow-[0_18px_40px_rgba(0,0,0,0.2)]' : 'border-emerald-100 bg-white/95 shadow-[0_18px_35px_rgba(16,185,129,0.08)]'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black ${isDark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'}`}>
                              {index + 1}
                            </div>
                            <h4 className="text-base font-black">{step.title}</h4>
                          </div>
                          <p className={`mt-4 text-sm leading-6 ${isDark ? 'text-emerald-50/78' : 'text-slate-600'}`}>
                            {step.description}
                          </p>
                        </article>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4 lg:hidden">
                  {APPROACH_FLOW.map((step, index) => (
                    <div key={step.title} className="flex flex-col items-stretch">
                      <article className={`rounded-[1.75rem] border p-5 ${isDark ? 'border-white/10 bg-white/5 shadow-[0_18px_40px_rgba(0,0,0,0.2)]' : 'border-emerald-100 bg-white/95 shadow-[0_18px_35px_rgba(16,185,129,0.08)]'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black ${isDark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'}`}>
                            {index + 1}
                          </div>
                          <h4 className="text-base font-black">{step.title}</h4>
                        </div>
                        <p className={`mt-4 text-sm leading-6 ${isDark ? 'text-emerald-50/78' : 'text-slate-600'}`}>
                          {step.description}
                        </p>
                      </article>

                      {index < APPROACH_FLOW.length - 1 ? (
                        <div className="flex justify-center py-3">
                          <div className={`flex h-11 w-11 items-center justify-center rounded-full ${isDark ? 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/20' : 'bg-emerald-100 text-emerald-700'}`}>
                            <FaArrowRight className="rotate-90 text-base" />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
};

export default CommunicationSkillsPage;
