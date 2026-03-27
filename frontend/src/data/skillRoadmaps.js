export const slugifySkill = (title) => {
  const specialCases = {
    'C++': 'cpp',
    'CI/CD': 'ci-cd',
    'Express.js': 'express-js',
    'Node.js': 'node-js',
    'React.js': 'react-js',
    'Node.js & Express': 'node-js-express',
  };

  if (specialCases[title]) {
    return specialCases[title];
  }

  return title
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\+/g, 'plus')
    .replace(/\./g, '')
    .replace(/\//g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

const buildRoadmap = ({ track, title, summary, phases, platforms, videos, mockTopics }) => ({
  track,
  title,
  summary,
  phases,
  platforms,
  videos,
  mockTest: {
    title: `${title} Mock Test`,
    description: `Assess how ready you are in ${title} with scenario-based questions, concept checks, and application tasks.`,
    topics: mockTopics,
  },
});

const PROGRAMMING_LANGUAGE_LEVEL_CONFIG = {
  beginner: {
    label: 'Beginner',
    summaryPrefix: 'Start from scratch and build strong foundations before moving to bigger projects.',
    phaseIndexes: [0, 1],
    platformFocusPrefix: 'Beginner Focus',
    videoFocusPrefix: 'Beginner Path',
    mockTopicCount: 3,
  },
  intermediate: {
    label: 'Intermediate',
    summaryPrefix: 'Build on the basics and move into practical coding patterns, problem solving, and stronger implementation habits.',
    phaseIndexes: [1, 2],
    platformFocusPrefix: 'Intermediate Focus',
    videoFocusPrefix: 'Intermediate Path',
    mockTopicCount: 4,
  },
  advanced: {
    label: 'Advanced',
    summaryPrefix: 'Focus on deeper concepts, advanced workflows, and production-style execution for this language.',
    phaseIndexes: [2, 3],
    platformFocusPrefix: 'Advanced Focus',
    videoFocusPrefix: 'Advanced Path',
    mockTopicCount: 4,
  },
};

const buildProgrammingLanguageRoadmap = (roadmap, level) => {
  if (roadmap.track !== 'Programming Language' || !level || !PROGRAMMING_LANGUAGE_LEVEL_CONFIG[level]) {
    return roadmap;
  }

  const config = PROGRAMMING_LANGUAGE_LEVEL_CONFIG[level];
  const phases = config.phaseIndexes
    .map((index) => roadmap.phases[index])
    .filter(Boolean)
    .map((phase, index) => ({
      ...phase,
      title: `${config.label} Stage ${index + 1}: ${phase.title.replace(/^Phase \d+:\s*/, '')}`,
    }));

  const platforms = roadmap.platforms.map((platform) => ({
    ...platform,
    focus: `${config.platformFocusPrefix}: ${platform.focus}`,
  }));

  const videos = roadmap.videos.map((video) => ({
    ...video,
    focus: `${config.videoFocusPrefix}: ${video.focus}`,
  }));

  const mockTopics = roadmap.mockTest.topics.slice(0, config.mockTopicCount);

  return {
    ...roadmap,
    summary: `${config.summaryPrefix} ${roadmap.summary}`,
    phases,
    platforms,
    videos,
    mockTest: {
      ...roadmap.mockTest,
      title: `${config.label} ${roadmap.title} Mock Test`,
      description: `Assess your ${config.label.toLowerCase()} ${roadmap.title} readiness with questions focused on the level you selected.`,
      topics: mockTopics,
    },
    selectedLevel: config.label,
  };
};

export const SKILL_ROADMAPS = {
  'generative-ai': buildRoadmap({
    track: 'AI & ML',
    title: 'Generative AI',
    summary: 'Follow a practical sequence from LLM foundations to hands-on GenAI projects and evaluation.',
    phases: [
      { title: 'Phase 1: Foundations', items: ['Understand tokens, embeddings, transformers, and context windows.', 'Learn the differences between LLMs, multimodal models, and fine-tuned systems.'] },
      { title: 'Phase 2: Prompting & APIs', items: ['Practice zero-shot, few-shot, chain-of-thought, and structured prompting.', 'Use model APIs and playgrounds to generate text, summaries, and assistants.'] },
      { title: 'Phase 3: GenAI Systems', items: ['Build RAG flows with embeddings, vector stores, and document retrieval.', 'Experiment with tools, agents, guardrails, and output validation.'] },
      { title: 'Phase 4: Real Projects', items: ['Ship a chatbot, document Q&A, or content assistant end to end.', 'Measure cost, latency, hallucinations, and response quality with evals.'] },
    ],
    platforms: [
      { name: 'Coursera', focus: 'Structured AI and LLM foundations from guided courses.' },
      { name: 'DeepLearning.AI', focus: 'Short practical GenAI courses focused on production use cases.' },
      { name: 'Hugging Face', focus: 'Model demos, transformers docs, and experimentation playgrounds.' },
    ],
    videos: [
      { title: 'Generative AI Full Course', creator: 'freeCodeCamp', focus: 'Strong beginner-friendly overview.' },
      { title: 'Prompt Engineering Basics', creator: 'DeepLearning.AI', focus: 'Prompting patterns and workflow design.' },
      { title: 'RAG Explained Clearly', creator: 'AssemblyAI', focus: 'How retrieval-augmented generation works in practice.' },
    ],
    mockTopics: ['LLM basics', 'prompt design', 'RAG architecture', 'evaluation metrics'],
  }),
  'agentic-ai': buildRoadmap({
    track: 'AI & ML',
    title: 'Agentic AI',
    summary: 'Learn how AI agents plan, use tools, maintain context, and execute multi-step tasks from simple automations to advanced agent systems.',
    phases: [
      { title: 'Phase 1: Foundations', items: ['Understand the difference between a plain LLM workflow and an agentic workflow.', 'Learn core concepts like goals, planning, memory, tools, feedback loops, and multi-step reasoning.'] },
      { title: 'Phase 2: Tool Use & Workflows', items: ['Practice building agents that call APIs, search data, and work with structured outputs.', 'Learn how prompts, function calling, and decision steps fit together inside agent loops.'] },
      { title: 'Phase 3: Multi-Agent & Reliability', items: ['Explore task decomposition, agent roles, orchestration, and handoffs between agents.', 'Add guardrails, retries, validation, logging, and monitoring to make agent systems reliable.'] },
      { title: 'Phase 4: Real Projects', items: ['Build an agentic assistant such as a research agent, workflow copilot, or operations bot.', 'Evaluate success based on accuracy, task completion, latency, safety, and cost efficiency.'] },
    ],
    platforms: [
      { name: 'DeepLearning.AI', focus: 'Short practical courses on agents, tool use, and workflow design.' },
      { name: 'LangChain / LangGraph Docs', focus: 'Understand agent orchestration, state, and tool-calling patterns.' },
      { name: 'Hugging Face', focus: 'Experiment with open models, agent demos, and tool-integrated workflows.' },
    ],
    videos: [
      { title: 'AI Agents Explained', creator: 'AssemblyAI', focus: 'Clear overview of how agentic systems work.' },
      { title: 'Build AI Agents', creator: 'freeCodeCamp', focus: 'Beginner-friendly end-to-end implementation ideas.' },
      { title: 'Multi-Agent Systems', creator: 'DeepLearning.AI', focus: 'How orchestration and collaboration patterns work.' },
    ],
    mockTopics: ['agent loops', 'tool calling', 'planning', 'multi-agent orchestration'],
  }),
  'machine-learning': buildRoadmap({
    track: 'AI & ML',
    title: 'Machine Learning',
    summary: 'Build ML skill from math intuition and supervised learning to model evaluation and deployment habits.',
    phases: [
      { title: 'Phase 1: Core Concepts', items: ['Learn supervised vs unsupervised learning, features, labels, and datasets.', 'Refresh linear algebra, probability, and statistics needed for ML thinking.'] },
      { title: 'Phase 2: Model Building', items: ['Practice regression, classification, clustering, and tree-based methods.', 'Understand overfitting, bias-variance tradeoff, and train/validation/test splits.'] },
      { title: 'Phase 3: Evaluation', items: ['Use accuracy, precision, recall, F1, ROC-AUC, and error analysis.', 'Improve models with preprocessing, scaling, feature engineering, and tuning.'] },
      { title: 'Phase 4: Projects', items: ['Build prediction projects with real datasets and clean notebooks.', 'Package one ML workflow into an app or API to show end-to-end understanding.'] },
    ],
    platforms: [
      { name: 'Kaggle', focus: 'Hands-on datasets, notebooks, and competitions.' },
      { name: 'Coursera', focus: 'Strong guided ML fundamentals and practice.' },
      { name: 'Scikit-learn Docs', focus: 'Reference for core ML algorithms and workflows.' },
    ],
    videos: [
      { title: 'Machine Learning for Everybody', creator: 'freeCodeCamp', focus: 'Clear beginner ML path.' },
      { title: 'ML Concepts Explained', creator: 'StatQuest', focus: 'Excellent conceptual clarity.' },
      { title: 'Scikit-learn Tutorial', creator: 'Data School', focus: 'Practical implementation with Python.' },
    ],
    mockTopics: ['model selection', 'metrics', 'feature engineering', 'cross validation'],
  }),
  'data-analysis': buildRoadmap({
    track: 'AI & ML',
    title: 'Data Analysis',
    summary: 'Learn how to inspect, clean, visualize, and communicate data with business context.',
    phases: [
      { title: 'Phase 1: Data Basics', items: ['Understand rows, columns, datatypes, missing values, and outliers.', 'Practice spreadsheet thinking and basic SQL-style filtering and grouping.'] },
      { title: 'Phase 2: Python Analysis', items: ['Use pandas and NumPy for cleaning, reshaping, and exploratory analysis.', 'Learn how to calculate trends, distributions, and summary statistics.'] },
      { title: 'Phase 3: Visualization', items: ['Build charts with Matplotlib, Seaborn, or BI tools.', 'Choose visuals based on comparison, trend, composition, and distribution.'] },
      { title: 'Phase 4: Storytelling', items: ['Turn findings into dashboards or reports with recommendations.', 'Practice explaining insights in simple business language.'] },
    ],
    platforms: [
      { name: 'Kaggle', focus: 'Practice with datasets and analysis notebooks.' },
      { name: 'DataCamp', focus: 'Step-by-step Python and analytics exercises.' },
      { name: 'Google Data Analytics', focus: 'Structured path for reporting and storytelling.' },
    ],
    videos: [
      { title: 'Data Analysis with Python', creator: 'freeCodeCamp', focus: 'Full walkthrough using pandas.' },
      { title: 'Pandas Tutorial', creator: 'Keith Galli', focus: 'Hands-on analysis techniques.' },
      { title: 'Data Visualization Guide', creator: 'Alex The Analyst', focus: 'Charts and dashboard mindset.' },
    ],
    mockTopics: ['EDA', 'cleaning techniques', 'visualization choice', 'insight communication'],
  }),
  'deep-learning': buildRoadmap({
    track: 'AI & ML',
    title: 'Deep Learning',
    summary: 'Move from neural network foundations to computer vision, sequence models, and applied deep learning.',
    phases: [
      { title: 'Phase 1: Neural Network Basics', items: ['Learn perceptrons, activations, loss functions, and backpropagation.', 'Understand gradient descent and why optimization matters.'] },
      { title: 'Phase 2: Frameworks', items: ['Build models with TensorFlow or PyTorch.', 'Train simple dense networks on tabular and image data.'] },
      { title: 'Phase 3: Advanced Architectures', items: ['Study CNNs, RNNs, attention, and transformer ideas.', 'Learn regularization, dropout, batch norm, and tuning techniques.'] },
      { title: 'Phase 4: Applied Projects', items: ['Create one image, NLP, or time-series deep learning project.', 'Track experiments, metrics, and failure cases.'] },
    ],
    platforms: [
      { name: 'DeepLearning.AI', focus: 'Excellent deep learning progression.' },
      { name: 'PyTorch Docs', focus: 'Hands-on model building references.' },
      { name: 'Kaggle', focus: 'Real datasets for deep learning projects.' },
    ],
    videos: [
      { title: 'Deep Learning Full Course', creator: 'freeCodeCamp', focus: 'Complete starter path.' },
      { title: 'Neural Networks Explained', creator: '3Blue1Brown', focus: 'Best intuition for backpropagation.' },
      { title: 'PyTorch Tutorial', creator: 'Aladdin Persson', focus: 'Practical implementation patterns.' },
    ],
    mockTopics: ['backpropagation', 'CNNs', 'transformers', 'training stability'],
  }),
  'prompt-engineering': buildRoadmap({
    track: 'AI & ML',
    title: 'Prompt Engineering',
    summary: 'Develop reliable prompting habits for LLMs, agents, structured output, and evaluation.',
    phases: [
      { title: 'Phase 1: Prompt Fundamentals', items: ['Learn role, context, constraints, examples, and output formatting.', 'Compare zero-shot, few-shot, and instruction-based prompting.'] },
      { title: 'Phase 2: Pattern Library', items: ['Practice summarization, extraction, classification, and reasoning prompts.', 'Use XML, JSON, and markdown structures for clean outputs.'] },
      { title: 'Phase 3: Workflow Design', items: ['Break complex tasks into planning, generation, and verification steps.', 'Combine prompts with tools, retrieval, and function calls.'] },
      { title: 'Phase 4: Evaluation', items: ['Test prompts for robustness, hallucinations, and edge cases.', 'Create reusable prompt templates for product workflows.'] },
    ],
    platforms: [
      { name: 'DeepLearning.AI', focus: 'Short prompt-focused lessons and examples.' },
      { name: 'OpenAI Playground-style tools', focus: 'Rapid testing and iteration of prompts.' },
      { name: 'Hugging Face Spaces', focus: 'Hands-on prompt experimentation with public demos.' },
    ],
    videos: [
      { title: 'Prompt Engineering Crash Course', creator: 'freeCodeCamp', focus: 'Quick beginner start.' },
      { title: 'Prompting Best Practices', creator: 'DeepLearning.AI', focus: 'Patterns for better output control.' },
      { title: 'Building Reliable LLM Prompts', creator: 'AssemblyAI', focus: 'Prompt testing mindset.' },
    ],
    mockTopics: ['prompt patterns', 'structured outputs', 'tool use', 'evaluation'],
  }),
  javascript: buildRoadmap({
    track: 'Programming Language',
    title: 'JavaScript',
    summary: 'Build JavaScript confidence from syntax and logic to DOM, async programming, and projects.',
    phases: [
      { title: 'Phase 1: Fundamentals', items: ['Learn variables, functions, arrays, objects, loops, and conditionals.', 'Understand scope, hoisting, and modern ES6+ syntax.'] },
      { title: 'Phase 2: Problem Solving', items: ['Practice array methods, string problems, and basic algorithms.', 'Write clean reusable functions and modular code.'] },
      { title: 'Phase 3: Browser & Async', items: ['Use the DOM, events, fetch, promises, and async/await.', 'Understand APIs and how frontend apps consume data.'] },
      { title: 'Phase 4: Projects', items: ['Build mini apps like todo, weather, or quiz tools.', 'Refactor code and prepare for framework usage like React.'] },
    ],
    platforms: [
      { name: 'MDN Web Docs', focus: 'Best documentation for JavaScript fundamentals.' },
      { name: 'freeCodeCamp', focus: 'Hands-on exercises and projects.' },
      { name: 'Frontend Mentor', focus: 'Practice JavaScript in real UI projects.' },
    ],
    videos: [
      { title: 'JavaScript Full Course', creator: 'freeCodeCamp', focus: 'Complete beginner to intermediate path.' },
      { title: 'JavaScript DOM Course', creator: 'Bro Code', focus: 'DOM and events practice.' },
      { title: 'JavaScript Interview Questions', creator: 'Akshay Saini', focus: 'Deep understanding of JS behavior.' },
    ],
    mockTopics: ['closures', 'async await', 'DOM manipulation', 'array methods'],
  }),
  python: buildRoadmap({
    track: 'Programming Language',
    title: 'Python',
    summary: 'Learn Python from syntax and scripting to automation, data work, and problem solving.',
    phases: [
      { title: 'Phase 1: Syntax Basics', items: ['Learn variables, control flow, functions, lists, dicts, and sets.', 'Get comfortable with files, exceptions, and modules.'] },
      { title: 'Phase 2: Problem Solving', items: ['Practice loops, recursion, and common coding patterns.', 'Strengthen DSA basics using Python syntax.'] },
      { title: 'Phase 3: Practical Usage', items: ['Use Python for scripting, APIs, data processing, and automation.', 'Understand virtual environments and package management.'] },
      { title: 'Phase 4: Projects', items: ['Build CLI tools, automation scripts, or data mini-projects.', 'Choose a specialization such as backend, AI, or analytics.'] },
    ],
    platforms: [
      { name: 'Python Docs', focus: 'Core language reference and tutorials.' },
      { name: 'Exercism', focus: 'Practice-oriented Python exercises.' },
      { name: 'Kaggle', focus: 'Use Python in real data and ML workflows.' },
    ],
    videos: [
      { title: 'Python Full Course', creator: 'freeCodeCamp', focus: 'End-to-end beginner path.' },
      { title: 'Python Tutorial', creator: 'Corey Schafer', focus: 'Excellent concept clarity.' },
      { title: 'Python Automation Projects', creator: 'Tech With Tim', focus: 'Hands-on project building.' },
    ],
    mockTopics: ['data structures', 'functions', 'file handling', 'OOP basics'],
  }),
  java: buildRoadmap({
    track: 'Programming Language',
    title: 'Java',
    summary: 'Build strong Java fundamentals for OOP, backend development, and interview preparation.',
    phases: [
      { title: 'Phase 1: Java Basics', items: ['Learn classes, objects, methods, loops, arrays, and conditionals.', 'Understand JVM, JDK, compilation, and packages.'] },
      { title: 'Phase 2: OOP & Collections', items: ['Practice inheritance, polymorphism, abstraction, and interfaces.', 'Use collections like ArrayList, HashMap, and Set effectively.'] },
      { title: 'Phase 3: Advanced Java', items: ['Learn exception handling, generics, streams, and multithreading basics.', 'Understand clean class design and package organization.'] },
      { title: 'Phase 4: Projects', items: ['Build console apps or backend services with Java.', 'Prepare for Spring Boot and enterprise workflows.'] },
    ],
    platforms: [
      { name: 'GeeksforGeeks', focus: 'Java fundamentals and DSA practice.' },
      { name: 'Oracle Java Docs', focus: 'Official language references.' },
      { name: 'LeetCode', focus: 'Problem solving with Java syntax.' },
    ],
    videos: [
      { title: 'Java Full Course', creator: 'Bro Code', focus: 'Clear beginner-friendly learning.' },
      { title: 'Java OOP Explained', creator: 'Programming with Mosh', focus: 'Object-oriented clarity.' },
      { title: 'Java Collections Framework', creator: 'Telusko', focus: 'Practical collection usage.' },
    ],
    mockTopics: ['OOP', 'collections', 'exceptions', 'streams'],
  }),
  cpp: buildRoadmap({
    track: 'Programming Language',
    title: 'C++',
    summary: 'Use C++ to strengthen problem solving, performance thinking, and systems-level understanding.',
    phases: [
      { title: 'Phase 1: Language Basics', items: ['Learn variables, loops, functions, arrays, and pointers.', 'Understand references, memory, and compilation basics.'] },
      { title: 'Phase 2: OOP & STL', items: ['Use classes, constructors, inheritance, and operator overloading.', 'Master STL containers, iterators, and algorithms.'] },
      { title: 'Phase 3: DSA Practice', items: ['Solve recursion, trees, graphs, and dynamic programming problems.', 'Improve time and space complexity reasoning.'] },
      { title: 'Phase 4: Advanced Topics', items: ['Study smart pointers, templates, and memory management habits.', 'Build small system-style or console projects.'] },
    ],
    platforms: [
      { name: 'LeetCode', focus: 'Excellent for DSA practice in C++.' },
      { name: 'cplusplus.com', focus: 'Language and STL references.' },
      { name: 'Codeforces', focus: 'Competitive programming practice.' },
    ],
    videos: [
      { title: 'C++ Full Course', creator: 'freeCodeCamp', focus: 'Strong beginner start.' },
      { title: 'C++ STL Tutorial', creator: 'Luv', focus: 'Very useful for problem solving.' },
      { title: 'Dynamic Programming Playlist', creator: 'Aditya Verma', focus: 'Advanced coding practice.' },
    ],
    mockTopics: ['pointers', 'STL', 'recursion', 'complexity analysis'],
  }),
  sql: buildRoadmap({
    track: 'Programming Language',
    title: 'SQL',
    summary: 'Learn how to query, join, aggregate, and optimize structured data for applications and analytics.',
    phases: [
      { title: 'Phase 1: Query Basics', items: ['Learn SELECT, WHERE, ORDER BY, GROUP BY, and LIMIT.', 'Understand tables, rows, keys, and normalization basics.'] },
      { title: 'Phase 2: Intermediate SQL', items: ['Practice joins, subqueries, aggregations, and case expressions.', 'Use filtering and grouping to answer analytical questions.'] },
      { title: 'Phase 3: Advanced SQL', items: ['Learn CTEs, window functions, indexing, and optimization basics.', 'Understand query plans and performance tradeoffs.'] },
      { title: 'Phase 4: Applied Practice', items: ['Solve business-style data questions and reporting tasks.', 'Connect SQL with backend apps or dashboards.'] },
    ],
    platforms: [
      { name: 'SQLBolt', focus: 'Friendly interactive SQL practice.' },
      { name: 'LeetCode SQL', focus: 'Interview-style query questions.' },
      { name: 'Mode SQL Tutorial', focus: 'Analytics-focused exercises.' },
    ],
    videos: [
      { title: 'SQL Full Course', creator: 'freeCodeCamp', focus: 'Solid beginner-to-intermediate path.' },
      { title: 'SQL Interview Questions', creator: 'Alex The Analyst', focus: 'Practical business SQL.' },
      { title: 'Advanced SQL Window Functions', creator: 'Khan Academy / educational playlists', focus: 'Higher-level SQL concepts.' },
    ],
    mockTopics: ['joins', 'aggregations', 'window functions', 'query optimization'],
  }),
  mongodb: buildRoadmap({
    track: 'Mern Stack Development',
    title: 'MongoDB',
    summary: 'Learn document database design, querying, aggregation, and MongoDB usage in MERN applications.',
    phases: [
      { title: 'Phase 1: Database Basics', items: ['Understand documents, collections, ObjectId, and schema thinking.', 'Compare MongoDB with relational databases.'] },
      { title: 'Phase 2: CRUD & Queries', items: ['Practice insert, find, update, delete, filtering, and sorting.', 'Use indexes and query patterns effectively.'] },
      { title: 'Phase 3: Aggregation & Modeling', items: ['Learn aggregation pipelines, lookups, and data modeling choices.', 'Design collections for real app flows.'] },
      { title: 'Phase 4: MERN Integration', items: ['Connect MongoDB with Express and Mongoose.', 'Build one project with auth, storage, and dashboard queries.'] },
    ],
    platforms: [
      { name: 'MongoDB University', focus: 'Official guided MongoDB learning.' },
      { name: 'MongoDB Docs', focus: 'Best reference for commands and design.' },
      { name: 'GeeksforGeeks', focus: 'Beginner-friendly conceptual explanations.' },
    ],
    videos: [
      { title: 'MongoDB Tutorial', creator: 'freeCodeCamp', focus: 'Core CRUD and schema concepts.' },
      { title: 'Mongoose Crash Course', creator: 'Traversy Media', focus: 'MongoDB inside MERN apps.' },
      { title: 'Aggregation Pipeline Explained', creator: 'Web Dev Simplified / MongoDB channels', focus: 'Advanced querying.' },
    ],
    mockTopics: ['CRUD', 'aggregation', 'schema design', 'indexes'],
  }),
  'express-js': buildRoadmap({
    track: 'Mern Stack Development',
    title: 'Express.js',
    summary: 'Build backend fundamentals for MERN by learning routing, middleware, APIs, and auth-ready structure.',
    phases: [
      { title: 'Phase 1: Server Basics', items: ['Understand Node server flow, routing, requests, and responses.', 'Create simple REST endpoints with Express.'] },
      { title: 'Phase 2: Middleware & APIs', items: ['Use middleware for validation, logging, auth, and error handling.', 'Organize routes, controllers, and services cleanly.'] },
      { title: 'Phase 3: Database Integration', items: ['Connect MongoDB with models and async handlers.', 'Build CRUD APIs with proper status codes and validations.'] },
      { title: 'Phase 4: Production Readiness', items: ['Handle auth, rate limiting, environment config, and deployment basics.', 'Document APIs and test key routes.'] },
    ],
    platforms: [
      { name: 'Express Docs', focus: 'Official routing and middleware guidance.' },
      { name: 'Node.js Docs', focus: 'Server runtime and async concepts.' },
      { name: 'Postman', focus: 'API testing during backend development.' },
    ],
    videos: [
      { title: 'Express JS Crash Course', creator: 'Traversy Media', focus: 'Backend essentials quickly.' },
      { title: 'Build REST APIs with Node and Express', creator: 'freeCodeCamp', focus: 'Practical API development.' },
      { title: 'Express Middleware Explained', creator: 'Web Dev Simplified', focus: 'Architecture and request flow.' },
    ],
    mockTopics: ['routing', 'middleware', 'REST APIs', 'error handling'],
  }),
  'react-js': buildRoadmap({
    track: 'Mern Stack Development',
    title: 'React.js',
    summary: 'Learn how to build dynamic frontend interfaces for MERN products using components, hooks, and routing.',
    phases: [
      { title: 'Phase 1: React Basics', items: ['Understand components, props, state, JSX, and events.', 'Learn how React renders and updates UI.'] },
      { title: 'Phase 2: Hooks & Routing', items: ['Use useState, useEffect, forms, and React Router patterns.', 'Practice conditional rendering and reusable components.'] },
      { title: 'Phase 3: App Architecture', items: ['Handle APIs, loading states, auth flows, and shared state.', 'Improve code organization, styling, and responsiveness.'] },
      { title: 'Phase 4: Real Projects', items: ['Build a MERN dashboard, auth flow, or CRUD admin panel.', 'Polish UX and connect frontend cleanly with backend APIs.'] },
    ],
    platforms: [
      { name: 'React Docs', focus: 'Official learning path and API references.' },
      { name: 'Frontend Mentor', focus: 'UI practice with realistic constraints.' },
      { name: 'freeCodeCamp', focus: 'Exercises and React practice.' },
    ],
    videos: [
      { title: 'React Full Course', creator: 'freeCodeCamp', focus: 'Complete foundation course.' },
      { title: 'React Hooks Course', creator: 'Web Dev Simplified', focus: 'Hooks and state management.' },
      { title: 'Build a MERN Frontend', creator: 'Traversy Media', focus: 'Connecting React with backend services.' },
    ],
    mockTopics: ['components', 'hooks', 'routing', 'state management'],
  }),
  'node-js': buildRoadmap({
    track: 'Mern Stack Development',
    title: 'Node.js',
    summary: 'Understand the JavaScript runtime behind MERN backends, async workflows, packages, and server apps.',
    phases: [
      { title: 'Phase 1: Runtime Basics', items: ['Learn event loop, modules, npm, file system, and core APIs.', 'Understand how Node differs from browser JavaScript.'] },
      { title: 'Phase 2: Async Programming', items: ['Practice callbacks, promises, async/await, and error handling.', 'Use packages and scripts efficiently in real apps.'] },
      { title: 'Phase 3: Backend Patterns', items: ['Structure APIs, configs, env variables, and reusable modules.', 'Learn logging, validation, and security basics.'] },
      { title: 'Phase 4: Production Apps', items: ['Run Node apps in deployment environments and debug them.', 'Build one full backend serving a MERN frontend.'] },
    ],
    platforms: [
      { name: 'Node.js Docs', focus: 'Official source for runtime fundamentals.' },
      { name: 'npm Docs', focus: 'Package and script ecosystem understanding.' },
      { name: 'Postman', focus: 'Testing backend behavior during development.' },
    ],
    videos: [
      { title: 'Node JS Full Course', creator: 'freeCodeCamp', focus: 'Solid Node foundation.' },
      { title: 'Node Event Loop Explained', creator: 'Akshay Saini / educational channels', focus: 'Async mental model.' },
      { title: 'Node Backend Project', creator: 'Traversy Media', focus: 'Real backend architecture.' },
    ],
    mockTopics: ['event loop', 'modules', 'async handling', 'server architecture'],
  }),
  'cloud-platforms': buildRoadmap({
    track: 'Cloud/Devops',
    title: 'Cloud Platforms',
    summary: 'Learn how applications are hosted, scaled, secured, and managed on cloud infrastructure.',
    phases: [
      { title: 'Phase 1: Cloud Fundamentals', items: ['Understand IaaS, PaaS, SaaS, regions, VPCs, and cloud pricing basics.', 'Compare AWS, Azure, and GCP service categories.'] },
      { title: 'Phase 2: Core Services', items: ['Learn compute, storage, databases, networking, and IAM services.', 'Deploy a basic app using virtual machines or managed hosting.'] },
      { title: 'Phase 3: Security & Reliability', items: ['Practice access control, backups, monitoring, and scaling strategies.', 'Understand load balancing and managed services.'] },
      { title: 'Phase 4: Real Deployments', items: ['Host one backend or MERN app in the cloud.', 'Document architecture decisions and cost awareness.'] },
    ],
    platforms: [
      { name: 'AWS Skill Builder', focus: 'Cloud fundamentals and service overviews.' },
      { name: 'Microsoft Learn', focus: 'Azure concepts and guided labs.' },
      { name: 'Google Cloud Skills Boost', focus: 'Hands-on cloud labs and exercises.' },
    ],
    videos: [
      { title: 'Cloud Computing Full Course', creator: 'Simplilearn / freeCodeCamp', focus: 'Broad introduction.' },
      { title: 'AWS for Beginners', creator: 'freeCodeCamp', focus: 'Real cloud walkthroughs.' },
      { title: 'Cloud Architecture Basics', creator: 'TechWorld with Nana', focus: 'Deployment thinking.' },
    ],
    mockTopics: ['cloud service models', 'IAM', 'scaling', 'architecture basics'],
  }),
  'ci-cd': buildRoadmap({
    track: 'Cloud/Devops',
    title: 'CI/CD',
    summary: 'Learn how code moves from commit to production through automated pipelines and quality checks.',
    phases: [
      { title: 'Phase 1: Version Control Flow', items: ['Understand Git workflows, branching, pull requests, and code reviews.', 'Learn why automation matters in delivery speed and reliability.'] },
      { title: 'Phase 2: Continuous Integration', items: ['Set up linting, tests, and build checks in pipelines.', 'Practice GitHub Actions or similar CI systems.'] },
      { title: 'Phase 3: Continuous Delivery', items: ['Automate deployment to staging or production environments.', 'Handle secrets, environment variables, and rollback strategies.'] },
      { title: 'Phase 4: Pipeline Maturity', items: ['Add notifications, approvals, and release strategies.', 'Improve pipeline speed and debugging confidence.'] },
    ],
    platforms: [
      { name: 'GitHub Actions Docs', focus: 'CI/CD workflows and automation.' },
      { name: 'GitLab CI Docs', focus: 'Pipeline design patterns.' },
      { name: 'Jenkins Docs', focus: 'Traditional CI/CD pipeline concepts.' },
    ],
    videos: [
      { title: 'CI/CD Explained', creator: 'TechWorld with Nana', focus: 'Very clear beginner explanation.' },
      { title: 'GitHub Actions Tutorial', creator: 'freeCodeCamp', focus: 'Practical automation setup.' },
      { title: 'DevOps Pipeline Course', creator: 'KodeKloud / Nana', focus: 'Real deployment flow.' },
    ],
    mockTopics: ['pipeline stages', 'branching flow', 'deployment automation', 'secrets handling'],
  }),
  containers: buildRoadmap({
    track: 'Cloud/Devops',
    title: 'Containers',
    summary: 'Understand containerization, Docker workflows, and portable application deployment.',
    phases: [
      { title: 'Phase 1: Container Basics', items: ['Learn what containers are and how they differ from VMs.', 'Understand images, containers, registries, and layers.'] },
      { title: 'Phase 2: Docker Workflow', items: ['Write Dockerfiles, build images, and run containers locally.', 'Use volumes, ports, and environment variables correctly.'] },
      { title: 'Phase 3: Multi-Service Apps', items: ['Use Docker Compose for app plus database setups.', 'Containerize a MERN or backend project.'] },
      { title: 'Phase 4: Production Thinking', items: ['Push images to registries and learn basic orchestration ideas.', 'Understand security, image size, and deployment practices.'] },
    ],
    platforms: [
      { name: 'Docker Docs', focus: 'Best official reference for Docker workflow.' },
      { name: 'KodeKloud', focus: 'Hands-on DevOps practice labs.' },
      { name: 'Play with Docker', focus: 'Browser-based Docker experimentation.' },
    ],
    videos: [
      { title: 'Docker Full Course', creator: 'freeCodeCamp', focus: 'Container basics to practice.' },
      { title: 'Docker in One Video', creator: 'TechWorld with Nana', focus: 'Clear concept building.' },
      { title: 'Docker Compose Tutorial', creator: 'Traversy Media', focus: 'Multi-service app setup.' },
    ],
    mockTopics: ['Dockerfiles', 'images vs containers', 'compose', 'deployment flow'],
  }),
  monitoring: buildRoadmap({
    track: 'Cloud/Devops',
    title: 'Monitoring',
    summary: 'Learn how to observe system health, logs, metrics, and alerts for reliable software delivery.',
    phases: [
      { title: 'Phase 1: Observability Basics', items: ['Understand logs, metrics, traces, uptime, and alerting concepts.', 'Learn why observability matters in production apps.'] },
      { title: 'Phase 2: Tooling', items: ['Use tools like Prometheus, Grafana, or cloud-native dashboards.', 'Track CPU, memory, latency, error rates, and throughput.'] },
      { title: 'Phase 3: Alerts & Debugging', items: ['Create meaningful alerts and incident response habits.', 'Debug failures through logs and dashboards.'] },
      { title: 'Phase 4: Real App Monitoring', items: ['Add basic monitoring to one deployed app or API.', 'Review health trends and improve stability.'] },
    ],
    platforms: [
      { name: 'Grafana Labs', focus: 'Monitoring dashboards and observability tooling.' },
      { name: 'Prometheus Docs', focus: 'Metrics collection and querying.' },
      { name: 'Datadog Learn', focus: 'Practical application monitoring ideas.' },
    ],
    videos: [
      { title: 'Monitoring and Observability Explained', creator: 'TechWorld with Nana', focus: 'Beginner-friendly overview.' },
      { title: 'Grafana Tutorial', creator: 'freeCodeCamp', focus: 'Dashboard setup and metrics.' },
      { title: 'Prometheus Basics', creator: 'Julio Casal / devops channels', focus: 'Metrics and alerts.' },
    ],
    mockTopics: ['metrics', 'logs', 'alerts', 'incident debugging'],
  }),
  react: buildRoadmap({
    track: 'Libraries/Frameworks',
    title: 'React',
    summary: 'Learn the React ecosystem from components to project architecture and production UI habits.',
    phases: [
      { title: 'Phase 1: Core React', items: ['Understand components, props, state, JSX, and event handling.', 'Learn one-way data flow and re-rendering basics.'] },
      { title: 'Phase 2: Hooks & Routing', items: ['Use hooks, forms, effects, and routing patterns effectively.', 'Practice reusable components and UI composition.'] },
      { title: 'Phase 3: Data & State', items: ['Fetch APIs, manage local and shared state, and handle async UI.', 'Improve folder structure and scalability.'] },
      { title: 'Phase 4: Build Portfolio Apps', items: ['Create dashboards, auth flows, and polished responsive projects.', 'Focus on accessibility and performance habits.'] },
    ],
    platforms: [
      { name: 'React Docs', focus: 'Official recommended learning path.' },
      { name: 'Frontend Mentor', focus: 'Real UI challenges for React practice.' },
      { name: 'Scrimba', focus: 'Interactive React lessons.' },
    ],
    videos: [
      { title: 'React Course', creator: 'freeCodeCamp', focus: 'Complete path with projects.' },
      { title: 'React Hooks Explained', creator: 'Web Dev Simplified', focus: 'Practical React architecture.' },
      { title: 'Build React Projects', creator: 'Traversy Media', focus: 'Project-first learning.' },
    ],
    mockTopics: ['hooks', 'component design', 'routing', 'API integration'],
  }),
  'node-js-express': buildRoadmap({
    track: 'Libraries/Frameworks',
    title: 'Node.js & Express',
    summary: 'Learn the backend framework pair that powers APIs, services, and server-side JavaScript apps.',
    phases: [
      { title: 'Phase 1: Runtime + Framework Basics', items: ['Understand Node modules, npm, and Express routing basics.', 'Create simple server endpoints and middleware flow.'] },
      { title: 'Phase 2: API Development', items: ['Build CRUD routes, controllers, and validation patterns.', 'Learn request lifecycle, status codes, and error handling.'] },
      { title: 'Phase 3: Integration', items: ['Connect databases, auth flows, and external services.', 'Structure backend projects for maintainability.'] },
      { title: 'Phase 4: Real Apps', items: ['Build one complete API consumed by a frontend app.', 'Add testing, docs, and deployment readiness.'] },
    ],
    platforms: [
      { name: 'Express Docs', focus: 'Core framework reference.' },
      { name: 'Node.js Docs', focus: 'Runtime concepts and APIs.' },
      { name: 'Postman', focus: 'Testing service behavior while building.' },
    ],
    videos: [
      { title: 'Node and Express Course', creator: 'freeCodeCamp', focus: 'Foundational backend learning.' },
      { title: 'Express API Tutorial', creator: 'Traversy Media', focus: 'Practical CRUD APIs.' },
      { title: 'REST API Architecture', creator: 'Web Dev Simplified', focus: 'Clean backend design.' },
    ],
    mockTopics: ['routing', 'middleware', 'CRUD APIs', 'backend architecture'],
  }),
  'tailwind-css': buildRoadmap({
    track: 'Libraries/Frameworks',
    title: 'Tailwind CSS',
    summary: 'Learn utility-first styling to build fast, consistent, responsive interfaces with clean design systems.',
    phases: [
      { title: 'Phase 1: Tailwind Basics', items: ['Understand utility classes, spacing, typography, and colors.', 'Learn how Tailwind differs from traditional CSS styling.'] },
      { title: 'Phase 2: Layout Mastery', items: ['Use flex, grid, positioning, and responsive breakpoints.', 'Build cards, forms, navbars, and sections quickly.'] },
      { title: 'Phase 3: Reusable Patterns', items: ['Create consistent component patterns and theme systems.', 'Use variants, state styles, and transitions effectively.'] },
      { title: 'Phase 4: Real UI Projects', items: ['Recreate real product screens and polish responsive behavior.', 'Blend Tailwind with React components cleanly.'] },
    ],
    platforms: [
      { name: 'Tailwind Docs', focus: 'Official utility reference and examples.' },
      { name: 'Tailwind UI', focus: 'Inspiration for production-grade patterns.' },
      { name: 'Frontend Mentor', focus: 'Practice styling full interfaces.' },
    ],
    videos: [
      { title: 'Tailwind CSS Full Course', creator: 'freeCodeCamp', focus: 'Full beginner-friendly walkthrough.' },
      { title: 'Tailwind Crash Course', creator: 'Traversy Media', focus: 'Fast practical introduction.' },
      { title: 'Responsive Tailwind Design', creator: 'Web Dev Simplified', focus: 'Layout and component usage.' },
    ],
    mockTopics: ['responsive classes', 'layout systems', 'state variants', 'component styling'],
  }),
  nextjs: buildRoadmap({
    track: 'Libraries/Frameworks',
    title: 'Next.js',
    summary: 'Learn Next.js for full-stack React apps with routing, rendering, and production-ready patterns.',
    phases: [
      { title: 'Phase 1: Framework Basics', items: ['Understand app structure, file-based routing, and layouts.', 'Learn client vs server components and rendering modes.'] },
      { title: 'Phase 2: Data & APIs', items: ['Fetch data in server and client contexts.', 'Build API routes or server actions where appropriate.'] },
      { title: 'Phase 3: Auth & Performance', items: ['Handle auth flows, metadata, caching, and optimization.', 'Understand deployment concerns and environment setup.'] },
      { title: 'Phase 4: Full Projects', items: ['Build one production-style app with dashboard and data flow.', 'Deploy and tune performance and UX.'] },
    ],
    platforms: [
      { name: 'Next.js Docs', focus: 'Official framework learning path.' },
      { name: 'Vercel Learn', focus: 'Hands-on Next.js tutorials.' },
      { name: 'Frontend Mentor', focus: 'Project ideas to implement with Next.js.' },
    ],
    videos: [
      { title: 'Next.js Full Course', creator: 'freeCodeCamp', focus: 'Strong beginner start.' },
      { title: 'Next.js App Router Tutorial', creator: 'Codevolution / official ecosystem channels', focus: 'Modern patterns.' },
      { title: 'Build a Full Stack Next App', creator: 'JavaScript Mastery', focus: 'Project-driven learning.' },
    ],
    mockTopics: ['routing', 'rendering modes', 'data fetching', 'deployment'],
  }),
  'rest-api-design': buildRoadmap({
    track: 'APIs',
    title: 'REST API Design',
    summary: 'Learn how to design clean API resources, routes, payloads, and contracts that scale well.',
    phases: [
      { title: 'Phase 1: REST Principles', items: ['Understand resources, methods, endpoints, status codes, and naming.', 'Learn idempotency and statelessness basics.'] },
      { title: 'Phase 2: API Contracts', items: ['Design request and response payloads clearly.', 'Handle filtering, pagination, sorting, and versioning.'] },
      { title: 'Phase 3: Error Handling & Security', items: ['Return useful errors and validation feedback.', 'Apply auth, rate limiting, and safe defaults.'] },
      { title: 'Phase 4: Documentation & Practice', items: ['Document APIs with examples and test edge cases.', 'Build one cleanly designed CRUD or service API.'] },
    ],
    platforms: [
      { name: 'Postman', focus: 'Testing endpoints and documenting requests.' },
      { name: 'Swagger / OpenAPI', focus: 'API contract and documentation learning.' },
      { name: 'RESTful API design guides', focus: 'Naming and consistency best practices.' },
    ],
    videos: [
      { title: 'REST API Design Best Practices', creator: 'Web Dev Simplified', focus: 'Clean API thinking.' },
      { title: 'Build REST APIs', creator: 'freeCodeCamp', focus: 'Practical implementation.' },
      { title: 'API Design Explained', creator: 'Hussein Nasser / backend channels', focus: 'System-level reasoning.' },
    ],
    mockTopics: ['HTTP methods', 'status codes', 'pagination', 'API contracts'],
  }),
  'authentication-apis': buildRoadmap({
    track: 'APIs',
    title: 'Authentication APIs',
    summary: 'Build secure login and protected API flows using tokens, sessions, roles, and validation.',
    phases: [
      { title: 'Phase 1: Auth Basics', items: ['Understand authentication vs authorization.', 'Learn sessions, JWTs, refresh tokens, and cookies.'] },
      { title: 'Phase 2: Protected Routes', items: ['Implement signup, login, logout, and current-user endpoints.', 'Add middleware to verify access and roles.'] },
      { title: 'Phase 3: Security Practices', items: ['Hash passwords, validate input, and protect secrets.', 'Handle expiration, refresh flow, and common attack surfaces.'] },
      { title: 'Phase 4: Real Integration', items: ['Connect auth APIs to frontend apps cleanly.', 'Test auth edge cases and error flows thoroughly.'] },
    ],
    platforms: [
      { name: 'Postman', focus: 'Testing protected requests and auth headers.' },
      { name: 'Auth0 Learning', focus: 'Modern authentication concepts.' },
      { name: 'OWASP', focus: 'Security awareness and common auth risks.' },
    ],
    videos: [
      { title: 'JWT Authentication Tutorial', creator: 'Traversy Media', focus: 'Token-based auth implementation.' },
      { title: 'Authentication vs Authorization', creator: 'Web Dev Simplified', focus: 'Conceptual clarity.' },
      { title: 'Secure Login API', creator: 'freeCodeCamp', focus: 'Complete auth flow practice.' },
    ],
    mockTopics: ['JWT', 'sessions', 'password hashing', 'role-based access'],
  }),
  'third-party-integrations': buildRoadmap({
    track: 'APIs',
    title: 'Third-Party Integrations',
    summary: 'Learn how to connect your application with payment, auth, maps, AI, and external platforms.',
    phases: [
      { title: 'Phase 1: API Consumption Basics', items: ['Understand API keys, headers, rate limits, and request patterns.', 'Practice reading docs and testing third-party APIs.'] },
      { title: 'Phase 2: Integration Patterns', items: ['Connect payments, emails, maps, or AI APIs into simple flows.', 'Handle async responses and service failures.'] },
      { title: 'Phase 3: Reliability & Security', items: ['Store secrets safely and protect external credentials.', 'Add retries, fallbacks, and logging for external calls.'] },
      { title: 'Phase 4: Product Use Cases', items: ['Ship one project using at least one external integration.', 'Document setup and debugging steps clearly.'] },
    ],
    platforms: [
      { name: 'Postman', focus: 'Trying third-party APIs quickly.' },
      { name: 'RapidAPI', focus: 'Exploring many integration examples.' },
      { name: 'Provider Docs', focus: 'Official setup instructions and constraints.' },
    ],
    videos: [
      { title: 'Working with Third Party APIs', creator: 'freeCodeCamp', focus: 'General API consumption practice.' },
      { title: 'API Integration Tutorial', creator: 'Web Dev Simplified', focus: 'Using external services in apps.' },
      { title: 'Stripe / Maps / AI API walkthroughs', creator: 'provider ecosystem channels', focus: 'Specific integration patterns.' },
    ],
    mockTopics: ['API keys', 'rate limiting', 'error handling', 'integration debugging'],
  }),
  'testing-apis': buildRoadmap({
    track: 'APIs',
    title: 'Testing APIs',
    summary: 'Learn how to validate API behavior, edge cases, authentication, and reliability before shipping.',
    phases: [
      { title: 'Phase 1: API Test Basics', items: ['Understand request/response assertions and status code validation.', 'Use tools like Postman or Thunder Client for manual testing.'] },
      { title: 'Phase 2: Test Coverage', items: ['Write tests for CRUD flows, validation, auth, and error cases.', 'Cover edge cases and negative scenarios.'] },
      { title: 'Phase 3: Automation', items: ['Use test frameworks to automate API checks.', 'Run tests inside CI pipelines.'] },
      { title: 'Phase 4: Reliability', items: ['Measure response correctness and consistency across environments.', 'Document test cases and debugging steps.'] },
    ],
    platforms: [
      { name: 'Postman', focus: 'Manual and scripted API testing.' },
      { name: 'Jest / Supertest', focus: 'Automated backend API tests.' },
      { name: 'GitHub Actions', focus: 'Running tests in CI.' },
    ],
    videos: [
      { title: 'API Testing with Postman', creator: 'freeCodeCamp', focus: 'Postman assertions and collections.' },
      { title: 'Testing Express APIs', creator: 'Web Dev Simplified', focus: 'Automation with test frameworks.' },
      { title: 'Backend Testing Tutorial', creator: 'Traversy Media', focus: 'Real app test coverage.' },
    ],
    mockTopics: ['status codes', 'edge cases', 'auth testing', 'automation'],
  }),
  'relational-databases': buildRoadmap({
    track: 'Database',
    title: 'Relational Databases',
    summary: 'Learn structured data modeling, SQL relationships, and schema thinking for application backends.',
    phases: [
      { title: 'Phase 1: Relational Basics', items: ['Understand tables, primary keys, foreign keys, and normalization.', 'Learn how structured data is organized.'] },
      { title: 'Phase 2: SQL Operations', items: ['Practice joins, filters, inserts, updates, and deletes.', 'Query across related entities confidently.'] },
      { title: 'Phase 3: Design & Constraints', items: ['Model schemas, relationships, and integrity constraints.', 'Understand transactions and consistency basics.'] },
      { title: 'Phase 4: Application Usage', items: ['Connect relational databases to backend apps.', 'Build one project with meaningful schema design.'] },
    ],
    platforms: [
      { name: 'PostgreSQL Docs', focus: 'Official relational database reference.' },
      { name: 'SQLBolt', focus: 'Interactive SQL learning.' },
      { name: 'Mode SQL Tutorial', focus: 'Applied data querying practice.' },
    ],
    videos: [
      { title: 'Database Design Course', creator: 'freeCodeCamp', focus: 'Schema and relationship basics.' },
      { title: 'PostgreSQL Tutorial', creator: 'Programming with Mosh / database channels', focus: 'Hands-on relational database usage.' },
      { title: 'SQL Joins Explained', creator: 'Khan Academy / Alex The Analyst', focus: 'Core relational querying.' },
    ],
    mockTopics: ['normalization', 'joins', 'constraints', 'transactions'],
  }),
  'nosql-databases': buildRoadmap({
    track: 'Database',
    title: 'NoSQL Databases',
    summary: 'Understand flexible-schema data storage, document models, and NoSQL use cases in modern products.',
    phases: [
      { title: 'Phase 1: NoSQL Basics', items: ['Learn document, key-value, and column-family database categories.', 'Compare NoSQL tradeoffs with relational systems.'] },
      { title: 'Phase 2: Data Modeling', items: ['Design documents and collections based on query patterns.', 'Understand embedding vs referencing decisions.'] },
      { title: 'Phase 3: Querying & Scaling', items: ['Practice filters, indexing, aggregation, and performance basics.', 'Understand replication and scaling ideas conceptually.'] },
      { title: 'Phase 4: App Integration', items: ['Use a NoSQL database in one backend or MERN project.', 'Document where NoSQL fits best.'] },
    ],
    platforms: [
      { name: 'MongoDB University', focus: 'Excellent NoSQL learning path.' },
      { name: 'Firebase Docs', focus: 'Realtime and document database concepts.' },
      { name: 'GeeksforGeeks', focus: 'Concept explanations and comparisons.' },
    ],
    videos: [
      { title: 'NoSQL Databases Explained', creator: 'freeCodeCamp / Fireship', focus: 'Beginner conceptual clarity.' },
      { title: 'MongoDB Crash Course', creator: 'Traversy Media', focus: 'Document database practice.' },
      { title: 'NoSQL vs SQL', creator: 'Hussein Nasser / backend channels', focus: 'Architecture tradeoffs.' },
    ],
    mockTopics: ['document modeling', 'embedding vs referencing', 'indexing', 'use cases'],
  }),
  'query-optimization': buildRoadmap({
    track: 'Database',
    title: 'Query Optimization',
    summary: 'Learn how to make queries faster through indexing, execution plans, and better data access patterns.',
    phases: [
      { title: 'Phase 1: Performance Basics', items: ['Understand why queries slow down: scans, joins, and bad filters.', 'Learn latency, throughput, and bottleneck thinking.'] },
      { title: 'Phase 2: Indexing', items: ['Study single-column, compound, and covering indexes.', 'Know when indexes help and when they hurt writes.'] },
      { title: 'Phase 3: Query Plans', items: ['Read explain plans and identify expensive operations.', 'Rewrite queries for better efficiency.'] },
      { title: 'Phase 4: Practical Tuning', items: ['Optimize one real schema or reporting query set.', 'Measure before and after improvements.'] },
    ],
    platforms: [
      { name: 'PostgreSQL Explain Docs', focus: 'Understanding execution plans.' },
      { name: 'Use The Index, Luke!', focus: 'Great SQL performance explanations.' },
      { name: 'DB vendor docs', focus: 'Engine-specific tuning guidance.' },
    ],
    videos: [
      { title: 'SQL Optimization Tutorial', creator: 'freeCodeCamp / database channels', focus: 'Index and query tuning basics.' },
      { title: 'How Indexes Work', creator: 'Hussein Nasser', focus: 'Deep conceptual clarity.' },
      { title: 'Execution Plans Explained', creator: 'database educators', focus: 'Reading plans practically.' },
    ],
    mockTopics: ['indexes', 'execution plans', 'query rewriting', 'performance tradeoffs'],
  }),
  'database-design': buildRoadmap({
    track: 'Database',
    title: 'Database Design',
    summary: 'Learn how to model entities, relationships, constraints, and schemas for real product workflows.',
    phases: [
      { title: 'Phase 1: Requirements to Entities', items: ['Translate product requirements into entities and fields.', 'Identify one-to-one, one-to-many, and many-to-many relationships.'] },
      { title: 'Phase 2: Schema Planning', items: ['Define keys, constraints, normalization, and data ownership.', 'Think through read and write patterns.'] },
      { title: 'Phase 3: Tradeoff Decisions', items: ['Choose between relational and NoSQL models appropriately.', 'Balance flexibility, consistency, and performance.'] },
      { title: 'Phase 4: Real Designs', items: ['Design schemas for auth, e-commerce, or dashboard-style apps.', 'Review and improve schema quality over iterations.'] },
    ],
    platforms: [
      { name: 'dbdiagram', focus: 'Visual schema modeling practice.' },
      { name: 'Lucidchart / ERD tools', focus: 'Entity relationship planning.' },
      { name: 'Database design guides', focus: 'Schema design patterns and best practices.' },
    ],
    videos: [
      { title: 'Database Design Tutorial', creator: 'freeCodeCamp', focus: 'ERD and schema basics.' },
      { title: 'How to Design a Database', creator: 'Kudvenkat / database channels', focus: 'Requirement-to-schema flow.' },
      { title: 'ER Diagram Explained', creator: 'education channels', focus: 'Entity relationship thinking.' },
    ],
    mockTopics: ['ER modeling', 'normalization', 'schema tradeoffs', 'real-world modeling'],
  }),
};

export const getSkillRoadmap = (skillId, level) => {
  const roadmap = SKILL_ROADMAPS[skillId];

  if (!roadmap) {
    return undefined;
  }

  return buildProgrammingLanguageRoadmap(roadmap, level);
};
