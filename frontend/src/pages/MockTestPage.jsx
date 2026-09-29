import { useMemo, useState } from 'react';
import { FaArrowLeft, FaCheckCircle, FaClipboardCheck, FaSpinner } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { generateMockTest } from '../lib/api';
import { readCurrentUser } from '../lib/currentUser';
import { recordMockTest, saveTest } from '../lib/dashboardStorage';

const TEST_OPTIONS = [
  { value: 'aptitude', title: 'Aptitude Test', description: 'Quantitative aptitude, arithmetic, ratios, time, work, and probability.' },
  { value: 'reasoning', title: 'Reasoning Test', description: 'Patterns, logic, directions, analogies, and problem solving.' },
  { value: 'technical', title: 'Technical Test', description: 'Skill-focused technical questions selected for your preparation.' },
];

const DEFAULT_SKILLS = ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'Data Structures', 'DBMS', 'Operating Systems', 'Computer Networks'];

const MockTestPage = ({ theme }) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const currentUser = useMemo(() => readCurrentUser(), []);
  const profileSkills = useMemo(() => {
    const skills = currentUser?.collaboration_skills || currentUser?.skills || [];
    return Array.isArray(skills) ? skills.map((item) => item.name).filter(Boolean) : Object.keys(skills || {});
  }, [currentUser]);
  const skillOptions = [...new Set([...profileSkills, ...DEFAULT_SKILLS])];
  const [category, setCategory] = useState('aptitude');
  const [skill, setSkill] = useState(profileSkills[0] || 'JavaScript');
  const [questionCount, setQuestionCount] = useState(10);
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const cardBase = isDark ? 'border border-emerald-500/15 bg-white/5 text-emerald-50' : 'border border-emerald-100 bg-white text-slate-800 shadow-[0_18px_45px_rgba(16,185,129,0.08)]';
  const inputClass = isDark ? 'w-full rounded-xl border border-white/10 bg-[#0b1711] px-4 py-3 text-sm text-white outline-none' : 'w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-800 outline-none';

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setTest(null);
    setResult(null);
    setAnswers({});
    try {
      const data = await generateMockTest(category, category === 'technical' ? skill : '', questionCount);
      if (data.error) {
        setError(data.error);
        return;
      }
      setTest(data);
    } catch (requestError) {
      setError(requestError.message || 'Could not generate the mock test.');
    } finally {
      setLoading(false);
    }
  };

  const submitTest = () => {
    const questions =
      test?.questions || [];

    const correct =
      questions.filter(
        (question) =>
          Number(
            answers[question.id]
          ) ===
          question.correct_index
      ).length;

    const completedResult = {
      correct,
      total: questions.length,
      percentage: Math.round(
        (correct / questions.length) * 100
      ),
    };

    setResult(completedResult);

    recordMockTest(
      currentUser?.id,
      {
        category: test.category,
        skill: test.skill,
        ...completedResult,
      }
    );
  };
  const saveCurrentTest = () => {
    if (!test || !result) {
      return;
    }

    const saved = saveTest(
      currentUser?.id,
      {
        type: 'mock',
        title:
          `${test.category}${test.skill ? `: ${test.skill}` : ''}`,
        category: test.category,
        skill: test.skill || '',
        questions: test.questions,
        answers,
        result,
      }
    );

    alert(
      'Mock test saved to your dashboard.'
    );

    console.log(
      'Saved mock test:',
      saved
    );
  };

  return (
    <main className={`min-h-[calc(100dvh-5rem)] px-5 py-8 sm:px-8 ${isDark ? 'text-white' : 'text-slate-900'}`}>
      <div className="mx-auto max-w-5xl">
        <button type="button" onClick={() => navigate('/interview')} className={`mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${isDark ? 'bg-white/10 text-emerald-100' : 'bg-white text-slate-700 ring-1 ring-emerald-100'}`}>
          <FaArrowLeft /> Interview Skills
        </button>

        <section className={`rounded-[2rem] p-6 sm:p-8 ${cardBase}`}>
          <div className="flex items-start gap-4">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${isDark ? 'bg-emerald-400/15 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}><FaClipboardCheck className="text-2xl" /></div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-600">AI mock test</p>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl">Test your placement readiness</h1>
              <p className={`mt-3 max-w-2xl text-sm leading-7 ${isDark ? 'text-emerald-50/70' : 'text-slate-600'}`}>Choose an assessment, generate 10 to 20 MCQs, and review your score with the correct answers.</p>
            </div>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {TEST_OPTIONS.map((option) => (
              <button key={option.value} type="button" onClick={() => { setCategory(option.value); setTest(null); setResult(null); }} className={`rounded-2xl border p-4 text-left transition-all ${category === option.value ? 'border-emerald-500 bg-emerald-500 text-emerald-950' : isDark ? 'border-white/10 bg-white/5 hover:border-emerald-400/40' : 'border-emerald-100 bg-emerald-50/40 hover:border-emerald-400'}`}>
                <h2 className="font-black">{option.title}</h2>
                <p className={`mt-2 text-xs leading-5 ${category === option.value ? 'text-emerald-950/75' : isDark ? 'text-emerald-50/65' : 'text-slate-600'}`}>{option.description}</p>
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {category === 'technical' ? <label className="space-y-2"><span className="text-sm font-bold">Technical skill</span><select value={skill} onChange={(event) => setSkill(event.target.value)} className={inputClass}>{skillOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label> : <div />}
            <label className="space-y-2"><span className="text-sm font-bold">Questions</span><select value={questionCount} onChange={(event) => setQuestionCount(Number(event.target.value))} className={inputClass}><option value={10}>10 questions</option><option value={15}>15 questions</option><option value={20}>20 questions</option></select></label>
          </div>
          <button type="button" onClick={handleGenerate} disabled={loading} className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-black text-white disabled:opacity-60">{loading ? <FaSpinner className="animate-spin" /> : <FaClipboardCheck />}{loading ? 'Generating test...' : 'Generate mock test'}</button>
          {error ? <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p> : null}
        </section>

        {test ? <section className={`mt-8 rounded-[2rem] p-6 sm:p-8 ${cardBase}`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-500/15 pb-5"><div><p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-600">{test.source || 'AI generated'}</p><h2 className="mt-2 text-2xl font-black">{test.category}{test.skill ? `: ${test.skill}` : ''}</h2></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${isDark ? 'bg-white/10 text-emerald-100' : 'bg-emerald-50 text-emerald-700'}`}>{test.questions.length} MCQs</span></div>
          <div className="mt-6 space-y-6">{test.questions.map((question, index) => <article key={question.id} className={`rounded-2xl border p-5 ${isDark ? 'border-white/10 bg-white/5' : 'border-emerald-100 bg-emerald-50/35'}`}><p className="font-bold leading-7"><span className="mr-2 text-emerald-600">{index + 1}.</span>{question.question}</p><div className="mt-4 grid gap-2">{question.options.map((option, optionIndex) => { const selected = Number(answers[question.id]) === optionIndex; const isCorrect = result && optionIndex === question.correct_index; const isIncorrect = result && selected && !isCorrect; return <label key={option} className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm ${isCorrect ? 'border-emerald-500 bg-emerald-500/15' : isIncorrect ? 'border-rose-400 bg-rose-50 text-rose-800' : selected ? 'border-emerald-400' : isDark ? 'border-white/10 bg-black/10' : 'border-emerald-100 bg-white'}`}><input type="radio" name={`question-${question.id}`} checked={selected} disabled={Boolean(result)} onChange={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))} /><span>{option}</span></label>; })}</div>{result ? <p className={`mt-4 text-sm leading-6 ${isDark ? 'text-emerald-100/80' : 'text-slate-600'}`}>{question.explanation}</p> : null}</article>)}</div>
          {!result ? <div className="mt-8 flex flex-wrap items-center gap-3"><button type="button" onClick={submitTest} disabled={Object.keys(answers).length !== test.questions.length} className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50"><FaCheckCircle /> Submit test</button></div> : <div className={`mt-8 rounded-2xl p-5 ${isDark ? 'bg-emerald-400/10 text-emerald-100' : 'bg-emerald-50 text-emerald-800'}`}><p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-600">Test complete</p><p className="mt-2 text-3xl font-black">{result.correct}/{result.total} correct</p><p className="mt-2 text-sm">Score: {result.percentage}%</p> <br></br><button type="button" onClick={saveCurrentTest} className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-black text-white"><FaClipboardCheck />Save Test to Dashboard</button></div>}
        </section> : null}
      </div>
    </main>
  );
};

export default MockTestPage;
