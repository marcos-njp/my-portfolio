/**
 * Analytics Logger for Digital Twin Chat
 * Tracks user questions and AI responses to Neon Postgres
 */

import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;

export interface ChatLogData {
  sessionId: string;
  userQuery: string;
  aiResponse: string;
  mood?: string;
  chunksUsed?: number;
  topScore?: number;
  avgScore?: number;
}

/**
 * Log chat interaction to database
 */
export async function logChatInteraction(data: ChatLogData): Promise<void> {
  try {
    await prisma.chatLog.create({
      data: {
        sessionId: data.sessionId,
        userQuery: data.userQuery,
        aiResponse: data.aiResponse,
        mood: data.mood || 'professional',
        chunksUsed: data.chunksUsed || 0,
        topScore: data.topScore || 0.0,
        avgScore: data.avgScore || 0.0,
      },
    });
    
    // Track frequent questions
    await trackFrequentQuestion(data.userQuery);
    
    console.log(`[Analytics] Logged chat for session ${data.sessionId}`);
  } catch (error) {
    console.error('[Analytics] Failed to log:', error);
    // Non-blocking - don't fail the chat request
  }
}

/**
 * Track frequently asked questions
 */
async function trackFrequentQuestion(question: string): Promise<void> {
  try {
    const category = categorizeQuestion(question);
    
    // Try to update existing question
    const updated = await prisma.frequentQuestion.updateMany({
      where: { question },
      data: {
        count: { increment: 1 },
        lastAsked: new Date(),
      },
    });
    
    // If no rows updated, create new entry
    if (updated.count === 0) {
      await prisma.frequentQuestion.create({
        data: {
          question,
          category,
          count: 1,
        },
      });
    }
  } catch (error) {
    console.error('[Analytics] Failed to track question:', error);
  }
}

/**
 * Categorize question for analytics
 */
function categorizeQuestion(question: string): string {
  const q = question.toLowerCase();
  
  if (/project|app|built|portfolio|github|code/.test(q)) return 'projects';
  if (/skill|technology|tech|framework|language|tools/.test(q)) return 'skills';
  if (/experience|work|job|internship|competition/.test(q)) return 'experience';
  if (/education|university|degree|student|school/.test(q)) return 'education';
  
  return 'general';
}

export { prisma };
