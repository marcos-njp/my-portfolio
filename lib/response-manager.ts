/**
 * Response Length Management
 * Keeps answers short and specific. Simple questions get short answers.
 */

/**
 * Get response length instruction for system prompt
 */
export function getResponseLengthInstruction(): string {
  return `\nLENGTH: Be concise. One or two sentences for simple questions, up to four for complex ones. Hard cap around 150 words. Do not pad, repeat, or list everything. Specifics over length.`;
}
