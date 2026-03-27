import React, { useEffect, useMemo, useState } from 'react';
import {
  FaArrowRight,
  FaBullseye,
  FaCheckCircle,
  FaChartLine,
  FaInbox,
  FaHome,
  FaMoon,
  FaSyncAlt,
  FaSun,
  FaStar,
  FaUsers,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

import { fetchRecommendationUsers, fetchRecommendationsForProfile, fetchUserNotifications, sendConnectionInvite } from '../lib/api';
import { readCurrentUser } from '../lib/currentUser';

const humanizeKey = (value) =>
  value
    ? value
        .replace(/-/g, ' ')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase())
    : 'Unknown';

const formatScore = (score) => {
  if (typeof score !== 'number') {
    return '0.000';
  }

  return score.toFixed(3);
};

const RecommendationPage = ({ theme, setTheme }) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const [currentUser, setCurrentUser] = useState(() => readCurrentUser());
  const [recommendations, setRecommendations] = useState([]);
  const [roster, setRoster] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState('');
  const [rosterError, setRosterError] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteLoadingId, setInviteLoadingId] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);

  const cardBase = isDark
    ? 'border border-emerald-500/15 bg-white/5 text-emerald-50 shadow-[0_24px_60px_rgba(0,0,0,0.28)]'
    : 'border border-emerald-100 bg-white/85 text-slate-800 shadow-[0_24px_60px_rgba(16,185,129,0.10)]';

  const surfaceBase = isDark
    ? 'border border-white/10 bg-[#0b1711]/90 text-emerald-50'
    : 'border border-emerald-100 bg-white/90 text-slate-800';

  const chipBase = isDark
    ? 'border border-white/10 bg-white/5 text-emerald-100'
    : 'border border-emerald-100 bg-emerald-50 text-emerald-800';

  const toggleTheme = () => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    const syncCurrentUser = () => {
      setCurrentUser(readCurrentUser());
      setRefreshTick((current) => current + 1);
    };

    syncCurrentUser();
    window.addEventListener('storage', syncCurrentUser);
    window.addEventListener('focus', syncCurrentUser);
    window.addEventListener('auth-change', syncCurrentUser);

    return () => {
      window.removeEventListener('storage', syncCurrentUser);
      window.removeEventListener('focus', syncCurrentUser);
      window.removeEventListener('auth-change', syncCurrentUser);
    };
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setRecommendations([]);
      setRoster([]);
      return undefined;
    }

    let ignore = false;

    const loadRecommendations = async () => {
      setLoadingRecommendations(true);
      setRecommendationsError('');

      try {
        const data = await fetchRecommendationsForProfile(currentUser);
        if (ignore) {
          return;
        }

        if (data.error) {
          setRecommendations([]);
          setRecommendationsError(data.error);
          return;
        }

        setRecommendations(data.recommendations || []);
      } catch (error) {
        if (!ignore) {
          setRecommendations([]);
          setRecommendationsError('Could not load peer recommendations.');
        }
      } finally {
        if (!ignore) {
          setLoadingRecommendations(false);
        }
      }
    };

    loadRecommendations();

    return () => {
      ignore = true;
    };
  }, [currentUser, refreshTick]);

  useEffect(() => {
    let ignore = false;

    const loadRoster = async () => {
      setLoadingRoster(true);
      setRosterError('');

      try {
        const data = await fetchRecommendationUsers();
        if (ignore) {
          return;
        }

        setRoster(data.users || []);
      } catch (error) {
        if (!ignore) {
          setRoster([]);
          setRosterError('Could not load users from MongoDB.');
        }
      } finally {
        if (!ignore) {
          setLoadingRoster(false);
        }
      }
    };

    loadRoster();

    return () => {
      ignore = true;
    };
  }, [currentUser, refreshTick]);

  useEffect(() => {
    if (!currentUser?.id) {
      setNotificationCount(0);
      return undefined;
    }

    let ignore = false;

    const loadNotifications = async () => {
      try {
        const data = await fetchUserNotifications(currentUser.id);
        if (!ignore) {
          setNotificationCount((data.notifications || []).filter((item) => item.status === 'pending').length);
        }
      } catch (error) {
        if (!ignore) {
          setNotificationCount(0);
        }
      }
    };

    loadNotifications();
    const interval = window.setInterval(loadNotifications, 10000);

    return () => {
      ignore = true;
      window.clearInterval(interval);
    };
  }, [currentUser?.id]);

  const readyToConnectUsers = useMemo(() => {
    const recommendationById = new Map(recommendations.map((item) => [String(item.id), item]));

    return roster
      .filter((user) => user?.mock_interview_enabled)
      .filter((user) => String(user.id) !== String(currentUser?.id))
      .map((user) => ({
        ...user,
        recommendation: recommendationById.get(String(user.id)) || null,
      }))
      .sort((left, right) => (right.recommendation?.score || 0) - (left.recommendation?.score || 0))
      .slice(0, 5);
  }, [currentUser?.id, recommendations, roster]);

  const topRecommendationScore = useMemo(() => {
    if (!readyToConnectUsers.length) {
      return 0;
    }

    return Math.max(...readyToConnectUsers.map((item) => item.recommendation?.score || 0));
  }, [readyToConnectUsers]);

  const recommendationStats = useMemo(
    () => [
      {
        label: 'Live user',
        value: currentUser?.id ? 'Loaded' : 'Missing',
        hint: currentUser?.id ? 'Using current session profile' : 'Sign in first',
      },
      {
        label: 'Connectable users',
        value: readyToConnectUsers.length || '0',
        hint: 'Loaded from MongoDB',
      },
      {
        label: 'Best score',
        value: formatScore(topRecommendationScore),
        hint: 'Highest backend rank',
      },
    ],
    [currentUser?.id, readyToConnectUsers.length, topRecommendationScore],
  );

  const liveProfileSummary = useMemo(
    () => [
      { label: 'Name', value: currentUser?.name || 'Not signed in' },
      { label: 'Location', value: currentUser?.location || 'Location not set' },
      { label: 'Goal', value: currentUser?.goal || 'Goal not set' },
      { label: 'Skills', value: currentUser?.skills ? Object.keys(currentUser.skills).length : 0 },
    ],
    [currentUser],
  );

  const handleSendInvite = async (partnerId, partnerName) => {
    if (!currentUser?.id) {
      setInviteError('Please sign in first.');
      return;
    }

    setInviteLoadingId(String(partnerId));
    setInviteError('');
    setInviteMessage('');

    try {
      const response = await sendConnectionInvite(Number(currentUser.id), Number(partnerId));
      if (response.error) {
        setInviteError(response.error);
        return;
      }

      setInviteMessage(`Invite sent to ${partnerName || 'collaborator'}. It will appear in their inbox.`);
    } catch (error) {
      setInviteError('Could not send the invite.');
    } finally {
      setInviteLoadingId('');
    }
  };

  return (
    <div className={`min-h-dvh w-full transition-colors duration-500 ${isDark ? 'bg-[#050f0a] text-white' : 'bg-[#f0fdf4] text-slate-900'}`}>
      <div
        className={`mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-5 py-5 transition-all duration-700 sm:px-8 ${
          isReady ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
        }`}
      >
        <nav className={`flex items-center justify-between rounded-full px-5 py-4 backdrop-blur-2xl ${isDark ? 'border border-emerald-500/15 bg-white/5' : 'border border-white/70 bg-white/75'}`}>
          <div>
            <p className={`text-xs font-bold uppercase tracking-[0.35em] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>SkillNet</p>
            <h1 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Peer Recommendations</h1>
          </div>

          <div className="flex items-center gap-3">
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
              <FaChartLine />
              Dashboard
            </button>

            <button
              type="button"
              onClick={() => navigate('/inbox')}
              className={`relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${isDark ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-200' : 'border border-emerald-100 bg-white text-emerald-700 shadow-sm'}`}
            >
              <FaInbox />
              Inbox
              {notificationCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-black text-white">
                  {notificationCount}
                </span>
              ) : null}
            </button>
          </div>
        </nav>

        <main className="flex-1 py-6">
          <section className={`overflow-hidden rounded-[2rem] p-7 ${cardBase}`}>
            <div className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
              <div>
                <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.28em] ${isDark ? 'bg-emerald-400/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}`}>
                  <FaUsers />
                  Match people by fit
                </div>
                <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
                  Live collaborators
                </h2>
                <p className={`mt-4 max-w-2xl text-sm leading-7 sm:text-base ${isDark ? 'text-emerald-50/75' : 'text-slate-600'}`}>
                  We pull the live user list from MongoDB, keep only users who enabled mock interviews, and rank them for your current session.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRefreshTick((current) => current + 1)}
                className={`inline-flex items-center gap-2 self-start rounded-full px-4 py-2 text-sm font-bold transition-all ${isDark ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-white text-slate-900 ring-1 ring-emerald-100 hover:bg-slate-50'}`}
              >
                <FaSyncAlt />
                Refresh matches
              </button>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {recommendationStats.map((item) => (
                <div key={item.label} className={`rounded-3xl p-4 ${surfaceBase}`}>
                  <p className={`text-xs font-bold uppercase tracking-[0.28em] ${isDark ? 'text-emerald-200/70' : 'text-emerald-700/70'}`}>{item.label}</p>
                  <p className="mt-3 text-2xl font-black">{item.value}</p>
                  <p className={`mt-1 text-xs ${isDark ? 'text-emerald-50/55' : 'text-slate-500'}`}>{item.hint}</p>
                </div>
              ))}
            </div>

            {currentUser?.id ? (
              <div className={`mt-7 rounded-[1.75rem] p-5 ${isDark ? 'bg-white/5 ring-1 ring-white/10' : 'bg-white/80 ring-1 ring-emerald-100'}`}>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-600">Live session user</p>
                    <h3 className="mt-2 text-2xl font-black">{currentUser.name}</h3>
                    <p className={`mt-2 text-sm ${isDark ? 'text-emerald-50/65' : 'text-slate-600'}`}>
                      This is the real-time user currently signed in on the device.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/profile')}
                    className={`inline-flex items-center gap-2 self-start rounded-full px-4 py-2 text-sm font-bold transition-all ${isDark ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-white text-slate-900 ring-1 ring-emerald-100 hover:bg-slate-50'}`}
                  >
                    View profile
                    <FaArrowRight />
                  </button>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {liveProfileSummary.map((item) => (
                    <div key={item.label} className={`rounded-2xl p-4 ${surfaceBase}`}>
                      <p className={`text-xs font-bold uppercase tracking-[0.25em] ${isDark ? 'text-emerald-200/70' : 'text-emerald-700/70'}`}>{item.label}</p>
                      <p className="mt-2 text-sm font-black">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {inviteMessage ? (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                {inviteMessage}
              </div>
            ) : null}

            {inviteError ? (
              <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {inviteError}
              </div>
            ) : null}

            <div className={`mt-7 rounded-[1.75rem] p-5 ${isDark ? 'bg-white/5 ring-1 ring-white/10' : 'bg-emerald-50/80 ring-1 ring-emerald-100'}`}>
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isDark ? 'bg-emerald-400/10 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                  <FaBullseye />
                </div>
                <div>
                  <p className="text-sm font-black">How the ranking works</p>
                  <p className={`text-sm ${isDark ? 'text-emerald-50/65' : 'text-slate-600'}`}>
                    The top results are the strongest mix of similarity and useful contrast.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  'Same goal and same location add direct alignment.',
                  'Shared interests and mock interview readiness increase practice value.',
                  'Complementary skill gaps help pair stronger and weaker areas.',
                  'The API returns a ranked top five, so the page mirrors that list exactly.',
                ].map((item) => (
                  <div key={item} className={`flex items-start gap-3 rounded-2xl p-3 ${chipBase}`}>
                    <FaCheckCircle className={`mt-0.5 flex-shrink-0 ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`} />
                    <p className="text-sm leading-6">{item}</p>
                  </div>
                ))}
              </div>

              <div className={`mt-5 rounded-2xl p-4 text-sm ${isDark ? 'bg-black/15 text-emerald-50/70' : 'bg-white/70 text-slate-600'}`}>
                The list comes from MongoDB, filtered to users who are ready to connect right now.
              </div>
            </div>
          </section>

          <section className={`mt-6 rounded-[2rem] p-6 ${cardBase}`}>
            <div className="flex flex-col gap-3 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className={`text-xs font-bold uppercase tracking-[0.35em] ${isDark ? 'text-emerald-300/80' : 'text-emerald-700'}`}>Ranked results</p>
                <h3 className="mt-2 text-2xl font-black">Top five recommendations</h3>
              </div>
              <div className={`text-sm ${isDark ? 'text-emerald-50/60' : 'text-slate-600'}`}>
                {loadingRecommendations ? 'Refreshing matches...' : 'Ordered by backend score'}
              </div>
            </div>

            {recommendationsError || rosterError ? (
              <div className={`mt-6 rounded-[1.5rem] p-6 text-sm ${isDark ? 'border border-rose-400/20 bg-rose-500/10 text-rose-100' : 'border border-rose-100 bg-rose-50 text-rose-700'}`}>
                {recommendationsError || rosterError}
              </div>
            ) : loadingRecommendations || loadingRoster ? (
              <div className={`mt-6 rounded-[1.5rem] p-6 text-sm ${surfaceBase}`}>Calculating peer matches...</div>
            ) : readyToConnectUsers.length ? (
              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                {readyToConnectUsers.map((item, index) => {
                  const recommendation = item.recommendation || {};
                  const progress = topRecommendationScore ? Math.max(8, Math.round(((recommendation.score || 0) / topRecommendationScore) * 100)) : 8;
                  const previewReasons = (recommendation.reasons || []).slice(0, 3);
                  const profileSkills = Array.isArray(item?.collaboration_skills)
                    ? item.collaboration_skills
                    : item?.skills && typeof item.skills === 'object'
                      ? Object.entries(item.skills).map(([name, level]) => ({ name, level }))
                      : [];
                  const profileInterests = Array.isArray(item?.interests) ? item.interests : [];
                  const profile = item;

                  return (
                    <article
                      key={profile.id}
                      className={`rounded-[1.6rem] border p-5 transition-all hover:-translate-y-0.5 ${
                        isDark ? 'border-white/10 bg-white/5' : 'border-emerald-100 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isDark ? 'bg-emerald-400/10 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                              <FaStar />
                            </div>
                            <div>
                              <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-600">
                                Rank {index + 1}
                              </p>
                              <h4 className="text-xl font-black">{profile.name}</h4>
                              {profile?.domain ? (
                                <p className={`mt-1 text-xs font-semibold uppercase tracking-[0.22em] ${isDark ? 'text-emerald-100/65' : 'text-slate-500'}`}>
                                  {profile.domain}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className={`rounded-2xl px-4 py-3 text-right ${isDark ? 'bg-white/5' : 'bg-emerald-50'}`}>
                          <p className="text-[0.65rem] font-bold uppercase tracking-[0.28em] text-emerald-600">Score</p>
                          <p className="mt-1 text-2xl font-black">{formatScore(item.score)}</p>
                        </div>
                      </div>

                      <div className="mt-5 h-2 overflow-hidden rounded-full bg-black/10">
                        <div
                          className={`h-full rounded-full ${isDark ? 'bg-gradient-to-r from-emerald-400 via-lime-300 to-amber-300' : 'bg-gradient-to-r from-emerald-600 via-lime-500 to-amber-400'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                          {(previewReasons.length ? previewReasons : ['No specific match reasons returned.']).map((reason) => (
                            <span key={reason} className={`rounded-full px-3 py-1 text-xs font-semibold ${chipBase}`}>
                              {reason}
                            </span>
                          ))}
                        </div>

                      {profile ? (
                        <div className={`mt-4 rounded-2xl p-4 ${surfaceBase}`}>
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className={`text-xs font-bold uppercase tracking-[0.28em] ${isDark ? 'text-emerald-200/70' : 'text-emerald-700/70'}`}>Profile preview</p>
                              <p className="mt-2 text-sm font-black">{profile.name || item.name}</p>
                              <p className={`mt-1 text-sm ${isDark ? 'text-emerald-50/65' : 'text-slate-600'}`}>
                                {profile.location || 'Location not set'}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleSendInvite(profile.id, profile.name || item.name)}
                                disabled={inviteLoadingId === String(profile.id)}
                                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${isDark ? 'bg-emerald-400 text-slate-950 hover:bg-emerald-300' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}
                              >
                                {inviteLoadingId === String(profile.id) ? 'Sending...' : 'Connect'}
                                <FaArrowRight />
                              </button>
                              <button
                                type="button"
                                onClick={() => navigate('/inbox')}
                                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${isDark ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-white text-slate-900 ring-1 ring-emerald-100 hover:bg-slate-50'}`}
                              >
                                Inbox
                              </button>
                            </div>
                          </div>

                          {profileSkills.length ? (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {profileSkills.slice(0, 4).map((skill, skillIndex) => (
                                <span key={`${skill.name || skillIndex}-${skillIndex}`} className={`rounded-full px-3 py-1 text-xs font-semibold ${chipBase}`}>
                                  {skill.name || skill}
                                </span>
                              ))}
                            </div>
                          ) : null}

                          {profileInterests.length ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {profileInterests.slice(0, 4).map((interest) => (
                                <span key={interest} className={`rounded-full px-3 py-1 text-xs font-semibold ${chipBase}`}>
                                  {humanizeKey(interest)}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div className={`mt-4 rounded-2xl p-4 text-sm ${surfaceBase}`}>
                          Profile preview is loading.
                        </div>
                      )}

                      <div className={`mt-4 rounded-2xl p-4 ${surfaceBase}`}>
                        <p className={`text-xs font-bold uppercase tracking-[0.28em] ${isDark ? 'text-emerald-200/70' : 'text-emerald-700/70'}`}>Why this match surfaced</p>
                        <ul className="mt-3 space-y-2">
                          {(item.reasons || []).slice(0, 4).map((reason) => (
                            <li key={reason} className="flex items-start gap-3 text-sm leading-6">
                              <FaCheckCircle className={`mt-0.5 flex-shrink-0 ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`} />
                              <span>{reason}</span>
                            </li>
                          ))}
                          {!item.reasons?.length ? (
                            <li className={`text-sm ${isDark ? 'text-emerald-50/60' : 'text-slate-600'}`}>The backend returned no reason strings for this profile.</li>
                          ) : null}
                        </ul>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className={`mt-6 rounded-[1.5rem] p-6 text-sm ${surfaceBase}`}>
                No MongoDB users are currently marked ready to connect.
              </div>
            )}

            <div className={`mt-6 flex flex-col gap-4 rounded-[1.6rem] p-5 sm:flex-row sm:items-center sm:justify-between ${isDark ? 'bg-white/5 ring-1 ring-white/10' : 'bg-emerald-50/80 ring-1 ring-emerald-100'}`}>
              <div>
                <p className="text-sm font-black">Need a fresh comparison?</p>
                <p className={`text-sm ${isDark ? 'text-emerald-50/65' : 'text-slate-600'}`}>
                  Refresh after updating your stored profile so the ranking reflects the latest data.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setRefreshTick((current) => current + 1)}
                className={`inline-flex items-center justify-center gap-3 rounded-full px-6 py-3 text-sm font-black transition-all ${isDark ? 'bg-gradient-to-r from-emerald-500 to-amber-400 text-emerald-950' : 'bg-gradient-to-r from-emerald-600 to-green-400 text-white'}`}
              >
                Recalculate matches
                <FaArrowRight />
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default RecommendationPage;
