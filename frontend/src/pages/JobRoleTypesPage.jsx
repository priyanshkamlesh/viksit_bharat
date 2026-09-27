import React, { useEffect, useMemo, useState } from 'react';
import {
  FaArrowLeft,
  FaCheckCircle,
  FaHome,
  FaMoon,
  FaSave,
  FaSyncAlt,
  FaSun,
} from 'react-icons/fa';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { updateCollaborationProfile } from '../lib/api';
import { getJobRolesForBranch } from '../data/careerPaths';
import { clearCurrentUser, readCurrentUser, readRegisteredUsers, saveCurrentUser, saveRegisteredUsers } from '../lib/currentUser';

const JobRoleTypesPage = ({ theme, setTheme }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDark = theme === 'dark';
  const currentUser = useMemo(() => readCurrentUser(), []);
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [roleData, setRoleData] = useState({ role: '', summary: '', items: [] });
  const [selectedType, setSelectedType] = useState('');

  const branch = searchParams.get('branch') || currentUser?.branch || '';

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    const roles = getJobRolesForBranch(branch);
    const items = roles.map((targetRole) => ({
      title: targetRole,
      description: `A target role available for ${branch}.`,
    }));
    setRoleData({ role: branch, summary: `Choose the target role that best matches your ${branch} path.`, items });
    setSelectedType((current) => (current && roles.includes(current) ? current : ''));
    setMessage('');
    setLoading(false);
  }, [branch]);

  const toggleTheme = () => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'));
  };

  const handleSwitchAccount = () => {
    clearCurrentUser();
    navigate('/login');
  };

  const handleExploreType = (typeTitle) => {
    setSelectedType(typeTitle);
  };

  const handleSave = async () => {
    if (!selectedType) {
      setMessage('Please select one specialization.');
      return;
    }

    setLoading(true);
    setMessage('');

    const nextUser = {
      ...(currentUser || {}),
      branch,
      job_role: selectedType,
      mock_interview: {
        ...(currentUser?.mock_interview || {}),
        enabled: true,
        target_role: selectedType,
      },
    };

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
          branch,
          job_role: selectedType,
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
            branch,
            job_role: selectedType,
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

      setMessage('Specialization saved successfully. ✅');
      setTimeout(() => {
        navigate('/home');
      }, 700);
    } catch (error) {
      setMessage(error.message || 'Could not save specialization.');
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
            <h1 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Role Specializations</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/job-roles')}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${isDark ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-200' : 'border border-emerald-100 bg-white text-emerald-700 shadow-sm'}`}
            >
              <FaArrowLeft />
              Back
            </button>
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
              <p className={`text-xs font-bold uppercase tracking-[0.35em] ${isDark ? 'text-emerald-300/80' : 'text-emerald-700'}`}>AI generated</p>
              <h2 className={`mt-3 text-3xl font-black tracking-tight sm:text-4xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Target roles for {branch || 'your branch'}
              </h2>
              <p className={`mt-4 text-sm leading-7 sm:text-base ${isDark ? 'text-emerald-50/75' : 'text-slate-600'}`}>
                {roleData.summary} Click a role card to select it.
              </p>
            </div>

            <div className="mx-auto mt-8 grid max-w-6xl gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(roleData.items || []).map((item) => {
                const title = item?.title || 'Untitled';
                const description = item?.description || '';
                const active = selectedType === title;
                return (
                  <button
                    key={title}
                    type="button"
                    onClick={() => handleExploreType(title)}
                    className={`rounded-[2rem] border p-6 text-left transition-all hover:-translate-y-1 ${active ? 'border-emerald-500 bg-emerald-500/10' : isDark ? 'border-emerald-500/15 bg-white/5 text-emerald-50' : 'border-emerald-100 bg-white text-slate-800'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-black">{title}</h3>
                        <p className={`mt-3 text-sm leading-6 ${isDark ? 'text-emerald-50/70' : 'text-slate-600'}`}>{description}</p>
                      </div>
                      {active ? <FaCheckCircle className="mt-1 text-emerald-400" /> : null}
                    </div>
                  </button>
                );
              })}
            </div>

            {!loading && !(roleData.items || []).length ? (
              <div className={`mx-auto mt-6 max-w-3xl rounded-2xl px-4 py-3 text-sm font-semibold ${isDark ? 'bg-white/5 text-emerald-50/70' : 'bg-emerald-50 text-slate-600'}`}>
                No target roles were found. Go back and choose another branch.
              </div>
            ) : null}

            {message ? (
              <div className={`mx-auto mt-6 max-w-3xl rounded-2xl px-4 py-3 text-sm font-semibold ${message.startsWith('Error') || message.startsWith('Please') ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'}`}>
                {message}
              </div>
            ) : null}

            <div className="mx-auto mt-6 flex max-w-3xl flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-black uppercase tracking-[0.2em] transition-all ${isDark ? 'bg-emerald-400 text-[#052414]' : 'bg-emerald-600 text-white'} disabled:opacity-70`}
              >
                <FaSave />
                {loading ? 'Saving...' : 'Save Specialization'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default JobRoleTypesPage;
