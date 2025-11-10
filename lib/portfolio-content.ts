// Portfolio content organized for RAG embedding
export const portfolioContent = [
  // About/Intro
  {
    category: 'about',
    title: 'Introduction',
    text: `Niño Marcos is an IT student specializing in full-stack web development. 
    He is passionate about building modern, scalable web applications using cutting-edge technologies.
    Currently studying Bachelor of Science in Information Technology, expected graduation 2027.
    Email: justinpmarcos@gmail.com
    GitHub: marcos-njp
    LinkedIn: niño-marcos`
  },
  
  // Skills - Languages
  {
    category: 'skills',
    title: 'Programming Languages',
    text: `Niño Marcos is proficient in multiple programming languages including:
    - JavaScript/TypeScript: Advanced level, used for both frontend and backend development
    - Python: Intermediate level, used for data analysis and automation
    - Java: Intermediate level, object-oriented programming
    - SQL: Database queries and management
    - HTML/CSS: Expert level for web markup and styling`
  },
  
  // Skills - Frontend
  {
    category: 'skills',
    title: 'Frontend Development',
    text: `Frontend technologies and frameworks Niño works with:
    - React.js: Component-based UI development
    - Next.js: Server-side rendering and static site generation
    - Tailwind CSS: Utility-first CSS framework for styling
    - shadcn/ui: Accessible component library
    - Framer Motion: Animation library for smooth transitions
    - Responsive Design: Mobile-first approach`
  },
  
  // Skills - Backend
  {
    category: 'skills',
    title: 'Backend Development',
    text: `Backend technologies Niño uses:
    - Node.js: JavaScript runtime for server-side applications
    - Next.js API Routes: Serverless API endpoints
    - PostgreSQL: Relational database management
    - Neon Database: Serverless Postgres
    - Prisma: Modern ORM for database operations
    - RESTful APIs: API design and implementation`
  },
  
  // Skills - Tools
  {
    category: 'skills',
    title: 'Development Tools',
    text: `Tools and platforms Niño uses for development:
    - Git & GitHub: Version control and collaboration
    - VS Code: Primary code editor
    - Vercel: Deployment platform for web applications
    - Figma: Design and prototyping
    - Postman: API testing
    - Chrome DevTools: Debugging and optimization`
  },
  
  // Project 1
  {
    category: 'projects',
    title: 'Person Search Project',
    text: `Person Search is a comprehensive search application deployed at https://person-search-main-project.vercel.app/.
    This project demonstrates Niño's ability to build functional search interfaces.
    Technologies used include modern web frameworks and responsive design principles.
    The application allows users to efficiently search and filter through person data.
    Live demo available at the provided URL.`
  },
  
  // Project 2
  {
    category: 'projects',
    title: 'My CV Project',
    text: `My CV is an interactive curriculum vitae web application deployed at https://my-cv-main-project.vercel.app/.
    This project showcases Niño's frontend development skills and design sensibilities.
    Built with modern web technologies for optimal performance and user experience.
    Features include interactive elements and responsive layout that works across all devices.
    The CV presents professional information in an engaging, modern format.`
  },
  
  // Experience
  {
    category: 'experience',
    title: 'Current Status and Competitions',
    text: `Niño Marcos is currently an IT Student actively learning and building projects.
    
    Competition Achievements:
    - STEAM Fest Robotics Competition 2018: 4th place winner
    - Robothon National Robotics Competition 2018: 5th place winner
    
    These competitions demonstrate problem-solving skills, teamwork, and technical expertise in robotics and engineering.`
  },
  
  // Education - Current
  {
    category: 'education',
    title: 'Higher Education',
    text: `Niño Marcos is currently pursuing a Bachelor of Science in Information Technology (BSIT).
    Period: 2023 - Present (Expected graduation: 2027)
    Focus: Full-stack web development, database management, software engineering
    Currently building practical projects and gaining hands-on experience with modern web technologies.`
  },
  
  // Education - Previous
  {
    category: 'education',
    title: 'Basic Education',
    text: `Completed Basic Education from 2016 to 2020.
    This foundational education provided the groundwork for pursuing higher education in technology.
    Developed early interest in computer science and programming during this period.`
  },
  
  // Portfolio Website
  {
    category: 'projects',
    title: 'Portfolio Website',
    text: `This portfolio website showcases Niño Marcos' work and skills.
    Built with Next.js 15, React 19, TypeScript, and Tailwind CSS.
    Features include:
    - Responsive design that works on all devices
    - Dark/light theme toggle for user preference
    - Project showcase with live demos
    - Interactive AI chat assistant (you!)
    - Contact form for inquiries
    - Modern, minimalist design aesthetic
    
    The site demonstrates proficiency in modern web development practices including:
    - Server-side rendering with Next.js
    - Component-based architecture with React
    - Type safety with TypeScript
    - Utility-first CSS with Tailwind
    - AI integration with OpenAI and Vercel AI SDK
    - Vector database integration with Upstash`
  },
  
  // Contact Information
  {
    category: 'contact',
    title: 'How to Contact Niño',
    text: `You can reach Niño Marcos through:
    - Email: justinpmarcos@gmail.com
    - GitHub: github.com/marcos-njp
    - LinkedIn: linkedin.com/in/niño-marcos
    
    He is open to collaboration opportunities, freelance work, and full-time positions.
    Feel free to reach out for project inquiries or professional networking.`
  }
];

// Helper function to get all text content for embedding
export function getAllPortfolioText(): string {
  return portfolioContent.map(item => item.text).join('\n\n');
}

// Helper function to get content by category
export function getContentByCategory(category: string) {
  return portfolioContent.filter(item => item.category === category);
}
