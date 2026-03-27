import React, { useState } from 'react';
import { FaEnvelope, FaMoon, FaLock, FaSun, FaGoogle, FaGithub } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';

import { fetchUserByEmail } from '../lib/api';
import { saveCurrentUser } from '../lib/currentUser';


const Login = ({ theme, setTheme }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false,
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const isDark = theme === 'dark';

  const handleChange = (event) => {
    const { name, type, value, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetchUserByEmail(formData.email.trim().toLowerCase());
      if (!response.user) {
        setMessage('No account found for that email. Please register first.');
        return;
      }

      saveCurrentUser(response.user);
      navigate('/home');
    } catch (error) {
      setMessage('Unable to sign in right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    setMessage(`${provider} sign-in will be available soon. Please continue with email for now.`);
  };

  const toggleTheme = () => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'));
  };

  // Shared Social Button Styles
  const socialBtnClass = isDark 
    ? "flex items-center justify-center gap-3 w-full py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-100 hover:bg-emerald-500/10 transition-all font-semibold text-sm"
    : "flex items-center justify-center gap-3 w-full py-3 rounded-xl border border-emerald-100 bg-white text-slate-700 shadow-sm hover:shadow-md hover:bg-emerald-50/30 transition-all font-semibold text-sm";

  return (
    <div className={`box-border min-h-dvh w-full overflow-hidden transition-colors duration-500 ${isDark ? 'bg-[#050f0a]' : 'bg-[#f0fdf4]'}`}>
      
      {/* Theme Toggle Floating Button */}
      <div className="fixed top-6 right-6 z-50">
        <button
          onClick={toggleTheme}
          className={`group flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all ${
            isDark 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-white text-emerald-700 border border-emerald-100 shadow-lg'
          }`}
        >
          {isDark ? <FaSun className="animate-spin-slow" /> : <FaMoon />}
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>

      <div className="box-border flex min-h-dvh items-center justify-center p-6">
        {/* Main Card */}
        <div className={`relative w-full max-w-lg rounded-[2.5rem] p-[1px] transition-all duration-700 ${
          isDark 
            ? 'bg-gradient-to-br from-emerald-500/30 via-transparent to-emerald-500/10 shadow-[0_0_50px_-12px_rgba(16,185,129,0.3)]' 
            : 'bg-gradient-to-br from-white via-emerald-200 to-white shadow-[0_20px_50px_rgba(5,150,105,0.15)]'
        }`}>
          
          <div className={`w-full rounded-[2.45rem] p-10 backdrop-blur-3xl ${
            isDark ? 'bg-[#08130d]/95' : 'bg-white/80'
          }`}>
            <div className="text-center mb-10">
              <h2 className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
                <span className="text-emerald-500">Login</span>
              </h2>
              <p className={`mt-2 text-sm font-medium ${isDark ? 'text-emerald-100/40' : 'text-slate-500'}`}>
                Welcome to our site
              </p>
            </div>

            {/* Social Logins */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                className={socialBtnClass}
              >
                <FaGoogle className="text-red-500" /> Google
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin('github')}
                className={socialBtnClass}
              >
                <FaGithub className={isDark ? "text-white" : "text-slate-900"} /> GitHub
              </button>
            </div>

            <p className={`-mt-2 mb-8 text-center text-xs ${isDark ? 'text-emerald-100/50' : 'text-slate-500'}`}>
              Google and GitHub sign-in are coming soon. Email login is ready now.
            </p>

            {/* Divider */}
            <div className="relative mb-8">
              <div className={`absolute inset-0 flex items-center ${isDark ? 'opacity-10' : 'opacity-20'}`}>
                <div className="w-full border-t border-emerald-900"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className={`px-4 font-bold tracking-widest ${isDark ? 'bg-[#08130d] text-emerald-800' : 'bg-white text-emerald-300'}`}>
                  Or continue with email
                </span>
              </div>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Email */}
              <div className="space-y-2 group">
                <label className={`ml-2 text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${
                  isDark ? 'text-emerald-700 group-focus-within:text-emerald-400' : 'text-emerald-800 group-focus-within:text-emerald-500'
                }`}>
                  Email Address
                </label>
                <div className="relative">
                  <FaEnvelope className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                    isDark ? 'text-emerald-900 group-focus-within:text-emerald-500' : 'text-emerald-200 group-focus-within:text-emerald-500'
                  }`} />
                  <input
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full rounded-2xl border py-4 pl-12 pr-5 text-sm transition-all duration-300 outline-none ${
                      isDark 
                        ? 'border-emerald-900/50 bg-emerald-950/30 text-emerald-50 placeholder:text-emerald-900 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10' 
                        : 'border-emerald-100 bg-emerald-50/50 text-slate-700 placeholder:text-emerald-200 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10'
                    }`}
                    placeholder="preeyansh@example.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2 group">
                <label className={`ml-2 text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${
                  isDark ? 'text-emerald-700 group-focus-within:text-emerald-400' : 'text-emerald-800 group-focus-within:text-emerald-500'
                }`}>
                  Password
                </label>
                <div className="relative">
                  <FaLock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                    isDark ? 'text-emerald-900 group-focus-within:text-emerald-500' : 'text-emerald-200 group-focus-within:text-emerald-500'
                  }`} />
                  <input
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full rounded-2xl border py-4 pl-12 pr-5 text-sm transition-all duration-300 outline-none ${
                      isDark 
                        ? 'border-emerald-900/50 bg-emerald-950/30 text-emerald-50 placeholder:text-emerald-900 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10' 
                        : 'border-emerald-100 bg-emerald-50/50 text-slate-700 placeholder:text-emerald-200 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10'
                    }`}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-400 py-4 font-bold text-emerald-950 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-xs disabled:opacity-70"
              >
                {loading ? 'Signing In...' : 'Sign In to Account'}
              </button>
            </form>

            {message ? (
              <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {message}
              </div>
            ) : null}

            {/* Registration Link */}
            <div className="mt-10 text-center">
              <p className={`text-sm font-medium ${isDark ? 'text-emerald-100/30' : 'text-slate-400'}`}>
                Don't have an account?{' '}
                <button className="text-emerald-500 font-bold hover:underline underline-offset-4 decoration-2 transition-all">
                  <Link to="/register">Register Yourself</Link>
                </button>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
