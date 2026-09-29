import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FaArrowRight, FaBriefcase, FaFileAlt, FaInbox, FaMicrophoneAlt, FaClipboardCheck, FaMoon, FaSignOutAlt, FaSun, FaSyncAlt, FaUserCheck, FaUserCircle, FaUsers } from 'react-icons/fa';
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
        className={`mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-5 py-5 transition-all duration-700 sm:px-8 sm:py-6 ${isReady ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
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

            <div className="mx-auto mt-10 grid max-w-6xl gap-6 lg:grid-cols-3">
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
              <button
                type="button"
                onClick={() => navigate('/career-assessment')}
                className={`group rounded-[2rem] p-7 text-left transition-all hover:-translate-y-1 ${cardBase}`}
              >
                <div
                  className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${isDark
                      ? 'bg-emerald-400/10 text-emerald-300'
                      : 'bg-emerald-100 text-emerald-700'
                    }`}
                >
                  <FaClipboardCheck className="text-xl" />
                </div>

                <h3 className="text-xl font-black">
                  Career Assessment
                </h3>

                <p
                  className={`mt-3 text-sm leading-6 ${isDark
                      ? 'text-emerald-50/70'
                      : 'text-slate-600'
                    }`}
                >
                  Assess your skills, track your career progress, or
                  continue the assessment path from your personalized roadmap.
                </p>

                <div
                  className={`mt-6 inline-flex items-center gap-2 text-sm font-bold ${isDark
                      ? 'text-emerald-300'
                      : 'text-emerald-700'
                    }`}
                >
                  Start assessment
                  <FaArrowRight className="transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            </div>
            {/* ============================= */}
            {/* AI CAREER READINESS CARD */}
            {/* ============================= */}

            <div
              style={{
                position: "relative",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "35px",
                marginTop: "28px",
                padding: "30px 34px",
                borderRadius: "22px",
                border: "1px solid rgba(85, 217, 155, 0.25)",
                background:
                  "linear-gradient(120deg, #0d2119 0%, #0b1713 55%, #0e2119 100%)",
                overflow: "hidden",
                boxShadow:
                  "0 15px 45px rgba(0, 0, 0, 0.18)"
              }}
            >
              {/* Decorative Glow */}

              <div
                style={{
                  position: "absolute",
                  width: "220px",
                  height: "220px",
                  right: "90px",
                  top: "-100px",
                  borderRadius: "50%",
                  background:
                    "rgba(85, 217, 155, 0.08)",
                  filter: "blur(30px)",
                  pointerEvents: "none"
                }}
              />


              {/* LEFT CONTENT */}

              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  maxWidth: "720px"
                }}
              >

                {/* Small Label */}

                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "12px",
                    color: "#55d99b",
                    fontSize: "11px",
                    fontWeight: "700",
                    letterSpacing: "2.5px"
                  }}
                >
                  <span
                    style={{
                      width: "7px",
                      height: "7px",
                      borderRadius: "50%",
                      background: "#55d99b",
                      boxShadow:
                        "0 0 12px rgba(85, 217, 155, 0.8)"
                    }}
                  />

                  AI CAREER INTELLIGENCE
                </div>


                {/* Heading */}

                <h2
                  style={{
                    margin: 0,
                    fontSize: "30px",
                    lineHeight: "1.2",
                    fontWeight: "750",
                    color: "#f5f7f6"
                  }}
                >
                  Are You Career Ready?
                </h2>


                {/* Description */}

                <p
                  style={{
                    margin: "12px 0 22px",
                    maxWidth: "650px",
                    color: "#96a69f",
                    fontSize: "14px",
                    lineHeight: "1.7"
                  }}
                >
                  Measure your employability using your skills,
                  resume, projects, assessments and interview
                  performance. Discover your skill gaps and get
                  a personalized career roadmap.
                </p>


                {/* Features */}

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "9px",
                    marginBottom: "22px"
                  }}
                >

                  {[
                    "Skill Analysis",
                    "Resume Readiness",
                    "Project Evidence",
                    "Career Roadmap"
                  ].map((item) => (
                    <span
                      key={item}
                      style={{
                        padding: "7px 11px",
                        borderRadius: "8px",
                        border:
                          "1px solid rgba(85, 217, 155, 0.14)",
                        background:
                          "rgba(85, 217, 155, 0.05)",
                        color: "#aebbb5",
                        fontSize: "11px"
                      }}
                    >
                      {item}
                    </span>
                  ))}

                </div>


                {/* CTA */}

                <button
                  onClick={() =>
                    navigate("/career-readiness")
                  }
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "12px 19px",
                    border: "none",
                    borderRadius: "10px",
                    background: "#55d99b",
                    color: "#07100d",
                    fontSize: "13px",
                    fontWeight: "750",
                    cursor: "pointer",
                    boxShadow:
                      "0 8px 25px rgba(85, 217, 155, 0.16)",
                    transition:
                      "transform 0.2s ease, box-shadow 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform =
                      "translateY(-2px)";

                    e.currentTarget.style.boxShadow =
                      "0 12px 30px rgba(85, 217, 155, 0.25)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform =
                      "translateY(0)";

                    e.currentTarget.style.boxShadow =
                      "0 8px 25px rgba(85, 217, 155, 0.16)";
                  }}
                >
                  Check My Career Readiness

                  <span
                    style={{
                      fontSize: "17px",
                      lineHeight: 1
                    }}
                  >
                    →
                  </span>
                </button>

              </div>


              {/* RIGHT VISUAL */}

              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  width: "190px",
                  height: "190px",
                  minWidth: "190px",
                  borderRadius: "50%",
                  border:
                    "1px solid rgba(85, 217, 155, 0.25)",
                  background:
                    "radial-gradient(circle, rgba(85,217,155,0.10), rgba(85,217,155,0.025) 65%, transparent 70%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow:
                    "inset 0 0 35px rgba(85, 217, 155, 0.05)"
                }}
              >

                <div
                  style={{
                    fontSize: "34px",
                    marginBottom: "8px"
                  }}
                >
                  🎯
                </div>

                <div
                  style={{
                    color: "#71827a",
                    fontSize: "10px",
                    letterSpacing: "1.5px",
                    textTransform: "uppercase"
                  }}
                >
                  AI Powered
                </div>

                <div
                  style={{
                    marginTop: "5px",
                    color: "#55d99b",
                    fontSize: "18px",
                    fontWeight: "750",
                    textAlign: "center",
                    lineHeight: "1.2"
                  }}
                >
                  Career
                  <br />
                  Intelligence
                </div>

              </div>

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
