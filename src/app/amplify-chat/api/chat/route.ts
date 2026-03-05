import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages } from "ai";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system:
      "You are Amplify Chat, an internal AI assistant for Amplify Advisors. " +
      "You help financial advisors with their day-to-day tasks, answer questions about data, " +
      "draft communications, and provide insights. Be concise, professional, and helpful.",
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
