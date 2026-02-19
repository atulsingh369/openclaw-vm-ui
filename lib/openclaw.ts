import "server-only";

import type { ChatCompletionRequest } from "@/lib/chat-types";

const DEFAULT_GATEWAY_URL = "http://172.203.222.133:18789/v1/chat/completions";

function getGatewayConfig() {
  const token = process.env.OPENCLAW_GATEWAY_TOKEN;
  const url = process.env.OPENCLAW_GATEWAY_URL ?? DEFAULT_GATEWAY_URL;

  if (!token) {
    throw new Error("OPENCLAW_GATEWAY_TOKEN is not configured");
  }

  return { token, url };
}

export async function requestOpenClawCompletion(payload: ChatCompletionRequest): Promise<Response> {
  const { token, url } = getGatewayConfig();

  return fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
    cache: "no-store"
  });
}
