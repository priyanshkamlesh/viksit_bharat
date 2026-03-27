import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { fetchFullRoadmap, gradeMockTestAnswers } from '../lib/api';
import { getSkillRoadmap } from '../data/skillRoadmaps';
import { appendMockTestHistory } from '../lib/dashboardStorage';
import { readCurrentUser } from '../lib/currentUser';

const humanizeSkill = (value) =>
  value
    ? value
        .replace(/-/g, ' ')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase())
    : 'Skill';

const flattenRoadmapNodes = (branches, parentTitle = '', map = new Map()) => {
  branches.forEach((branch) => {
    if (!branch?.id) {
      return;
    }

    map.set(branch.id, {
      id: branch.id,
      title: branch.title || 'Untitled',
      description: branch.description || '',
      items: branch.items || [],
      parentTitle,
      childrenCount: branch.children?.length || 0,
      isLeaf: !branch.children?.length,
    });

    if (branch.children?.length) {
      flattenRoadmapNodes(branch.children, branch.title || parentTitle, map);
    }
  });

  return map;
};

const normalizeStrictAnswer = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const makeMockQuestion = (id, question, answer, acceptedAnswers = []) => ({
  id,
  question,
  answer,
  acceptedAnswers,
});

const MOCK_TEST_BANKS = {
  'generative ai': [
    makeMockQuestion('genai-1', 'What does LLM stand for?', 'large language model', ['llm']),
    makeMockQuestion('genai-2', 'What are embeddings used for?', 'semantic similarity', ['finding similar meaning', 'vector search']),
    makeMockQuestion('genai-3', 'What does RAG stand for?', 'retrieval augmented generation', ['retrieval-augmented generation']),
    makeMockQuestion('genai-4', 'What is a token?', 'a unit of text', ['unit of text']),
    makeMockQuestion('genai-5', 'What is prompt engineering?', 'crafting prompts to guide model outputs', ['designing prompts to guide model outputs']),
    makeMockQuestion('genai-6', 'What is a hallucination in GenAI?', 'incorrect or made up output', ['made-up output', 'fabricated output']),
    makeMockQuestion('genai-7', 'What are guardrails?', 'controls that keep outputs safe and valid', ['safety controls']),
    makeMockQuestion('genai-8', 'What is a vector database used for?', 'storing embeddings for similarity search', ['embedding search']),
    makeMockQuestion('genai-9', 'What is few-shot prompting?', 'giving a few examples', ['using a few examples']),
    makeMockQuestion('genai-10', 'What is zero-shot prompting?', 'asking without examples', ['no examples']),
    makeMockQuestion('genai-11', 'What is the purpose of an agent?', 'to plan and use tools to complete tasks', ['planning and tool use']),
    makeMockQuestion('genai-12', 'What is a context window?', 'the maximum input the model can use', ['maximum input size']),
    makeMockQuestion('genai-13', 'What do evaluation metrics measure?', 'output quality', ['quality']),
    makeMockQuestion('genai-14', 'What is structured output?', 'output in a fixed format', ['fixed format output']),
  ],
  'agentic ai': [
    makeMockQuestion('agent-1', 'What is an agentic workflow?', 'an llm workflow with planning and tool use', ['llm workflow with planning and tool use']),
    makeMockQuestion('agent-2', 'What is a tool call?', 'asking an external tool or api to act', ['calling an external tool or api']),
    makeMockQuestion('agent-3', 'What is planning in agents?', 'deciding the next steps to reach a goal', ['next steps to reach a goal']),
    makeMockQuestion('agent-4', 'What is memory in an agent?', 'saved context across steps', ['context across steps']),
    makeMockQuestion('agent-5', 'What is orchestration?', 'coordinating multiple steps or agents', ['coordinating steps']),
    makeMockQuestion('agent-6', 'What is a feedback loop?', 'using results to improve the next step', ['improving the next step']),
    makeMockQuestion('agent-7', 'What is multi-agent collaboration?', 'multiple agents working together', ['agents working together']),
    makeMockQuestion('agent-8', 'Why are guardrails important?', 'to keep the agent safe and reliable', ['safety and reliability']),
    makeMockQuestion('agent-9', 'Why are retries used?', 'to recover from temporary failures', ['recover from failures']),
    makeMockQuestion('agent-10', 'What does monitoring help track?', 'latency safety and quality', ['latency', 'safety', 'quality']),
    makeMockQuestion('agent-11', 'What is task decomposition?', 'breaking a task into smaller steps', ['splitting a task']),
    makeMockQuestion('agent-12', 'What is a handoff?', 'passing work from one agent to another', ['passing work to another agent']),
  ],
  'prompt engineering': [
    makeMockQuestion('prompt-1', 'What is prompt engineering?', 'designing prompts for better model output', ['crafting prompts for better model output']),
    makeMockQuestion('prompt-2', 'What does context mean in a prompt?', 'background information for the model', ['background information']),
    makeMockQuestion('prompt-3', 'What are constraints in a prompt?', 'rules the model must follow', ['rules to follow']),
    makeMockQuestion('prompt-4', 'What is a few-shot prompt?', 'a prompt with a few examples', ['using a few examples']),
    makeMockQuestion('prompt-5', 'What is a zero-shot prompt?', 'a prompt with no examples', ['no examples']),
    makeMockQuestion('prompt-6', 'What is structured output?', 'output in a fixed format', ['fixed format output']),
    makeMockQuestion('prompt-7', 'What is extraction?', 'pulling specific information from text', ['information extraction']),
    makeMockQuestion('prompt-8', 'What is classification?', 'assigning a label or category', ['assigning a category']),
    makeMockQuestion('prompt-9', 'What is verification?', 'checking whether output is correct', ['checking correctness']),
    makeMockQuestion('prompt-10', 'What is a hallucination?', 'an incorrect or fabricated answer', ['fabricated answer']),
    makeMockQuestion('prompt-11', 'What formats are often used for clean output?', 'json markdown and xml', ['json, markdown, and xml']),
    makeMockQuestion('prompt-12', 'What should an evaluation step check?', 'robustness and edge cases', ['edge cases']),
  ],
  'machine learning': [
    makeMockQuestion('ml-1', 'What is supervised learning?', 'learning from labeled data', ['training on labeled data']),
    makeMockQuestion('ml-2', 'What are features?', 'input variables used for prediction', ['input variables']),
    makeMockQuestion('ml-3', 'What are labels?', 'the target values', ['target values']),
    makeMockQuestion('ml-4', 'What is overfitting?', 'fitting the training data too closely', ['fitting training data too closely']),
    makeMockQuestion('ml-5', 'What is the train validation test split used for?', 'model evaluation', ['evaluation']),
    makeMockQuestion('ml-6', 'What is precision?', 'correct positive predictions out of predicted positives', ['positive prediction accuracy']),
    makeMockQuestion('ml-7', 'What is recall?', 'correct positive predictions out of actual positives', ['sensitivity']),
    makeMockQuestion('ml-8', 'What is F1 score?', 'a balance of precision and recall', ['precision and recall balance']),
    makeMockQuestion('ml-9', 'What is feature engineering?', 'creating useful input features', ['making useful features']),
    makeMockQuestion('ml-10', 'What is cross validation?', 'testing a model across multiple splits', ['cross-validation']),
    makeMockQuestion('ml-11', 'What is regression?', 'predicting a continuous value', ['continuous prediction']),
    makeMockQuestion('ml-12', 'What is classification?', 'predicting a category', ['category prediction']),
  ],
  'deep learning': [
    makeMockQuestion('dl-1', 'What is backpropagation?', 'the process of updating weights using gradients', ['updating weights using gradients']),
    makeMockQuestion('dl-2', 'What is gradient descent?', 'an optimization method for reducing loss', ['optimization for reducing loss']),
    makeMockQuestion('dl-3', 'What is an activation function?', 'a function that adds nonlinearity', ['adds nonlinearity']),
    makeMockQuestion('dl-4', 'What is a loss function?', 'a measure of model error', ['model error measure']),
    makeMockQuestion('dl-5', 'What is a CNN?', 'a convolutional neural network', ['convolutional neural network']),
    makeMockQuestion('dl-6', 'What is an RNN?', 'a recurrent neural network', ['recurrent neural network']),
    makeMockQuestion('dl-7', 'What is attention?', 'a mechanism for focusing on relevant inputs', ['focusing on relevant inputs']),
    makeMockQuestion('dl-8', 'What is dropout?', 'a regularization method', ['regularization']),
    makeMockQuestion('dl-9', 'What is batch normalization?', 'a technique that stabilizes training', ['stabilizes training']),
    makeMockQuestion('dl-10', 'Which framework is commonly used for deep learning?', 'pytorch', ['py torch']),
    makeMockQuestion('dl-11', 'What is regularization?', 'a method to reduce overfitting', ['reducing overfitting']),
    makeMockQuestion('dl-12', 'What does training stability refer to?', 'how reliably the model learns', ['how reliably learning happens']),
  ],
  'data analysis': [
    makeMockQuestion('da-1', 'What are rows and columns?', 'the basic structure of a table', ['table structure']),
    makeMockQuestion('da-2', 'What are missing values?', 'blank or unavailable data', ['unavailable data']),
    makeMockQuestion('da-3', 'What are outliers?', 'unusual values that differ from most data', ['unusual values']),
    makeMockQuestion('da-4', 'What is pandas used for?', 'data manipulation and analysis', ['data analysis']),
    makeMockQuestion('da-5', 'What is NumPy used for?', 'numerical computing', ['numeric computing']),
    makeMockQuestion('da-6', 'What is EDA?', 'exploratory data analysis', ['exploratory analysis']),
    makeMockQuestion('da-7', 'What is summary statistics?', 'quick numeric summaries of data', ['numeric summaries']),
    makeMockQuestion('da-8', 'What is filtering?', 'selecting rows that match conditions', ['row filtering']),
    makeMockQuestion('da-9', 'What is grouping?', 'combining data by category', ['group by category']),
    makeMockQuestion('da-10', 'What is visualization?', 'presenting data with charts', ['charts']),
    makeMockQuestion('da-11', 'What is a dashboard?', 'a visual reporting interface', ['reporting interface']),
    makeMockQuestion('da-12', 'What are insights?', 'useful findings from data', ['findings']),
  ],
  javascript: [
    makeMockQuestion('js-1', 'What is a variable?', 'a named storage location', ['storage location']),
    makeMockQuestion('js-2', 'What is a function?', 'a reusable block of code', ['reusable code block']),
    makeMockQuestion('js-3', 'What is an array?', 'an ordered list', ['ordered list']),
    makeMockQuestion('js-4', 'What is an object?', 'a key value collection', ['key value pair collection']),
    makeMockQuestion('js-5', 'What is scope?', 'where a variable can be accessed', ['variable access range']),
    makeMockQuestion('js-6', 'What is hoisting?', 'declarations moving to the top during execution', ['moving declarations to the top']),
    makeMockQuestion('js-7', 'What is the DOM?', 'the document object model', ['document object model']),
    makeMockQuestion('js-8', 'What is an event?', 'an action that the browser or user triggers', ['triggered action']),
    makeMockQuestion('js-9', 'What is fetch used for?', 'making network requests', ['network requests']),
    makeMockQuestion('js-10', 'What is a promise?', 'an object representing future completion', ['future completion object']),
    makeMockQuestion('js-11', 'What is async await?', 'syntax for working with promises', ['promise syntax']),
    makeMockQuestion('js-12', 'What is an API?', 'an interface for communicating with software', ['software interface']),
  ],
};

const buildSkillFallbackQuestions = (roadmapTitle) => [
  makeMockQuestion('fallback-1', `What field is this mock test focused on?`, roadmapTitle),
  makeMockQuestion('fallback-2', `What is one core concept of ${roadmapTitle}?`, roadmapTitle),
  makeMockQuestion('fallback-3', `What should you study first in ${roadmapTitle}?`, roadmapTitle),
  makeMockQuestion('fallback-4', `What kind of projects are common in ${roadmapTitle}?`, roadmapTitle),
  makeMockQuestion('fallback-5', `What is a practical use case for ${roadmapTitle}?`, roadmapTitle),
  makeMockQuestion('fallback-6', `What is a challenge often seen in ${roadmapTitle}?`, roadmapTitle),
  makeMockQuestion('fallback-7', `What is one important tool for ${roadmapTitle}?`, roadmapTitle),
  makeMockQuestion('fallback-8', `What is one useful outcome of learning ${roadmapTitle}?`, roadmapTitle),
];

const buildLocalRoadmapDisplay = (skillId, selectedLevel) => {
  const roadmap = getSkillRoadmap(skillId, selectedLevel);
  if (!roadmap) {
    return null;
  }

  const branches = (roadmap.phases || []).map((phase, index) => ({
    id: `phase-${index + 1}`,
    title: phase.title,
    description: (phase.items || [])[0] || roadmap.summary || '',
    items: phase.items || [],
    children: (phase.items || []).map((item, itemIndex) => ({
      id: `phase-${index + 1}-item-${itemIndex + 1}`,
      title: item,
      description: '',
      items: [],
      children: [],
    })),
  }));

  const nodes = [
    {
      id: 'root',
      title: roadmap.title,
      description: roadmap.summary,
      items: [],
      level: 0,
      kind: 'root',
      depends_on: [],
    },
  ];
  const edges = [];

  const addNode = (node, level, parentId, kind = 'leaf') => {
    nodes.push({
      id: node.id,
      title: node.title,
      description: node.description || '',
      items: node.items || [],
      level,
      kind,
      depends_on: parentId ? [parentId] : [],
    });

    if (parentId) {
      edges.push({ source: parentId, target: node.id });
    }
  };

  branches.forEach((branch) => {
    addNode(branch, 1, 'root', branch.children?.length ? 'branch' : 'leaf');
    branch.children?.forEach((child) => {
      addNode(child, 2, branch.id, 'leaf');
    });
  });

  const mermaidLines = ['flowchart TD', `  root["${roadmap.title.replace(/"/g, '\\"')}"]`];
  branches.forEach((branch) => {
    mermaidLines.push(`  root --> ${branch.id}`);
    mermaidLines.push(`  ${branch.id}["${branch.title.replace(/"/g, '\\"')}"]`);
    branch.children?.forEach((child) => {
      mermaidLines.push(`  ${branch.id} --> ${child.id}`);
      mermaidLines.push(`  ${child.id}["${child.title.replace(/"/g, '\\"')}"]`);
    });
  });

  const steps = nodes
    .filter((node) => node.id !== 'root')
    .map((node) => ({
      id: node.id,
      title: node.title,
      description: node.description,
      items: node.items,
      depends_on: node.depends_on,
      level: node.level,
      kind: node.kind,
    }));

  return {
    skill: roadmap.title,
    level: roadmap.selectedLevel,
    summary: roadmap.summary,
    tree: {
      title: roadmap.title,
      summary: roadmap.summary,
      branches,
    },
    structure: {
      title: roadmap.title,
      summary: roadmap.summary,
      branches,
    },
    steps,
    flowchart: {
      nodes,
      edges,
      mermaid: mermaidLines.join('\n'),
    },
  };
};

const buildMockTestQuestions = (roadmapData) => {
  const roadmapTitle = roadmapData?.skill || roadmapData?.title || 'Skill Roadmap';
  const skillKey = normalizeStrictAnswer(roadmapTitle);
  const trackKey = normalizeStrictAnswer(roadmapData?.track || '');
  const bank = MOCK_TEST_BANKS[skillKey] || MOCK_TEST_BANKS[trackKey] || buildSkillFallbackQuestions(roadmapTitle);

  return bank.slice(0, 15);
};

const isAcceptedMockAnswer = (submitted, question) => {
  const normalizedSubmitted = normalizeStrictAnswer(submitted);
  const candidates = [question.answer, ...(question.acceptedAnswers || [])]
    .map((candidate) => normalizeStrictAnswer(candidate))
    .filter(Boolean);

  return candidates.includes(normalizedSubmitted);
};

const SkillRoadmapPage = ({ theme }) => {
  const navigate = useNavigate();
  const { skillId } = useParams();
  const [searchParams] = useSearchParams();
  const selectedLevel = searchParams.get('level');
  const isDark = theme === 'dark';
  const cacheKey = `skill-roadmap:${skillId || 'unknown'}:${selectedLevel || 'all'}`;
  const localRoadmapData = buildLocalRoadmapDisplay(skillId, selectedLevel);

  const readCachedRoadmap = (key) => {
    if (typeof window === 'undefined') {
      return null;
    }

    const cached = window.localStorage.getItem(key);
    if (!cached) {
      return null;
    }

    try {
      return JSON.parse(cached);
    } catch (error) {
      window.localStorage.removeItem(key);
      return null;
    }
  };

  const [roadmapData, setRoadmapData] = useState(() => localRoadmapData || readCachedRoadmap(cacheKey));
  const [loading, setLoading] = useState(() => !(localRoadmapData || readCachedRoadmap(cacheKey)));
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState('flowchart');
  const [diagramSvg, setDiagramSvg] = useState('');
  const [diagramError, setDiagramError] = useState('');
  const [hoverNote, setHoverNote] = useState(null);
  const [mockTestQuestions, setMockTestQuestions] = useState([]);
  const [mockTestAnswers, setMockTestAnswers] = useState({});
  const [mockTestResult, setMockTestResult] = useState(null);
  const [mockTestMessage, setMockTestMessage] = useState('');
  const [mockTestChecking, setMockTestChecking] = useState(false);
  const mermaidIdRef = useRef(`roadmap-${skillId || 'skill'}`);
  const chartContainerRef = useRef(null);
  const lastRenderedSvgRef = useRef('');
  const nodeLookupRef = useRef(new Map());

  useEffect(() => {
    mermaidIdRef.current = `roadmap-${skillId || 'skill'}`;
  }, [skillId]);

  useEffect(() => {
    if (!skillId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      const cached = readCachedRoadmap(cacheKey);
      const local = buildLocalRoadmapDisplay(skillId, selectedLevel);

      if (cached) {
        setRoadmapData(cached);
        setLoading(false);
        setRefreshing(true);
      } else if (local) {
        setRoadmapData(local);
        setLoading(false);
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const data = await fetchFullRoadmap(skillId, selectedLevel);
        setRoadmapData(data);
        window.localStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (err) {
        console.error('API ERROR:', err);
        if (!cached && !local) {
          setRoadmapData(null);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    load();
  }, [skillId, selectedLevel, cacheKey]);

  useEffect(() => {
    if (view !== 'flowchart' || !roadmapData?.flowchart?.mermaid) {
      return;
    }

    let active = true;

    const render = async () => {
      try {
        const mermaidModule = await import('mermaid');
        const mermaidInstance = mermaidModule.default;

        mermaidInstance.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          theme: isDark ? 'dark' : 'default',
          flowchart: {
            useMaxWidth: true,
            curve: 'basis',
          },
          themeVariables: isDark
            ? {
                background: '#020617',
                primaryColor: '#0f172a',
                primaryTextColor: '#e2e8f0',
                primaryBorderColor: '#34d399',
                lineColor: '#34d399',
                fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
              }
            : {
                background: '#ffffff',
                primaryColor: '#ecfdf5',
                primaryTextColor: '#0f172a',
                primaryBorderColor: '#10b981',
                lineColor: '#10b981',
                fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
              },
        });

        const { svg } = await mermaidInstance.render(mermaidIdRef.current, roadmapData.flowchart.mermaid);

        if (active) {
          lastRenderedSvgRef.current = svg;
          setDiagramSvg(svg);
          setDiagramError('');
        }
      } catch (error) {
        console.error('Mermaid render error:', error);
        if (active) {
          setDiagramSvg(lastRenderedSvgRef.current);
          setDiagramError('Unable to render the roadmap flowchart.');
        }
      }
    };

    render();

    return () => {
      active = false;
    };
  }, [roadmapData, view, isDark]);

  useEffect(() => {
    nodeLookupRef.current = flattenRoadmapNodes(roadmapData?.tree?.branches ?? []);
  }, [roadmapData]);

  useEffect(() => {
    if (view !== 'flowchart') {
      setHoverNote(null);
    }
  }, [view]);

  useEffect(() => {
    if (view !== 'flowchart' || !chartContainerRef.current || !roadmapData?.flowchart?.mermaid) {
      return undefined;
    }

    const chartRoot = chartContainerRef.current.querySelector('svg');
    if (!chartRoot) {
      return undefined;
    }

    const nodeCandidates = Array.from(chartRoot.querySelectorAll('.leafNode'));
    const nodes = Array.from(
      new Set(
        nodeCandidates
          .map((node) => (node instanceof Element ? node.closest('g') || node : null))
          .filter(Boolean)
      )
    );

    const getNodeId = (element) => {
      if (!(element instanceof Element)) {
        return '';
      }

      return element.getAttribute('id') || element.getAttribute('data-id') || '';
    };

    const showNote = (event) => {
      const element = event.currentTarget instanceof Element ? event.currentTarget : null;
      const nodeId = getNodeId(element);
      if (!nodeId) {
        return;
      }

      const node = nodeLookupRef.current.get(nodeId);
      if (!node) {
        return;
      }

      const rect = chartContainerRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left + 16;
      const y = event.clientY - rect.top + 16;

      setHoverNote({
        id: node.id,
        title: node.title,
        description: node.description,
        items: node.items,
        parentTitle: node.parentTitle,
        x: Math.max(12, Math.min(x, rect.width - 340)),
        y: Math.max(12, Math.min(y, rect.height - 220)),
      });
    };

    const moveNote = (event) => {
      setHoverNote((current) => {
        if (!current) {
          return current;
        }

        const rect = chartContainerRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left + 16;
        const y = event.clientY - rect.top + 16;

        return {
          ...current,
          x: Math.max(12, Math.min(x, rect.width - 340)),
          y: Math.max(12, Math.min(y, rect.height - 220)),
        };
      });
    };

    const hideNote = () => setHoverNote(null);

    nodes.forEach((node) => {
      node.addEventListener('mouseenter', showNote);
      node.addEventListener('mousemove', moveNote);
      node.addEventListener('mouseleave', hideNote);
    });

    return () => {
      nodes.forEach((node) => {
        node.removeEventListener('mouseenter', showNote);
        node.removeEventListener('mousemove', moveNote);
        node.removeEventListener('mouseleave', hideNote);
      });
    };
  }, [diagramSvg, roadmapData, view]);

  if (!roadmapData && !loading) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center px-6 ${
          isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
        }`}
      >
        <div className="max-w-md rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-5 text-sm">
          Failed to load roadmap.
        </div>
      </div>
    );
  }

  const displaySkill = roadmapData?.skill || humanizeSkill(skillId);
  const summary = roadmapData?.summary;
  const level = roadmapData?.level;
  const branches = roadmapData?.tree?.branches ?? [];
  const hasDiagram = Boolean(diagramSvg || lastRenderedSvgRef.current);

  const handleGenerateMockTest = () => {
    const generatedQuestions = buildMockTestQuestions(roadmapData);
    setMockTestQuestions(generatedQuestions);
    setMockTestAnswers({});
    setMockTestResult(null);

    if (generatedQuestions.length < 10) {
      setMockTestMessage('This roadmap does not have enough content to generate 10 strict questions yet.');
      return;
    }

    setMockTestMessage('Strict mock test generated. Answers must match exactly with no extra words.');
  };

  const handleMockTestAnswerChange = (questionId, value) => {
    setMockTestAnswers((current) => ({
      ...current,
      [questionId]: value,
    }));
  };

  const handleSubmitMockTest = async (event) => {
    event.preventDefault();

    if (!mockTestQuestions.length) {
      setMockTestMessage('Generate the mock test first.');
      return;
    }

    setMockTestChecking(true);

    const localFallbackResults = mockTestQuestions.map((question) => {
      const submitted = (mockTestAnswers[question.id] || '').trim();
      const expected = question.answer.trim();
      const isEmpty = !submitted;
      const isCorrect = isAcceptedMockAnswer(submitted, question);

      return {
        ...question,
        submitted,
        expected,
        isCorrect,
        error: isEmpty
          ? 'Answer is required.'
          : isCorrect
            ? ''
            : `Expected meaning: "${expected}".`,
      };
    });

    let results = localFallbackResults;
    let gradingMode = 'fallback';

    try {
      const response = await gradeMockTestAnswers({
        skill: displaySkill,
        level: level || '',
        questions: mockTestQuestions.map((question) => ({
          ...question,
          submitted: mockTestAnswers[question.id] || '',
        })),
      });

      if (response?.results?.length) {
        gradingMode = response.grading_mode || 'ai';
        results = response.results.map((item) => {
          const originalQuestion = mockTestQuestions.find((question) => question.id === item.id);
          return {
            ...(originalQuestion || {}),
            submitted: item.submitted || mockTestAnswers[item.id] || '',
            expected: item.expected || originalQuestion?.answer || '',
            isCorrect: Boolean(item.isCorrect),
            matched_answer: item.matched_answer || '',
            error: item.isCorrect ? '' : item.explanation || 'The answer does not match the expected concept closely enough.',
          };
        });
      }
    } catch (error) {
      results = localFallbackResults;
    } finally {
      setMockTestChecking(false);
    }

    const correctCount = results.filter((item) => item.isCorrect).length;
    const total = results.length;
    const score = total ? Math.round((correctCount / total) * 100) : 0;

    setMockTestResult({
      correctCount,
      total,
      score,
      results,
    });

    const currentUser = readCurrentUser();
    if (currentUser?.id) {
      appendMockTestHistory(currentUser.id, {
        skill: displaySkill,
        level: level || '',
        gradingMode,
        score,
        correctCount,
        total,
        results: results.map((item) => ({
          id: item.id,
          question: item.question,
          submitted: item.submitted,
          expected: item.expected,
          isCorrect: item.isCorrect,
        })),
      });
    }

    if (results.some((item) => !item.isCorrect)) {
      setMockTestMessage(gradingMode === 'ai'
        ? 'AI grading found at least one answer that did not match the expected meaning.'
        : 'One or more answers were not exact enough.');
    } else {
      setMockTestMessage(gradingMode === 'ai'
        ? `AI graded your answers. Score: ${score}%`
        : `Perfect score: ${score}%`);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-slate-50' : 'bg-slate-50 text-slate-900'}`}>
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-5 rounded-3xl border border-emerald-400/15 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-5 py-6 shadow-2xl shadow-black/30">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-300/80">
                AI skill tree
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {displaySkill} Roadmap
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                {summary || `A branching roadmap for ${displaySkill}.`}
              </p>
              {refreshing ? (
                <p className="mt-2 text-xs text-emerald-300">Refreshing cached roadmap...</p>
              ) : null}
              {level ? (
                <p className="mt-3 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                  Level: {level}
                </p>
              ) : null}
            </div>

            <button
              onClick={() => navigate('/tech')}
              className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              Back to skills
            </button>
          </div>

          {branches.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {branches.map((branch) => (
                <span
                  key={branch.id}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200"
                >
                  {branch.title}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mb-4 flex flex-wrap gap-3">
          <button
            onClick={() => setView('flowchart')}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              view === 'flowchart'
                ? 'bg-emerald-400 text-slate-950'
                : 'border border-slate-300 bg-white text-slate-700 hover:border-emerald-400 hover:text-emerald-700'
            }`}
          >
            Flowchart
          </button>

          <button
            onClick={() => setView('tree')}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              view === 'tree'
                ? 'bg-emerald-400 text-slate-950'
                : 'border border-slate-300 bg-white text-slate-700 hover:border-emerald-400 hover:text-emerald-700'
            }`}
          >
            Learning tree
          </button>

          <button
            onClick={handleGenerateMockTest}
            className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            Generate Mock Test
          </button>
        </div>

        {view === 'flowchart' ? (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/40">
            <div className="border-b border-slate-200 px-5 py-3 text-sm text-slate-500">
              Mermaid flowchart generated by the AI roadmap model.
            </div>
            <div className="min-h-[72vh] bg-slate-950 p-4">
              {hasDiagram ? (
                <div ref={chartContainerRef} className="relative overflow-auto rounded-2xl bg-slate-950 p-4">
                  <div dangerouslySetInnerHTML={{ __html: diagramSvg || lastRenderedSvgRef.current }} />

                  {hoverNote ? (
                    <div
                      className="pointer-events-none absolute z-20 w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl border border-emerald-400/40 bg-slate-950/95 p-4 text-left shadow-2xl shadow-black/40 backdrop-blur"
                      style={{
                        left: `${hoverNote.x}px`,
                        top: `${hoverNote.y}px`,
                      }}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-300">
                        {hoverNote.parentTitle ? `${hoverNote.parentTitle} / ` : ''}
                        Leaf topic
                      </p>
                      <h3 className="mt-2 text-base font-bold text-white">{hoverNote.title}</h3>
                      {hoverNote.description ? (
                        <p className="mt-2 text-sm leading-6 text-slate-300">{hoverNote.description}</p>
                      ) : null}
                      {hoverNote.items?.length ? (
                        <div className="mt-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                            More details
                          </p>
                          <ul className="mt-2 space-y-1.5 text-sm text-slate-200">
                            {hoverNote.items.map((item) => (
                              <li key={item} className="flex gap-2">
                                <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : diagramError ? (
                <div className="flex min-h-[60vh] items-center justify-center px-6 text-sm text-red-300">
                  {diagramError}
                </div>
              ) : (
                <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-sm text-slate-300">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 animate-pulse rounded-full bg-emerald-400" />
                    Rendering flowchart...
                  </div>
                  <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="h-4 w-40 rounded bg-white/10" />
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div className="h-28 rounded-xl bg-white/5" />
                      <div className="h-28 rounded-xl bg-white/5" />
                      <div className="h-28 rounded-xl bg-white/5" />
                    </div>
                  </div>
                </div>
              )}
              {loading && hasDiagram ? (
                <div className="mt-3 text-center text-xs text-emerald-300">
                  Refreshing roadmap in the background...
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {(roadmapData?.steps ?? []).map((step, index) => (
              <div
                key={step.id}
                className={`rounded-3xl border bg-white p-5 shadow-lg shadow-slate-200/40 ${
                  step.level === 0 ? 'border-emerald-300' : 'border-slate-200'
                }`}
                style={{ marginLeft: `${Math.min(step.level, 3) * 18}px` }}
              >
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                    {step.kind === 'root' ? 'Root' : `Step ${index + 1}`}
                  </span>
                  <span className="text-xs text-slate-500">Level {step.level}</span>
                  {step.depends_on?.length ? (
                    <span className="text-xs text-slate-500">
                      Depends on {step.depends_on.join(', ')}
                    </span>
                  ) : (
                    <span className="text-xs text-emerald-700">Starting point</span>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
                {step.description ? (
                  <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
                ) : null}

                {step.items?.length ? (
                  <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
                    {step.items.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 rounded-3xl border border-emerald-200 bg-white p-6 shadow-xl shadow-slate-200/40">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-emerald-700">Mock test</p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">Strict roadmap quiz</h3>
              <p className="mt-2 text-sm text-slate-600">
                Generate 10 to 15 exact-answer questions from the roadmap. Extra words, paraphrasing, and loose answers will be marked wrong.
              </p>
            </div>
            <button
              type="button"
              onClick={handleGenerateMockTest}
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-emerald-500"
            >
              Generate Mock Test
            </button>
          </div>

          {mockTestMessage ? (
            <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
              {mockTestMessage}
            </div>
          ) : null}

          {mockTestQuestions.length ? (
            <form onSubmit={handleSubmitMockTest} className="mt-6 space-y-4">
              <div className="grid gap-4">
                {mockTestQuestions.map((question, index) => {
                  const result = mockTestResult?.results?.find((item) => item.id === question.id);
                  return (
                    <div
                      key={question.id}
                      className={`rounded-2xl border p-4 ${
                        result?.isCorrect ? 'border-emerald-200 bg-emerald-50/70' : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-700">Question {index + 1}</p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">{question.question}</p>
                        </div>
                        {mockTestResult ? (
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.2em] ${
                              result?.isCorrect ? 'bg-emerald-600 text-white' : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {result?.isCorrect ? 'Correct' : 'Wrong'}
                          </span>
                        ) : null}
                      </div>

                      <input
                        type="text"
                        value={mockTestAnswers[question.id] || ''}
                        onChange={(event) => handleMockTestAnswerChange(question.id, event.target.value)}
                        className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                        placeholder="Type the exact answer"
                      />

                      {result?.error ? (
                        <p className="mt-2 text-sm font-semibold text-rose-600">{result.error}</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-4">
              <button
                type="submit"
                disabled={mockTestChecking}
                className="rounded-full bg-slate-950 px-6 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mockTestChecking ? 'Checking with AI...' : 'Submit Answers'}
              </button>
                {mockTestResult ? (
                  <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800">
                    Score: {mockTestResult.score}% ({mockTestResult.correctCount}/{mockTestResult.total})
                  </div>
                ) : null}
              </div>
            </form>
          ) : null}
        </div>

      </div>
    </div>
  );
};

export default SkillRoadmapPage;
