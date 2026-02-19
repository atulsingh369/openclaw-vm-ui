import { NextResponse } from "next/server";
import type { ChatCompletionRequest, ChatMessage } from "@/lib/chat-types";
import { requestOpenClawCompletion } from "@/lib/openclaw";

const DEFAULT_MODEL = "openclaw:main";

function isValidRole(role: unknown): role is ChatMessage["role"] {
  return role === "system" || role === "user" || role === "assistant";
}

function normalizeMessages(input: unknown): ChatMessage[] | null {
  if (!Array.isArray(input)) {
    return null;
  }

  const output: ChatMessage[] = [];
  for (const item of input) {
    if (
      !item ||
      typeof item !== "object" ||
      !isValidRole((item as { role?: unknown }).role) ||
      typeof (item as { content?: unknown }).content !== "string"
    ) {
      return null;
    }

    const content = (item as { content: string }).content.trim();
    if (!content) {
      return null;
    }

    output.push({
      role: (item as { role: ChatMessage["role"] }).role,
      content
    });
  }

  return output.length > 0 ? output : null;
}

function parseBody(body: unknown): ChatCompletionRequest | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const maybeMessages = normalizeMessages((body as { messages?: unknown }).messages);
  if (!maybeMessages) {
    return null;
  }

  const maybeModel = (body as { model?: unknown }).model;
  const maybeStream = (body as { stream?: unknown }).stream;

  return {
    model: typeof maybeModel === "string" && maybeModel.trim() ? maybeModel : DEFAULT_MODEL,
    messages: maybeMessages,
    stream: typeof maybeStream === "boolean" ? maybeStream : false
  };
}

export async function POST(req: Request) {
  try {
    const raw = (await req.json()) as unknown;
    const payload = parseBody(raw);

    if (!payload) {
      return NextResponse.json(
        {
          error: {
            message:
              "Invalid request body. Expected { model?: string, messages: ChatMessage[], stream?: boolean }."
          }
        },
        { status: 400 }
      );
    }

    const upstream = await requestOpenClawCompletion(payload);

    if (payload.stream && upstream.body) {
      return new Response(upstream.body, {
        status: upstream.status,
        headers: {
          "Content-Type": upstream.headers.get("content-type") ?? "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive"
        }
      });
    }

    const text = await upstream.text();
    let data: unknown = null;

    try {
      data = text ? (JSON.parse(text) as unknown) : null;
    } catch {
      data = {
        raw: text
      };
    }

    if (!upstream.ok) {
      return NextResponse.json(
        {
          error: {
            message: "Gateway request failed",
            status: upstream.status,
            details: data
          }
        },
        { status: upstream.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: {
            message: "Malformed JSON request body"
          }
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes("OPENCLAW_GATEWAY_TOKEN")) {
      return NextResponse.json(
        {
          error: {
            message: "Server is missing OPENCLAW_GATEWAY_TOKEN"
          }
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: {
          message: "Unable to reach OpenClaw Gateway. Please try again.",
          details: error instanceof Error ? error.message : "Unknown error"
        }
      },
      { status: 502 }
    );
  }
}
