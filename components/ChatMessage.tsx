"use client";

import type { ChatMessage as ChatMessageType } from "@/lib/chat-types";

type Props = {
  message: ChatMessageType;
};

function roleClasses(role: ChatMessageType["role"]): string {
  switch (role) {
    case "assistant":
      return "bg-emerald-950/40 border-emerald-700/40";
    case "system":
      return "bg-sky-950/30 border-sky-700/40";
    default:
      return "bg-panelSoft border-borderSoft";
  }
}

export default function ChatMessage({ message }: Props) {
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
    } catch {
      // No-op: clipboard can fail in restricted browser contexts.
    }
  };

  return (
    <article
      className={`rounded-xl border p-4 shadow-sm transition-colors ${roleClasses(message.role)}`}
      aria-label={`${message.role} message`}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">{message.role}</span>
        <button
          type="button"
          onClick={onCopy}
          className="rounded-md border border-borderSoft px-2 py-1 text-xs text-slate-300 hover:bg-slate-700"
        >
          Copy
        </button>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-100">{message.content}</p>
    </article>
  );
}
