/**
 * PortalChat — Laura AI chat widget for the client portal.
 * Persistent, case-aware chat that shows message history and allows real-time conversation.
 */

import { useState, useRef, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Streamdown } from "streamdown";
import { sanitizeAIContent } from "@/lib/sanitize";

/** Group messages by date for display */
function formatDateSeparator(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

interface PortalChatProps {
  className?: string;
}

export default function PortalChat({ className }: PortalChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch message history
  const { data: messages = [], refetch: refetchMessages } = trpc.portalChat.getMessages.useQuery(
    { limit: 50 },
    { enabled: isOpen, refetchInterval: isOpen ? 15000 : false }
  );

  // Send message mutation
  const sendMessage = trpc.portalChat.sendMessage.useMutation({
    onSuccess: () => {
      refetchMessages();
      setInput("");
    },
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, sendMessage.isPending]);

  // Focus textarea when chat opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || sendMessage.isPending) return;
    sendMessage.mutate({ content: trimmed });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating chat button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-3 rounded-full shadow-lg transition-all hover:scale-105 ${className}`}
        >
          <MessageCircle className="h-5 w-5" />
          <span className="font-medium text-sm">Ask Laura</span>
          {messages.length === 0 && (
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
          )}
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-sm">Laura</p>
                <p className="text-xs text-white/80">Your case manager</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
            {messages.length === 0 && !sendMessage.isPending && (
              <div className="text-center py-8">
                <MessageCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-1">Hi! I'm Laura, your case manager.</p>
                <p className="text-xs text-gray-400">
                  Ask me anything about your documents, timeline, or process.
                </p>
                <div className="mt-4 space-y-2">
                  {["What should I upload next?", "How long will my visa take?", "Help with my criminal record certificate"].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => {
                        setInput(prompt);
                        setTimeout(() => handleSend(), 50);
                      }}
                      className="block w-full text-left text-xs px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg: any, idx: number) => {
              // Date separator
              const msgDate = new Date(msg.createdAt);
              const prevDate = idx > 0 ? new Date(messages[idx - 1].createdAt) : null;
              const showDateSeparator = !prevDate || msgDate.toDateString() !== prevDate.toDateString();

              return (
                <div key={msg.id}>
                  {showDateSeparator && (
                    <div className="flex items-center gap-2 my-3">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-[10px] text-gray-400 font-medium">{formatDateSeparator(msgDate)}</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                  )}
                  <div className={`flex ${msg.role === "client" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
                        msg.role === "client"
                          ? "bg-amber-500 text-white rounded-br-md"
                          : msg.role === "system"
                          ? "bg-blue-50 text-blue-800 border border-blue-100 rounded-bl-md italic text-xs"
                          : "bg-gray-100 text-gray-800 rounded-bl-md"
                      }`}
                    >
                      {msg.role === "laura" ? (
                        <Streamdown>{sanitizeAIContent(msg.content)}</Streamdown>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                      <p className={`text-[10px] mt-1 ${msg.role === "client" ? "text-white/60" : "text-gray-400"}`}>
                        {msgDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Loading indicator */}
            {sendMessage.isPending && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            {/* Error display */}
            {sendMessage.error && (
              <div className="flex justify-start">
                <div className="bg-red-50 text-red-700 rounded-2xl rounded-bl-md px-3.5 py-2.5 text-xs border border-red-100">
                  Something went wrong. Please try again.
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-gray-100 px-3 py-2.5 shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={1}
                className="flex-1 resize-none text-sm px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none max-h-[80px] overflow-y-auto"
                style={{ minHeight: "36px" }}
              />
              <Button
                size="sm"
                onClick={handleSend}
                disabled={!input.trim() || sendMessage.isPending}
                className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl h-9 w-9 p-0 shrink-0"
              >
                {sendMessage.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 text-center">
              Laura has full context about your case and documents
            </p>
          </div>
        </div>
      )}
    </>
  );
}
