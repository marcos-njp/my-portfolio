/**
 * Analytics Logger for Chat Interactions
 * Tracks user questions to Neon Postgres for improvement insights
 */

import { PrismaClient } from '@prisma/client';

// Edge-compatible Prisma client
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
  averageScore?: number;
  hadFeedback?: boolean;
  feedbackType?: string;
  responseTime?: number;
}

/**
 * Log chat interaction to database
 */
export async function logChatInteraction(data: ChatLogData): Promise<void> {
  try {
    await prisma.chatAnalytics.create({
      data: {
        sessionId: data.sessionId,
        userQuery: data.userQuery,
        aiResponse: data.aiResponse,
        mood: data.mood || 'professional',
        chunksUsed: data.chunksUsed || 0,
        topScore: data.topScore || 0.0,
        averageScore: data.averageScore || 0.0,
        hadFeedback: data.hadFeedback || false,
        feedbackType: data.feedbackType,
        responseTime: data.responseTime,
      },
    });
    
    // Track frequent questions
    await trackFrequentQuestion(data.userQuery);
    
    console.log(`[Analytics] Logged interaction for session ${data.sessionId}`);
  } catch (error) {
    console.error('[Analytics] Failed to log interaction:', error);
    // Non-blocking: don't fail the request if logging fails
  }
}

/**
 * Track frequently asked questions
 */
async function trackFrequentQuestion(question: string): Promise<void> {
  try {
    const existing = await prisma.frequentQuestions.findUnique({
      where: { question },
    });
    
    if (existing) {
      // Increment count
      await prisma.frequentQuestions.update({
        where: { question },
        data: {
          count: { increment: 1 },
          lastAsked: new Date(),
        },
      });
    } else {
      // Create new entry
      const category = categorizeQuestion(question);
      await prisma.frequentQuestions.create({
        data: {
          question,
          category,
          count: 1,
        },
      });
    }
  } catch (error) {
    console.error('[Analytics] Failed to track frequent question:', error);
  }
}

/**
 * Categorize question for analytics
 */
function categorizeQuestion(question: string): string {
  const lowerQuery = question.toLowerCase();
  
  if (/project|app|built|portfolio|github/.test(lowerQuery)) return 'projects';
  if (/skill|technology|tech stack|framework|language/.test(lowerQuery)) return 'skills';
  if (/experience|work|job|internship|competition/.test(lowerQuery)) return 'experience';
  if (/education|university|degree|student/.test(lowerQuery)) return 'education';
  if (/salary|compensation|remote|location/.test(lowerQuery)) return 'compensation';
  
  return 'general';
}

/**
 * Get analytics insights (for admin dashboard)
 */
export async function getAnalytics(limit: number = 100) {
  try {
    const [recentChats, frequentQuestions, moodDistribution] = await Promise.all([
      // Recent interactions
      prisma.chatAnalytics.findMany({
        take: limit,
        orderBy: { timestamp: 'desc' },
        select: {
          userQuery: true,
          mood: true,
          chunksUsed: true,
          topScore: true,
          hadFeedback: true,
          timestamp: true,
        },
      }),
      
      // Most frequently asked questions
      prisma.frequentQuestions.findMany({
        take: 20,
        orderBy: { count: 'desc' },
      }),
      
      // Mood distribution
      prisma.chatAnalytics.groupBy({
        by: ['mood'],
        _count: true,
      }),
    ]);
    
    return {
      recentChats,
      frequentQuestions,
      moodDistribution,
    };
  } catch (error) {
    console.error('[Analytics] Failed to get analytics:', error);
    return null;
  }
}

export { prisma };
