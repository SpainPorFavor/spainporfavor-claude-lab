/**
 * Shared sanitization utility for AI-generated content.
 * Used across all surfaces that render LLM output (chat, feedback, admin views).
 * 
 * Strategy: Strip ALL HTML tags since we render through Streamdown (markdown)
 * or plain text. This prevents XSS from any AI-generated content.
 */
import DOMPurify from "dompurify";

/**
 * Sanitize AI-generated text content.
 * Strips all HTML tags — content is rendered as markdown via Streamdown
 * or as plain text, so no HTML should ever pass through.
 */
export function sanitizeAIContent(content: string | null | undefined): string {
  if (!content) return "";
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [], // Strip ALL HTML
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize AI feedback objects (from document validation).
 * Returns a safe copy with all string fields sanitized.
 */
export function sanitizeAIFeedback(feedback: any): { feedback: string; issues?: string[] } {
  if (!feedback) return { feedback: "" };
  return {
    feedback: sanitizeAIContent(feedback.feedback || feedback.message || ""),
    issues: Array.isArray(feedback.issues)
      ? feedback.issues.map((issue: any) => sanitizeAIContent(String(issue)))
      : undefined,
  };
}
