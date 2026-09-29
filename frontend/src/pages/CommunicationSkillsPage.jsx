import { FaComments } from 'react-icons/fa';
import SoftSkillsLearningPage from '../components/SoftSkillsLearningPage';

const topics = [
  {
    slug: 'active-listening',
    title: 'Active listening',
    overview: 'Learn to understand the whole question before answering, then show the speaker that you have heard their main point.',
    practices: ['Pause before responding instead of preparing your answer while the other person speaks.', 'Repeat the key point in your own words when a question is complex.', 'Ask one clarifying question when information is missing.', 'Use brief verbal signals without interrupting the flow.'],
    activity: 'Ask a friend to describe a project for one minute. Summarize their goal, challenge, and result in three sentences, then ask if your summary is accurate.',
    phrase: 'If I understand correctly, the main challenge was ___. I would approach it by ___.',
  },
  {
    slug: 'clear-speaking',
    title: 'Clear and concise speaking',
    overview: 'Make your ideas easy to follow by leading with the answer, using simple sentences, and ending with a clear takeaway.',
    practices: ['Start with your direct answer before adding background.', 'Use one main idea per sentence.', 'Replace filler words with a short silent pause.', 'End responses with the action, result, or learning.'],
    activity: 'Record a 60-second answer to “Tell me about your project.” Listen once and remove one repeated point, one filler word, and one unnecessary detail.',
    phrase: 'The key point is ___. I did this by ___. The result was ___.',
  },
  {
    slug: 'professional-introduction',
    title: 'Professional introduction',
    overview: 'Build a confident introduction that connects your background, strengths, current work, and goal in under one minute.',
    practices: ['Open with your name and current academic or professional context.', 'Mention one relevant strength or area of interest.', 'Use one project or achievement as evidence.', 'Finish by connecting your background to the opportunity.'],
    activity: 'Write a four-sentence introduction, then practise saying it without reading. Keep it between 45 and 60 seconds.',
    phrase: 'I am ___. I have been developing ___. Recently I ___. I am excited to contribute by ___.',
  },
  {
    slug: 'structured-answers',
    title: 'Structured interview answers',
    overview: 'Use a reliable answer structure so your response stays focused even when the question feels difficult.',
    practices: ['Use Situation, Task, Action, Result for experience-based questions.', 'Choose one example rather than listing many small examples.', 'Keep the situation short and spend most time on your actions.', 'Include a measurable or observable outcome whenever possible.'],
    activity: 'Choose a time you solved a problem in a group. Write four short STAR headings and add one sentence below each. Speak it aloud in two minutes.',
    phrase: 'The situation was ___. My responsibility was ___. I took these actions ___. As a result ___.',
  },
  {
    slug: 'questions-and-follow-ups',
    title: 'Questions and follow-ups',
    overview: 'Learn how to ask thoughtful questions that show curiosity, preparation, and professional judgement.',
    practices: ['Ask about the role, team, learning path, or success measures.', 'Build on something the interviewer has already mentioned.', 'Avoid questions that a quick website visit would answer.', 'Thank the interviewer and explain why the answer is useful to you.'],
    activity: 'Prepare three questions for a role you want. Label each as role, team, or growth, then practise asking them in a natural tone.',
    phrase: 'Could you share how success in this role is measured during the first few months?',
  },
];

const CommunicationSkillsPage = ({ theme }) => (
  <SoftSkillsLearningPage theme={theme} title="Communication skills" description="Choose a topic to practise clear speaking, attentive listening, structured answers, and confident interview conversations." icon={FaComments} topics={topics} />
);

export default CommunicationSkillsPage;
