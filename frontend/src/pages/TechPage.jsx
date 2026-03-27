import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FaArrowRight,
  FaBrain,
  FaCloud,
  FaCode,
  FaHome,
  FaLayerGroup,
  FaLink,
  FaMoon,
  FaRobot,
  FaSignOutAlt,
  FaSun,
  FaSyncAlt,
  FaUserCircle,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { clearCurrentUser, readCurrentUser } from '../lib/currentUser';

const techOptions = [
  {
    title: 'AI & ML',
    description: 'Explore generative AI, machine learning concepts, model thinking, prompts, and intelligent workflows.',
    route: '/aiml',
    Icon: FaRobot,
    accentLight: 'bg-fuchsia-100 text-fuchsia-700',
    accentDark: 'bg-fuchsia-400/10 text-fuchsia-300',
    textLight: 'text-fuchsia-700',
    textDark: 'text-fuchsia-300',
    skills: ['Generative AI', 'Machine Learning', 'Deep Learning', 'Prompt Engineering'],
  },
  {
    title: 'Programming Language',
    description: 'Strengthen fundamentals in core programming languages, syntax, logic building, and problem solving.',
    route: '/programming-language',
    Icon: FaBrain,
    accentLight: 'bg-emerald-100 text-emerald-700',
    accentDark: 'bg-emerald-500/10 text-emerald-300',
    textLight: 'text-emerald-700',
    textDark: 'text-emerald-300',
    skills: ['JavaScript', 'Python', 'Java', 'C++', 'SQL'],
  },
  {
    title: 'Mern Stack Development',
    description: 'Build end-to-end MERN applications using MongoDB, Express, React, Node.js, and connected workflows.',
    route: '/full-stack-developer',
    Icon: FaCode,
    accentLight: 'bg-amber-100 text-amber-700',
    accentDark: 'bg-amber-400/10 text-amber-300',
    textLight: 'text-amber-700',
    textDark: 'text-amber-300',
    skills: ['MongoDB', 'Express.js', 'React.js', 'Node.js'],
  },
  {
    title: 'Cloud/Devops',
    description: 'Learn cloud platforms, deployment pipelines, automation, infra basics, and DevOps workflows.',
    route: '/cloud-devops',
    Icon: FaCloud,
    accentLight: 'bg-sky-100 text-sky-700',
    accentDark: 'bg-sky-400/10 text-sky-300',
    textLight: 'text-sky-700',
    textDark: 'text-sky-300',
    skills: ['Cloud Platforms', 'CI/CD', 'Containers', 'Monitoring'],
  },
  {
    title: 'Libraries/Frameworks',
    description: 'Work with modern libraries and frameworks used for frontend, backend, and scalable application design.',
    route: '/libraries-frameworks',
    Icon: FaLayerGroup,
    accentLight: 'bg-violet-100 text-violet-700',
    accentDark: 'bg-violet-400/10 text-violet-300',
    textLight: 'text-violet-700',
    textDark: 'text-violet-300',
    skills: ['React', 'Next.js', 'Express', 'Tailwind CSS'],
  },
  {
    title: 'APIs',
    description: 'Understand REST APIs, integrations, request flows, authentication, and practical service communication.',
    route: '/apis',
    Icon: FaLink,
    accentLight: 'bg-rose-100 text-rose-700',
    accentDark: 'bg-rose-400/10 text-rose-300',
    textLight: 'text-rose-700',
    textDark: 'text-rose-300',
    skills: ['REST Design', 'Auth APIs', 'Integrations', 'API Testing'],
  },
  {
    title: 'Database',
    description: 'Learn relational and NoSQL databases, querying, schema design, optimization, and data handling basics.',
    route: '/database',
    Icon: FaCloud,
    accentLight: 'bg-cyan-100 text-cyan-700',
    accentDark: 'bg-cyan-400/10 text-cyan-300',
    textLight: 'text-cyan-700',
    textDark: 'text-cyan-300',
    skills: ['SQL Databases', 'NoSQL', 'Optimization', 'Schema Design'],
  },
];

const TechPage = ({ theme, setTheme }) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const profileMenuRef = useRef(null);
  const currentUser = useMemo(() => readCurrentUser(), []);
  const profileName = currentUser?.name || 'Your Account';

  const cardBase = isDark
    ? 'border border-emerald-500/15 bg-white/5 text-emerald-50 shadow-[0_24px_60px_rgba(0,0,0,0.28)]'
    : 'border border-emerald-100 bg-white/80 text-slate-800 shadow-[0_24px_60px_rgba(16,185,129,0.10)]';

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

  return (
    <div className={`min-h-dvh w-full overflow-x-hidden overflow-y-auto transition-colors duration-500 ${isDark ? 'bg-[#050f0a] text-white' : 'bg-[#f0fdf4] text-slate-900'}`}>
      <div
        className={`mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-5 py-5 transition-all duration-700 sm:px-8 ${
          isReady ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}
      >
        <nav className={`sticky top-5 z-10 flex items-center justify-between rounded-full px-5 py-4 backdrop-blur-2xl ${isDark ? 'border border-emerald-500/15 bg-[#07110c]/80' : 'border border-white/70 bg-white/85'}`}>
          <div>
            <p className={`text-xs font-bold uppercase tracking-[0.35em] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>SkillNet</p>
            <h1 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Technology Tracks</h1>
          </div>

          <div className="flex items-center gap-3">
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
              <FaArrowRight />
              Dashboard
            </button>

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
                <div className={`absolute right-0 top-[calc(100%+0.75rem)] z-20 min-w-60 overflow-hidden rounded-2xl border backdrop-blur-2xl ${isDark ? 'border-emerald-500/20 bg-[#0b1711]/95 shadow-[0_24px_50px_rgba(0,0,0,0.35)]' : 'border-emerald-100 bg-white/95 shadow-[0_24px_50px_rgba(16,185,129,0.12)]'}`}>
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
          </div>
        </nav>

        <main className="flex flex-1 items-start justify-center py-6">
          <div className="w-full">
            <div className="mx-auto max-w-3xl text-center">
              <p className={`text-xs font-bold uppercase tracking-[0.35em] ${isDark ? 'text-emerald-300/80' : 'text-emerald-700'}`}>Technology Skills</p>
              <h2 className={`mt-3 text-3xl font-black tracking-tight sm:text-4xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Pick the technical path you want to sharpen next.
              </h2>
            </div>

            <div className="mx-auto mt-8 grid max-w-6xl gap-5 md:grid-cols-2 xl:grid-cols-3">
              {techOptions.map(({ title, description, route, Icon, accentLight, accentDark, textLight, textDark, skills }) => (
                <button
                  key={title}
                  type="button"
                  onClick={() => navigate(route)}
                  className={`group rounded-[2rem] p-6 text-left transition-all hover:-translate-y-1 ${cardBase}`}
                >
                  <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${isDark ? accentDark : accentLight}`}>
                    <Icon className="text-xl" />
                  </div>
                  <h3 className="text-xl font-black">{title}</h3>
                  <p className={`mt-3 text-sm leading-6 ${isDark ? 'text-emerald-50/70' : 'text-slate-600'}`}>{description}</p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          isDark ? 'bg-white/6 text-emerald-100/85' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className={`mt-6 inline-flex items-center gap-2 text-sm font-bold ${isDark ? textDark : textLight}`}>
                    Explore track
                    <FaArrowRight className="transition-transform group-hover:translate-x-1" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TechPage;
