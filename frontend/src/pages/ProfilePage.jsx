import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaCamera,
  FaGithub,
  FaLinkedin,
  FaPlus,
  FaTrash,
} from 'react-icons/fa';

import { updateCollaborationProfile } from '../lib/api';
import { BRANCH_OPTIONS, getJobRolesForBranch } from '../data/careerPaths';
import { readCurrentUser, readRegisteredUsers, saveCurrentUser, saveRegisteredUsers } from '../lib/currentUser';

const toSkillList = (skills) => {
  if (Array.isArray(skills)) {
    return skills;
  }

  if (skills && typeof skills === 'object') {
    return Object.entries(skills).map(([name, level]) => ({
      name,
      level: Number(level) >= 70 ? 'pro' : Number(level) >= 40 ? 'intermediate' : 'beginner',
    }));
  }

  return [];
};

const ProfilePage = ({ theme }) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const currentUser = useMemo(() => readCurrentUser(), []);
  const profileFileInputRef = useRef(null);
  const bannerFileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [profileImagePreview, setProfileImagePreview] = useState(currentUser?.portfolio_photo_url || '');
  const [bannerImagePreview, setBannerImagePreview] = useState(currentUser?.portfolio_banner_url || '');
  const [formData, setFormData] = useState({
    user_id: currentUser?.id || 1,
    username: currentUser?.name || '',
    email: currentUser?.email || '',
    portfolio_photo_url: currentUser?.portfolio_photo_url || '',
    portfolio_banner_url: currentUser?.portfolio_banner_url || '',
    location: currentUser?.location || '',
    college: currentUser?.college || '',
    domain: currentUser?.domain || 'Backend',
    branch: currentUser?.branch || '',
    job_role:
      currentUser?.job_role ||
      currentUser?.mock_interview?.target_role ||
      getJobRolesForBranch(currentUser?.branch || '')[0] ||
      '',
    skills: toSkillList(currentUser?.collaboration_skills || currentUser?.skills),
    interests: currentUser?.interests || [],
    bio: currentUser?.bio || '',
    github_url: currentUser?.github_url || '',
    linkedin_url: currentUser?.linkedin_url || '',
  });
  const [skillInput, setSkillInput] = useState({ name: '', level: 'intermediate' });

  const domains = ['Backend', 'Frontend', 'Full Stack', 'AI/ML', 'Data Science', 'Mobile', 'DevOps', 'Cloud'];
  const interestOptions = [
    { value: 'hackathon', label: 'Hackathon' },
    { value: 'project_search', label: 'Project Search' },
    { value: 'startup', label: 'Startup' },
    { value: 'mentoring', label: 'Mentoring' },
  ];

  const inputClass = isDark
    ? 'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35'
    : 'w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400';

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || '');
      setProfileImagePreview(result);
      setFormData((current) => ({ ...current, portfolio_photo_url: result }));
    };
    reader.readAsDataURL(file);
  };

  const openProfileFilePicker = () => {
    profileFileInputRef.current?.click();
  };

  const handleBannerUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || '');
      setBannerImagePreview(result);
      setFormData((current) => ({ ...current, portfolio_banner_url: result }));
    };
    reader.readAsDataURL(file);
  };

  const openBannerFilePicker = () => {
    bannerFileInputRef.current?.click();
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleBranchChange = (event) => {
    const branch = event.target.value;
    const suggestedRoles = getJobRolesForBranch(branch);
    setFormData((current) => ({
      ...current,
      branch,
      job_role: suggestedRoles.includes(current.job_role) ? current.job_role : suggestedRoles[0] || '',
    }));
  };

  const handleSkillAdd = () => {
    if (!skillInput.name.trim()) {
      return;
    }

    setFormData((current) => ({
      ...current,
      skills: [...current.skills, { name: skillInput.name.trim(), level: skillInput.level }],
    }));
    setSkillInput({ name: '', level: 'intermediate' });
  };

  const handleSkillRemove = (index) => {
    setFormData((current) => ({
      ...current,
      skills: current.skills.filter((_, skillIndex) => skillIndex !== index),
    }));
  };

  const handleInterestToggle = (interest) => {
    setFormData((current) => {
      const interests = current.interests.includes(interest)
        ? current.interests.filter((item) => item !== interest)
        : [...current.interests, interest];
      return { ...current, interests };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    if (!formData.username.trim() || !formData.email.trim() || !formData.location.trim() || !formData.college.trim()) {
      setMessage('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (!formData.skills.length) {
      setMessage('Please add at least one skill');
      setLoading(false);
      return;
    }

    if (!formData.interests.length) {
      setMessage('Please select at least one interest');
      setLoading(false);
      return;
    }

    try {
      const submitData = {
        ...formData,
        user_id: formData.user_id || currentUser?.id || 1,
        portfolio_photo_url: profileImagePreview || '',
        portfolio_banner_url: bannerImagePreview || '',
        mock_interview: {
          ...(currentUser?.mock_interview || {}),
          enabled: true,
          target_role: formData.job_role || currentUser?.mock_interview?.target_role || 'Software Engineer',
          experience_level: currentUser?.mock_interview?.experience_level || 'beginner',
          focus_areas: currentUser?.mock_interview?.focus_areas || [],
        },
      };

      const response = await updateCollaborationProfile(submitData.user_id, submitData);
      if (response.error) {
        setMessage(`Error: ${response.error}`);
        return;
      }

      saveCurrentUser({
        ...(currentUser || {}),
        ...(response.user || {}),
        ...submitData,
        name: submitData.username,
        collaboration_skills: submitData.skills,
        branch: submitData.branch,
        job_role: submitData.job_role,
      });

      const updatedUser = {
        ...(currentUser || {}),
        ...(response.user || {}),
        ...submitData,
        name: submitData.username,
        collaboration_skills: submitData.skills,
        branch: submitData.branch,
        job_role: submitData.job_role,
      };

      const registeredUsers = readRegisteredUsers();
      const nextRegisteredUsers = registeredUsers.some((user) => user?.id === updatedUser.id)
        ? registeredUsers.map((user) => (user?.id === updatedUser.id ? { ...user, ...updatedUser } : user))
        : [...registeredUsers, updatedUser];

      saveRegisteredUsers(nextRegisteredUsers);

      setMessage('Profile saved successfully! ✅');
      setTimeout(() => {
        navigate('/home');
      }, 900);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDark ? 'bg-[#050f0a] text-white' : 'bg-[#f0fdf4] text-slate-900'}`}>
      <div className="mx-auto max-w-5xl px-6 py-6">
        <button
          type="button"
          onClick={() => navigate('/home')}
          className={`mb-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${isDark ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-200' : 'border border-emerald-100 bg-white text-emerald-700 shadow-sm'}`}
        >
          <FaArrowLeft />
          Back
        </button>

        <div className={`overflow-hidden rounded-[2rem] border ${isDark ? 'border-emerald-500/15 bg-white/5' : 'border-emerald-100 bg-white/90'}`}>
          <div
            className="relative h-64"
            style={
              bannerImagePreview
                ? {
                    backgroundImage: `linear-gradient(180deg, rgba(5, 15, 10, 0.12), rgba(5, 15, 10, 0.55)), url(${bannerImagePreview})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : undefined
            }
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/10" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
              <p className={`text-sm font-semibold ${bannerImagePreview ? 'text-white/80' : isDark ? 'text-emerald-100/70' : 'text-slate-500'}`}>
                Upload a banner to personalize your profile
              </p>
              <button
                type="button"
                onClick={openProfileFilePicker}
                className="group relative block cursor-pointer"
                aria-label="Upload profile photo"
              >
                <div className={`relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 shadow-[0_18px_50px_rgba(0,0,0,0.2)] ${profileImagePreview ? 'border-white' : isDark ? 'border-emerald-400/40 bg-emerald-500/10' : 'border-white bg-emerald-50'}`}>
                  {profileImagePreview ? (
                    <>
                      <img src={profileImagePreview} alt="Profile" className="h-32 w-32 rounded-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
                        <FaCamera className="text-2xl text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-center">
                      <FaCamera className={`text-4xl ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`} />
                      <p className={`text-xs font-semibold ${isDark ? 'text-emerald-100' : 'text-emerald-700'}`}>Upload photo</p>
                    </div>
                  )}
                </div>
              </button>
              <input ref={profileFileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.35em] text-white/80">Profile</p>
                <h1 className="mt-2 text-3xl font-black text-white">Your collaboration identity</h1>
              </div>
              <button type="button" onClick={openBannerFilePicker} className="rounded-full bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white backdrop-blur transition-colors hover:bg-white/25">
                {bannerImagePreview ? 'Change banner' : 'Upload banner'}
              </button>
              <input ref={bannerFileInputRef} type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
            </div>
          </div>

          <form className="relative px-6 pb-8 pt-8 sm:px-8" onSubmit={handleSubmit}>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-6">
                <div className={`rounded-[1.5rem] border p-6 ${isDark ? 'border-white/10 bg-white/5' : 'border-emerald-100 bg-emerald-50/40'}`}>
                  <h2 className="text-xl font-black">Basic Details</h2>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2 sm:col-span-2">
                      <span className="text-sm font-semibold">Name *</span>
                      <input name="username" value={formData.username} onChange={handleInputChange} className={inputClass} />
                    </label>
                    <label className="space-y-2 sm:col-span-2">
                      <span className="text-sm font-semibold">Email *</span>
                      <input name="email" value={formData.email} onChange={handleInputChange} className={inputClass} />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-semibold">Location *</span>
                      <input name="location" value={formData.location} onChange={handleInputChange} className={inputClass} />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-semibold">College *</span>
                      <input name="college" value={formData.college} onChange={handleInputChange} className={inputClass} />
                    </label>
                    <label className="space-y-2 sm:col-span-2">
                      <span className="text-sm font-semibold">Branch</span>
                      <select name="branch" value={formData.branch} onChange={handleBranchChange} className={inputClass}>
                        <option value="">Select branch</option>
                        {BRANCH_OPTIONS.map((branch) => (
                          <option key={branch} value={branch}>{branch}</option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-2 sm:col-span-2">
                      <span className="text-sm font-semibold">Target Job Role</span>
                      <select
                        name="job_role"
                        value={formData.job_role}
                        onChange={handleInputChange}
                        className={inputClass}
                        disabled={!formData.branch}
                      >
                        <option value="">{formData.branch ? 'Select a role' : 'Choose a branch first'}</option>
                        {getJobRolesForBranch(formData.branch).map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                      <p className={`text-xs ${isDark ? 'text-emerald-100/55' : 'text-slate-500'}`}>
                        We suggest roles based on your branch, and you can pick the one that fits best.
                      </p>
                    </label>
                    <label className="space-y-2 sm:col-span-2">
                      <span className="text-sm font-semibold">Domain</span>
                      <select name="domain" value={formData.domain} onChange={handleInputChange} className={inputClass}>
                        {domains.map((domain) => (
                          <option key={domain} value={domain}>{domain}</option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-2 sm:col-span-2">
                      <span className="text-sm font-semibold">Bio</span>
                      <textarea name="bio" value={formData.bio} onChange={handleInputChange} rows="4" className={inputClass} />
                    </label>
                  </div>
                </div>

                <div className={`rounded-[1.5rem] border p-6 ${isDark ? 'border-white/10 bg-white/5' : 'border-emerald-100 bg-white'}`}>
                  <h2 className="text-xl font-black">Social Links</h2>
                  <div className="mt-5 grid gap-4">
                    <label className="space-y-2">
                      <span className="text-sm font-semibold inline-flex items-center gap-2"><FaGithub /> GitHub</span>
                      <input name="github_url" value={formData.github_url} onChange={handleInputChange} className={inputClass} />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-semibold inline-flex items-center gap-2"><FaLinkedin /> LinkedIn</span>
                      <input name="linkedin_url" value={formData.linkedin_url} onChange={handleInputChange} className={inputClass} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className={`rounded-[1.5rem] border p-6 ${isDark ? 'border-white/10 bg-white/5' : 'border-emerald-100 bg-white'}`}>
                  <h2 className="text-xl font-black">Skills</h2>
                  <div className="mt-5 flex gap-3">
                    <input
                      value={skillInput.name}
                      onChange={(event) => setSkillInput((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Add a skill"
                      className={inputClass}
                    />
                    <select
                      value={skillInput.level}
                      onChange={(event) => setSkillInput((current) => ({ ...current, level: event.target.value }))}
                      className={inputClass}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="pro">Pro</option>
                    </select>
                    <button type="button" onClick={handleSkillAdd} className="rounded-full bg-emerald-600 px-4 py-3 text-sm font-black text-white">
                      <FaPlus />
                    </button>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {formData.skills.map((skill, index) => (
                      <button
                        key={`${skill.name}-${index}`}
                        type="button"
                        onClick={() => handleSkillRemove(index)}
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold ${isDark ? 'bg-white/10 text-emerald-100' : 'bg-emerald-50 text-emerald-700'}`}
                      >
                        {skill.name} <FaTrash className="text-xs" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`rounded-[1.5rem] border p-6 ${isDark ? 'border-white/10 bg-white/5' : 'border-emerald-100 bg-white'}`}>
                  <h2 className="text-xl font-black">Interests</h2>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {interestOptions.map((interest) => {
                      const active = formData.interests.includes(interest.value);
                      return (
                        <button
                          key={interest.value}
                          type="button"
                          onClick={() => handleInterestToggle(interest.value)}
                          className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                            active
                              ? 'bg-emerald-600 text-white'
                              : isDark
                                ? 'bg-white/10 text-emerald-100'
                                : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {interest.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className={`rounded-[1.5rem] border p-6 ${isDark ? 'border-white/10 bg-white/5' : 'border-emerald-100 bg-white'}`}>
                  <h2 className="text-xl font-black">Preview</h2>
                  <p className={`mt-3 text-sm ${isDark ? 'text-emerald-100/70' : 'text-slate-600'}`}>
                    This profile is used by recommendations and your navbar profile menu.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {formData.branch ? (
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isDark ? 'bg-white/10 text-emerald-100' : 'bg-emerald-50 text-emerald-700'}`}>
                        {formData.branch}
                      </span>
                    ) : null}
                    {formData.job_role ? (
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isDark ? 'bg-white/10 text-emerald-100' : 'bg-emerald-50 text-emerald-700'}`}>
                        {formData.job_role}
                      </span>
                    ) : null}
                    {formData.skills.slice(0, 4).map((skill) => (
                      <span key={skill.name} className={`rounded-full px-3 py-1 text-xs font-semibold ${isDark ? 'bg-white/10 text-emerald-100' : 'bg-emerald-50 text-emerald-700'}`}>
                        {skill.name} · {skill.level}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {message ? (
              <div className={`mt-6 rounded-2xl px-4 py-3 text-sm font-semibold ${message.startsWith('Error') ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'}`}>
                {message}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={loading}
                className={`rounded-full px-6 py-3 text-sm font-black uppercase tracking-[0.2em] transition-all ${isDark ? 'bg-emerald-400 text-[#052414]' : 'bg-emerald-600 text-white'}`}
              >
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/recommendations')}
                className={`rounded-full px-6 py-3 text-sm font-black uppercase tracking-[0.2em] transition-all ${isDark ? 'bg-white/10 text-white' : 'bg-white text-slate-900 ring-1 ring-emerald-100'}`}
              >
                View Recommendations
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
