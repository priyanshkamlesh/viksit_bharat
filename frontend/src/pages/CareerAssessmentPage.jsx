import React, { useEffect, useMemo, useState } from 'react';
import {
  FaArrowLeft,
  FaArrowRight,
  FaCheckCircle,
  FaClipboardCheck,
  FaRoute,
  FaSpinner,
  FaRedo,
} from 'react-icons/fa';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { readCurrentUser } from '../lib/currentUser';
import { recordCareerAssessment, saveTest, } from '../lib/dashboardStorage';

const CareerAssessmentPage = ({ theme }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isDark = theme === 'dark';

  const [currentUser] = useState(() => readCurrentUser());

  /*
   * ---------------------------------------------------------
   * PAGE MODE
   * ---------------------------------------------------------
   */

  const initialMode = searchParams.get('mode');

  const [pageMode, setPageMode] = useState(
    initialMode === 'normal' || initialMode === 'career'
      ? 'setup'
      : 'choice'
  );

  const isCareerMode = initialMode === 'career';

  /*
   * ---------------------------------------------------------
   * CAREER SETUP
   * ---------------------------------------------------------
   */

  const [roles, setRoles] = useState([]);
  const [targetRole, setTargetRole] = useState('');
  const [skills, setSkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState('');

  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState('mixed');

  /*
   * ---------------------------------------------------------
   * ASSESSMENT
   * ---------------------------------------------------------
   */

  const [assessment, setAssessment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingAssessment, setLoadingAssessment] = useState(false);
  const [error, setError] = useState('');

  /*
   * ---------------------------------------------------------
   * STYLES
   * ---------------------------------------------------------
   */

  const cardBase = isDark
    ? 'border border-emerald-500/15 bg-white/5 text-emerald-50 shadow-[0_24px_60px_rgba(0,0,0,0.28)]'
    : 'border border-emerald-100 bg-white/90 text-slate-800 shadow-[0_24px_60px_rgba(16,185,129,0.10)]';

  const inputClass = isDark
    ? 'w-full rounded-xl border border-white/10 bg-[#0b1711] px-4 py-3 text-sm text-white outline-none focus:border-emerald-400'
    : 'w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-400';

  const mutedText = isDark
    ? 'text-emerald-50/70'
    : 'text-slate-600';

  /*
   * ---------------------------------------------------------
   * LOAD ROLES
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (pageMode !== 'setup') {
      return;
    }

    const loadRoles = async () => {
      try {
        setLoadingRoles(true);
        setError('');

        console.log('Loading career roles...');

        const response = await fetch(
          'http://localhost:8000/career/roles'
        );

        console.log(
          'Career roles response:',
          response.status
        );

        if (!response.ok) {
          throw new Error(
            `Career roles API failed (${response.status})`
          );
        }

        const data = await response.json();

        console.log(
          'Career roles:',
          data
        );

        const availableRoles = data.roles || [];

        if (!availableRoles.length) {
          throw new Error(
            'No career roles were returned by the backend.'
          );
        }

        setRoles(availableRoles);

        /*
         * Normal mode:
         * use user's profile role if available.
         */

        if (!isCareerMode) {
          const profileRole =
            currentUser?.job_role ||
            currentUser?.jobRole ||
            '';

          if (
            profileRole &&
            availableRoles.includes(profileRole)
          ) {
            setTargetRole(profileRole);
          }
        }
      } catch (error) {
        console.error(
          'Career role loading error:',
          error
        );

        setError(
          error.message ||
          'Could not load career roles.'
        );
      } finally {
        setLoadingRoles(false);
      }
    };

    loadRoles();
  }, [pageMode, currentUser]);

  /*
   * ---------------------------------------------------------
   * LOAD SKILLS
   * ---------------------------------------------------------
   *
   * For now these are the skills supported by the
   * Career Assessment UI.
   *
   * Later we can load the exact skills from
   * career_roles.json through a dedicated API.
   */

  useEffect(() => {
    if (!targetRole) {
      setSkills([]);
      setSelectedSkill('');
      return;
    }

    const loadRoleSkills = async () => {
      try {
        setError('');

        console.log(
          'Loading skills for:',
          targetRole
        );

        const response = await fetch(
          `http://localhost:8000/career/roles/${encodeURIComponent(
            targetRole
          )}`
        );

        console.log(
          'Role skills response:',
          response.status
        );

        if (!response.ok) {
          throw new Error(
            `Failed to load skills (${response.status})`
          );
        }

        const data = await response.json();

        console.log(
          'Role skill data:',
          data
        );

        const availableSkills = Object.keys(
          data.skills || {}
        );

        setSkills(availableSkills);

        /*
         * Automatically select the first skill.
         */
        const skillFromUrl =
          searchParams.get('skill');

        if (
          isCareerMode &&
          skillFromUrl &&
          availableSkills.includes(skillFromUrl)
        ) {
          setSelectedSkill(skillFromUrl);
        } else if (availableSkills.length > 0) {
          setSelectedSkill(availableSkills[0]);
        } else {
          setSelectedSkill('');
        }

      } catch (error) {

        console.error(
          'Skill loading error:',
          error
        );

        setSkills([]);
        setSelectedSkill('');

        setError(
          error.message ||
          'Could not load assessment skills.'
        );
      }
    };

    loadRoleSkills();

  }, [targetRole, isCareerMode, searchParams]);

  /*
   * ---------------------------------------------------------
   * NORMAL ASSESSMENT
   * ---------------------------------------------------------
   */

  const startNormalAssessment = () => {
    setError('');
    setPageMode('setup');

    /*
     * Explicitly mark this as a normal assessment.
     */
    localStorage.setItem(
      'careerAssessmentMode',
      'normal'
    );
  };

  /*
   * ---------------------------------------------------------
   * RESUME CAREER ASSESSMENT
   * ---------------------------------------------------------
   */

  const resumeCareerAssessment = () => {
    setError('');

    const savedSession = JSON.parse(
      localStorage.getItem(
        'careerAssessmentSession'
      ) || 'null'
    );

    /*
     * If there is an active assessment,
     * continue it.
     */

    if (
      savedSession &&
      savedSession.status === 'in_progress' &&
      savedSession.targetRole &&
      savedSession.skill
    ) {
      navigate(
        `/career-assessment?mode=career&role=${encodeURIComponent(
          savedSession.targetRole
        )}&skill=${encodeURIComponent(
          savedSession.skill
        )}`
      );

      return;
    }

    /*
     * If no active assessment exists,
     * send the student to the roadmap.
     */

    const roadmapData = JSON.parse(
      localStorage.getItem(
        'careerRoadmapData'
      ) || 'null'
    );

    if (
      roadmapData &&
      roadmapData.targetRole &&
      Array.isArray(roadmapData.skillGaps) &&
      roadmapData.skillGaps.length
    ) {
      navigate('/career-roadmap');
      return;
    }

    /*
     * No roadmap exists yet.
     */

    navigate('/career-readiness');
  };

  /*
   * ---------------------------------------------------------
   * RESTORE CAREER ASSESSMENT
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!isCareerMode) {
      return;
    }

    const roleFromUrl =
      searchParams.get('role');

    const skillFromUrl =
      searchParams.get('skill');

    if (roleFromUrl) {
      setTargetRole(roleFromUrl);
    }

    if (skillFromUrl) {
      setSelectedSkill(skillFromUrl);
    }

    setPageMode('setup');
  }, [isCareerMode, searchParams]);

  /*
   * ---------------------------------------------------------
   * GENERATE AI ASSESSMENT
   * ---------------------------------------------------------
   */

  const generateAssessment = async () => {
    if (!targetRole) {
      setError(
        'Please select a career role.'
      );
      return;
    }

    if (!selectedSkill) {
      setError(
        'Please select an assessment skill.'
      );
      return;
    }

    try {
      setLoadingAssessment(true);
      setError('');
      setAssessment(null);
      setResult(null);
      setAnswers({});

      console.log(
        'Generating Career Assessment:',
        {
          target_role: targetRole,
          skill: selectedSkill,
          question_count: questionCount,
          difficulty,
        }
      );

      const response = await fetch(
        'http://localhost:8000/career/assessment/generate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            target_role: targetRole,
            skill: selectedSkill,
            question_count: questionCount,
            difficulty,
          }),
        }
      );

      const responseText =
        await response.text();

      console.log(
        'Assessment API status:',
        response.status
      );

      console.log(
        'Assessment API response:',
        responseText
      );

      if (!response.ok) {
        throw new Error(
          responseText ||
          `Assessment API failed (${response.status})`
        );
      }

      const data =
        JSON.parse(responseText);

      if (
        !data.questions ||
        !data.questions.length
      ) {
        throw new Error(
          'AI did not return any questions.'
        );
      }

      setAssessment(data);

      /*
       * Save active career assessment.
       */

      if (isCareerMode) {
        localStorage.setItem(
          'careerAssessmentSession',
          JSON.stringify({
            mode: 'career',
            targetRole,
            skill: selectedSkill,
            questionCount,
            difficulty,
            startedAt:
              new Date().toISOString(),
            status: 'in_progress',
          })
        );
      }
      /*
       * Move to assessment UI.
       */

      setPageMode('assessment');
    } catch (error) {
      console.error(
        'Career assessment generation error:',
        error
      );

      setError(
        error.message ||
        'Could not generate the career assessment.'
      );
    } finally {
      setLoadingAssessment(false);
    }
  };

  const saveCareerAssessment = () => {
    if (!assessment || !result) {
      return;
    }

    const saved = saveTest(
      currentUser?.id,
      {
        type: 'career-assessment',
        title:
          `${targetRole}: ${selectedSkill}`,
        targetRole,
        skill: selectedSkill,
        difficulty,
        questions:
          assessment.questions,
        answers,
        result,
      }
    );

    alert(
      'Career assessment saved to your dashboard.'
    );

    console.log(
      'Saved career assessment:',
      saved
    );
  };

  /*
   * ---------------------------------------------------------
   * SUBMIT
   * ---------------------------------------------------------
   */

  const submitAssessment = () => {
    if (!assessment?.questions?.length) {
      return;
    }

    const questions =
      assessment.questions;

    const correct =
      questions.filter(
        (question) =>
          Number(
            answers[question.id]
          ) ===
          Number(
            question.correct_index
          )
      ).length;

    const percentage = Math.round(
      (correct / questions.length) * 100
    );

    const completedResult = {
      correct,
      total: questions.length,
      percentage,
      targetRole,
      skill: selectedSkill,
      difficulty,
      mode: isCareerMode
        ? 'career'
        : 'normal',
      completedAt:
        new Date().toISOString(),
    };

    setResult(completedResult);

    /*
     * Career Assessment History
     *
     * Completely separate from Mock Test History.
     */

    const history =
      JSON.parse(
        localStorage.getItem(
          'careerAssessmentHistory'
        ) || '[]'
      );

    history.unshift(
      completedResult
    );

    localStorage.setItem(
      'careerAssessmentHistory',
      JSON.stringify(history)
    );

    /*
     * Complete active career session.
     */

    if (isCareerMode) {
      localStorage.setItem(
        'careerAssessmentSession',
        JSON.stringify({
          mode: 'career',
          targetRole,
          skill: selectedSkill,
          status: 'completed',
          completedAt:
            new Date().toISOString(),
          score: percentage,
        })
      );
    }

    setPageMode('result');
  };

  /*
   * ---------------------------------------------------------
   * RESTART
   * ---------------------------------------------------------
   */

  const restartAssessment = () => {
    setAssessment(null);
    setAnswers({});
    setResult(null);
    setError('');
    setPageMode('setup');
  };

  /*
   * ---------------------------------------------------------
   * PROGRESS
   * ---------------------------------------------------------
   */

  const answeredCount =
    Object.keys(answers).length;

  const totalQuestions =
    assessment?.questions?.length || 0;

  /*
   * =========================================================
   * CHOICE SCREEN
   * =========================================================
   */

  if (pageMode === 'choice') {
    return (
      <div
        className={`min-h-dvh w-full ${isDark
          ? 'bg-[#050f0a] text-white'
          : 'bg-[#f0fdf4] text-slate-900'
          }`}
      >
        <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-5 py-8 sm:px-8">

          <button
            type="button"
            onClick={() =>
              navigate('/home')
            }
            className={`mb-10 self-start inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold ${isDark
              ? 'bg-white/10 text-emerald-100'
              : 'bg-white text-emerald-700 shadow-sm'
              }`}
          >
            <FaArrowLeft />
            Back to Home
          </button>

          <div className="mx-auto w-full max-w-5xl text-center">

            <p className="text-xs font-bold uppercase tracking-[0.35em] text-emerald-500">
              SkillNet Assessment
            </p>

            <h1 className="mt-4 text-3xl font-black sm:text-5xl">
              Choose Your Assessment
            </h1>

            <p
              className={`mx-auto mt-4 max-w-2xl text-sm leading-7 sm:text-base ${mutedText}`}
            >
              Start a new career assessment or continue
              the assessment journey connected to your
              personalized career roadmap.
            </p>

            <div className="mt-10 grid gap-6 md:grid-cols-2">

              {/* NORMAL */}

              <button
                type="button"
                onClick={
                  startNormalAssessment
                }
                className={`group rounded-[2rem] p-8 text-left transition-all hover:-translate-y-1 ${cardBase}`}
              >
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl ${isDark
                    ? 'bg-sky-400/10 text-sky-300'
                    : 'bg-sky-100 text-sky-700'
                    }`}
                >
                  <FaClipboardCheck className="text-2xl" />
                </div>

                <h2 className="mt-6 text-2xl font-black">
                  Normal Career Assessment
                </h2>

                <p
                  className={`mt-4 text-sm leading-7 ${mutedText}`}
                >
                  Start a new assessment by selecting
                  a career role and skill. AI will generate
                  questions based on your selection.
                </p>

                <div className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-sky-500">
                  Start Assessment
                  <FaArrowRight className="transition-transform group-hover:translate-x-1" />
                </div>
              </button>

              {/* RESUME */}

              <button
                type="button"
                onClick={
                  resumeCareerAssessment
                }
                className={`group rounded-[2rem] p-8 text-left transition-all hover:-translate-y-1 ${cardBase}`}
              >
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl ${isDark
                    ? 'bg-emerald-400/10 text-emerald-300'
                    : 'bg-emerald-100 text-emerald-700'
                    }`}
                >
                  <FaRoute className="text-2xl" />
                </div>

                <h2 className="mt-6 text-2xl font-black">
                  Resume Career Assessment
                </h2>

                <p
                  className={`mt-4 text-sm leading-7 ${mutedText}`}
                >
                  Continue your career assessment from
                  your personalized roadmap and work on
                  the next identified skill gap.
                </p>

                <div className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-emerald-500">
                  Resume Career Path
                  <FaArrowRight className="transition-transform group-hover:translate-x-1" />
                </div>
              </button>

            </div>

          </div>
        </div>
      </div>
    );
  }

  /*
   * =========================================================
   * SETUP SCREEN
   * =========================================================
   */

  if (pageMode === 'setup') {
    return (
      <div
        className={`min-h-dvh w-full ${isDark
          ? 'bg-[#050f0a] text-white'
          : 'bg-[#f0fdf4] text-slate-900'
          }`}
      >
        <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-5 py-8 sm:px-8">

          <button
            type="button"
            onClick={() =>
              navigate('/home')
            }
            className={`mb-8 self-start inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold ${isDark
              ? 'bg-white/10 text-emerald-100'
              : 'bg-white text-emerald-700 shadow-sm'
              }`}
          >
            <FaArrowLeft />
            Back to Home
          </button>

          <div className="mx-auto mt-4 w-full max-w-4xl">

            <div
              className={`rounded-[2rem] p-7 sm:p-9 ${cardBase}`}
            >

              <div className="flex items-start gap-4">

                <div
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${isDark
                    ? 'bg-emerald-400/10 text-emerald-300'
                    : 'bg-emerald-100 text-emerald-700'
                    }`}
                >
                  {isCareerMode ? (
                    <FaRoute className="text-2xl" />
                  ) : (
                    <FaClipboardCheck className="text-2xl" />
                  )}
                </div>

                <div>

                  <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-500">
                    AI Career Assessment
                  </p>

                  <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                    {isCareerMode
                      ? 'Continue Career Assessment'
                      : 'Assess Your Career Skills'}
                  </h1>

                  <p
                    className={`mt-3 text-sm leading-7 ${mutedText}`}
                  >
                    {isCareerMode
                      ? 'Continue the assessment connected to your career roadmap.'
                      : 'Evaluate your career skills using AI-generated MCQs.'}
                  </p>

                </div>

              </div>

              {error ? (
                <div className="mt-6 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                  {error}
                </div>
              ) : null}

              <div className="mt-8 grid gap-5 md:grid-cols-2">

                {/* ROLE */}

                <label className="space-y-2">

                  <span className="text-sm font-bold">
                    Career Role
                  </span>

                  <select
                    value={targetRole}
                    onChange={(event) => {
                      setTargetRole(
                        event.target.value
                      );
                      setSelectedSkill('');
                    }}
                    disabled={
                      loadingRoles ||
                      isCareerMode
                    }
                    className={inputClass}
                  >

                    <option value="">
                      {loadingRoles
                        ? 'Loading roles...'
                        : 'Select career role'}
                    </option>

                    {roles.map(
                      (role) => (
                        <option
                          key={role}
                          value={role}
                        >
                          {role}
                        </option>
                      )
                    )}

                  </select>

                </label>

                {/* SKILL */}

                <label className="space-y-2">

                  <span className="text-sm font-bold">
                    Assessment Skill
                  </span>

                  <select
                    value={selectedSkill}
                    onChange={(event) =>
                      setSelectedSkill(
                        event.target.value
                      )
                    }
                    disabled={!targetRole || !skills.length}
                    className={inputClass}
                  >
                    <option value="">
                      {!targetRole
                        ? 'Select career role first'
                        : !skills.length
                          ? 'Loading skills...'
                          : 'Select assessment skill'}
                    </option>

                    {skills.map((skill) => (
                      <option
                        key={skill}
                        value={skill}
                      >
                        {skill}
                      </option>
                    ))}
                  </select>

                </label>

                {/* QUESTIONS */}

                <label className="space-y-2">

                  <span className="text-sm font-bold">
                    Number of Questions
                  </span>

                  <select
                    value={questionCount}
                    onChange={(event) =>
                      setQuestionCount(
                        Number(
                          event.target.value
                        )
                      )
                    }
                    className={inputClass}
                  >
                    <option value={10}>
                      10 Questions
                    </option>
                    <option value={15}>
                      15 Questions
                    </option>
                    <option value={20}>
                      20 Questions
                    </option>
                  </select>

                </label>

                {/* DIFFICULTY */}

                <label className="space-y-2">

                  <span className="text-sm font-bold">
                    Difficulty
                  </span>

                  <select
                    value={difficulty}
                    onChange={(event) =>
                      setDifficulty(
                        event.target.value
                      )
                    }
                    className={inputClass}
                  >
                    <option value="easy">
                      Easy
                    </option>
                    <option value="medium">
                      Medium
                    </option>
                    <option value="hard">
                      Hard
                    </option>
                    <option value="mixed">
                      Mixed
                    </option>
                  </select>

                </label>

              </div>

              {isCareerMode ? (
                <div
                  className={`mt-6 rounded-2xl p-4 ${isDark
                    ? 'bg-emerald-400/10'
                    : 'bg-emerald-50'
                    }`}
                >
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
                    Roadmap Assessment
                  </p>

                  <p className="mt-2 font-black">
                    {selectedSkill || 'Pending skill'}
                  </p>

                  <p className={`mt-1 text-sm ${mutedText}`}>
                    This assessment is connected to your
                    personalized career roadmap.
                  </p>
                </div>
              ) : null}

              <button
                type="button"
                onClick={
                  generateAssessment
                }
                disabled={
                  loadingAssessment ||
                  loadingRoles ||
                  !targetRole ||
                  !selectedSkill
                }
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
              >

                {loadingAssessment ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Generating AI Assessment...
                  </>
                ) : (
                  <>
                    <FaClipboardCheck />
                    Generate AI Assessment
                  </>
                )}

              </button>

            </div>

          </div>
        </div>
      </div>
    );
  }

  /*
   * =========================================================
   * ASSESSMENT SCREEN
   * =========================================================
   */

  if (pageMode === 'assessment') {
    return (
      <div
        className={`min-h-dvh w-full ${isDark
          ? 'bg-[#050f0a] text-white'
          : 'bg-[#f0fdf4] text-slate-900'
          }`}
      >
        <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">

          <div
            className={`rounded-[2rem] p-6 sm:p-8 ${cardBase}`}
          >

            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-emerald-500/15 pb-6">

              <div>

                <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-600">
                  AI Career Assessment
                </p>

                <h1 className="mt-2 text-2xl font-black sm:text-3xl">
                  {assessment.skill}
                </h1>

                <p className={`mt-2 text-sm ${mutedText}`}>
                  {assessment.target_role}
                </p>

              </div>

              <span className="rounded-full bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-600">
                {answeredCount}/{totalQuestions} answered
              </span>

            </div>

            <div className="mt-7 space-y-6">

              {assessment.questions.map(
                (question, index) => {

                  const selected =
                    Number(
                      answers[question.id]
                    );

                  return (
                    <article
                      key={question.id}
                      className={`rounded-2xl border p-5 ${isDark
                        ? 'border-white/10 bg-white/5'
                        : 'border-emerald-100 bg-emerald-50/30'
                        }`}
                    >

                      <p className="font-bold leading-7">

                        <span className="mr-2 text-emerald-600">
                          {index + 1}.
                        </span>

                        {question.question}

                      </p>

                      <div className="mt-4 grid gap-3">

                        {question.options.map(
                          (
                            option,
                            optionIndex
                          ) => {

                            const isSelected =
                              selected ===
                              optionIndex;

                            return (
                              <label
                                key={
                                  optionIndex
                                }
                                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm ${isSelected
                                  ? 'border-emerald-500 bg-emerald-500/10'
                                  : isDark
                                    ? 'border-white/10 bg-black/10'
                                    : 'border-emerald-100 bg-white'
                                  }`}
                              >

                                <input
                                  type="radio"
                                  name={`career-question-${question.id}`}
                                  checked={
                                    isSelected
                                  }
                                  onChange={() =>
                                    setAnswers(
                                      (
                                        current
                                      ) => ({
                                        ...current,
                                        [question.id]:
                                          optionIndex,
                                      })
                                    )
                                  }
                                />

                                <span>
                                  {option}
                                </span>

                              </label>
                            );
                          }
                        )}

                      </div>

                    </article>
                  );
                }
              )}

            </div>

            <button
              type="button"
              onClick={
                submitAssessment
              }
              disabled={
                answeredCount !==
                totalQuestions
              }
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-black text-white disabled:opacity-50"
            >
              <FaCheckCircle />
              Submit Assessment
            </button>
          </div>
        </div>
      </div>
    );
  }

  /*
   * =========================================================
   * RESULT SCREEN
   * =========================================================
   */

  if (pageMode === 'result') {
    return (
      <div
        className={`min-h-dvh w-full ${isDark
          ? 'bg-[#050f0a] text-white'
          : 'bg-[#f0fdf4] text-slate-900'
          }`}
      >
        <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8">

          <div
            className={`rounded-[2rem] p-7 sm:p-9 ${cardBase}`}
          >

            <div className="text-center">

              <FaCheckCircle className="mx-auto text-6xl text-emerald-500" />

              <p className="mt-6 text-xs font-black uppercase tracking-[0.3em] text-emerald-600">
                Assessment Complete
              </p>

              <h1 className="mt-3 text-5xl font-black">
                {result.percentage}%
              </h1>

              <p className={`mt-2 ${mutedText}`}>
                {result.correct} / {result.total} correct
              </p>

            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">

              <div className="rounded-2xl bg-emerald-500/10 p-5 text-center">
                <p className="text-xs font-bold">
                  Career Role
                </p>

                <p className="mt-2 font-black">
                  {result.targetRole}
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-500/10 p-5 text-center">
                <p className="text-xs font-bold">
                  Skill
                </p>

                <p className="mt-2 font-black">
                  {result.skill}
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-500/10 p-5 text-center">
                <p className="text-xs font-bold">
                  Score
                </p>

                <p className="mt-2 font-black text-emerald-500">
                  {result.percentage}%
                </p>
              </div>

            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">

              <button
                type="button"
                onClick={
                  restartAssessment
                }
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-black text-white"
              >
                <FaRedo />
                Take Another Assessment
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    '/career-readiness'
                  )
                }
                className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-black ${isDark
                  ? 'bg-white/10 text-emerald-100'
                  : 'bg-emerald-50 text-emerald-700'
                  }`}
              >
                Career Readiness
                <FaArrowRight />
              </button>

              <button
                type="button"
                onClick={
                  saveCareerAssessment
                }
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-black text-white"
              >
                <FaClipboardCheck />
                Save Assessment to Dashboard
              </button>

            </div>

          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default CareerAssessmentPage;