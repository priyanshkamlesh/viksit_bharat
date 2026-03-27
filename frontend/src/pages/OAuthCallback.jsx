import React, { useEffect, useMemo, useState } from 'react';
import { FaGithub, FaGoogle, FaSpinner } from 'react-icons/fa';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { fetchUserById } from '../lib/api';
import { readRegisteredUsers, saveCurrentUser, saveRegisteredUsers } from '../lib/currentUser';

const OAuthCallback = ({ theme }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDark = theme === 'dark';
  const [status, setStatus] = useState('Completing sign-in...');
  const [error, setError] = useState('');

  const provider = searchParams.get('provider') || '';
  const userId = searchParams.get('user_id');
  const callbackError = searchParams.get('error');

  const providerLabel = useMemo(() => {
    if (provider.toLowerCase() === 'github') {
      return 'GitHub';
    }

    return 'Google';
  }, [provider]);

  useEffect(() => {
    const finalizeLogin = async () => {
      if (callbackError) {
        setError(decodeURIComponent(callbackError));
        setStatus('Sign-in failed.');
        return;
      }

      if (!userId) {
        setError('Missing user id from OAuth callback.');
        setStatus('Sign-in failed.');
        return;
      }

      try {
        const response = await fetchUserById(userId);
        if (!response.user) {
          throw new Error('User record was not found after authentication.');
        }

        const user = {
          ...response.user,
          login_method: provider.toLowerCase() || 'oauth',
        };

        saveCurrentUser(user);

        const registeredUsers = readRegisteredUsers();
        const nextRegisteredUsers = registeredUsers.some((item) => String(item?.id) === String(user.id))
          ? registeredUsers.map((item) => (String(item?.id) === String(user.id) ? { ...item, ...user } : item))
          : [...registeredUsers, user];

        saveRegisteredUsers(nextRegisteredUsers);
        setStatus('Sign-in complete. Redirecting...');
        setTimeout(() => {
          navigate('/home', { replace: true });
        }, 700);
      } catch (err) {
        setError(err.message || 'Could not finish sign-in.');
        setStatus('Sign-in failed.');
      }
    };

    finalizeLogin();
  }, [callbackError, navigate, provider, userId]);

  const icon = provider.toLowerCase() === 'github' ? <FaGithub /> : <FaGoogle />;

  return (
    <div className={`flex min-h-dvh items-center justify-center px-6 ${isDark ? 'bg-[#050f0a] text-white' : 'bg-[#f0fdf4] text-slate-900'}`}>
      <div className={`w-full max-w-md rounded-[2rem] border p-8 text-center ${isDark ? 'border-emerald-500/15 bg-white/5' : 'border-emerald-100 bg-white/90'}`}>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
          {error ? <span className="text-xl font-black">!</span> : <FaSpinner className="animate-spin" />}
        </div>
        <h1 className="text-2xl font-black">{error ? 'Sign-in error' : `Signing in with ${providerLabel}`}</h1>
        <p className={`mt-3 text-sm ${isDark ? 'text-emerald-100/70' : 'text-slate-600'}`}>{status}</p>
        {error ? (
          <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </p>
        ) : (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
            {icon}
            Completing secure OAuth flow
          </div>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;
