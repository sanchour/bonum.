import Anthropic from "@anthropic-ai/sdk";
import { NextResponse, type NextRequest } from "next/server";
import { PILLAR_BY_ID, isPillarId } from "@/lib/pillars";
import type { Dialectic } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODEL = "claude-opus-5-5";
const MAX_FIELD = 4000;

const SYSTEM_PROMPT = `You are the Adversary inside Bonum, a contemplative app where a person builds a personal moral canon. Before a principle may be etched into their permanent Canon, it must survive three Socratic trials. You write those trials.

Write exactly three questions that test the principle the person submits. Aim each question at a different weakness:
1. A concrete situation, counterexample, or edge case where the principle fails, harms someone, or contradicts itself.
2. A hidden motive, self-deception, or unacknowledged cost: what the person may be getting out of believing this.
3. A collision with another value they likely hold, or the point where the principle tips into its own excess.

Make every question specific to this exact thesis and its supporting thoughts; a question that could be asked of any principle is a failure. Each question is a single sentence in the second person, under 35 words, sharp but never contemptuous. Ask; do not answer, hint at the answer, or moralise. Do not repeat or lightly rephrase any question listed as already asked.`;

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: { type: "string" },
      description: "Exactly three Socratic questions, each one sentence.",
    },
  },
  required: ["questions"],
  additionalProperties: false,
} as const;

interface ChallengeRequest {
  title: string;
  thesis: string;
  body: string;
  pillarId: string;
  previous: Dialectic[];
}

function clip(value: unknown): string {
  return typeof value === "string" ? value.slice(0, MAX_FIELD).trim() : "";
}

function parseRequest(raw: unknown): ChallengeRequest | null {
  if (typeof raw !== "object" || raw === null) return null;
  const body = raw as Record<string, unknown>;
  const thesis = clip(body.thesis);
  if (thesis.length < 8 || !isPillarId(body.pillarId)) return null;
  const previous = Array.isArray(body.previous)
    ? body.previous
        .filter(
          (d): d is Dialectic =>
            typeof d === "object" && d !== null && typeof (d as Dialectic).question === "string",
        )
        .slice(-12)
        .map((d) => ({ question: clip(d.question), answer: clip(d.answer) }))
    : [];
  return { title: clip(body.title), thesis, body: clip(body.body), pillarId: body.pillarId, previous };
}

function buildUserMessage(request: ChallengeRequest): string {
  const pillar = PILLAR_BY_ID[request.pillarId as keyof typeof PILLAR_BY_ID];
  const asked = request.previous.length
    ? request.previous.map((d, i) => `${i + 1}. ${d.question}`).join("\n")
    : "(none)";
  return [
    `<pillar name="${pillar.name}" realm="${pillar.realm}" meaning="${pillar.translation}">`,
    pillar.description,
    `</pillar>`,
    ``,
    `<principle_title>${request.title || "(untitled)"}</principle_title>`,
    `<thesis>${request.thesis}</thesis>`,
    `<supporting_thoughts>${request.body || "(none given)"}</supporting_thoughts>`,
    ``,
    `<already_asked>`,
    asked,
    `</already_asked>`,
    ``,
    `Write the three trials for this principle.`,
  ].join("\n");
}

/** POST /api/challenge → { questions: string[] } — custom adversarial trials from Claude. */
export async function POST(request: NextRequest) {
  let parsed: ChallengeRequest | null = null;
  try {
    parsed = parseRequest(await request.json());
  } catch {
    parsed = null;
  }
  if (!parsed) {
    return NextResponse.json({ error: "A thesis and a valid pillar are required." }, { status: 400 });
  }

  let client: Anthropic;
  try {
    client = new Anthropic({ timeout: 55_000, maxRetries: 1 });
  } catch {
    return NextResponse.json(
      { available: false, error: "The Oracle is not configured (set ANTHROPIC_API_KEY)." },
      { status: 503 },
    );
  }

  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: OUTPUT_SCHEMA },
      },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserMessage(parsed) }],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json({ error: "The Oracle declined this thesis." }, { status: 422 });
    }

    const text = response.content
      .flatMap((block) => (block.type === "text" ? [block.text] : []))
      .join("")
      .trim();

    let questions: string[] = [];
    try {
      const data = JSON.parse(text) as { questions?: unknown };
      if (Array.isArray(data.questions)) {
        questions = data.questions
          .filter((q): q is string => typeof q === "string")
          .map((q) => q.trim())
          .filter((q) => q.length > 0)
          .slice(0, 3);
      }
    } catch {
      questions = [];
    }

    if (questions.length < 3) {
      return NextResponse.json({ error: "The Oracle answered in riddles. Try again." }, { status: 502 });
    }
    return NextResponse.json({ questions, model: response.model });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
      return NextResponse.json(
        { available: false, error: "The Oracle's key was rejected." },
        { status: 503 },
      );
    }
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "The Oracle is overwhelmed. Try again shortly." }, { status: 429 });
    }
    if (error instanceof Anthropic.APIConnectionError) {
      return NextResponse.json({ error: "The Oracle could not be reached." }, { status: 504 });
    }
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `The Oracle faltered (${error.status ?? "error"}).` }, { status: 502 });
    }
    // Every API failure is handled above. What remains was thrown before any request left the
    // server, which in practice means no credentials could be resolved (no ANTHROPIC_API_KEY).
    console.warn("[bonum] /api/challenge unavailable:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { available: false, error: "The Oracle is not configured (set ANTHROPIC_API_KEY)." },
      { status: 503 },
    );
  }
}
