import React, { useMemo } from 'react';
import {
  FaArrowLeft,
  FaCheckCircle,
  FaClipboardCheck,
} from 'react-icons/fa';
import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import { readCurrentUser } from '../lib/currentUser';
import { getSavedTest } from '../lib/dashboardStorage';


const SavedTestPage = ({ theme }) => {

  const navigate = useNavigate();

  const [searchParams] =
    useSearchParams();

  const isDark =
    theme === 'dark';

  const currentUser = useMemo(
    () => readCurrentUser(),
    []
  );

  const testId =
    searchParams.get('id');

  const savedTest = useMemo(
    () =>
      getSavedTest(
        currentUser?.id,
        testId
      ),
    [currentUser?.id, testId]
  );

  const cardBase = isDark
    ? 'border border-emerald-500/15 bg-white/5 text-emerald-50'
    : 'border border-emerald-100 bg-white text-slate-800 shadow-[0_18px_45px_rgba(16,185,129,0.08)]';

  if (!savedTest) {
    return (
      <main
        className={`min-h-dvh px-5 py-8 ${
          isDark
            ? 'bg-[#050f0a] text-white'
            : 'bg-[#f0fdf4] text-slate-900'
        }`}
      >
        <div className="mx-auto max-w-4xl">

          <button
            type="button"
            onClick={() =>
              navigate('/dashboard')
            }
            className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-black text-white"
          >
            <FaArrowLeft />
            Dashboard
          </button>

          <div
            className={`rounded-[2rem] p-8 ${cardBase}`}
          >
            <h1 className="text-2xl font-black">
              Saved test not found
            </h1>

            <p className="mt-3 text-sm opacity-70">
              This test may have been removed
              or is not available for the
              current account.
            </p>
          </div>

        </div>
      </main>
    );
  }

  const questions =
    savedTest.questions || [];

  const answers =
    savedTest.answers || {};

  const result =
    savedTest.result || {};

  const isCareer =
    savedTest.type ===
    'career-assessment';

  return (
    <main
      className={`min-h-dvh px-5 py-8 ${
        isDark
          ? 'bg-[#050f0a] text-white'
          : 'bg-[#f0fdf4] text-slate-900'
      }`}
    >

      <div className="mx-auto max-w-5xl">

        <button
          type="button"
          onClick={() =>
            navigate('/dashboard')
          }
          className={`mb-6 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-black ${
            isDark
              ? 'bg-white/10 text-emerald-100'
              : 'bg-white text-emerald-700 shadow-sm'
          }`}
        >
          <FaArrowLeft />
          Back to Dashboard
        </button>

        <section
          className={`rounded-[2rem] p-6 sm:p-8 ${cardBase}`}
        >

          <div className="flex flex-wrap items-start justify-between gap-5 border-b border-emerald-500/15 pb-6">

            <div>

              <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-600">
                {isCareer
                  ? 'Career Assessment'
                  : 'Mock Test'}
              </p>

              <h1 className="mt-2 text-3xl font-black">
                {savedTest.title}
              </h1>

              {isCareer ? (
                <p className="mt-2 text-sm opacity-70">
                  {savedTest.targetRole}
                </p>
              ) : null}

            </div>

            <div className="text-right">

              <p className="text-3xl font-black text-emerald-500">
                {result.percentage}%
              </p>

              <p className="text-xs opacity-60">
                {result.correct}/
                {result.total} correct
              </p>

            </div>

          </div>

          <div className="mt-7 space-y-6">

            {questions.map(
              (question, index) => {

                const selected =
                  Number(
                    answers[question.id]
                  );

                return (
                  <article
                    key={question.id}
                    className={`rounded-2xl border p-5 ${
                      isDark
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

                    <div className="mt-4 grid gap-2">

                      {question.options.map(
                        (
                          option,
                          optionIndex
                        ) => {

                          const isCorrect =
                            optionIndex ===
                            question.correct_index;

                          const isSelected =
                            selected ===
                            optionIndex;

                          return (
                            <div
                              key={
                                optionIndex
                              }
                              className={`rounded-xl border px-4 py-3 text-sm ${
                                isCorrect
                                  ? 'border-emerald-500 bg-emerald-500/15'
                                  : isSelected
                                    ? 'border-rose-400 bg-rose-500/10'
                                    : isDark
                                      ? 'border-white/10'
                                      : 'border-emerald-100 bg-white'
                              }`}
                            >

                              <div className="flex items-start gap-3">

                                {isCorrect ? (
                                  <FaCheckCircle className="mt-0.5 shrink-0 text-emerald-500" />
                                ) : (
                                  <span className="w-4 shrink-0" />
                                )}

                                <span>
                                  {option}
                                </span>

                              </div>

                            </div>
                          );
                        }
                      )}

                    </div>

                    {question.explanation ? (
                      <p
                        className={`mt-4 text-sm leading-6 ${
                          isDark
                            ? 'text-emerald-50/70'
                            : 'text-slate-600'
                        }`}
                      >
                        <strong>
                          Explanation:
                        </strong>{' '}
                        {question.explanation}
                      </p>
                    ) : null}

                  </article>
                );
              }
            )}

          </div>

        </section>

      </div>

    </main>
  );
};

export default SavedTestPage;