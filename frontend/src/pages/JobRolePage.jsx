import React, { useEffect, useMemo, useState } from 'react';
import {
  FaArrowRight,
  FaBriefcase,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

import { BRANCH_OPTIONS, getJobRolesForBranch } from '../data/careerPaths';
import { readCurrentUser } from '../lib/currentUser';

const JobRolePage = ({ theme, setTheme }) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const currentUser = useMemo(() => readCurrentUser(), []);
  const [isReady, setIsReady] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(currentUser?.branch || '');

  const cardBase = isDark
    ? 'border border-emerald-500/15 bg-white/5 text-emerald-50 shadow-[0_24px_60px_rgba(0,0,0,0.28)]'
    : 'border border-emerald-100 bg-white/80 text-slate-800 shadow-[0_24px_60px_rgba(16,185,129,0.10)]';

  useEffect(() => {
    setIsReady(true);
  }, []);

  const handleContinue = () => {
    if (!selectedBranch) {
      return;
    }

    navigate(`/job-roles/types?branch=${encodeURIComponent(selectedBranch)}`);
  };

  return (
    <div className={`min-h-dvh w-full transition-colors duration-500 ${isDark ? 'bg-[#050f0a] text-white' : 'bg-[#f0fdf4] text-slate-900'}`}>
      <div className={`mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-5 py-5 sm:px-8 ${isReady ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'} transition-all duration-700`}>
        <main className="flex flex-1 flex-col justify-center py-6">
            <div className="w-full">
              <div className="mx-auto max-w-3xl text-center">
              <p className={`text-xs font-bold uppercase tracking-[0.35em] ${isDark ? 'text-emerald-300/80' : 'text-emerald-700'}`}>Job Profile</p>
              <h2 className={`mt-3 text-3xl font-black tracking-tight sm:text-4xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Pick your branch, then choose the job role you want to move toward.
              </h2>
              <p className={`mt-4 text-sm leading-7 sm:text-base ${isDark ? 'text-emerald-50/75' : 'text-slate-600'}`}>
                This selection updates your collaboration profile and helps the app understand the role you are preparing for.
              </p>
            </div>

            <div className="mx-auto mt-8 max-w-4xl">
              <section className={`rounded-[2rem] p-6 ${cardBase}`}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${isDark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                    <FaBriefcase className="text-xl" />
                  </div>
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-[0.28em] ${isDark ? 'text-emerald-300/80' : 'text-emerald-700'}`}>Branch selector</p>
                    <h3 className="text-2xl font-black">Choose your branch</h3>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {BRANCH_OPTIONS.map((branch) => {
                    const active = selectedBranch === branch;
                    return (
                      <button
                        key={branch}
                        type="button"
                        onClick={() => {
                          setSelectedBranch(branch);
                        }}
                        className={`rounded-3xl border p-4 text-left transition-all hover:-translate-y-0.5 ${active ? 'border-emerald-500 bg-emerald-500/10' : isDark ? 'border-white/10 bg-white/5 text-emerald-50' : 'border-emerald-100 bg-white text-slate-800'}`}
                      >
                        <p className="text-sm font-black">{branch}</p>
                        <p className={`mt-2 text-xs ${isDark ? 'text-emerald-50/65' : 'text-slate-500'}`}>{getJobRolesForBranch(branch).length} target roles available</p>
                      </button>
                    );
                  })}
                </div>
              </section>
              <button type="button" onClick={handleContinue} disabled={!selectedBranch} className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-black uppercase tracking-[0.2em] transition-all disabled:cursor-not-allowed disabled:opacity-50 ${isDark ? 'bg-emerald-400 text-[#052414]' : 'bg-emerald-600 text-white'}`}>
                Continue to target roles
                <FaArrowRight />
              </button>
            </div>
          </div>
        </main>
    </div>
  </div>
  );
};

export default JobRolePage;
