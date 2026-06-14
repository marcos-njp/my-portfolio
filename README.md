# Niño Marcos Portfolio

An AI-powered digital twin portfolio featuring advanced conversational AI, RAG architecture, and dual personality modes. Built with Next.js 15, Groq AI, and modern web technologies.

## Quick Start

```bash
# Install dependencies
pnpm install

# Development server
pnpm dev

# Production build
pnpm build
pnpm start
```

Visit `http://localhost:3000`

## AI Digital Twin Features

### Dual Personality System
- **Professional Mode**: Formal, technical responses for business contexts
- **Gen-Z Mode**: Casual, modern communication with contemporary expressions
- Smart context switching based on conversation tone

### RAG Architecture
- **Semantic Search**: Vector-based content retrieval using Upstash Vector
- **Context Awareness**: Maintains conversation history and session memory
- **Smart Preprocessing**: Query validation and enhancement
- **Feedback Learning**: Continuous improvement through user interactions

### Advanced Chat Features
- **Session Management**: Persistent conversations with Redis
- **Suggested Questions**: Context-aware follow-up suggestions
- **Mood Detection**: Automatic personality adjustment
- **Knowledge Gap Detection**: Smart detection of unanswerable questions with graceful fallbacks
- **Error Handling**: Context-aware responses for missing information

## Tech Stack

### Core Framework
- **Next.js 15**: App Router with Turbopack for fast builds
- **React 19**: Latest features with Server Components
- **TypeScript**: Full type safety throughout

### AI & Database
- **Groq AI**: Lightning-fast inference with llama-3.3-70b-versatile
- **Upstash Vector**: Semantic search and RAG capabilities
- **Upstash Redis**: Session management and caching

### UI & Styling
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Modern component library
- **Framer Motion**: Smooth animations
- **Lucide Icons**: Beautiful icon set

### Development Tools
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **MCP Protocol**: Model Context Protocol integration

## Project Architecture

```
app/
├── actions/           # Server actions for AI interactions
├── api/              # API routes (chat, MCP transport)
├── docs/             # Documentation system
└── layout.tsx        # Root layout with providers

components/
├── ai-chat/          # Chat system components
│   ├── chat-input.tsx    # Message input with suggestions
│   ├── chat-message.tsx  # Message rendering
│   └── mood-selector.tsx # Personality mode switcher
├── docs/             # Documentation components
│   ├── common/           # Reusable doc components
│   └── sections/         # Documentation sections
└── ui/               # Base UI components (shadcn)

lib/
├── ai-moods.ts       # Personality system logic
├── chat-mcp.ts       # MCP protocol handling
├── rag-utils.ts      # RAG and vector operations
├── session-memory.ts # Session management
└── response-manager.ts # AI response processing

data/
├── digitaltwin.json  # Digital twin personality data
├── personality.json  # Mood and response templates
└── readmeData.md     # Vector database content
```

## Environment Setup

Create `.env.local` with required API keys:

```env
# Groq AI Configuration
GROQ_API_KEY=your_groq_api_key_here

# Upstash Vector Database
UPSTASH_VECTOR_REST_URL=https://your-vector-endpoint.upstash.io
UPSTASH_VECTOR_REST_TOKEN=your_vector_token_here

# Upstash Redis Cache
UPSTASH_REDIS_REST_URL=https://your-redis-endpoint.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token_here
```

### Getting API Keys
1. **Groq AI**: Sign up at [console.groq.com](https://console.groq.com)
2. **Upstash Vector**: Create database at [upstash.com/vector](https://upstash.com/vector)
3. **Upstash Redis**: Create database at [upstash.com/redis](https://upstash.com/redis)

## Data Management

### Vector Database Setup
```bash
# Update vector database with latest content
pnpm run update-vector
```

This script processes `data/readmeData.md` and populates the vector database for RAG functionality.

### Content Files
- **`digitaltwin.json`**: Core personality traits and background
- **`personality.json`**: Response templates and mood configurations
- **`readmeData.md`**: Knowledge base content for vector search

## Deployment

### Vercel (Recommended)
1. Fork this repository
2. Connect to Vercel dashboard
3. Add environment variables
4. Deploy with automatic CI/CD

### Custom Deployment
```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

### Environment Variables for Production
Ensure all environment variables are set in your deployment platform:
- Production: All 5 environment variables required
- Preview: Same as production for testing
- Development: Use `.env.local` for local development

## Key Features

### Intelligent Conversations
- Context-aware responses based on conversation history
- Personality consistency across sessions
- Smart follow-up question generation
- Semantic understanding of user intent

### Advanced Search
- Vector-based semantic search through portfolio content
- RAG (Retrieval Augmented Generation) for accurate responses
- Real-time content retrieval and synthesis
- Conversation memory for context retention

### Modern UI/UX
- Responsive design for all device sizes
- Dark/light mode with system preference detection
- Smooth animations and micro-interactions
- Accessible design following WCAG guidelines

### Performance
- Next.js 15 with Turbopack for fast builds
- Optimized bundle sizes with code splitting
- Edge runtime for global low latency
- Efficient caching strategies

## Documentation

- **[Full Documentation](/docs)**: Complete project documentation
- **[AI Setup Guide](agents.md)**: Detailed AI configuration
- **[Component Guide](/docs?section=lib-utilities)**: Reusable component library
- **[API Reference](/docs?section=operations)**: API endpoints and usage

## Contributing

This is a personal portfolio project, but feedback and suggestions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project as inspiration for your own portfolio.

---

**Built by Niño Marcos**  
*Showcasing modern web development and AI integration*
