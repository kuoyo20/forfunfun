import type { InterviewConfig, InterviewReport, Message } from "@/types/interview";

/**
 * AI API abstraction layer.
 *
 * Currently uses a smart simulation that adapts questions based on config.
 * To integrate a real AI backend, replace the implementations of
 * `fetchNextQuestion` and `fetchReport` with actual API calls.
 *
 * Example with a real backend:
 *   const res = await fetch("/api/interview/chat", {
 *     method: "POST",
 *     body: JSON.stringify({ config, messages }),
 *   });
 *   return res.json();
 */

const TOPIC_QUESTIONS: Record<string, string[]> = {
  JavaScript: [
    "Can you explain the difference between `var`, `let`, and `const`? When would you use each?",
    "How does the JavaScript event loop work? Can you walk me through the execution order of microtasks and macrotasks?",
    "What are closures and how have you used them in production code?",
  ],
  TypeScript: [
    "How do you use generics in TypeScript? Can you give an example of when they're essential?",
    "What's the difference between `interface` and `type` in TypeScript? When do you prefer one over the other?",
    "How do you handle strict null checks and what patterns do you use to deal with potentially undefined values?",
  ],
  React: [
    "Explain the React component lifecycle. How do hooks like `useEffect` map to class lifecycle methods?",
    "When would you use `useMemo` vs `useCallback`? Can you describe a real scenario where they made a difference?",
    "How do you manage state in large React applications? Compare the trade-offs of different approaches you've used.",
  ],
  "Node.js": [
    "How does Node.js handle concurrent requests despite being single-threaded?",
    "What strategies do you use for error handling in Express/Node.js applications?",
    "How would you design a Node.js application that needs to process thousands of messages per second?",
  ],
  "System Design": [
    "How would you design a URL shortening service like bit.ly? Walk me through the key components.",
    "Design a real-time notification system. What trade-offs would you consider?",
    "How would you scale a chat application to support millions of concurrent users?",
  ],
  "Data Structures": [
    "When would you choose a hash map over a balanced BST? What are the trade-offs?",
    "Explain how you'd implement an LRU cache. What data structures would you use?",
    "Describe a situation where choosing the right data structure significantly improved performance in your code.",
  ],
  Algorithms: [
    "Walk me through how you'd approach solving a dynamic programming problem. What's your thought process?",
    "When is BFS preferred over DFS, and vice versa? Give examples.",
    "How do you analyze the time and space complexity of your code? Can you give a recent example?",
  ],
  CSS: [
    "Explain the CSS box model. How does `box-sizing: border-box` change things?",
    "How do you decide between Flexbox and Grid? Can you describe a layout where Grid was clearly better?",
    "How do you approach responsive design? What's your strategy for handling different screen sizes?",
  ],
  Testing: [
    "What's your testing strategy? How do you decide what to unit test vs integration test vs e2e test?",
    "How do you test asynchronous code? What patterns do you use for mocking API calls?",
    "Describe a time when a test caught a critical bug before it reached production.",
  ],
  DevOps: [
    "How would you set up a CI/CD pipeline for a new project? What tools would you choose and why?",
    "How do you approach containerization? When is Docker overkill?",
    "What monitoring and observability tools have you used? How do you decide what to monitor?",
  ],
};

const DIFFICULTY_PREFIXES: Record<string, string> = {
  junior:
    "This is a foundational question. ",
  mid:
    "Let's go a bit deeper. ",
  senior:
    "I'd like to explore this at an architectural level. ",
};

const FOLLOW_UP_TEMPLATES = [
  "That's interesting. Can you give me a more concrete example from your experience?",
  "Good point. How would your approach change if the scale increased by 100x?",
  "I see. What would you do differently if you could start that project over?",
  "Can you walk me through the debugging process you'd use if that solution failed?",
  "How would you explain this concept to a junior developer on your team?",
  "What are the potential pitfalls of that approach, and how would you mitigate them?",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getQuestionPool(config: InterviewConfig): string[] {
  const pool: string[] = [];
  for (const topic of config.topics) {
    const questions = TOPIC_QUESTIONS[topic];
    if (questions) pool.push(...questions);
  }
  if (pool.length === 0) {
    pool.push(
      "Tell me about a challenging project you've worked on recently.",
      "How do you approach learning new technologies?",
      "Describe your ideal development workflow.",
    );
  }
  return pool;
}

function buildQuestion(
  config: InterviewConfig,
  questionPool: string[],
  askedQuestions: Set<string>,
  questionIndex: number,
  lastAnswer: string,
): string {
  // Every 2-3 questions, ask a follow-up based on the previous answer
  if (questionIndex > 1 && questionIndex % 3 === 0 && lastAnswer.length > 20) {
    return pickRandom(FOLLOW_UP_TEMPLATES);
  }

  // Pick an unasked question
  const available = questionPool.filter((q) => !askedQuestions.has(q));
  if (available.length === 0) {
    return pickRandom(FOLLOW_UP_TEMPLATES);
  }

  const question = pickRandom(available);
  askedQuestions.add(question);

  const prefix = DIFFICULTY_PREFIXES[config.difficulty] ?? "";
  return prefix + question;
}

// Track asked questions across the session
const sessionAskedQuestions = new Set<string>();
let sessionQuestionPool: string[] = [];

export function resetSession(): void {
  sessionAskedQuestions.clear();
  sessionQuestionPool = [];
}

export async function fetchNextQuestion(
  config: InterviewConfig,
  messages: Message[],
  questionIndex: number,
): Promise<string> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 700));

  if (sessionQuestionPool.length === 0) {
    sessionQuestionPool = getQuestionPool(config);
  }

  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const lastAnswer = lastUserMsg?.content ?? "";

  return buildQuestion(
    config,
    sessionQuestionPool,
    sessionAskedQuestions,
    questionIndex,
    lastAnswer,
  );
}

export function buildGreeting(config: InterviewConfig): string {
  const topicList = config.topics.join(", ");
  const diffLabel =
    config.difficulty === "junior"
      ? "entry-level"
      : config.difficulty === "mid"
        ? "mid-level"
        : "senior-level";

  return (
    `Hi! I'll be your interviewer today for the **${config.position}** position. ` +
    `We'll focus on ${topicList} at a ${diffLabel} difficulty. ` +
    `You have ${config.timeLimitMinutes} minutes and up to ${config.maxQuestions} questions.\n\n` +
    `Let's start — can you briefly introduce yourself and tell me what interests you about this role?`
  );
}

function pairQuestionsAndAnswers(
  messages: Message[],
): { question: string; answer: string }[] {
  const pairs: { question: string; answer: string }[] = [];
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].role === "assistant") {
      const nextUser = messages[i + 1];
      if (nextUser && nextUser.role === "user") {
        pairs.push({
          question: messages[i].content,
          answer: nextUser.content,
        });
      }
    }
  }
  return pairs;
}

function evaluateAnswer(answer: string, difficulty: string): { score: number; feedback: string } {
  const length = answer.length;
  const hasSpecificTerms = /example|project|implemented|built|designed|because|approach/i.test(answer);
  const hasNumbers = /\d/.test(answer);

  let baseScore: number;
  if (length < 30) {
    baseScore = 40 + Math.floor(Math.random() * 15);
  } else if (length < 100) {
    baseScore = 55 + Math.floor(Math.random() * 15);
  } else if (length < 300) {
    baseScore = 65 + Math.floor(Math.random() * 15);
  } else {
    baseScore = 75 + Math.floor(Math.random() * 15);
  }

  if (hasSpecificTerms) baseScore += 5;
  if (hasNumbers) baseScore += 3;

  const score = Math.min(100, baseScore);

  let feedback: string;
  if (score >= 85) {
    feedback = "Excellent answer with specific details and clear reasoning.";
  } else if (score >= 70) {
    feedback = "Good response. Adding more concrete examples would strengthen it.";
  } else if (score >= 55) {
    feedback = "Adequate answer, but lacks depth. Try to include specific experiences or technical details.";
  } else {
    feedback = "The answer is too brief. Elaborate with examples, trade-offs, and your reasoning process.";
  }

  if (difficulty === "senior" && score < 80) {
    feedback += " For a senior-level position, more architectural insight is expected.";
  }

  return { score, feedback };
}

export async function fetchReport(
  config: InterviewConfig,
  messages: Message[],
  durationSeconds: number,
): Promise<InterviewReport> {
  // Simulate processing
  await new Promise((resolve) => setTimeout(resolve, 1200 + Math.random() * 800));

  const pairs = pairQuestionsAndAnswers(messages);

  const questionBreakdown = pairs.map(({ question, answer }) => {
    const { score, feedback } = evaluateAnswer(answer, config.difficulty);
    return { question, answer, score, feedback };
  });

  const scores = questionBreakdown.map((q) => q.score);
  const overallScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

  const avgLength =
    pairs.length > 0
      ? pairs.reduce((sum, p) => sum + p.answer.length, 0) / pairs.length
      : 0;

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (overallScore >= 70) strengths.push("Demonstrates solid understanding of core concepts");
  if (avgLength > 150) strengths.push("Provides detailed and thorough responses");
  if (pairs.length >= config.maxQuestions * 0.8) strengths.push("Completed most of the interview questions");
  if (scores.some((s) => s >= 85)) strengths.push("Some answers showed exceptional depth");

  if (overallScore < 65) weaknesses.push("Overall responses need more technical depth");
  if (avgLength < 80) weaknesses.push("Answers tend to be too brief — aim for more detail");
  if (scores.some((s) => s < 50)) weaknesses.push("Some answers were significantly below expectations");
  if (durationSeconds < config.timeLimitMinutes * 60 * 0.3) {
    weaknesses.push("Finished very quickly — consider taking more time to think through answers");
  }

  if (strengths.length === 0) strengths.push("Showed willingness to attempt all questions");
  if (weaknesses.length === 0) weaknesses.push("Minor: could strengthen answers with more real-world examples");

  const recommendations = [
    "Practice the STAR method (Situation, Task, Action, Result) for behavioral questions",
    "Include specific metrics or outcomes when describing past projects",
    `Review ${config.topics[0] ?? "core"} fundamentals for stronger technical answers`,
  ];

  if (config.difficulty === "senior") {
    recommendations.push("Focus on architectural decision-making and trade-off analysis");
  }
  if (avgLength < 100) {
    recommendations.push("Aim for 3-5 sentences per answer to provide sufficient detail");
  }

  return {
    overallScore,
    strengths,
    weaknesses,
    recommendations,
    questionBreakdown,
  };
}
