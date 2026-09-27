import React, { useEffect, useState } from 'react';
import {
  FaBars,
  FaBriefcase,
  FaComments,
  FaEnvelope,
  FaHome,
  FaMoon,
  FaRobot,
  FaSignOutAlt,
  FaSun,
  FaTimes,
  FaUserCircle,
  FaUsers,
} from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';

import { clearCurrentUser } from '../lib/currentUser';

const navItems = [
  { label: 'Home', route: '/home', icon: FaHome },
  { label: 'Profile', route: '/profile', icon: FaUserCircle },
  { label: 'Job Roles', route: '/job-roles', icon: FaBriefcase },
  { label: 'Interview', route: '/interview', icon: FaComments },
  { label: 'Recommendations', route: '/recommendations', icon: FaUsers },
  { label: 'Recommended Profiles', route: '/recommendations/profiles', icon: FaUsers },
  { label: 'Dashboard', route: '/dashboard', icon: FaRobot },
  { label: 'Inbox', route: '/inbox', icon: FaEnvelope },
];

const ResponsiveNavigation = ({ theme, setTheme, currentUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollUi, setScrollUi] = useState({ hidden: false, opacity: 1 });
  const isDark = theme === 'dark';

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let previousScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > previousScrollY;
      const atTop = currentScrollY <= 8;
      const opacity = Math.max(0.18, 1 - currentScrollY / 450);

      setScrollUi({
        hidden: !atTop && scrollingDown,
        opacity: atTop ? 1 : opacity,
      });
      previousScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (route) => {
    if (route === '/recommendations') {
      return location.pathname === route;
    }

    return location.pathname === route || location.pathname.startsWith(`${route}/`);
  };

  const handleNavigate = (route) => {
    setIsMenuOpen(false);
    navigate(route);
  };

  const handleLogout = () => {
    clearCurrentUser();
    setIsMenuOpen(false);
    navigate('/login', { replace: true });
  };

  const surfaceClass = isDark
    ? 'border-emerald-500/20 bg-[#07110c]/95 text-emerald-50 shadow-[0_20px_55px_rgba(0,0,0,0.28)]'
    : 'border-emerald-100 bg-white/95 text-slate-900 shadow-[0_20px_55px_rgba(16,185,129,0.12)]';
  const mutedClass = isDark ? 'text-emerald-100/65' : 'text-slate-500';
  const activeClass = isDark ? 'bg-emerald-400/15 text-emerald-100' : 'bg-emerald-50 text-emerald-700';
  const iconButtonClass = `rounded-2xl border p-3 transition-colors ${isDark ? 'border-emerald-500/20 bg-[#07110c]/95 text-emerald-100 hover:bg-emerald-400/15 hover:text-emerald-100' : 'border-emerald-100 bg-white/95 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'}`;

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ease-out ${scrollUi.hidden ? '-translate-y-1/2' : 'translate-y-0'} ${isDark ? 'bg-[#050f0a]' : 'bg-[#f0fdf4]'}`} style={{ opacity: scrollUi.opacity }}>
      <div className="mx-3 flex items-center gap-3 py-3 sm:mx-6">
        <div className="relative shrink-0">
        <button type="button" onClick={() => setIsMenuOpen((current) => !current)} className={iconButtonClass} aria-expanded={isMenuOpen} aria-controls="navigation-menu" aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'} title={isMenuOpen ? 'Close menu' : 'Open menu'}>
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        {isMenuOpen ? (
          <div id="navigation-menu" className={`absolute left-0 top-[calc(100%+0.75rem)] w-[min(20rem,calc(100vw-2rem))] rounded-3xl border p-3 backdrop-blur-2xl ${surfaceClass}`}>
            <div className="grid grid-cols-1 gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.route);
                return (
                  <button key={item.route} type="button" onClick={() => handleNavigate(item.route)} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold ${active ? activeClass : `${mutedClass} hover:bg-emerald-500/10`}`}>
                    <Icon />
                    {item.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex items-center gap-2 border-t border-emerald-500/15 pt-2">
              <span className={`min-w-0 flex-1 truncate px-3 text-xs font-semibold ${mutedClass}`}>{currentUser?.name || currentUser?.email || 'Account'}</span>
              <button type="button" onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))} className={`rounded-2xl p-3 ${mutedClass}`} aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}>
                {isDark ? <FaSun /> : <FaMoon />}
              </button>
              <button type="button" onClick={handleLogout} className="rounded-2xl p-3 text-rose-500" aria-label="Log out">
                <FaSignOutAlt />
              </button>
            </div>
          </div>
        ) : null}
        </div>

        <nav className={`min-w-0 flex-1 rounded-3xl border px-4 py-4 backdrop-blur-2xl sm:rounded-full ${surfaceClass}`} aria-label="Primary navigation">
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={() => handleNavigate('/home')} className="flex min-w-0 items-center gap-3 text-left">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-lg font-black text-emerald-950">S</span>
            <span className="hidden min-w-0 sm:block">
              <span className="block text-[10px] font-black uppercase tracking-[0.28em] text-emerald-500">SkillNet</span>
              <span className="block truncate text-sm font-black">Career workspace</span>
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))} className={`rounded-full p-2.5 ${mutedClass} hover:bg-emerald-500/10 hover:text-emerald-500`} aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'} title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}>
              {isDark ? <FaSun /> : <FaMoon />}
            </button>
            <button type="button" onClick={() => handleNavigate('/profile')} className={`rounded-full p-2.5 ${mutedClass} hover:bg-emerald-500/10 hover:text-emerald-500`} aria-label="Open profile" title="Profile">
              <FaUserCircle />
            </button>
          </div>
        </div>
        </nav>
      </div>
    </header>
  );
};

export default ResponsiveNavigation;
