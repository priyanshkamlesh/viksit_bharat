import { FaArrowLeft, FaArrowRight, FaCheckCircle, FaLightbulb } from 'react-icons/fa';
import { useNavigate, useSearchParams } from 'react-router-dom';

const SoftSkillsLearningPage = ({ theme, title, description, icon: Icon, topics }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDark = theme === 'dark';
  const selectedTopic = searchParams.get('topic');
  const topic = topics.find((item) => item.slug === selectedTopic);
  const cardBase = isDark
    ? 'border border-emerald-500/15 bg-white/5 text-emerald-50 shadow-[0_24px_60px_rgba(0,0,0,0.28)]'
    : 'border border-emerald-100 bg-white/85 text-slate-800 shadow-[0_24px_60px_rgba(16,185,129,0.10)]';

  const openTopic = (nextTopic) => navigate(`?topic=${nextTopic.slug}`);

  return (
    <main className={`min-h-[calc(100dvh-5rem)] px-5 py-8 sm:px-8 ${isDark ? 'text-white' : 'text-slate-900'}`}>
      <div className="mx-auto max-w-6xl">
        <button type="button" onClick={() => (topic ? navigate('.') : navigate('/interview'))} className={`mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${isDark ? 'bg-white/10 text-emerald-100' : 'bg-white text-slate-700 ring-1 ring-emerald-100'}`}>
          <FaArrowLeft />
          {topic ? `All ${title} topics` : 'Interview skills'}
        </button>

        <div className="max-w-3xl">
          <p className={`text-xs font-black uppercase tracking-[0.35em] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Interview skills</p>
          <h1 className="mt-3 text-3xl font-black sm:text-5xl">{topic ? topic.title : title}</h1>
          <p className={`mt-4 text-base leading-7 ${isDark ? 'text-emerald-50/70' : 'text-slate-600'}`}>{topic ? topic.overview : description}</p>
        </div>

        {topic ? (
          <section className={`mt-8 overflow-hidden rounded-[2rem] ${cardBase}`}>
            <div className={`border-b p-6 sm:p-8 ${isDark ? 'border-emerald-400/15 bg-emerald-400/5' : 'border-emerald-100 bg-emerald-50/60'}`}>
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-lg font-black text-emerald-950">{topics.indexOf(topic) + 1}</span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-600">Your study sheet</p>
                  <h2 className="mt-2 text-2xl font-black sm:text-3xl">Learn, practise, reflect</h2>
                </div>
              </div>
            </div>
            <div className="p-6 sm:p-8">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-600">01. Core practices</p>
                <h3 className="mt-2 text-2xl font-black">What to remember</h3>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {topic.practices.map((practice, index) => (
                    <article key={practice} className={`flex gap-3 rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-emerald-100 bg-emerald-50/40'}`}>
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-emerald-950">{index + 1}</span>
                      <p className={`text-sm leading-6 ${isDark ? 'text-emerald-50/80' : 'text-slate-600'}`}>{practice}</p>
                    </article>
                  ))}
                </div>
              </div>
              <div className="mt-10 border-t border-emerald-500/15 pt-8">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-600">02. Practice now</p>
                <h3 className="mt-2 text-2xl font-black">Try this activity</h3>
                <div className={`mt-5 rounded-2xl border p-5 ${isDark ? 'border-amber-300/15 bg-amber-300/5' : 'border-amber-100 bg-amber-50/55'}`}>
                  <div className="flex gap-3"><FaLightbulb className="mt-1 shrink-0 text-amber-500" /><p className={`text-sm leading-7 ${isDark ? 'text-emerald-50/80' : 'text-slate-700'}`}>{topic.activity}</p></div>
                </div>
              </div>
              <div className="mt-10 border-t border-emerald-500/15 pt-8">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-600">03. Interview ready</p>
                <h3 className="mt-2 text-2xl font-black">A phrase to practise</h3>
                <blockquote className={`mt-5 rounded-2xl border-l-4 p-5 text-base font-semibold leading-7 ${isDark ? 'border-cyan-400 bg-cyan-400/5 text-cyan-100' : 'border-cyan-500 bg-cyan-50 text-cyan-900'}`}>“{topic.phrase}”</blockquote>
              </div>
            </div>
          </section>
        ) : (
          <section className={`mt-8 rounded-[2rem] p-6 sm:p-8 ${cardBase}`}>
            <div className="flex items-center gap-4 border-b border-emerald-500/15 pb-5">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${isDark ? 'bg-emerald-400/10 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}><Icon className="text-2xl" /></div>
              <div><p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-600">Complete topic list</p><h2 className="mt-1 text-2xl font-black">{title}</h2></div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {topics.map((item, index) => (
                <button key={item.slug} type="button" onClick={() => openTopic(item)} className={`group flex items-start gap-3 rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 ${isDark ? 'border-white/10 bg-white/5 hover:border-emerald-400/40' : 'border-emerald-100 bg-emerald-50/40 hover:border-emerald-400'}`}>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-emerald-950">{index + 1}</span><span className="flex-1 text-sm font-bold leading-6">{item.title}</span><FaArrowRight className="mt-1 text-xs text-emerald-600 transition-transform group-hover:translate-x-1" />
                </button>
              ))}
            </div>
            <div className={`mt-6 flex items-center gap-2 text-sm ${isDark ? 'text-emerald-100/70' : 'text-slate-600'}`}><FaCheckCircle className="text-emerald-500" /> Select a topic to open its study sheet and practical exercise.</div>
          </section>
        )}
      </div>
    </main>
  );
};

export default SoftSkillsLearningPage;
