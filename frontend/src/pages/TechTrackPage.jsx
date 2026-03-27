import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FaArrowRight,
  FaBalanceScale,
  FaBookOpen,
  FaBrain,
  FaChartLine,
  FaCloud,
  FaCode,
  FaComments,
  FaCubes,
  FaDatabase,
  FaHome,
  FaLayerGroup,
  FaLink,
  FaMoon,
  FaProjectDiagram,
  FaRobot,
  FaRoute,
  FaServer,
  FaShieldAlt,
  FaSignOutAlt,
  FaSun,
  FaSyncAlt,
  FaTools,
  FaUserCircle,
  FaVial,
} from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';

import { slugifySkill } from '../data/skillRoadmaps';
import { clearCurrentUser, readCurrentUser } from '../lib/currentUser';

const TRACKS = {
  'ai-ml': {
    badge: 'AI & ML Skills',
    title: 'Explore the core skill areas that shape modern AI & ML work.',
    options: [
      {
        title: 'Generative AI',
        description: 'Work with LLMs, prompts, agents, retrieval, and real-world generative AI applications.',
        lightAccent: 'bg-fuchsia-100 text-fuchsia-700',
        darkAccent: 'bg-fuchsia-400/10 text-fuchsia-300',
        textLight: 'text-fuchsia-700',
        textDark: 'text-fuchsia-300',
        Icon: FaRobot,
      },
      {
        title: 'Machine Learning',
        description: 'Learn supervised and unsupervised learning, model training, evaluation, and feature thinking.',
        lightAccent: 'bg-emerald-100 text-emerald-700',
        darkAccent: 'bg-emerald-500/10 text-emerald-300',
        textLight: 'text-emerald-700',
        textDark: 'text-emerald-300',
        Icon: FaBrain,
      },
      {
        title: 'Data Analysis',
        description: 'Build data intuition through cleaning, exploration, visualization, and insight-driven reasoning.',
        lightAccent: 'bg-amber-100 text-amber-700',
        darkAccent: 'bg-amber-400/10 text-amber-300',
        textLight: 'text-amber-700',
        textDark: 'text-amber-300',
        Icon: FaRoute,
      },
      {
        title: 'Deep Learning',
        description: 'Understand neural networks, backpropagation, CNNs, RNNs, and deep learning workflows.',
        lightAccent: 'bg-sky-100 text-sky-700',
        darkAccent: 'bg-sky-400/10 text-sky-300',
        textLight: 'text-sky-700',
        textDark: 'text-sky-300',
        Icon: FaProjectDiagram,
      },
      {
        title: 'Prompt Engineering',
        description: 'Learn prompt design patterns, instruction tuning habits, and better output control strategies.',
        lightAccent: 'bg-violet-100 text-violet-700',
        darkAccent: 'bg-violet-400/10 text-violet-300',
        textLight: 'text-violet-700',
        textDark: 'text-violet-300',
        Icon: FaComments,
      },
    ],
  },
  'programming-language': {
    badge: 'Programming Language Skills',
    title: 'Sharpen the language fundamentals that power every technical role.',
    options: [
      {
        title: 'JavaScript',
        description: 'Strengthen fundamentals used across frontend, backend, APIs, and modern web application logic.',
        lightAccent: 'bg-yellow-100 text-yellow-700',
        darkAccent: 'bg-yellow-400/10 text-yellow-300',
        textLight: 'text-yellow-700',
        textDark: 'text-yellow-300',
        Icon: FaCode,
      },
      {
        title: 'Python',
        description: 'Build fluency for scripting, automation, AI/ML, backend systems, and data-oriented workflows.',
        lightAccent: 'bg-emerald-100 text-emerald-700',
        darkAccent: 'bg-emerald-500/10 text-emerald-300',
        textLight: 'text-emerald-700',
        textDark: 'text-emerald-300',
        Icon: FaBookOpen,
      },
      {
        title: 'Java',
        description: 'Practice object-oriented design, strong typing, backend development, and enterprise fundamentals.',
        lightAccent: 'bg-orange-100 text-orange-700',
        darkAccent: 'bg-orange-400/10 text-orange-300',
        textLight: 'text-orange-700',
        textDark: 'text-orange-300',
        Icon: FaServer,
      },
      {
        title: 'C++',
        description: 'Improve problem solving, memory concepts, performance thinking, and DSA-heavy coding practice.',
        lightAccent: 'bg-sky-100 text-sky-700',
        darkAccent: 'bg-sky-400/10 text-sky-300',
        textLight: 'text-sky-700',
        textDark: 'text-sky-300',
        Icon: FaTools,
      },
      {
        title: 'SQL',
        description: 'Master querying, joins, filtering, aggregations, and database-driven reasoning for real systems.',
        lightAccent: 'bg-violet-100 text-violet-700',
        darkAccent: 'bg-violet-400/10 text-violet-300',
        textLight: 'text-violet-700',
        textDark: 'text-violet-300',
        Icon: FaDatabase,
      },
    ],
  },
  'full-stack-developer': {
    badge: 'Mern Stack Skills',
    title: 'Master the core technologies that make up a modern MERN application stack.',
    options: [
      {
        title: 'MongoDB',
        description: 'Work with collections, schemas, queries, aggregations, and document-based data modeling.',
        lightAccent: 'bg-emerald-100 text-emerald-700',
        darkAccent: 'bg-emerald-500/10 text-emerald-300',
        textLight: 'text-emerald-700',
        textDark: 'text-emerald-300',
        Icon: FaDatabase,
      },
      {
        title: 'Express.js',
        description: 'Build routing layers, middleware, REST APIs, authentication flows, and backend business logic.',
        lightAccent: 'bg-amber-100 text-amber-700',
        darkAccent: 'bg-amber-400/10 text-amber-300',
        textLight: 'text-amber-700',
        textDark: 'text-amber-300',
        Icon: FaServer,
      },
      {
        title: 'React.js',
        description: 'Create component-driven user interfaces with state, routing, hooks, and dynamic frontend behavior.',
        lightAccent: 'bg-sky-100 text-sky-700',
        darkAccent: 'bg-sky-400/10 text-sky-300',
        textLight: 'text-sky-700',
        textDark: 'text-sky-300',
        Icon: FaLayerGroup,
      },
      {
        title: 'Node.js',
        description: 'Power the server runtime, package ecosystem, async workflows, and scalable JavaScript backends.',
        lightAccent: 'bg-violet-100 text-violet-700',
        darkAccent: 'bg-violet-400/10 text-violet-300',
        textLight: 'text-violet-700',
        textDark: 'text-violet-300',
        Icon: FaCode,
      },
    ],
  },
  'cloud-devops': {
    badge: 'Cloud/Devops Skills',
    title: 'Learn the infrastructure and automation skills behind reliable modern products.',
    options: [
      {
        title: 'Cloud Platforms',
        description: 'Understand core services from AWS, Azure, or GCP and how apps run in the cloud.',
        lightAccent: 'bg-sky-100 text-sky-700',
        darkAccent: 'bg-sky-400/10 text-sky-300',
        textLight: 'text-sky-700',
        textDark: 'text-sky-300',
        Icon: FaCloud,
      },
      {
        title: 'CI/CD',
        description: 'Build automated pipelines for testing, integration, and smoother deployment workflows.',
        lightAccent: 'bg-emerald-100 text-emerald-700',
        darkAccent: 'bg-emerald-500/10 text-emerald-300',
        textLight: 'text-emerald-700',
        textDark: 'text-emerald-300',
        Icon: FaRoute,
      },
      {
        title: 'Containers',
        description: 'Learn Docker-style packaging, runtime environments, and portable deployment strategies.',
        lightAccent: 'bg-violet-100 text-violet-700',
        darkAccent: 'bg-violet-400/10 text-violet-300',
        textLight: 'text-violet-700',
        textDark: 'text-violet-300',
        Icon: FaCubes,
      },
      {
        title: 'Monitoring',
        description: 'Track reliability, logs, and health signals so systems stay observable and maintainable.',
        lightAccent: 'bg-amber-100 text-amber-700',
        darkAccent: 'bg-amber-400/10 text-amber-300',
        textLight: 'text-amber-700',
        textDark: 'text-amber-300',
        Icon: FaChartLine,
      },
    ],
  },
  'libraries-frameworks': {
    badge: 'Libraries/Frameworks',
    title: 'Work with the ecosystems that speed up development across the stack.',
    options: [
      {
        title: 'React',
        description: 'Build component-driven interfaces with state, routing, and scalable frontend patterns.',
        lightAccent: 'bg-sky-100 text-sky-700',
        darkAccent: 'bg-sky-400/10 text-sky-300',
        textLight: 'text-sky-700',
        textDark: 'text-sky-300',
        Icon: FaLayerGroup,
      },
      {
        title: 'Node.js & Express',
        description: 'Create backend services, routing layers, middleware, and practical server-side logic.',
        lightAccent: 'bg-emerald-100 text-emerald-700',
        darkAccent: 'bg-emerald-500/10 text-emerald-300',
        textLight: 'text-emerald-700',
        textDark: 'text-emerald-300',
        Icon: FaServer,
      },
      {
        title: 'Tailwind CSS',
        description: 'Design responsive, utility-driven interfaces quickly while keeping visual consistency.',
        lightAccent: 'bg-cyan-100 text-cyan-700',
        darkAccent: 'bg-cyan-400/10 text-cyan-300',
        textLight: 'text-cyan-700',
        textDark: 'text-cyan-300',
        Icon: FaCode,
      },
      {
        title: 'Next.js',
        description: 'Combine frontend and backend concerns with routing, rendering strategies, and app structure.',
        lightAccent: 'bg-violet-100 text-violet-700',
        darkAccent: 'bg-violet-400/10 text-violet-300',
        textLight: 'text-violet-700',
        textDark: 'text-violet-300',
        Icon: FaProjectDiagram,
      },
    ],
  },
  apis: {
    badge: 'API Skills',
    title: 'Understand the service layer that connects systems, products, and data.',
    options: [
      {
        title: 'REST API Design',
        description: 'Design clean endpoints, resources, routes, and conventions for robust service communication.',
        lightAccent: 'bg-rose-100 text-rose-700',
        darkAccent: 'bg-rose-400/10 text-rose-300',
        textLight: 'text-rose-700',
        textDark: 'text-rose-300',
        Icon: FaLink,
      },
      {
        title: 'Authentication APIs',
        description: 'Implement secure login, access control, tokens, and protected API request flows.',
        lightAccent: 'bg-emerald-100 text-emerald-700',
        darkAccent: 'bg-emerald-500/10 text-emerald-300',
        textLight: 'text-emerald-700',
        textDark: 'text-emerald-300',
        Icon: FaShieldAlt,
      },
      {
        title: 'Third-Party Integrations',
        description: 'Connect payment, auth, maps, AI, and external platforms into your application stack.',
        lightAccent: 'bg-amber-100 text-amber-700',
        darkAccent: 'bg-amber-400/10 text-amber-300',
        textLight: 'text-amber-700',
        textDark: 'text-amber-300',
        Icon: FaRoute,
      },
      {
        title: 'Testing APIs',
        description: 'Validate requests, responses, errors, and edge cases using practical API testing habits.',
        lightAccent: 'bg-violet-100 text-violet-700',
        darkAccent: 'bg-violet-400/10 text-violet-300',
        textLight: 'text-violet-700',
        textDark: 'text-violet-300',
        Icon: FaVial,
      },
    ],
  },
  database: {
    badge: 'Database Skills',
    title: 'Build strong data foundations for application logic, storage, and system design.',
    options: [
      {
        title: 'Relational Databases',
        description: 'Learn schemas, joins, normalization, and SQL design for structured application data.',
        lightAccent: 'bg-cyan-100 text-cyan-700',
        darkAccent: 'bg-cyan-400/10 text-cyan-300',
        textLight: 'text-cyan-700',
        textDark: 'text-cyan-300',
        Icon: FaDatabase,
      },
      {
        title: 'NoSQL Databases',
        description: 'Understand document, key-value, and flexible-schema approaches for modern products.',
        lightAccent: 'bg-emerald-100 text-emerald-700',
        darkAccent: 'bg-emerald-500/10 text-emerald-300',
        textLight: 'text-emerald-700',
        textDark: 'text-emerald-300',
        Icon: FaCubes,
      },
      {
        title: 'Query Optimization',
        description: 'Improve performance with indexing, query planning, and better data access patterns.',
        lightAccent: 'bg-amber-100 text-amber-700',
        darkAccent: 'bg-amber-400/10 text-amber-300',
        textLight: 'text-amber-700',
        textDark: 'text-amber-300',
        Icon: FaChartLine,
      },
      {
        title: 'Database Design',
        description: 'Model entities, relationships, constraints, and scalable data structures with confidence.',
        lightAccent: 'bg-violet-100 text-violet-700',
        darkAccent: 'bg-violet-400/10 text-violet-300',
        textLight: 'text-violet-700',
        textDark: 'text-violet-300',
        Icon: FaProjectDiagram,
      },
    ],
  },
};

const TechTrackPage = ({ theme, setTheme, trackKey }) => {
  const navigate = useNavigate();
  const { track } = useParams();
  const isDark = theme === 'dark';
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [selectedProgrammingSkill, setSelectedProgrammingSkill] = useState(null);
  const profileMenuRef = useRef(null);
  const currentUser = useMemo(() => readCurrentUser(), []);
  const profileName = currentUser?.name || 'Your Account';

  const resolvedTrack = trackKey || track;
  const page = useMemo(() => TRACKS[resolvedTrack], [resolvedTrack]);

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

  const handleOptionClick = (title) => {
    if (resolvedTrack === 'programming-language') {
      setSelectedProgrammingSkill(title);
      return;
    }

    navigate(`/roadmap/${slugifySkill(title)}`);
  };

  const handleProgrammingLevelSelect = (level) => {
    if (!selectedProgrammingSkill) {
      return;
    }

    navigate(`/roadmap/${slugifySkill(selectedProgrammingSkill)}?level=${level}`);
    setSelectedProgrammingSkill(null);
  };

  if (!page) {
    navigate('/tech');
    return null;
  }

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
            <h1 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{page.badge}</h1>
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
              <p className={`text-xs font-bold uppercase tracking-[0.35em] ${isDark ? 'text-emerald-300/80' : 'text-emerald-700'}`}>{page.badge}</p>
              <h2 className={`mt-3 text-3xl font-black tracking-tight sm:text-4xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {page.title}
              </h2>
            </div>

            <div className="mx-auto mt-8 grid max-w-6xl gap-5 md:grid-cols-2 xl:grid-cols-3">
              {page.options.map(({ title, description, lightAccent, darkAccent, textLight, textDark, Icon }) => (
                <button
                  key={title}
                  type="button"
                  onClick={() => handleOptionClick(title)}
                  className={`group rounded-[2rem] p-6 text-left transition-all hover:-translate-y-1 ${cardBase}`}
                >
                  <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${isDark ? darkAccent : lightAccent}`}>
                    <Icon className="text-xl" />
                  </div>
                  <h3 className="text-xl font-black">{title}</h3>
                  <p className={`mt-3 text-sm leading-6 ${isDark ? 'text-emerald-50/70' : 'text-slate-600'}`}>{description}</p>
                  <div className={`mt-6 inline-flex items-center gap-2 text-sm font-bold ${isDark ? textDark : textLight}`}>
                    View roadmap
                    <FaArrowRight className="transition-transform group-hover:translate-x-1" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </main>

        {selectedProgrammingSkill ? (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-5 backdrop-blur-sm">
            <div className={`w-full max-w-lg rounded-[2rem] p-7 ${cardBase}`}>
              <p className={`text-xs font-bold uppercase tracking-[0.35em] ${isDark ? 'text-emerald-300/80' : 'text-emerald-700'}`}>
                Skill Selection
              </p>
              <h3 className="mt-3 text-2xl font-black">{selectedProgrammingSkill}</h3>
              <p className={`mt-3 text-sm leading-6 ${isDark ? 'text-emerald-50/70' : 'text-slate-600'}`}>
                Choose the level you want the roadmap, platforms, videos, and mock test to be generated for.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  { id: 'beginner', label: 'Beginner' },
                  { id: 'intermediate', label: 'Intermediate' },
                  { id: 'advanced', label: 'Advanced' },
                ].map((level) => (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => handleProgrammingLevelSelect(level.id)}
                    className={`rounded-2xl px-4 py-4 text-sm font-black transition-all ${isDark ? 'bg-white/5 text-emerald-100 hover:bg-emerald-400 hover:text-[#052414]' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white'}`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedProgrammingSkill(null)}
                  className={`rounded-full px-5 py-2 text-sm font-bold transition-all ${isDark ? 'text-emerald-100 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default TechTrackPage;
