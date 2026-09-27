import React, { useEffect, useState } from 'react';
import { FaArrowLeft, FaArrowRight, FaCalculator, FaLightbulb, FaSpinner } from 'react-icons/fa';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchTnpTopicMaterial } from '../lib/api';

const TRACKS = {
  reasoning: {
    title: 'Reasoning',
    description: 'Build the logic and pattern-solving skills used in aptitude and placement tests.',
    icon: FaLightbulb,
    topics: [
      'Number and letter series',
      'Analogies and classifications',
      'Coding and decoding',
      'Blood relations',
      'Direction sense',
      'Seating arrangement',
      'Puzzles and logical deductions',
      'Syllogisms',
      'Statement and conclusion',
      'Data sufficiency',
    ],
  },
  aptitude: {
    title: 'Aptitude',
    description: 'Practice the quantitative concepts that commonly appear in placement assessments.',
    icon: FaCalculator,
    topics: [
      'Number systems',
      'Percentages',
      'Profit and loss',
      'Ratio and proportion',
      'Averages',
      'Time, speed, and distance',
      'Time and work',
      'Simple and compound interest',
      'Permutation and combination',
      'Probability',
      'Data interpretation',
    ],
  },
};

const normalizeFormula = (value) => {
  let formula = String(value || '').trim();
  if (!formula) return '';
  if (formula.includes('\\')) return formula;

  formula = formula
    .replace(/nPr\s*=\s*n!\s*\/\s*\(n-r\)!/g, '{}^nP_r = \\frac{n!}{(n-r)!}')
    .replace(/nCr\s*=\s*n!\s*\/\s*\(n-r\)!r!/g, '{}^nC_r = \\frac{n!}{(n-r)!r!}')
    .replace(/nPr/g, '{}^nP_r')
    .replace(/nCr/g, '{}^nC_r')
    .replace(/\s×\s/g, ' \\times ')
    .replace(/Σ/g, '\\sum');

  return formula;
};

const FormulaValue = ({ value, isDark }) => {
  const formula = normalizeFormula(value);
  const looksMathematical = /[=^!]|nP_r|nC_r|\\frac|\\sum|\\times/.test(formula);

  if (!looksMathematical) {
    return <p className={`text-sm leading-6 ${isDark ? 'text-emerald-200' : 'text-emerald-800'}`}>{value}</p>;
  }

  return <BlockMath math={formula} />;
};

const RichText = ({ value, isDark }) => {
  const parts = String(value || '').split(/(\$[^$]+\$)/g);
  return (
    <p className={`text-sm leading-6 ${isDark ? 'text-emerald-50/70' : 'text-slate-600'}`}>
      {parts.map((part, index) => part.startsWith('$') && part.endsWith('$') ? <InlineMath key={index} math={part.slice(1, -1)} /> : part)}
    </p>
  );
};

const TnpSkillsPage = ({ theme }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDark = theme === 'dark';
  const selectedTrack = searchParams.get('track');
  const selectedTopic = searchParams.get('topic');
  const track = TRACKS[selectedTrack];
  const [material, setMaterial] = useState(null);
  const [loadingMaterial, setLoadingMaterial] = useState(false);
  const [materialError, setMaterialError] = useState('');

  const cardBase = isDark
    ? 'border border-emerald-500/15 bg-white/5 text-emerald-50 shadow-[0_24px_60px_rgba(0,0,0,0.28)]'
    : 'border border-emerald-100 bg-white/85 text-slate-800 shadow-[0_24px_60px_rgba(16,185,129,0.10)]';

  const TrackIcon = track?.icon;

  useEffect(() => {
    if (!track || !selectedTopic) {
      setMaterial(null);
      return undefined;
    }

    let ignore = false;
    setLoadingMaterial(true);
    setMaterialError('');

    fetchTnpTopicMaterial(track.title, selectedTopic)
      .then((data) => {
        if (ignore) return;
        if (data?.error) throw new Error(data.error);
        setMaterial(data);
      })
      .catch((error) => {
        if (!ignore) setMaterialError(error.message || 'Could not load study material.');
      })
      .finally(() => {
        if (!ignore) setLoadingMaterial(false);
      });

    return () => {
      ignore = true;
    };
  }, [selectedTopic, track]);

  return (
    <main className={`min-h-[calc(100dvh-5rem)] px-5 py-8 sm:px-8 ${isDark ? 'text-white' : 'text-slate-900'}`}>
      <div className="mx-auto max-w-6xl">
        <button type="button" onClick={() => (track ? navigate('/interview/tnp') : navigate('/interview'))} className={`mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${isDark ? 'bg-white/10 text-emerald-100' : 'bg-white text-slate-700 ring-1 ring-emerald-100'}`}>
          <FaArrowLeft />
          {track ? 'All T&P tracks' : 'Interview skills'}
        </button>

        <div className="max-w-3xl">
          <p className={`text-xs font-black uppercase tracking-[0.35em] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Training and placement</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">{track ? `${track.title} topics` : 'Choose your T&P track'}</h1>
          <p className={`mt-4 text-base leading-7 ${isDark ? 'text-emerald-50/70' : 'text-slate-600'}`}>
            {track ? track.description : 'Choose Reasoning or Aptitude to open the complete topic roadmap for that option.'}
          </p>
        </div>

        {track && selectedTopic ? (
          <section className={`mt-8 overflow-hidden rounded-[2rem] border p-0 ${isDark ? 'border-emerald-400/20 bg-[#07110c] text-emerald-50' : 'border-emerald-100 bg-white text-slate-900 shadow-[0_24px_60px_rgba(16,185,129,0.10)]'}`}>
            {loadingMaterial ? (
              <div className="flex min-h-64 flex-col items-center justify-center gap-4 text-sm font-bold text-emerald-600">
                <FaSpinner className="animate-spin" /> Generating study materials for you
              </div>
            ) : materialError ? (
              <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{materialError}</div>
            ) : (
              <>
                <div className={`relative overflow-hidden border-b p-6 sm:p-8 ${isDark ? 'border-emerald-400/15 bg-gradient-to-br from-emerald-400/10 via-transparent to-cyan-400/5' : 'border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-cyan-50'}`}>
                  <div className="relative z-10 max-w-3xl">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-600">Your study sheet</p>
                    <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{material?.title || selectedTopic}</h2>
                    <p className={`mt-4 text-sm leading-7 sm:text-base ${isDark ? 'text-emerald-50/70' : 'text-slate-600'}`}>{material?.overview}</p>
                    <div className="mt-5 inline-flex items-center rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-emerald-950">
                      {track.title} · formulas + shortcuts
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-600">01 · Remember</p>
                      <h3 className="mt-2 text-2xl font-black">Formulas and rules</h3>
                    </div>
                    <span className={`hidden rounded-full px-3 py-1 text-xs font-bold sm:inline-flex ${isDark ? 'bg-white/10 text-emerald-200' : 'bg-emerald-50 text-emerald-700'}`}>{material?.formulas?.length || 0} key points</span>
                  </div>
                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    {(material?.formulas || []).map((item, index) => (
                      <article key={`${item.name}-${index}`} className={`group rounded-2xl border p-5 transition-transform hover:-translate-y-0.5 ${isDark ? 'border-white/10 bg-white/5 hover:border-emerald-400/30' : 'border-emerald-100 bg-emerald-50/35 hover:border-emerald-300'}`}>
                        <div className="flex items-start gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-xs font-black text-emerald-950">{String(index + 1).padStart(2, '0')}</span>
                          <h4 className="pt-1 font-black">{item.name || `Formula ${index + 1}`}</h4>
                        </div>
                        <div className={`mt-4 overflow-x-auto rounded-xl border px-4 py-3 ${isDark ? 'border-emerald-400/15 bg-black/25' : 'border-emerald-100 bg-white'}`}>
                          <FormulaValue value={item.formula} isDark={isDark} />
                        </div>
                        <div className="mt-3"><RichText value={item.when_to_use} isDark={isDark} /></div>
                      </article>
                    ))}
                  </div>

                  <div className="mt-10 border-t border-emerald-500/15 pt-8">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-600">02 · Quick recall</p>
                      <h3 className="mt-2 text-2xl font-black">Cheat sheet</h3>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {(material?.cheat_sheet || []).map((item, index) => (
                      <article key={`${item.title}-${index}`} className={`flex gap-3 rounded-2xl border p-4 ${isDark ? 'border-amber-300/15 bg-amber-300/5' : 'border-amber-100 bg-amber-50/55'}`}>
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-400 text-xs font-black text-amber-950">{index + 1}</span>
                        <div>
                          <h4 className="font-black">{item.title || `Shortcut ${index + 1}`}</h4>
                          <div className="mt-2"><RichText value={item.detail} isDark={isDark} /></div>
                        </div>
                      </article>
                    ))}
                    </div>
                  </div>

                  {(material?.diagrams || []).length ? (
                    <div className="mt-10 border-t border-emerald-500/15 pt-8">
                      <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-600">03 · See the method</p>
                      <h3 className="mt-2 text-2xl font-black">Helpful diagrams</h3>
                      <div className="mt-5 grid gap-4">
                        {material.diagrams.map((diagram, index) => (
                          <article key={`${diagram.title}-${index}`} className={`rounded-2xl border p-5 ${isDark ? 'border-cyan-400/20 bg-cyan-400/5' : 'border-cyan-100 bg-cyan-50/60'}`}>
                            <h4 className="font-black">{diagram.title || `Topic flow ${index + 1}`}</h4>
                            <div className="mt-5 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
                              {(diagram.steps || []).map((step, stepIndex) => (
                                <React.Fragment key={`${step}-${stepIndex}`}>
                                  <span className={`flex flex-1 items-center justify-center rounded-xl px-3 py-3 text-center text-sm font-bold ${isDark ? 'bg-white/10 text-cyan-100' : 'bg-white text-cyan-800'}`}>{step}</span>
                                  {stepIndex < (diagram.steps || []).length - 1 ? <FaArrowRight className="mx-auto rotate-90 text-cyan-500 sm:mx-0 sm:rotate-0" /> : null}
                                </React.Fragment>
                              ))}
                            </div>
                            {diagram.explanation ? <p className={`mt-4 text-sm leading-6 ${isDark ? 'text-emerald-50/70' : 'text-slate-600'}`}>{diagram.explanation}</p> : null}
                          </article>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </section>
        ) : track ? (
          <section className={`mt-8 rounded-[2rem] p-6 sm:p-8 ${cardBase}`}>
            <div className="flex items-center gap-4 border-b border-emerald-500/15 pb-5">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${isDark ? 'bg-emerald-400/10 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                <TrackIcon className="text-2xl" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-600">Complete topic list</p>
                <h2 className="mt-1 text-2xl font-black">{track.title}</h2>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {track.topics.map((topic, index) => (
                <button key={topic} type="button" onClick={() => navigate(`/interview/tnp/topic?track=${selectedTrack}&topic=${encodeURIComponent(topic)}`)} className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 ${isDark ? 'border-white/10 bg-white/5 hover:border-emerald-400/40' : 'border-emerald-100 bg-emerald-50/40 hover:border-emerald-400'}`}>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-emerald-950">{index + 1}</span>
                  <span className="text-sm font-bold leading-6">{topic}</span>
                </button>
              ))}
            </div>
          </section>
        ) : (
          <section className="mt-8 grid gap-5 md:grid-cols-2">
            {Object.entries(TRACKS).map(([key, option]) => {
              const Icon = option.icon;
              return (
                <button key={key} type="button" onClick={() => navigate(`/interview/tnp?track=${key}`)} className={`group rounded-[2rem] p-7 text-left transition-all hover:-translate-y-1 ${cardBase}`}>
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${isDark ? 'bg-emerald-400/10 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                    <Icon className="text-2xl" />
                  </div>
                  <h2 className="mt-6 text-2xl font-black">{option.title}</h2>
                  <p className={`mt-3 text-sm leading-7 ${isDark ? 'text-emerald-50/70' : 'text-slate-600'}`}>{option.description}</p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-black text-emerald-600">
                    View all topics
                    <FaArrowRight className="transition-transform group-hover:translate-x-1" />
                  </span>
                </button>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
};

export default TnpSkillsPage;
