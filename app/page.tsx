"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ChatInput from "@/components/ChatInput";
import ChatMessage from "@/components/ChatMessage";
import type { ChatMessage as ChatMessageType } from "@/lib/chat-types";

type GatewayResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
    delta?: {
      content?: string;
    };
  }>;
  [key: string]: unknown;
};

function extractAssistantText(data: GatewayResponse): string {
  const firstChoice = data.choices?.[0];
  return firstChoice?.message?.content?.trim() ?? "";
}

function buildConversation(
  current: ChatMessageType[],
  prompt: string,
  systemMessage?: string
): ChatMessageType[] {
  const nextMessages = [...current];

  if (systemMessage) {
    const existingSystem = nextMessages.find((m) => m.role === "system");
    if (!existingSystem) {
      nextMessages.unshift({ role: "system", content: systemMessage });
    } else {
      existingSystem.content = systemMessage;
    }
  }

  nextMessages.push({ role: "user", content: prompt });
  return nextMessages;
}

export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawJson, setRawJson] = useState<unknown>(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    if (!error) {
      return;
    }

    const timer = setTimeout(() => setError(null), 3500);
    return () => clearTimeout(timer);
  }, [error]);

  const hasMessages = useMemo(() => messages.length > 0, [messages.length]);

  const handleStream = async (conversation: ChatMessageType[]) => {
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openclaw:main",
        stream: true,
        messages: conversation
      })
    });

    if (!response.ok || !response.body) {
      let message = `Request failed with status ${response.status}`;
      try {
        const data = (await response.json()) as { error?: { message?: string } };
        if (data.error?.message) {
          message = data.error.message;
        }
      } catch {
        // Non-JSON error from proxy.
      }
      throw new Error(message);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let accumulated = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith("data:")) {
          continue;
        }

        const payload = line.slice(5).trim();
        if (payload === "[DONE]") {
          continue;
        }

        try {
          const json = JSON.parse(payload) as GatewayResponse;
          const delta = json.choices?.[0]?.delta?.content ?? json.choices?.[0]?.message?.content ?? "";
          if (delta) {
            accumulated += delta;
            setMessages((prev) => {
              const next = [...prev];
              const idx = next.length - 1;
              if (idx >= 0 && next[idx]?.role === "assistant") {
                next[idx] = { role: "assistant", content: accumulated };
              }
              return next;
            });
          }
        } catch {
          // Ignore chunks that are not valid JSON payloads.
        }
      }
    }

    if (!accumulated.trim()) {
      throw new Error("No streamed assistant content was returned.");
    }

    setRawJson({ streamed: true, preview: accumulated });
  };

  const handleSubmit = async (input: { systemMessage?: string; prompt: string; stream: boolean }) => {
    setLoading(true);
    setError(null);

    const conversation = buildConversation(messages, input.prompt, input.systemMessage);
    setMessages(conversation);

    try {
      if (input.stream) {
        await handleStream(conversation);
      } else {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "openclaw:main",
            messages: conversation
          })
        });

        const data = (await response.json()) as GatewayResponse & {
          error?: { message?: string; details?: unknown };
        };
        setRawJson(data);

        if (!response.ok) {
          throw new Error(data.error?.message ?? `Request failed with status ${response.status}`);
        }

        const assistantText = extractAssistantText(data);
        if (!assistantText) {
          throw new Error("Gateway returned no assistant message content.");
        }

        setMessages((prev) => [...prev, { role: "assistant", content: assistantText }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
      setMessages((prev) => prev.filter((m, index) => !(index === prev.length - 1 && m.role === "assistant" && !m.content)));
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    if (loading) {
      return;
    }
    setMessages([]);
    setRawJson(null);
    setError(null);
  };

  return (
    <main className="mx-auto flex h-screen max-w-5xl flex-col gap-4 px-4 py-6 sm:px-6">
      <header className="rounded-2xl border border-borderSoft bg-panel p-4">
        <h1 className="text-xl font-semibold text-slate-100">OpenClaw Gateway Console</h1>
        <p className="mt-1 text-sm text-slate-400">Test prompts securely through a server-side proxy route.</p>
      </header>

      <section
        ref={containerRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-borderSoft bg-panel p-4"
      >
        {hasMessages ? (
          messages.map((message, index) => (
            <ChatMessage key={`${message.role}-${index}-${message.content.slice(0, 20)}`} message={message} />
          ))
        ) : (
          <p className="text-sm text-slate-400">No messages yet. Send a prompt to begin.</p>
        )}
      </section>

      <section className="sticky bottom-0 space-y-3 pb-1">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowRawJson((v) => !v)}
            className="rounded-lg border border-borderSoft px-3 py-2 text-xs font-medium uppercase tracking-wide text-slate-300 hover:bg-slate-700"
          >
            {showRawJson ? "Hide raw JSON" : "Show raw JSON"}
          </button>
        </div>

        {showRawJson ? (
          <pre className="max-h-48 overflow-auto rounded-xl border border-borderSoft bg-slate-900 p-3 text-xs text-slate-200">
            {JSON.stringify(rawJson, null, 2) || "No response yet."}
          </pre>
        ) : null}

        <ChatInput loading={loading} onSubmit={handleSubmit} onClear={handleClear} />
      </section>

      {error ? (
        <div
          role="alert"
          className="fixed right-4 top-4 z-50 rounded-lg border border-rose-500/40 bg-rose-950/90 px-4 py-3 text-sm text-rose-100 shadow-lg"
        >
          {error}
        </div>
      ) : null}
    </main>
  );
}
