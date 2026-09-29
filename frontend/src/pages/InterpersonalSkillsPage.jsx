import { FaPeopleArrows } from 'react-icons/fa';
import SoftSkillsLearningPage from '../components/SoftSkillsLearningPage';

const topics = [
  {
    slug: 'teamwork',
    title: 'Teamwork and collaboration',
    overview: 'Learn how to make progress with others by sharing ownership, communicating early, and supporting the team goal.',
    practices: ['Agree on the shared outcome before dividing tasks.', 'State your progress and blockers early.', 'Offer help with a specific task instead of a vague promise.', 'Credit team members when describing a group result.'],
    activity: 'Think of a group project. List one responsibility you owned, one way you supported another person, and the team result.',
    phrase: 'I owned ____, and I coordinated with the team by ____. Together, we achieved ____.',
  },
  {
    slug: 'empathy',
    title: 'Empathy and perspective',
    overview: 'Practise understanding another person’s viewpoint before you react, especially when priorities or opinions differ.',
    practices: ['Ask what matters most to the other person before suggesting a solution.', 'Separate the person from the problem.', 'Use neutral language instead of blame.', 'Acknowledge a valid concern even when you disagree.'],
    activity: 'Recall a disagreement. Write the other person’s likely goal, concern, and constraint before writing your own response.',
    phrase: 'I can see why that approach matters to you. Could we also consider ____ so we address ____?',
  },
  {
    slug: 'feedback',
    title: 'Giving and receiving feedback',
    overview: 'Turn feedback into useful action by being specific, respectful, and open to learning.',
    practices: ['Describe the observed behaviour, not the person’s character.', 'Explain the impact before suggesting a change.', 'Ask for a specific example when receiving unclear feedback.', 'Thank the person and state the action you will take.'],
    activity: 'Give feedback on a teammate’s presentation using this pattern: observation, impact, suggestion. Then ask them for one improvement for you.',
    phrase: 'One thing that worked well was ____. One improvement that could make it stronger is ____.',
  },
  {
    slug: 'conflict-resolution',
    title: 'Conflict resolution',
    overview: 'Handle disagreement calmly by focusing on facts, shared goals, and next steps instead of trying to win an argument.',
    practices: ['Discuss the issue privately when possible.', 'Use “I” statements to explain your concern.', 'Identify the shared goal before comparing solutions.', 'End with a specific agreement and owner for the next step.'],
    activity: 'Practise a two-minute response to a teammate who missed a deadline. State the impact, ask what happened, and agree on the recovery plan.',
    phrase: 'I noticed ____. It affected ____. How can we adjust the plan so we can reach ____ together?',
  },
  {
    slug: 'adaptability',
    title: 'Adaptability and professionalism',
    overview: 'Show that you can respond constructively when plans change, feedback arrives, or a new responsibility appears.',
    practices: ['Clarify the new priority and deadline.', 'Identify what must change in your current plan.', 'Communicate trade-offs instead of silently dropping work.', 'Reflect on what you learned after the change.'],
    activity: 'Choose a time a plan changed unexpectedly. Describe your first action, how you communicated, and what you would repeat next time.',
    phrase: 'When the priority changed, I reassessed ____, communicated ____, and focused on ____.',
  },
];

const InterpersonalSkillsPage = ({ theme }) => (
  <SoftSkillsLearningPage theme={theme} title="Interpersonal skills" description="Choose a topic to build the collaboration, empathy, feedback, conflict-handling, and adaptability skills employers value." icon={FaPeopleArrows} topics={topics} />
);

export default InterpersonalSkillsPage;
