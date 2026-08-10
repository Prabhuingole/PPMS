"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import api from "@/services/api";
import { cn } from "@/lib/utils";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await api.post("/api/ai/chat", { prompt: userMessage });
      const data = response.data?.data;
      if (data && data.response) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: "I'm sorry, I couldn't understand that." }]);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || "An error occurred while connecting to the assistant.";
      setMessages((prev) => [...prev, { role: "assistant", content: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 p-4 rounded-full shadow-lg text-white transition-all duration-300 z-[9999]",
          isOpen ? "bg-red-500 hover:bg-red-600 rotate-90" : "bg-primary hover:bg-primary/90"
        )}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 sm:w-96 h-[500px] bg-background border shadow-2xl rounded-2xl flex flex-col overflow-hidden z-[9999] animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <MessageCircle size={20} /> AI Assistant
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground mt-4 text-sm">
                How can I help you today?
              </div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  "p-3 rounded-xl max-w-[85%] text-sm whitespace-pre-wrap",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground self-end rounded-tr-sm"
                    : "bg-muted text-foreground self-start rounded-tl-sm"
                )}
              >
                {msg.content}
              </div>
            ))}
            {isLoading && (
              <div className="bg-muted text-foreground self-start rounded-xl rounded-tl-sm p-3 max-w-[85%] flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-3 border-t bg-muted/30 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question..."
              className="flex-1 px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
