"use client";

import { useState } from "react";

type Props = {
  loading: boolean;
  onSubmit: (input: { systemMessage?: string; prompt: string; stream: boolean }) => Promise<void>;
  onClear: () => void;
};

export default function ChatInput({ loading, onSubmit, onClear }: Props) {
  const [systemMessage, setSystemMessage] = useState("");
  const [prompt, setPrompt] = useState("");
  const [stream, setStream] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || loading) {
      return;
    }

    await onSubmit({
      systemMessage: systemMessage.trim() || undefined,
      prompt: trimmedPrompt,
      stream
    });

    setPrompt("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-borderSoft bg-panel p-4 shadow-lg">
      <div className="space-y-2">
        <label htmlFor="system-message" className="text-xs font-medium uppercase tracking-wide text-slate-400">
          System Message (Optional)
        </label>
        <input
          id="system-message"
          type="text"
          value={systemMessage}
          onChange={(e) => setSystemMessage(e.target.value)}
          placeholder="You are a precise assistant..."
          className="w-full rounded-lg border border-borderSoft bg-slate-900 px-3 py-2 text-sm outline-none ring-0 placeholder:text-slate-500 focus:border-slate-500"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="prompt" className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Prompt
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Type your message..."
          rows={4}
          className="w-full resize-y rounded-lg border border-borderSoft bg-slate-900 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-slate-500"
          required
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={stream}
            onChange={(e) => setStream(e.target.checked)}
            className="h-4 w-4 rounded border-borderSoft bg-slate-900"
          />
          Stream response
        </label>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg border border-borderSoft px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
            disabled={loading}
          >
            Clear chat
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </form>
  );
}
