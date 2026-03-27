import React, { useState } from 'react';
import { FaUser, FaEnvelope, FaLock, FaMapMarkerAlt, FaGraduationCap, FaCode, FaCalendarAlt, FaSun, FaMoon } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';

import { registerUser } from '../lib/api';
import { saveCurrentUser } from '../lib/currentUser';


const Register = ({ theme, setTheme }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    email: '',
    password: '',
    education: '',
    residence: '',
    skills: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const isDark = theme === 'dark';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    const skillMap = formData.skills
      .split(',')
      .map((skill) => skill.trim().toLowerCase().replace(/\s+/g, '-'))
      .filter(Boolean)
      .reduce((acc, skill) => {
        acc[skill] = 50;
        return acc;
      }, {});

    const profile = {
      name: formData.name.trim() || 'New User',
      email: formData.email.trim().toLowerCase(),
      goal: formData.education.trim()
        ? `Grow from ${formData.education.trim()} into a job-ready profile`
        : 'Build a job-ready profile',
      location: formData.residence.trim(),
      interests: ['career-growth', 'collaboration'],
      skills: skillMap,
      mock_interview: {
        enabled: true,
        target_role: 'Software Engineer',
        experience_level: 'beginner',
        focus_areas: Object.keys(skillMap).slice(0, 4),
      },
    };

    try {
      const response = await registerUser(profile);
      const savedUser = response.user || profile;
      saveCurrentUser(savedUser);
      navigate('/profile');
    } catch (error) {
      setMessage('Could not create your account on the server. Please try again.');
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // Input styling logic
  const inputClass = isDark 
    ? "w-full rounded-2xl border border-emerald-900/50 bg-emerald-950/30 py-3.5 pl-12 pr-5 text-sm text-emerald-50 placeholder:text-emerald-900 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
    : "w-full rounded-2xl border border-emerald-100 bg-emerald-50/50 py-3.5 pl-12 pr-5 text-slate-700 placeholder:text-emerald-200 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all";

  const labelClass = `ml-2 text-[10px] font-black uppercase tracking-[0.2em] mb-2 block ${
    isDark ? 'text-emerald-700 group-focus-within:text-emerald-400' : 'text-emerald-800 group-focus-within:text-emerald-600'
  }`;

  const iconClass = `absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
    isDark ? 'text-emerald-900 group-focus-within:text-emerald-500' : 'text-emerald-200 group-focus-within:text-emerald-500'
  }`;

  return (
    <div className={`box-border min-h-dvh w-full overflow-x-hidden px-6 py-4 transition-colors duration-500 ${isDark ? 'bg-[#050f0a]' : 'bg-[#f0fdf4]'}`}>
      
      {/* Floating Theme Toggle */}
      <div className="fixed top-6 right-6 z-50">
        <button onClick={toggleTheme} className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold shadow-lg transition-all ${isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white text-emerald-700 border border-emerald-100'}`}>
          {isDark ? <FaSun /> : <FaMoon />} {isDark ? 'Light' : 'Dark'}
        </button>
      </div>

      <div className="flex items-center justify-center">
        <div className={`relative w-full max-w-3xl rounded-[3rem] p-[1px] ${isDark ? 'bg-gradient-to-br from-emerald-500/30 via-transparent to-emerald-500/10 shadow-2xl' : 'bg-gradient-to-br from-white via-emerald-200 to-white shadow-xl'}`}>
          
          <div className={`w-full rounded-[2.95rem] p-8 md:p-12 backdrop-blur-3xl ${isDark ? 'bg-[#08130d]/95' : 'bg-white/85'}`}>
            
            <div className="text-center mb-10">
              <h2 className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Create <span className="text-emerald-500">Account</span>
              </h2>
              <p className={`mt-2 text-sm font-medium ${isDark ? 'text-emerald-100/40' : 'text-slate-500'}`}>Join the elite internship portal today</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Full Name */}
                <div className="group relative">
                  <label className={labelClass}>Full Name</label>
                  <div className="relative">
                    <FaUser className={iconClass} />
                    <input name="name" type="text" placeholder="Priyansh ..." className={inputClass} onChange={handleChange} />
                  </div>
                </div>

                {/* Age */}
                <div className="group relative">
                  <label className={labelClass}>Age</label>
                  <div className="relative">
                    <FaCalendarAlt className={iconClass} />
                    <input name="age" type="number" placeholder="21" className={inputClass} onChange={handleChange} />
                  </div>
                </div>

                {/* Email */}
                <div className="group relative">
                  <label className={labelClass}>Email Address</label>
                  <div className="relative">
                    <FaEnvelope className={iconClass} />
                    <input name="email" type="email" placeholder="preeyansh@example.com" className={inputClass} onChange={handleChange} />
                  </div>
                </div>

                {/* Password */}
                <div className="group relative">
                  <label className={labelClass}>Password</label>
                  <div className="relative">
                    <FaLock className={iconClass} />
                    <input name="password" type="password" placeholder="••••••••" className={inputClass} onChange={handleChange} />
                  </div>
                </div>

                {/* Education */}
                <div className="group relative md:col-span-2">
                  <label className={labelClass}>Education / University</label>
                  <div className="relative">
                    <FaGraduationCap className={iconClass} />
                    <input name="education" type="text" placeholder="B.Tech in Computer Science" className={inputClass} onChange={handleChange} />
                  </div>
                </div>

                {/* Residence (Address) */}
                <div className="group relative md:col-span-2">
                  <label className={labelClass}>Residence / Address</label>
                  <div className="relative">
                    <FaMapMarkerAlt className={iconClass} />
                    <input name="residence" type="text" placeholder="Bhopal, Madhya Pradesh" className={inputClass} onChange={handleChange} />
                  </div>
                </div>

                {/* Skills */}
                <div className="group relative md:col-span-2">
                  <label className={labelClass}>Skills (Comma Separated)</label>
                  <div className="relative">
                    <FaCode className={iconClass} />
                    <input name="skills" type="text" placeholder="React, Node.js, Python, Tailwind" className={inputClass} onChange={handleChange} />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button type="submit" disabled={loading} className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-400 py-4 font-black text-emerald-950 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] uppercase tracking-[0.2em] text-xs mt-4 disabled:opacity-70">
                {loading ? 'Registering...' : 'Verify & Register'}
              </button>

              {message ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                  {message}
                </div>
              ) : null}
            </form>

            <div className="mt-10 text-center">
              <p className={`text-sm font-medium ${isDark ? 'text-emerald-100/30' : 'text-slate-400'}`}>
                Already a member? <button className="text-emerald-500 font-bold hover:underline underline-offset-4 decoration-2"><Link to="/login">Sign In</Link> </button>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
