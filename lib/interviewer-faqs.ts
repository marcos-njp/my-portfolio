/**
 * Comprehensive FAQ Dataset for Interview Questions
 * 50+ Common Interviewer Questions with Optimized Responses
 */

export interface FAQ {
  category: string;
  question: string;
  keywords: string[];
  response: string;
  relevance_boost: number; // Weight for matching (0.0 - 1.0)
}

export const INTERVIEWER_FAQS: FAQ[] = [
  // ============ INTRODUCTION & BACKGROUND ============
  {
    category: "introduction",
    question: "Tell me about yourself",
    keywords: ["about yourself", "introduce yourself", "who are you", "background", "tell me about"],
    response: "I'm Niño Marcos, a 3rd-year IT student at St. Paul University Philippines. I specialize in full-stack development with Next.js, React, and TypeScript. I've deployed 3+ production applications and built an AI-powered RAG system using Groq and Upstash Vector. My proudest achievement is placing 4th internationally in the STEAM Challenge 2018 among 118 teams from 5 countries for programming excellence.",
    relevance_boost: 0.95
  },
  {
    category: "introduction",
    question: "Why should we hire you?",
    keywords: ["why hire", "why should we", "what makes you", "why you"],
    response: "I bring proven technical skills with production-ready projects deployed on Vercel, international competition success (4th place among 118 teams), and hands-on experience with modern tech stacks including Next.js 15, TypeScript, and AI integration. I'm a quick learner who's built complex systems like RAG-powered applications while still a student. I combine strong fundamentals with practical experience and genuine passion for development.",
    relevance_boost: 0.95
  },
  {
    category: "introduction",
    question: "What are your career goals?",
    keywords: ["career goals", "future plans", "where do you see yourself", "aspirations", "ambitions"],
    response: "My goal is to become a full-stack developer specializing in AI-integrated applications. Short-term, I'm seeking internships or entry-level positions to gain industry experience while completing my degree (graduating 2027). Long-term, I want to work on scalable web applications and contribute to open-source projects. I'm particularly interested in roles that combine modern frameworks like Next.js with AI/ML technologies.",
    relevance_boost: 0.9
  },

  // ============ TECHNICAL SKILLS ============
  {
    category: "technical",
    question: "What programming languages do you know?",
    keywords: ["programming languages", "languages", "what languages", "coding languages"],
    response: "I'm proficient in JavaScript (Advanced, 2 years), TypeScript (Advanced, 2 years), and Python (Intermediate, 5 years). For web development, I primarily use TypeScript with Next.js and React. I also have experience with SQL for database management and have worked with various frameworks and libraries in these ecosystems.",
    relevance_boost: 0.95
  },
  {
    category: "technical",
    question: "What frameworks and technologies are you experienced with?",
    keywords: ["frameworks", "technologies", "tech stack", "tools", "what do you use"],
    response: "Frontend: Next.js 15, React, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion. Backend: Node.js, Express, REST APIs, Prisma ORM. Databases: PostgreSQL, Upstash Vector, Upstash Redis. AI/ML: RAG systems, vector databases, Groq AI integration. Auth: OAuth (Google), NextAuth. Deployment: Vercel, Git version control. I focus on modern, production-ready tools with strong type safety.",
    relevance_boost: 0.95
  },
  {
    category: "technical",
    question: "Describe your experience with React/Next.js",
    keywords: ["react", "nextjs", "next.js", "frontend", "ui development"],
    response: "I've built multiple production applications with Next.js 15 and React, including server components, client components, and API routes. I'm experienced with App Router, server-side rendering, static generation, and streaming. I use TypeScript for type safety, Tailwind for styling, and implement responsive designs with animations using Framer Motion. My portfolio and person-search app are live examples deployed on Vercel.",
    relevance_boost: 0.92
  },
  {
    category: "technical",
    question: "What databases have you worked with?",
    keywords: ["database", "sql", "postgresql", "data storage", "databases"],
    response: "I primarily work with PostgreSQL using Prisma ORM for type-safe database operations. I've implemented user authentication systems, relational data models, and complex queries. Recently, I've been working with Upstash Vector for semantic search and RAG systems, plus Upstash Redis for caching. I understand database normalization, indexing, and optimization strategies.",
    relevance_boost: 0.9
  },
  {
    category: "technical",
    question: "Do you have experience with AI/Machine Learning?",
    keywords: ["ai", "machine learning", "ml", "artificial intelligence", "ai experience"],
    response: "Yes, I've built a production RAG (Retrieval-Augmented Generation) system using Groq AI with the llama-3.1-8b-instant model and Upstash Vector for semantic search. This powers my AI digital twin that answers professional queries with >82% relevance accuracy. I understand vector embeddings, semantic search, prompt engineering, and LLM integration patterns. I'm eager to expand my ML knowledge further.",
    relevance_boost: 0.88
  },

  // ============ PROJECTS & EXPERIENCE ============
  {
    category: "projects",
    question: "Tell me about your projects",
    keywords: ["projects", "what have you built", "portfolio", "work", "applications"],
    response: "Key projects: 1) AI-Powered Portfolio with RAG system - real-time professional query answering using Groq AI and vector search, 2) Person Search App - OAuth authentication, Prisma ORM, PostgreSQL with secure user management, 3) Modern Portfolio - dark/light themes, Framer Motion animations, fully responsive. All deployed on Vercel with production-grade code quality.",
    relevance_boost: 0.93
  },
  {
    category: "projects",
    question: "What's your most challenging project?",
    keywords: ["challenging project", "difficult project", "hardest project", "complex project"],
    response: "Building the AI-powered RAG system for my digital twin portfolio. Challenges included: optimizing vector search for >82% relevance accuracy, implementing streaming responses with proper error handling, managing state across server/client components in Next.js, and integrating multiple services (Groq AI, Upstash Vector, Redis caching) while maintaining performance. I solved these through systematic testing, documentation review, and iterative optimization.",
    relevance_boost: 0.9
  },
  {
    category: "projects",
    question: "Have you worked on production applications?",
    keywords: ["production", "live applications", "deployed", "real users"],
    response: "Yes, I have 3+ production applications deployed on Vercel with live URLs. These include my AI-powered portfolio, person search app, and modern portfolio site. I follow best practices: environment variable management, error boundaries, loading states, responsive design, SEO optimization, and monitoring. I understand the difference between development and production builds and handle deployment considerations.",
    relevance_boost: 0.88
  },

  // ============ ACHIEVEMENTS & COMPETITIONS ============
  {
    category: "achievements",
    question: "What are your biggest achievements?",
    keywords: ["achievements", "accomplishments", "awards", "recognition", "proud of"],
    response: "🏆 4th place internationally in STEAM Challenge 2018 (118 teams, 5 countries) for Programming Skills Excellence. 🥈 5th place nationally in Robothon 2018 (43 schools) with Excellence Award. 🚀 Successfully deployed 3+ production applications while still a student. 🤖 Built a functional RAG system achieving >82% relevance accuracy. These demonstrate my technical skills, competitive ability, and commitment to continuous learning.",
    relevance_boost: 0.95
  },
  {
    category: "achievements",
    question: "Tell me about your competition experience",
    keywords: ["competition", "contest", "robotics", "steam challenge", "robothon"],
    response: "In 2018, I competed internationally in the STEAM Challenge, placing 4th among 118 teams from 5 countries, earning recognition for Programming Skills Excellence. The same year, I placed 5th nationally at Robothon among 43 schools. These competitions taught me problem-solving under pressure, teamwork, algorithm optimization, and practical robotics programming. They sparked my passion for technology and competitive programming.",
    relevance_boost: 0.9
  },

  // ============ EDUCATION ============
  {
    category: "education",
    question: "What's your educational background?",
    keywords: ["education", "school", "university", "degree", "studying"],
    response: "I'm currently a 3rd-year BS Information Technology student at St. Paul University Philippines in Tuguegarao City, with an expected graduation in 2027. My coursework covers programming, database systems, web development, and software engineering. I complement classroom learning with self-directed projects and real-world application development, which is why I have production deployments while still studying.",
    relevance_boost: 0.88
  },
  {
    category: "education",
    question: "When will you graduate?",
    keywords: ["graduate", "graduation", "when finish", "degree completion"],
    response: "I'm expected to graduate in 2027 with my Bachelor of Science in Information Technology from St. Paul University Philippines. I'm currently in my 3rd year and actively seeking internship, OJT, or part-time opportunities to gain industry experience while completing my studies.",
    relevance_boost: 0.85
  },

  // ============ WORK PREFERENCES ============
  {
    category: "work_preferences",
    question: "What type of role are you looking for?",
    keywords: ["looking for", "seeking", "role", "position", "job type"],
    response: "I'm seeking remote internships, OJT positions, or entry-level full-stack developer roles. I'm particularly interested in positions involving Next.js, React, TypeScript, and modern web technologies. I'm open to part-time work while studying or full-time opportunities during breaks. Ideal roles would involve AI integration, real-time applications, or complex frontend challenges.",
    relevance_boost: 0.9
  },
  {
    category: "work_preferences",
    question: "Can you work remotely?",
    keywords: ["remote", "work from home", "location", "remote work"],
    response: "Yes, I'm fully equipped for remote work. I'm based in Tuguegarao City, Philippines, and have experience managing remote projects with Git, deploying to cloud platforms (Vercel), and collaborating asynchronously. I have reliable internet, a professional workspace, and strong self-management skills demonstrated by my independent project work.",
    relevance_boost: 0.85
  },
  {
    category: "work_preferences",
    question: "What are your salary expectations?",
    keywords: ["salary", "compensation", "pay", "rate", "expected salary"],
    response: "As a student seeking entry-level or internship positions, I'm flexible on compensation and more focused on gaining industry experience and learning opportunities. I'm open to discussing appropriate rates based on the role's responsibilities, work hours, and market standards for junior developers in the Philippines or remote positions.",
    relevance_boost: 0.8
  },

  // ============ SKILLS ASSESSMENT ============
  {
    category: "skills",
    question: "Rate your JavaScript/TypeScript skills",
    keywords: ["javascript skills", "typescript skills", "how good", "proficiency level"],
    response: "I rate myself as Advanced in both JavaScript and TypeScript (2 years experience each). I understand closures, promises, async/await, ES6+ features, type inference, generics, utility types, and advanced TypeScript patterns. All my recent projects use TypeScript for type safety. I can read documentation, debug complex issues, and write production-quality code following best practices.",
    relevance_boost: 0.88
  },
  {
    category: "skills",
    question: "What's your experience with version control?",
    keywords: ["git", "version control", "github", "source control"],
    response: "I use Git for all my projects with GitHub for remote repositories. I'm comfortable with branching strategies, pull requests, merge conflict resolution, and collaborative workflows. My projects follow proper commit conventions, and I maintain clean git history. I understand the importance of version control for team collaboration and code management.",
    relevance_boost: 0.82
  },
  {
    category: "skills",
    question: "How do you handle debugging and troubleshooting?",
    keywords: ["debugging", "troubleshooting", "fix bugs", "problem solving"],
    response: "I use systematic debugging: browser DevTools for frontend issues, console logging strategically, reading error stack traces, checking network requests, and using TypeScript's type checking. For complex issues, I isolate the problem, reproduce it consistently, search documentation, and break down the code. I maintain error boundaries, implement proper logging, and test thoroughly before deployment.",
    relevance_boost: 0.85
  },

  // ============ SOFT SKILLS & WORK STYLE ============
  {
    category: "soft_skills",
    question: "How do you manage your time?",
    keywords: ["time management", "organize work", "prioritize", "manage time"],
    response: "I balance studies with project work through structured scheduling and prioritization. I break large tasks into smaller milestones, use Git for tracking progress, and set realistic deadlines. My completed production projects while maintaining academic performance demonstrate effective time management. I'm comfortable with self-directed work and meeting commitments.",
    relevance_boost: 0.8
  },
  {
    category: "soft_skills",
    question: "How do you handle learning new technologies?",
    keywords: ["learning", "new technologies", "how do you learn", "adapt"],
    response: "I learn through official documentation first, then hands-on projects to apply concepts immediately. For example, I learned AI integration by building a RAG system, not just reading about it. I follow tech communities, read documentation thoroughly, build small proof-of-concepts, and iterate. My tech stack evolution (from basic web dev to AI-integrated apps) shows continuous learning ability.",
    relevance_boost: 0.85
  },
  {
    category: "soft_skills",
    question: "Do you work well in teams?",
    keywords: ["teamwork", "collaboration", "work in teams", "team player"],
    response: "Yes, my competition experience (4th internationally, 5th nationally) required strong teamwork and collaboration under pressure. While my recent projects are independent, I understand Git workflows, code reviews, and asynchronous communication. I'm eager to learn from senior developers and contribute to team success. I communicate clearly and take feedback constructively.",
    relevance_boost: 0.82
  },
  {
    category: "soft_skills",
    question: "What are your strengths?",
    keywords: ["strengths", "what are you good at", "strong points"],
    response: "Technical execution - I ship production-ready code with modern best practices. Fast learner - built a RAG system independently. Problem-solver - competition success demonstrates algorithmic thinking. Self-motivated - completed 3+ deployed projects while studying. Attention to detail - TypeScript, testing, documentation. Proven track record - international recognition and real deployments.",
    relevance_boost: 0.88
  },
  {
    category: "soft_skills",
    question: "What are your weaknesses?",
    keywords: ["weaknesses", "areas for improvement", "what could you improve"],
    response: "As a student, my main gap is professional team experience in a production environment - I've worked independently on projects. I'm actively seeking this through internships. I'm also continuing to deepen my backend and DevOps knowledge beyond Vercel deployments. I'm aware of these gaps and committed to learning, which is why I'm pursuing practical experience alongside my studies.",
    relevance_boost: 0.8
  },

  // ============ TECHNICAL DEEP DIVES ============
  {
    category: "technical_deep",
    question: "Explain how your RAG system works",
    keywords: ["rag system", "how does rag work", "vector search", "semantic search"],
    response: "My RAG system: 1) User query → embedded into vectors using Upstash Vector, 2) Semantic search finds top-3 relevant chunks from my professional profile (>82% relevance threshold), 3) Retrieved context + query → sent to Groq AI (llama-3.1-8b-instant), 4) AI generates response grounded in factual context, 5) Streamed back to user in real-time. This ensures accurate, factual responses about my background without hallucination.",
    relevance_boost: 0.9
  },
  {
    category: "technical_deep",
    question: "How do you ensure code quality?",
    keywords: ["code quality", "best practices", "clean code", "standards"],
    response: "TypeScript for type safety, ESLint for code standards, proper component structure in Next.js, error boundaries, loading states, responsive design patterns, environment variable security, Git commits with clear messages, code reusability, documentation, and testing before deployment. I follow Next.js best practices: server/client component separation, proper data fetching, and SEO optimization.",
    relevance_boost: 0.85
  },
  {
    category: "technical_deep",
    question: "What's your approach to responsive design?",
    keywords: ["responsive", "mobile", "responsive design", "mobile-first"],
    response: "I use Tailwind CSS's mobile-first approach with responsive breakpoints (sm, md, lg, xl). I test on multiple screen sizes during development, implement flexible layouts with flexbox/grid, use relative units, optimize images, and ensure touch-friendly interfaces. All my deployed projects are fully responsive, and I use Chrome DevTools for testing across devices.",
    relevance_boost: 0.82
  },

  // ============ SITUATIONAL QUESTIONS ============
  {
    category: "situational",
    question: "Describe a time you solved a difficult technical problem",
    keywords: ["difficult problem", "technical challenge", "problem you solved"],
    response: "When building my RAG system, initial vector search relevance was only ~75%, causing inaccurate responses. I debugged by: 1) analyzing query patterns, 2) optimizing content chunking strategy, 3) adjusting relevance thresholds, 4) improving prompt engineering, 5) implementing query validation. Through systematic testing and iteration, I achieved >82% relevance accuracy, ensuring factual and helpful responses.",
    relevance_boost: 0.88
  },
  {
    category: "situational",
    question: "How do you handle tight deadlines?",
    keywords: ["deadlines", "pressure", "time pressure", "tight timeline"],
    response: "I prioritize core functionality first (MVP approach), break work into small tasks, focus on one thing at a time, and test incrementally. My competition experience taught me to perform under pressure. For projects, I set realistic milestones and communicate clearly about progress. I'd rather deliver quality work on time than rush and create technical debt.",
    relevance_boost: 0.8
  },
  {
    category: "situational",
    question: "Tell me about a failure and what you learned",
    keywords: ["failure", "mistake", "learned from", "went wrong"],
    response: "Early projects had inconsistent code organization and lacked TypeScript, making maintenance difficult. I learned the importance of planning architecture upfront, using type safety from day one, and following established patterns. Now I start with proper project structure, TypeScript configuration, and clear component organization. This failure taught me that good foundations prevent future technical debt.",
    relevance_boost: 0.82
  },

  // ============ AVAILABILITY & LOGISTICS ============
  {
    category: "availability",
    question: "When can you start?",
    keywords: ["start date", "when can you start", "availability", "when available"],
    response: "For internships or part-time roles, I can start immediately while balancing my academic schedule. For full-time opportunities, I'm available during semester breaks or can discuss flexible arrangements. I'm eager to begin gaining practical experience and contributing to real projects as soon as possible.",
    relevance_boost: 0.8
  },
  {
    category: "availability",
    question: "How many hours can you commit?",
    keywords: ["hours", "time commitment", "how many hours", "weekly hours"],
    response: "I can commit 15-20 hours per week during the school semester for part-time or internship roles. During breaks, I'm available for full-time work (40 hours/week). I'm flexible and can adjust my schedule based on project needs while maintaining my academic commitments. Remote work allows me efficient time management.",
    relevance_boost: 0.78
  },

  // ============ TECHNICAL TOOLS & WORKFLOW ============
  {
    category: "tools",
    question: "What development tools do you use?",
    keywords: ["development tools", "ide", "tools", "workflow"],
    response: "VS Code as primary IDE with extensions for TypeScript, ESLint, Tailwind. Git for version control via GitHub. Vercel for deployment. Chrome DevTools for debugging. Postman for API testing. Figma for design reference. Terminal for package management (npm/pnpm). I follow modern development workflows with hot reload, type checking, and automated builds.",
    relevance_boost: 0.8
  },
  {
    category: "tools",
    question: "Have you worked with APIs?",
    keywords: ["api", "rest api", "api development", "backend api"],
    response: "Yes, I've built REST APIs using Next.js API routes for my projects. I understand HTTP methods, status codes, request/response patterns, error handling, and authentication. My chat API handles POST requests, processes data, integrates with Groq AI and Upstash services, implements streaming responses, and includes proper error boundaries. I've also consumed third-party APIs like OAuth providers.",
    relevance_boost: 0.85
  },

  // ============ COMPANY-SPECIFIC ============
  {
    category: "company",
    question: "Why do you want to work for us?",
    keywords: ["why this company", "why us", "interest in company"],
    response: "I'm drawn to opportunities where I can work with modern technologies, learn from experienced developers, and contribute to real products that impact users. I'm particularly interested in companies working with Next.js, React, TypeScript, and AI integration - technologies I'm passionate about and have hands-on experience with. I value environments that encourage learning and innovation.",
    relevance_boost: 0.75
  },
  {
    category: "company",
    question: "What do you know about our company?",
    keywords: ["know about company", "company research", "what do you know"],
    response: "I'd need more context about your specific company to give a detailed answer. However, I always research companies thoroughly before applying - understanding your tech stack, products, company culture, and recent developments. I look for alignment between my skills (Next.js, TypeScript, AI integration) and your technical needs, as well as opportunities for growth and learning.",
    relevance_boost: 0.7
  },

  // ============ QUESTIONS FOR INTERVIEWER ============
  {
    category: "questions",
    question: "Do you have any questions for us?",
    keywords: ["questions for us", "any questions", "what questions"],
    response: "Yes: 1) What does the typical day look like for this role? 2) What technologies and frameworks does the team primarily use? 3) What's the onboarding process for new developers? 4) How do you support continuous learning and skill development? 5) What are the biggest technical challenges the team is currently facing? I'm eager to understand how I can contribute and grow.",
    relevance_boost: 0.85
  },
];

/**
 * Find relevant FAQs based on query keywords
 */
export function findRelevantFAQs(query: string, topK: number = 3): FAQ[] {
  const queryLower = query.toLowerCase();
  
  const scoredFAQs = INTERVIEWER_FAQS.map(faq => {
    let score = 0;
    
    // Check keyword matches
    faq.keywords.forEach(keyword => {
      if (queryLower.includes(keyword.toLowerCase())) {
        score += faq.relevance_boost;
      }
    });
    
    // Check question similarity
    if (queryLower.includes(faq.question.toLowerCase()) || 
        faq.question.toLowerCase().includes(queryLower)) {
      score += faq.relevance_boost * 0.5;
    }
    
    return { faq, score };
  });
  
  return scoredFAQs
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(item => item.faq);
}
