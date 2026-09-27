import React from 'react'
import { FaBriefcase, FaComments, FaHome, FaUsers } from 'react-icons/fa'
import { useLocation, useNavigate } from 'react-router-dom'

const navItems = [
  { label: 'Home', route: '/home', icon: FaHome },
  { label: 'Job Roles', route: '/job-roles', icon: FaBriefcase },
  { label: 'Interview', route: '/interview', icon: FaComments },
  { label: 'Recommendations', route: '/recommendations', icon: FaUsers },
]

const QuickPageSwitcher = ({ theme }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const isDark = theme === 'dark'

  const activeRoute = location.pathname

  return (
    <aside className={`rounded-[2rem] border p-5 ${isDark ? 'border-white/10 bg-white/5 text-emerald-50' : 'border-emerald-100 bg-white text-slate-900'}`}>
      <p className={`text-xs font-black uppercase tracking-[0.3em] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
        Quick Switch
      </p>
      <p className={`mt-2 text-sm ${isDark ? 'text-emerald-100/75' : 'text-slate-600'}`}>
        Jump between the pages instantly from this sidebar.
      </p>

      <div className="mt-5 space-y-3">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = activeRoute === item.route
          return (
            <button
              key={item.route}
              type="button"
              onClick={() => navigate(item.route)}
              className={`flex w-full items-center gap-3 rounded-3xl border px-4 py-3 text-left text-sm font-semibold transition-all hover:-translate-y-0.5 ${
                active
                  ? isDark
                    ? 'border-emerald-400 bg-emerald-400/10 text-emerald-100'
                    : 'border-emerald-600 bg-emerald-50 text-emerald-700'
                  : isDark
                    ? 'border-white/10 bg-white/5 text-emerald-100 hover:bg-white/10'
                    : 'border-emerald-100 bg-slate-50 text-slate-700 hover:bg-emerald-50'
              }`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 text-lg text-emerald-300">
                <Icon />
              </span>
              {item.label}
            </button>
          )
        })}
      </div>
    </aside>
  )
}

export default QuickPageSwitcher
