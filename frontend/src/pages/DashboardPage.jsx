import React, { useEffect, useMemo, useState } from 'react';
import { FaArrowRight, FaChartLine, FaClipboardCheck, FaHome, FaMoon, FaSun, FaUsers } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

import { readCurrentUser } from '../lib/currentUser';
import {
  readConnectionHistory,
  readMockTestHistory,
  readCareerAssessmentHistory,
  readSavedTests,
} from '../lib/dashboardStorage';

const formatDateTime = (value) => {
  if (!value) {
    return 'Unknown time';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown time';
  }

  return date.toLocaleString();
};

const DashboardPage = ({ theme, setTheme }) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const [currentUser, setCurrentUser] = useState(() => readCurrentUser());
  const [historyVersion, setHistoryVersion] = useState(0);

  const [careerAnalysis, setCareerAnalysis] = useState(null);
  const [careerEvidence, setCareerEvidence] = useState(null);
  const [careerLoading, setCareerLoading] = useState(false);

  const loadCareerReadiness = async () => {
    try {
      setCareerLoading(true);

      // ---------------------------------------
      // Helper: Always return an array
      // ---------------------------------------
      const toArray = (value) => {
        if (Array.isArray(value)) {
          return value;
        }

        if (value && typeof value === "object") {
          return Object.keys(value);
        }

        if (typeof value === "string" && value.trim()) {
          return value
            .split(",")
            .map(item => item.trim())
            .filter(Boolean);
        }

        return [];
      };

      // ---------------------------------------
      // Extract existing user data safely
      // ---------------------------------------

      const resumeSkills = toArray(
        currentUser?.resume_skills ||
        currentUser?.resumeSkills ||
        currentUser?.skills
      );

      const projectSkills = toArray(
        currentUser?.project_skills ||
        currentUser?.projectSkills
      );

      const githubSkills = toArray(
        currentUser?.github_skills ||
        currentUser?.githubSkills
      );

      const projects = Array.isArray(currentUser?.projects)
        ? currentUser.projects
        : [];

      const mockTests = Array.isArray(currentUser?.mock_tests)
        ? currentUser.mock_tests
        : (
          Array.isArray(currentUser?.mockTests)
            ? currentUser.mockTests
            : []
        );

      const atsScore = Number(
        currentUser?.ats_score ||
        currentUser?.atsScore ||
        0
      );

      const interviewScore = Number(
        currentUser?.interview_score ||
        currentUser?.interviewScore ||
        0
      );

      // ---------------------------------------
      // Build evidence payload
      // ---------------------------------------

      const evidencePayload = {
        resume_skills: resumeSkills,
        project_skills: projectSkills,
        github_skills: githubSkills,
        projects: projects,
        mock_tests: mockTests,
        ats_score: Number.isFinite(atsScore) ? atsScore : 0,
        interview_score: Number.isFinite(interviewScore)
          ? interviewScore
          : 0
      };

      console.log(
        "Career Evidence Payload:",
        evidencePayload
      );

      // ---------------------------------------
      // STEP 1: Career Evidence
      // ---------------------------------------

      const evidenceResponse = await fetch(
        "http://localhost:8000/career/evidence",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(evidencePayload)
        }
      );

      if (!evidenceResponse.ok) {

        const errorBody = await evidenceResponse.text();

        console.error(
          "Career Evidence API Error:",
          evidenceResponse.status,
          errorBody
        );

        throw new Error(
          `Failed to load career evidence (${evidenceResponse.status})`
        );
      }

      const evidence = await evidenceResponse.json();

      console.log(
        "Career Evidence Result:",
        evidence
      );

      setCareerEvidence(evidence);

      // ---------------------------------------
      // STEP 2: Career Analysis
      // ---------------------------------------

      const analysisPayload = {
        user_id: currentUser?.id
          ? Number(currentUser.id)
          : null,

        target_role:
          currentUser?.job_role ||
          currentUser?.jobRole ||
          "Software Engineer",

        skills: evidence.skills || {},

        ats_score: evidence.ats_score || 0,

        project_score:
          evidence.project_score || 0,

        interview_score:
          evidence.interview_score || 0,

        assessment_score:
          evidence.assessment_score || 0
      };

      console.log(
        "Career Analysis Payload:",
        analysisPayload
      );

      const analysisResponse = await fetch(
        "http://localhost:8000/career/analyze",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(analysisPayload)
        }
      );

      if (!analysisResponse.ok) {

        const errorBody = await analysisResponse.text();

        console.error(
          "Career Analysis API Error:",
          analysisResponse.status,
          errorBody
        );

        throw new Error(
          `Failed to load career analysis (${analysisResponse.status})`
        );
      }

      const analysis = await analysisResponse.json();

      console.log(
        "Career Analysis Result:",
        analysis
      );

      setCareerAnalysis(analysis);

    } catch (error) {

      console.error(
        "Career readiness error:",
        error
      );

    } finally {
      setCareerLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    loadCareerReadiness();
  }, [currentUser]);

  const cardBase = isDark
    ? 'border border-emerald-500/15 bg-white/5 text-emerald-50 shadow-[0_24px_60px_rgba(0,0,0,0.28)]'
    : 'border border-emerald-100 bg-white/85 text-slate-800 shadow-[0_24px_60px_rgba(16,185,129,0.10)]';

  const panelBase = isDark
    ? 'border border-white/10 bg-[#0b1711]/90 text-emerald-50'
    : 'border border-emerald-100 bg-white/90 text-slate-800';

  const toggleTheme = () => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    const syncUser = () => setCurrentUser(readCurrentUser());
    syncUser();
    window.addEventListener('auth-change', syncUser);
    window.addEventListener('storage', syncUser);

    return () => {
      window.removeEventListener('auth-change', syncUser);
      window.removeEventListener('storage', syncUser);
    };
  }, []);

  useEffect(() => {
    const refreshDashboard = () => {
      setCurrentUser(readCurrentUser());
      setHistoryVersion((current) => current + 1);
    };

    window.addEventListener('dashboard-change', refreshDashboard);
    window.addEventListener('storage', refreshDashboard);
    window.addEventListener('focus', refreshDashboard);

    return () => {
      window.removeEventListener('dashboard-change', refreshDashboard);
      window.removeEventListener('storage', refreshDashboard);
      window.removeEventListener('focus', refreshDashboard);
    };
  }, []);

  const connectionHistory = useMemo(() => readConnectionHistory(currentUser?.id), [currentUser?.id, historyVersion]);
  const mockTestHistory = useMemo(() => readMockTestHistory(currentUser?.id), [currentUser?.id, historyVersion]);
  const careerAssessmentHistory = useMemo(() => readCareerAssessmentHistory(currentUser?.id), [currentUser?.id, historyVersion]);
  const savedTests = useMemo(() => readSavedTests(currentUser?.id), [currentUser?.id, historyVersion]);

  const stats = useMemo(() => {

    const uniqueConnections =
      new Set(
        connectionHistory.map(
          (item) =>
            String(
              item.partnerId ||
              item.partnerName ||
              item.connectionId ||
              item.id
            )
        )
      ).size;

    const averageTestScore =
      mockTestHistory.length
        ? Math.round(
          mockTestHistory.reduce(
            (sum, item) =>
              sum +
              Number(
                item.percentage || 0
              ),
            0
          ) /
          mockTestHistory.length
        )
        : 'N/A';

    const averageCareerScore =
      careerAssessmentHistory.length
        ? Math.round(
          careerAssessmentHistory.reduce(
            (sum, item) =>
              sum +
              Number(
                item.percentage || 0
              ),
            0
          ) /
          careerAssessmentHistory.length
        )
        : 'N/A';

    return [
      {
        label: 'Connections made',
        value: uniqueConnections
      },

      {
        label: 'Latest connection',
        value: connectionHistory[0]
          ? formatDateTime(
            connectionHistory[0]
              .connectedAt
          )
          : 'None yet'
      },

      {
        label: 'Mock tests completed',
        value: mockTestHistory.length
      },

      {
        label: 'Career assessments',
        value:
          careerAssessmentHistory.length
      },

      {
        label: 'Career assessment average',
        value:
          averageCareerScore === 'N/A'
            ? averageCareerScore
            : `${averageCareerScore}%`
      },

      {
        label: 'Mock test average',
        value:
          averageTestScore === 'N/A'
            ? averageTestScore
            : `${averageTestScore}%`
      },

      {
        label: 'Profile',
        value:
          currentUser?.name ||
          'Active'
      }
    ];

  }, [
    connectionHistory,
    currentUser?.name,
    mockTestHistory,
    careerAssessmentHistory
  ]);
  const recentConnections = connectionHistory.slice(0, 6);

  return (
    <div className={`min-h-dvh w-full transition-colors duration-500 ${isDark ? 'bg-[#050f0a] text-white' : 'bg-[#f0fdf4] text-slate-900'}`}>
      <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-5 py-5 sm:px-8">
        <nav className={`flex items-center justify-between rounded-full px-5 py-4 backdrop-blur-2xl ${isDark ? 'border border-emerald-500/15 bg-white/5' : 'border border-white/70 bg-white/75'}`}>
          <div>
            <p className={`text-xs font-bold uppercase tracking-[0.35em] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>SkillNet</p>
            <h1 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Dashboard</h1>
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
          </div>
        </nav>

        <main className="flex-1 py-6">
          <section className={`rounded-[2rem] p-7 ${cardBase}`}>
            <div className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.28em] ${isDark ? 'bg-emerald-400/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}`}>
                  <FaChartLine />
                  Progress center
                </div>
                <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
                  {currentUser?.name || 'Your'} collaboration dashboard
                </h2>
                <p className={`mt-4 max-w-2xl text-sm leading-7 sm:text-base ${isDark ? 'text-emerald-50/75' : 'text-slate-600'}`}>
                  See your profile activity and the collaborators you have connected with over time.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/recommendations')}
                className={`inline-flex items-center gap-2 self-start rounded-full px-4 py-2 text-sm font-bold transition-all ${isDark ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-white text-slate-900 ring-1 ring-emerald-100 hover:bg-slate-50'}`}
              >
                View recommendations
                <FaArrowRight />
              </button>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((item) => (
                <div key={item.label} className={`rounded-3xl p-4 ${panelBase}`}>
                  <p className={`text-xs font-bold uppercase tracking-[0.28em] ${isDark ? 'text-emerald-200/70' : 'text-emerald-700/70'}`}>{item.label}</p>
                  <p className="mt-3 text-2xl font-black">{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6">
            <div className={`rounded-[2rem] p-6 ${cardBase}`}>
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <p className={`text-xs font-bold uppercase tracking-[0.35em] ${isDark ? 'text-emerald-300/80' : 'text-emerald-700'}`}>Mock tests</p>
                  <h3 className="mt-2 text-2xl font-black">Your recent test scores</h3>
                </div>
                <button type="button" onClick={() => navigate('/interview/mock-test')} className={`rounded-full px-4 py-2 text-sm font-bold ${isDark ? 'bg-white/10 text-emerald-100' : 'bg-emerald-50 text-emerald-700'}`}>
                  Take a test
                </button>
              </div>

              <div className="mt-6 space-y-4">
                {mockTestHistory.slice(0, 6).map((item) => (
                  <article key={item.id} className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-emerald-100 bg-white'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isDark ? 'bg-emerald-400/10 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}><FaClipboardCheck /></div>
                      <div>
                        <p className="text-sm font-black">{item.category || 'Mock Test'}{item.skill ? `: ${item.skill}` : ''}</p>
                        <p className={`mt-1 text-xs ${isDark ? 'text-emerald-50/60' : 'text-slate-500'}`}>Completed {formatDateTime(item.completedAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-emerald-600">{Number(item.percentage || 0)}%</p>
                      <p className={`text-xs font-semibold ${isDark ? 'text-emerald-50/60' : 'text-slate-500'}`}>{item.correct || 0}/{item.total || 0} correct</p>
                    </div>
                  </article>
                ))}
                {!mockTestHistory.length ? <div className={`rounded-2xl p-5 text-sm ${panelBase}`}>No mock tests completed yet. Take an Aptitude, Reasoning, or Technical test to see your score here.</div> : null}
              </div>
            </div>
          </section>

          <section className="mt-6">
            <div
              className={`rounded-[2rem] p-6 ${cardBase}`}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <p
                    className={`text-xs font-bold uppercase tracking-[0.35em] ${isDark
                      ? 'text-emerald-300/80'
                      : 'text-emerald-700'
                      }`}
                  >
                    Career assessments
                  </p>
                  <h3 className="mt-2 text-2xl font-black">
                    Career assessment progress
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    navigate('/career-assessment')
                  }
                  className={`rounded-full px-4 py-2 text-sm font-bold ${isDark
                    ? 'bg-white/10 text-emerald-100'
                    : 'bg-emerald-50 text-emerald-700'
                    }`}
                >
                  Take Assessment
                </button>
              </div>
              <div className="mt-6 space-y-4">
                {careerAssessmentHistory
                  .slice(0, 6)
                  .map((item) => (
                    <article
                      key={item.id}
                      className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4 ${isDark
                        ? 'border-white/10 bg-white/5'
                        : 'border-emerald-100 bg-white'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isDark
                            ? 'bg-emerald-400/10 text-emerald-300'
                            : 'bg-emerald-100 text-emerald-700'
                            }`}
                        >
                          <FaClipboardCheck />
                        </div>
                        <div>
                          <p className="text-sm font-black">
                            {item.targetRole ||
                              'Career Assessment'}
                          </p>
                          <p
                            className={`mt-1 text-xs ${isDark
                              ? 'text-emerald-50/60'
                              : 'text-slate-500'
                              }`}
                          >
                            Skill: {item.skill ||
                              'General'}
                          </p>
                          <p
                            className={`mt-1 text-xs ${isDark
                              ? 'text-emerald-50/40'
                              : 'text-slate-400'
                              }`}
                          >
                            Completed{' '}
                            {formatDateTime(
                              item.completedAt
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-emerald-600">
                          {item.percentage || 0}%
                        </p>
                        <p
                          className={`text-xs font-semibold ${isDark
                            ? 'text-emerald-50/60'
                            : 'text-slate-500'
                            }`}
                        >
                          {item.correct || 0}/
                          {item.total || 0} correct
                        </p>
                      </div>
                    </article>
                  ))}
                {!careerAssessmentHistory.length ? (
                  <div
                    className={`rounded-2xl p-5 text-sm ${panelBase}`}
                  >
                    No career assessments completed yet.
                    Start an AI Career Assessment to
                    track your skill progress here.
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="mt-6">
            <div
              className={`rounded-[2rem] p-6 ${cardBase}`}
            >
              <div className="border-b border-white/10 pb-5">
                <p
                  className={`text-xs font-bold uppercase tracking-[0.35em] ${isDark
                      ? 'text-emerald-300/80'
                      : 'text-emerald-700'
                    }`}
                >
                  Saved tests
                </p>
                <h3 className="mt-2 text-2xl font-black">
                  Your saved assessments
                </h3>
                <p
                  className={`mt-2 text-sm ${isDark
                      ? 'text-emerald-50/60'
                      : 'text-slate-500'
                    }`}
                >
                  Save a completed test to review
                  the questions, your answers, and
                  the correct answers later.
                </p>
              </div>
              <div className="mt-6 space-y-4">
                {savedTests
                  .slice(0, 10)
                  .map((item) => (
                    <article
                      key={item.id}
                      className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4 ${isDark
                          ? 'border-white/10 bg-white/5'
                          : 'border-emerald-100 bg-white'
                        }`}
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-black uppercase ${item.type ===
                                'career-assessment'
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : 'bg-sky-500/10 text-sky-600'
                              }`}
                          >
                            {item.type ===
                              'career-assessment'
                              ? 'Career Assessment'
                              : 'Mock Test'}
                          </span>
                        </div>
                        <p className="mt-3 text-sm font-black">
                          {item.title ||
                            item.category ||
                            'Saved Test'}
                        </p>
                        <p
                          className={`mt-1 text-xs ${isDark
                              ? 'text-emerald-50/50'
                              : 'text-slate-400'
                            }`}
                        >
                          Saved{' '}
                          {formatDateTime(
                            item.savedAt
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xl font-black text-emerald-600">
                            {item.result?.percentage ||
                              item.percentage ||
                              0}%
                          </p>
                          <p
                            className={`text-xs ${isDark
                                ? 'text-emerald-50/60'
                                : 'text-slate-500'
                              }`}
                          >
                            {item.result?.correct ||
                              item.correct ||
                              0}
                            /
                            {item.result?.total ||
                              item.total ||
                              0}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/dashboard/saved-test?id=${encodeURIComponent(
                                item.id
                              )}`
                            )
                          }
                          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black ${isDark
                              ? 'bg-emerald-500/10 text-emerald-300'
                              : 'bg-emerald-50 text-emerald-700'
                            }`}
                        >
                          View Test
                          <FaArrowRight />
                        </button>
                      </div>
                    </article>
                  ))}
                {!savedTests.length ? (
                  <div
                    className={`rounded-2xl p-5 text-sm ${panelBase}`}
                  >
                    No saved tests yet.
                    <br />
                    Complete a Mock Test or Career
                    Assessment and choose
                    <strong>
                      {' '}Save to Dashboard
                    </strong>.
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="mt-6">
            <div className={`rounded-[2rem] p-6 ${cardBase}`}>
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <p className={`text-xs font-bold uppercase tracking-[0.35em] ${isDark ? 'text-emerald-300/80' : 'text-emerald-700'}`}>Connections</p>
                  <h3 className="mt-2 text-2xl font-black">People you connected with</h3>
                </div>
                <div className={`rounded-full px-4 py-2 text-sm font-bold ${isDark ? 'bg-white/10' : 'bg-emerald-50'}`}>
                  {recentConnections.length} recent
                </div>
              </div>
              <div className="mt-6 space-y-4">
                {recentConnections.length ? (
                  recentConnections.map((item) => (
                    <article
                      key={item.id}
                      className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-emerald-100 bg-white'}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-black">{item.partnerName || item.name || 'Collaborator'}</p>
                          <p className={`mt-1 text-xs ${isDark ? 'text-emerald-50/60' : 'text-slate-500'}`}>
                            Connected on {formatDateTime(item.connectedAt)}
                          </p>
                        </div>
                        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isDark ? 'bg-emerald-400/10 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                          <FaUsers />
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                        {item.sessionId ? (
                          <span className={`rounded-full px-3 py-1 ${isDark ? 'bg-white/10 text-emerald-100' : 'bg-emerald-50 text-emerald-800'}`}>
                            Session #{item.sessionId}
                          </span>
                        ) : null}
                        {item.mode ? (
                          <span className={`rounded-full px-3 py-1 ${isDark ? 'bg-white/10 text-emerald-100' : 'bg-emerald-50 text-emerald-800'}`}>
                            {item.mode}
                          </span>
                        ) : null}
                      </div>
                    </article>
                  ))
                ) : (
                  <div className={`rounded-2xl p-5 text-sm ${panelBase}`}>
                    No connections recorded yet. Start a mock interview session to track when you connected with collaborators.
                  </div>
                )}

              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
