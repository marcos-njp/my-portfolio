import { z } from "zod";

// Individual Zod schemas for chat parameters
export const messageSchema = z.string().min(1).max(1000);
export const moodSchema = z.enum(['professional', 'genz']);
export const sessionIdSchema = z.string();

// Complete chat schema
export const chatSchema = z.object({
  message: messageSchema,
  mood: moodSchema.optional().default('professional'),
  sessionId: sessionIdSchema.optional(),
});

export type ChatParams = z.infer<typeof chatSchema>;

// Chat tool definition
export const chatTool = {
  name: 'chat_with_digital_twin',
  description: 'Chat with Niño Marcos digital twin to learn about his professional background, skills, projects, and experience. Supports professional and genz moods.',
} as const;

// Shared chat logic interface
export interface ChatResult {
  type: 'text';
  text: string;
}
