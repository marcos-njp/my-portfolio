These are the setups, and specifications that I want you to make use of. 

use next js 15
use set shadcn
always use pnpm
keep code clean, avoid duplicate components, look if there are components that can be reusable, if none, then make one. (Refractors)
always npm run build
always npm run start

AI SETUP:
- Use Groq AI (NOT OpenAI) - faster and more cost-effective
- Model: llama-3.1-8b-instant for chat responses
- Upstash Vector for semantic search with RAG
- Upstash Redis for caching (optional)

Documentations you must read:
set up upstash db: https://upstash.com/docs/vector/sdks/ts/getting-started
redis: https://upstash.com/docs/redis/overall/getstarted
for the ai: https://ai-sdk.dev/docs/introduction
groq ai: https://ai-sdk.dev/providers/ai-sdk-providers/groq

The Task that we are going to accomplish comes from this workshop link (MUST READ:)
https://aiagents.ausbizconsulting.com.au/digital-twin-workshop
 
My database uses Vector and Redis. I use Groq API, check the specific model. We will first test the MCP server locally, and once finished, deploy it to Vercel. BUt take note, that is a separate task so I am just reminding you.

