import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Send, ArrowRight } from "lucide-react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type AssessmentChatProps = {
  userName: string;
  visaType: string;
  situation?: string;
  /** Lead's email for persisting chat history across sessions */
  email?: string;
  /** Called when user clicks the CTA to start their application */
  onStartApplication?: (dependents: number) => void;
};

const VISA_TYPE_LABELS: Record<string, string> = {
  "digital-nomad": "Digital Nomad Visa",
  "non-lucrative": "Non-Lucrative Visa",
  "student": "Student Visa",
  "work": "Work Visa",
  "eu-registration": "EU Registration Certificate",
  "not-sure": "visa options",
};

const VISA_PRICES: Record<string, number> = {
  "digital-nomad": 699,
  "non-lucrative": 649,
  "student": 549,
  "work": 799,
  "eu-registration": 349,
};

const DEPENDENT_PRICES: Record<string, number> = {
  "digital-nomad": 399,
  "non-lucrative": 349,
  "work": 449,
  "eu-registration": 199,
};

function getTotalPrice(visaType: string, dependents: number): string {
  const base = VISA_PRICES[visaType];
  if (!base) return "€349–€799";
  const depPrice = DEPENDENT_PRICES[visaType] || 0;
  const total = base + depPrice * dependents;
  return `€${total.toLocaleString()}`;
}

// Typing delay scales with message length — longer messages take longer to "type"
function getTypingDelay(messageLength: number = 50) {
  // Base: 1.5s for short messages (< 40 chars)
  // Scales up: ~2.5s for medium (80 chars), ~3.5s for long (150+ chars)
  // Max: 4.5s for very long messages
  const base = 1500;
  const perChar = 15; // 15ms per character
  const scaled = base + Math.min(messageLength * perChar, 3000);
  // Add some randomness (±300ms)
  return scaled + Math.floor(Math.random() * 600) - 300;
}

// Split a response into multiple short bubbles
function splitIntoBubbles(text: string): string[] {
  // If the LLM used our explicit split marker
  if (text.includes("||")) {
    return text
      .split("||")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  // Also split on double newlines (paragraph breaks)
  if (text.includes("\n\n")) {
    return text
      .split("\n\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  // If the message is short enough, keep as one bubble
  if (text.length <= 120) return [text];

  // Protect emails and URLs from being split on periods
  // Replace periods in emails/URLs with a placeholder, split, then restore
  const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const URL_REGEX = /https?:\/\/[^\s]+/g;

  let protected_text = text;
  const replacements: string[] = [];
  // Protect emails
  protected_text = protected_text.replace(EMAIL_REGEX, (match) => {
    const idx = replacements.length;
    replacements.push(match);
    return `__PROT${idx}__`;
  });
  // Protect URLs
  protected_text = protected_text.replace(URL_REGEX, (match) => {
    const idx = replacements.length;
    replacements.push(match);
    return `__PROT${idx}__`;
  });

  // Split on sentence boundaries for longer messages
  const sentences = protected_text.match(/[^.!?]+[.!?]+/g) || [protected_text];
  const bubbles: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if ((current + sentence).length > 140 && current.length > 0) {
      bubbles.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current.trim()) bubbles.push(current.trim());

  // Restore protected tokens
  const restored = (bubbles.length > 0 ? bubbles : [protected_text]).map((b) =>
    b.replace(/__PROT(\d+)__/g, (_, idx) => replacements[parseInt(idx, 10)])
  );

  return restored;
}

// Enforce one question per bubble: if a bubble contains multiple "?" marks,
// split it at the first question and keep the rest as a separate bubble.
// Exceptions: URLs and emails can contain "?" without being questions.
function enforceOneQuestion(bubbles: string[]): string[] {
  const result: string[] = [];
  for (const bubble of bubbles) {
    // Protect URLs from being counted as questions
    const withoutUrls = bubble.replace(/https?:\/\/[^\s]+/g, "").replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "");
    const questionMarks = (withoutUrls.match(/\?/g) || []).length;
    if (questionMarks <= 1) {
      result.push(bubble);
    } else {
      // Find the position of the first "?" in the original text (not inside URLs)
      // Split after the first sentence that ends with "?"
      const firstQMatch = bubble.match(/^([\s\S]*?\?)\s*([\s\S]+)$/);
      if (firstQMatch && firstQMatch[2].trim().length > 0) {
        result.push(firstQMatch[1].trim());
        // Recursively enforce on the remainder
        result.push(...enforceOneQuestion([firstQMatch[2].trim()]));
      } else {
        result.push(bubble);
      }
    }
  }
  return result;
}

// Render message content with clickable links
function renderMessageContent(content: string) {
  // Match URLs (http/https) and email addresses
  const LINK_PATTERN = /(https?:\/\/[^\s]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const parts = content.split(LINK_PATTERN);

  if (parts.length === 1) return content;

  return parts.map((part, i) => {
    // Reset regex lastIndex
    LINK_PATTERN.lastIndex = 0;
    if (LINK_PATTERN.test(part)) {
      LINK_PATTERN.lastIndex = 0;
      // Check if it's an email
      if (part.includes("@") && !part.startsWith("http")) {
        return (
          <a
            key={i}
            href={`mailto:${part}`}
            className="font-semibold underline"
            style={{ color: "#D97706" }}
          >
            {part}
          </a>
        );
      }
      // It's a URL
      const displayText = part.includes("calendly") ? "Schedule a call" : part.replace(/https?:\/\//, "").replace(/\/$/, "");
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium underline"
          style={{ color: "#D97706" }}
        >
          {displayText}
        </a>
      );
    }
    return part;
  });
}

export default function AssessmentChat({
  userName,
  visaType,
  situation,
  email,
  onStartApplication,
}: AssessmentChatProps) {
  // Generate a stable session ID for this chat session (persists across re-renders, resets on page reload)
  const sessionIdRef = useRef(
    `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  );
  const firstName = userName.split(" ")[0] || "there";
  const visaLabel = VISA_TYPE_LABELS[visaType] || "your visa";
  const [displayPrice, setDisplayPrice] = useState(() => getTotalPrice(visaType, 0));

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(true); // Start with typing for first message
  const [showCTA, setShowCTA] = useState(false);
  const [ctaType, setCTAType] = useState<"urgent" | "soft" | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasInitialized = useRef(false);
  // Use a ref to queue bubbles so we don't lose them across re-renders
  const bubbleQueueRef = useRef<string[]>([]);
  const processingRef = useRef(false);
  // Pending CTA — only shown after all bubbles finish rendering
  const pendingCTARef = useRef<"urgent" | "soft" | null>(null);
  // Track whether Laura has quoted a price (so we know when user's "yes" means proceed)
  const priceQuotedRef = useRef(false);
  const fallbackCountRef = useRef(0);

  const chatMutation = trpc.chat.send.useMutation();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Show first message with typing delay
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const delay = getTypingDelay();
    const timer = setTimeout(() => {
      setIsTyping(false);
      setMessages([
        {
          role: "assistant",
          content: `Hi ${firstName}, nice to meet you! Are you ok to answer a few questions about getting a visa in Spain?`,
        },
      ]);
      setTimeout(() => inputRef.current?.focus(), 300);
    }, delay);

    return () => clearTimeout(timer);
  }, [firstName]);

  // Process bubble queue — this runs whenever isTyping changes to false and there are queued bubbles
  const processNextBubble = useCallback(() => {
    if (processingRef.current) return;
    if (bubbleQueueRef.current.length === 0) {
      setIsLoading(false);
      return;
    }

    processingRef.current = true;
    setIsTyping(true);

    const nextBubble = bubbleQueueRef.current[0];
    const delay = getTypingDelay(nextBubble?.length || 50);
    setTimeout(() => {
      const bubble = bubbleQueueRef.current.shift()!;
      setMessages((prev) => [...prev, { role: "assistant", content: bubble }]);
      setIsTyping(false);
      processingRef.current = false;

      // If there are more bubbles, process next after a short pause
      if (bubbleQueueRef.current.length > 0) {
        setTimeout(() => processNextBubble(), 300);
      } else {
        setIsLoading(false);
        // Show CTA only after all bubbles have rendered
        if (pendingCTARef.current) {
          setCTAType(pendingCTARef.current);
          setShowCTA(true);
          pendingCTARef.current = null;
        }
      }
    }, delay);
  }, []);

  // Track dependents count extracted from conversation
  const [dependentCount, setDependentCount] = useState(0);

  // Detect family/dependent mentions in user messages
  const detectDependents = (text: string): number => {
    const lower = text.toLowerCase();
    // "me, my wife, and our son" = 2 dependents
    // "me and my partner" = 1 dependent
    // "family of 4" = 3 dependents
    // "wife and 2 kids" = 3 dependents
    // "partner and child" = 2 dependents
    let count = 0;

    // Detect partner/spouse/wife/husband
    if (/\b(wife|husband|partner|spouse|girlfriend|boyfriend|fianc[eé]e?)\b/i.test(lower)) {
      count += 1;
    }

    // Detect kids
    const kidsMatch = lower.match(/\b(\d+)\s*(?:kids?|children|child)\b/);
    if (kidsMatch) {
      count += parseInt(kidsMatch[1], 10);
    } else if (/\b(?:a|one|1)\s*(?:kid|child|son|daughter|baby)\b/i.test(lower)) {
      count += 1;
    } else if (/\b(?:two|2)\s*(?:kids?|children|sons?|daughters?)\b/i.test(lower)) {
      count += 2;
    } else if (/\b(?:three|3)\s*(?:kids?|children|sons?|daughters?)\b/i.test(lower)) {
      count += 3;
    } else if (/\b(?:son|daughter|child|kid|baby)\b/i.test(lower) && !/\b(no|don'?t have)\b/i.test(lower)) {
      count += 1;
    }

    // "family of N" pattern
    const familyMatch = lower.match(/family\s*of\s*(\d+)/i);
    if (familyMatch) {
      count = Math.max(count, parseInt(familyMatch[1], 10) - 1); // subtract main applicant
    }

    // IMPORTANT: Do NOT count parents (mother, father, mum, dad) as dependents.
    // They are NOT eligible on DNV/NLV/Student/Work visas.
    // If user mentions a parent, subtract them from count if they were included via "family of N".
    const mentionsParent = /\b(mother|father|mum|dad|mom|parent|parents|my mum|my dad|my mom|my mother|my father)\b/i.test(lower);
    if (mentionsParent && familyMatch) {
      // If "family of 3" includes a parent, subtract 1 for the parent
      const parentCount = /\b(mother.*father|father.*mother|mum.*dad|dad.*mum|mom.*dad|dad.*mom|parents|both parents)\b/i.test(lower) ? 2 : 1;
      count = Math.max(0, count - parentCount);
    }

    return count;
  };



  const handleSend = async () => {
    if (!input.trim() || isLoading || isTyping) return;

    const userMessage: ChatMessage = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      // Detect dependents from user message
      const detectedDeps = detectDependents(input.trim());
      if (detectedDeps > 0) {
        setDependentCount((prev) => {
          const newCount = Math.max(prev, detectedDeps);
          setDisplayPrice(getTotalPrice(visaType, newCount));
          return newCount;
        });
      }

      const result = await chatMutation.mutateAsync({
        messages: updatedMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        context: {
          name: userName,
          visaType: visaLabel,
          situation: situation || undefined,
          source: "free-assessment" as const,
          email: email || undefined,
          sessionId: sessionIdRef.current,
        },
      });

      // Split the response into bubbles and queue them
      let bubbles = splitIntoBubbles(result.reply);

      // ONE-QUESTION ENFORCEMENT: If any single bubble contains multiple questions,
      // split it so only one question appears per bubble. This prevents the LLM
      // from asking two questions at once even if the prompt instruction is ignored.
      bubbles = enforceOneQuestion(bubbles);

      // Capture whether price was ALREADY quoted in a PREVIOUS exchange
      // This is critical: CTA should only appear if user says "yes" to a price
      // that was quoted BEFORE this response, not in this same response.
      const priceWasAlreadyQuoted = priceQuotedRef.current;

      // Detect if this response contains a price quote or soft fallback
      const fullReply = result.reply.toLowerCase();
      const hasPriceQuote = /€\d+/.test(result.reply) && /\b(get started|would you like|ready to)\b/i.test(result.reply);
      const hasSoftFallback = /\b(no rush|no problem|when you're ready|laura@spainporfavor)\b/i.test(fullReply);

      // Extract total price from Laura's response
      // If we know the dependent count, always calculate the correct total
      if (hasPriceQuote) {
        if (dependentCount > 0) {
          // We know the family size — calculate the correct total
          setDisplayPrice(getTotalPrice(visaType, dependentCount));
        } else {
          // No dependents — find the explicit total or use the single price
          const totalMatch = result.reply.match(/€([\d,]+)\s*total/i);
          if (totalMatch) {
            const quoted = totalMatch[1].replace(/,/g, "");
            setDisplayPrice(`€${parseInt(quoted, 10).toLocaleString()}`);
          } else {
            // Sum all € amounts mentioned (e.g., "€699 for you plus €399 for wife" = €1,098)
            const allPrices = Array.from(result.reply.matchAll(/€([\d,]+)/g)).map(m => parseInt(m[1].replace(/,/g, ""), 10));
            if (allPrices.length > 0) {
              const sum = allPrices.reduce((a, b) => a + b, 0);
              setDisplayPrice(`€${sum.toLocaleString()}`);
            }
          }
        }
      }

      // Track that a price has been quoted (for follow-up yes detection)
      if (hasPriceQuote) {
        priceQuotedRef.current = true;
      }

      // Detect hesitation FIRST (used by both CTA logic and soft fallback)
      const userHesitated = /\b(think about|not sure|maybe later|need time|consider|let me|come back|not ready|no thanks|not now|not yet|not interested)\b/i.test(userMessage.content);

      // CTA only appears when user explicitly agrees to proceed AFTER seeing the price.
      // The price must have been quoted in a PREVIOUS exchange (not this one).
      // "Would you like to get started?" → user says yes → NEXT response triggers CTA.
      const userSaidYes = /\b(yes|yeah|yep|sure|let'?s do it|let'?s start|ready|sign me up|proceed|go ahead|absolutely|definitely|i'?m in|let'?s go|sounds good|i want to|i'?d like to start|get started)\b/i.test(userMessage.content);
      // Exclude generic "yes" that's answering a different question (e.g., "yes please explain")
      const isGenericYesWithMore = /^(yes|yeah|yep|sure)\s+(please|i'?d like|tell me|explain|go on|continue)/i.test(userMessage.content.trim());

      // KEY FIX: Only show CTA if price was quoted BEFORE this response (priceWasAlreadyQuoted),
      // not if it's being quoted in THIS response. This prevents CTA from appearing
      // when user says "yes" to "explain the process" and Laura responds with process + price.
      // Also: hesitation ALWAYS takes priority — if user hesitated, never show CTA.
      if (userSaidYes && !isGenericYesWithMore && !userHesitated && priceWasAlreadyQuoted && !showCTA) {
        pendingCTARef.current = "urgent";
      }

      // Soft fallback: ALWAYS ensure email + Calendly appears when user hesitates
      // This is deterministic — doesn't rely on LLM including it
      if (userHesitated) {
        // Check if ANY bubble in the array already has BOTH email and Calendly
        const allBubblesText = bubbles.join(" ");
        const hasEmail = allBubblesText.includes("laura@spainporfavor.com");
        const hasCalendly = allBubblesText.includes("calendly.com");
        if (!hasEmail || !hasCalendly) {
          // Remove any standalone "No problem at all!" bubble from LLM response
          // to avoid duplication when we append the full fallback
          bubbles = bubbles.filter(b => !/^no problem at all[!.]?$/i.test(b.trim()));

          // Use varied fallback messages so it never repeats verbatim
          const fallbackVariants = [
            "Of course! Moving to a new country is a big decision. Whenever you're ready, I'm at laura@spainporfavor.com \u2014 or you can book a quick chat with the team here: https://calendly.com/spainporfavor. We're here to help whenever the time is right for you.",
            "Absolutely, take all the time you need. You can reach me directly at laura@spainporfavor.com or grab a time to chat here: https://calendly.com/spainporfavor \u2014 no pressure at all.",
            "No rush whatsoever. If anything comes up or you have more questions down the line, drop me a note at laura@spainporfavor.com or book a quick call here: https://calendly.com/spainporfavor. We'll be here.",
          ];
          const variantIndex = Math.min(fallbackCountRef.current, fallbackVariants.length - 1);
          bubbles.push(fallbackVariants[variantIndex]);
          fallbackCountRef.current += 1;
        }
      }

      // Reset processingRef to ensure bubble queue starts fresh
      processingRef.current = false;
      bubbleQueueRef.current = [...bubbles];
      processNextBubble();
    } catch {
      bubbleQueueRef.current = [
        "Sorry, I'm having a small connection issue. Please try again in a moment.",
      ];
      processNextBubble();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {/* Header — Laura's personalized greeting */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b border-slate-100"
        style={{ backgroundColor: "#1A2332" }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
          style={{ backgroundColor: "#D97706" }}
        >
          L
        </div>
        <div>
          <p className="text-sm font-semibold text-white">
            My name is Laura
          </p>
          <p className="text-xs text-slate-300">
            If you have any questions, please ask me here
          </p>
        </div>
      </div>

      {/* Messages area */}
      <div className="h-[360px] overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mr-2 mt-1"
                style={{ backgroundColor: "#D97706" }}
              >
                L
              </div>
            )}
            <div
              className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-amber-500 text-white rounded-br-md"
                  : "bg-slate-100 text-slate-700 rounded-bl-md"
              }`}
            >
              {msg.role === "assistant" ? renderMessageContent(msg.content) : msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mr-2 mt-1"
              style={{ backgroundColor: "#D97706" }}
            >
              L
            </div>
            <div className="bg-slate-100 text-slate-500 px-3.5 py-2.5 rounded-2xl rounded-bl-md text-sm">
              <span className="inline-flex gap-1">
                <span
                  className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-slate-100 bg-white">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your reply..."
            className="flex-1 px-3.5 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100"
            disabled={isLoading || isTyping}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || isTyping}
            size="sm"
            className="w-9 h-9 rounded-full p-0 flex items-center justify-center"
            style={{ backgroundColor: "#D97706" }}
          >
            <Send className="w-4 h-4 text-white" />
          </Button>
        </div>
      </div>

      {/* CTA — shown after Laura gauges urgency */}
      {showCTA && ctaType === "urgent" && onStartApplication && (
        <div className="px-4 pb-4 pt-1">
          <button
            onClick={() => onStartApplication(dependentCount)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: "#D97706" }}
          >
            Start My Application — {displayPrice}
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-center text-xs text-muted-foreground mt-1.5">
            Includes document prep, Gestor submission, and free resubmission
            support for fixable issues (subject to our terms).
          </p>
        </div>
      )}


    </div>
  );
}
