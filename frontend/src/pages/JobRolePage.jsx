import React, { useEffect, useMemo, useState } from 'react';
import {
  FaArrowRight,
  FaBriefcase,
  FaCheckCircle,
  FaHome,
  FaMoon,
  FaSave,
  FaSignOutAlt,
  FaSun,
  FaSyncAlt,
  FaUserCircle,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

import { updateCollaborationProfile } from '../lib/api';
import { BRANCH_OPTIONS, getJobRolesForBranch } from '../data/careerPaths';
import { clearCurrentUser, readCurrentUser, saveCurrentUser, saveRegisteredUsers, readRegisteredUsers } from '../lib/currentUser';

const JobRolePage = ({ theme, setTheme }) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const currentUser = useMemo(() => readCurrentUser(), []);
  const [isReady, setIsReady] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(currentUser?.branch || '');
  const [selectedRole, setSelectedRole] = useState(
    currentUser?.job_role || currentUser?.mock_interview?.target_role || getJobRolesForBranch(currentUser?.branch || '')[0] || '',
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const cardBase = isDark
    ? 'border border-emerald-500/15 bg-white/5 text-emerald-50 shadow-[0_24px_60px_rgba(0,0,0,0.28)]'
    : 'border border-emerald-100 bg-white/80 text-slate-800 shadow-[0_24px_60px_rgba(16,185,129,0.10)]';

  const panelBase = isDark
    ? 'border border-white/10 bg-white/5 text-emerald-50'
    : 'border border-emerald-100 bg-white text-slate-800';

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    const roles = getJobRolesForBranch(selectedBranch);
    if (!roles.length) {
      return;
    }

    if (!roles.includes(selectedRole)) {
      setSelectedRole(roles[0]);
    }
  }, [selectedBranch, selectedRole]);

  const toggleTheme = () => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'));
  };

  const handleSwitchAccount = () => {
    clearCurrentUser();
    navigate('/login');
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    navigate(`/job-roles/types?role=${encodeURIComponent(role)}&branch=${encodeURIComponent(selectedBranch)}`);
  };

  const handleSave = async () => {
    if (!selectedBranch) {
      setMessage('Please choose a branch first.');
      return;
    }

    const resolvedRole = selectedRole || getJobRolesForBranch(selectedBranch)[0] || '';
    const nextUser = {
      ...(currentUser || {}),
      branch: selectedBranch,
      job_role: resolvedRole,
      mock_interview: {
        ...(currentUser?.mock_interview || {}),
        enabled: true,
        target_role: resolvedRole,
      },
    };

    setLoading(true);
    setMessage('');

    try {
      if (currentUser?.id && currentUser?.email && (currentUser?.username || currentUser?.name)) {
        const payload = {
          user_id: currentUser.id,
          username: currentUser.username || currentUser.name || '',
          email: currentUser.email,
          portfolio_photo_url: currentUser.portfolio_photo_url || '',
          portfolio_banner_url: currentUser.portfolio_banner_url || '',
          location: currentUser.location || '',
          college: currentUser.college || '',
          domain: currentUser.domain || 'Backend',
          branch: selectedBranch,
          job_role: resolvedRole,
          skills: Array.isArray(currentUser.collaboration_skills)
            ? currentUser.collaboration_skills
            : Array.isArray(currentUser.skills)
              ? currentUser.skills
              : Object.entries(currentUser.skills || {}).map(([name, level]) => ({ name, level })),
          interests: currentUser.interests || [],
          bio: currentUser.bio || '',
          github_url: currentUser.github_url || '',
          linkedin_url: currentUser.linkedin_url || '',
        };

        const response = await updateCollaborationProfile(currentUser.id, payload);
        if (!response?.error && response?.user) {
          saveCurrentUser({
            ...nextUser,
            ...response.user,
            branch: selectedBranch,
            job_role: resolvedRole,
          });
        } else {
          saveCurrentUser(nextUser);
        }
      } else {
        saveCurrentUser(nextUser);
      }

      const registeredUsers = readRegisteredUsers();
      const updatedUser = {
        ...nextUser,
        ...(currentUser || {}),
      };
      const nextRegisteredUsers = registeredUsers.some((user) => String(user?.id) === String(updatedUser.id))
        ? registeredUsers.map((user) => (String(user?.id) === String(updatedUser.id) ? { ...user, ...updatedUser } : user))
        : [...registeredUsers, updatedUser];
      saveRegisteredUsers(nextRegisteredUsers);

      setMessage('Job role saved successfully. ✅');
      setTimeout(() => {
        navigate('/home');
      }, 700);
    } catch (error) {
      setMessage(error.message || 'Could not save job role.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-dvh w-full transition-colors duration-500 ${isDark ? 'bg-[#050f0a] text-white' : 'bg-[#f0fdf4] text-slate-900'}`}>
      <div className={`mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-5 py-5 sm:px-8 ${isReady ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'} transition-all duration-700`}>
        <nav className={`flex items-center justify-between rounded-full px-5 py-4 backdrop-blur-2xl ${isDark ? 'border border-emerald-500/15 bg-white/5' : 'border border-white/70 bg-white/75'}`}>
          <div>
            <p className={`text-xs font-bold uppercase tracking-[0.35em] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>SkillNet</p>
            <h1 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Job Roles</h1>
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
              onClick={toggleTheme}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${isDark ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-200' : 'border border-emerald-100 bg-white text-emerald-700 shadow-sm'}`}
            >
              {isDark ? <FaSun /> : <FaMoon />}
              {isDark ? 'Light' : 'Dark'}
            </button>
            <button
              type="button"
              onClick={handleSwitchAccount}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${isDark ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-200' : 'border border-emerald-100 bg-white text-emerald-700 shadow-sm'}`}
            >
              <FaSyncAlt />
              Switch
            </button>
          </div>
        </nav>

        <main className="flex flex-1 items-center justify-center py-6">
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

            <div className="mx-auto mt-8 grid max-w-6xl gap-5 xl:grid-cols-[1.1fr_0.9fr]">
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
                          const roles = getJobRolesForBranch(branch);
                          setSelectedRole((current) => (roles.includes(current) ? current : roles[0] || ''));
                        }}
                        className={`rounded-3xl border p-4 text-left transition-all hover:-translate-y-0.5 ${active ? 'border-emerald-500 bg-emerald-500/10' : panelBase}`}
                      >
                        <p className="text-sm font-black">{branch}</p>
                        <p className={`mt-2 text-xs ${isDark ? 'text-emerald-50/65' : 'text-slate-500'}`}>
                          {getJobRolesForBranch(branch).length} role options
                        </p>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className={`rounded-[2rem] p-6 ${cardBase}`}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${isDark ? 'bg-amber-400/10 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>
                    <FaUserCircle className="text-xl" />
                  </div>
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-[0.28em] ${isDark ? 'text-amber-300/80' : 'text-amber-700'}`}>Role picker</p>
                    <h3 className="text-2xl font-black">Select your target role</h3>
                  </div>
                </div>

                <div className="mt-6 grid gap-3">
                  {(getJobRolesForBranch(selectedBranch) || []).map((role) => {
                    const active = selectedRole === role;
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleRoleSelect(role)}
                        className={`rounded-3xl border px-4 py-4 text-left transition-all hover:-translate-y-0.5 ${active ? 'border-emerald-500 bg-emerald-500/10' : panelBase}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-black">{role}</p>
                            <p className={`mt-1 text-xs ${isDark ? 'text-emerald-50/65' : 'text-slate-500'}`}>
                              Based on your selected branch
                            </p>
                          </div>
                          {active ? <FaCheckCircle className="mt-1 text-emerald-400" /> : null}
                        </div>
                      </button>
                    );
                  })}

                  {selectedBranch ? null : (
                    <div className={`rounded-3xl p-4 text-sm ${isDark ? 'bg-white/5 text-emerald-50/70' : 'bg-emerald-50 text-slate-600'}`}>
                      Select a branch to see matching job roles.
                    </div>
                  )}
                </div>

                <div className={`mt-6 rounded-3xl p-4 ${isDark ? 'bg-white/5' : 'bg-emerald-50/80'}`}>
                  <p className="text-xs font-bold uppercase tracking-[0.28em]">Preview</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedBranch ? (
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isDark ? 'bg-white/10 text-emerald-100' : 'bg-white text-emerald-700'}`}>
                        {selectedBranch}
                      </span>
                    ) : null}
                    {selectedRole ? (
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isDark ? 'bg-white/10 text-emerald-100' : 'bg-white text-emerald-700'}`}>
                        {selectedRole}
                      </span>
                    ) : null}
                  </div>
                </div>

                {message ? (
                  <div className={`mt-5 rounded-2xl px-4 py-3 text-sm font-semibold ${message.startsWith('Error') || message.startsWith('Please') ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'}`}>
                    {message}
                  </div>
                ) : null}

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={loading}
                    className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-black uppercase tracking-[0.2em] transition-all ${isDark ? 'bg-emerald-400 text-[#052414]' : 'bg-emerald-600 text-white'} disabled:opacity-70`}
                  >
                    <FaSave />
                    {loading ? 'Saving...' : 'Save Job Role'}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/profile')}
                    className={`rounded-full px-6 py-3 text-sm font-black uppercase tracking-[0.2em] transition-all ${isDark ? 'bg-white/10 text-white' : 'bg-white text-slate-900 ring-1 ring-emerald-100'}`}
                  >
                    Open Profile
                  </button>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default JobRolePage;
