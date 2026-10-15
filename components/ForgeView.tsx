"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bot,
  Church,
  Feather,
  Flame,
  Hammer,
  Library,
  Loader,
  RefreshCw,
  Scroll,
} from "lucide-react";
import { AnimatePresence, motion, useTransform, type MotionValue } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  appendDialectic,
  beginTrial,
  canonize,
  createAxiom,
  linkAntithesis,
  updateDraft,
} from "@/lib/actions";
import { canonOrder, db, isCanon } from "@/lib/db";
import { useAxioms, usePillarStats } from "@/lib/hooks";
import { PILLARS, PILLAR_BY_ID } from "@/lib/pillars";
import { realmColor, springs, withAlpha } from "@/lib/theme";
import { showToast } from "@/lib/toast";
import { alternateTrial, selectTrials } from "@/lib/trials";
import type { Axiom, Dialectic, PillarId } from "@/lib/types";
import { relativeTime, toRoman } from "@/lib/util";
import { useBonumNav } from "./BonumContext";
import { CathedralSigil } from "./CathedralSigil";
import { GoldBurst } from "./GoldBurst";
import { HoldToEtch, useHoldProgress } from "./HoldToEtch";
import { PillarGlyph } from "./PillarGlyph";

/* ═══════════════════════════════ Session model ═══════════════════════════════ */

type Step = "index" | "thesis" | "trials" | "ceremony";

interface Draft {
  title: string;
  thesis: string;
  body: string;
  pillarId: PillarId | null;
  antithesisId: string | null;
}

interface TrialState {
  questions: string[];
  answers: string[];
  index: number;
  source: "curated" | "oracle";
  round: string;
}

interface ForgeSession {
  step: Step;
  axiomId: string | null;
  draft: Draft;
  trials: TrialState | null;
  finalTitle: string;
  finalThesis: string;
  etchedId: string | null;
}

const EMPTY_DRAFT: Draft = { title: "", thesis: "", body: "", pillarId: null, antithesisId: null };
const EMPTY_SESSION: ForgeSession = {
  step: "index",
  axiomId: null,
  draft: EMPTY_DRAFT,
  trials: null,
  finalTitle: "",
  finalThesis: "",
  etchedId: null,
};

/** The forge remembers an unfinished session across view switches for the life of the page. */
let rememberedSession: ForgeSession = EMPTY_SESSION;
let handledRequestNonce = 0;

const MIN_THESIS = 12;
const MIN_DEFENSE = 12;
const OPPOSITE: Partial<Record<PillarId, PillarId>> = {
  "bonus-affectus": "malum-adfectus",
  "malum-adfectus": "bonus-affectus",
};

function draftFromAxiom(axiom: Axiom): Draft {
  return {
    title: axiom.title,
    thesis: axiom.thesis,
    body: axiom.bodyMarkdown,
    pillarId: axiom.pillarId,
    antithesisId: axiom.antithesisId,
  };
}

function draftFromSeed(seed: string | undefined, pillarId: PillarId | null): Draft {
  if (!seed) return { ...EMPTY_DRAFT, pillarId };
  const firstLine = seed.split("\n")[0].trim();
  const title = firstLine.length <= 60 ? firstLine.replace(/[.;:]$/, "") : "";
  return { ...EMPTY_DRAFT, pillarId, title, thesis: seed.trim() };
}

async function summonOracle(input: {
  title: string;
  thesis: string;
  body: string;
  pillarId: PillarId;
  previous: Dialectic[];
}): Promise<string[]> {
  const response = await fetch("/api/challenge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await response.json().catch(() => ({}))) as { questions?: string[]; error?: string };
  if (!response.ok || !Array.isArray(data.questions) || data.questions.length === 0) {
    throw new Error(data.error ?? "The Oracle is silent.");
  }
  return data.questions;
}

/* ═══════════════════════════════════ View ═══════════════════════════════════ */

export function ForgeView() {
  const nav = useBonumNav();
  const axioms = useAxioms();
  const [session, setSession] = useState<ForgeSession>(() => rememberedSession);

  useEffect(() => {
    rememberedSession = session;
  }, [session]);

  const openAxiom = useCallback(async (id: string) => {
    const axiom = await db.axioms.get(id);
    if (!axiom) {
      showToast({ title: "That spark could not be found." });
      return;
    }
    setSession({ ...EMPTY_SESSION, step: "thesis", axiomId: axiom.id, draft: draftFromAxiom(axiom) });
  }, []);

  // Requests from the deck, tomes and palette.
  useEffect(() => {
    const request = nav.forgeRequest;
    if (!request || request.nonce === handledRequestNonce) return;
    handledRequestNonce = request.nonce;
    if (request.axiomId) {
      void openAxiom(request.axiomId);
    } else if (request.pillarId || request.seedText) {
      setSession({
        ...EMPTY_SESSION,
        step: "thesis",
        draft: draftFromSeed(request.seedText, request.pillarId ?? null),
      });
    }
  }, [nav.forgeRequest, openAxiom]);

  const stepIndex = session.step === "thesis" ? 0 : session.step === "trials" ? 1 : session.step === "ceremony" ? 2 : -1;

  return (
    <div className="mb-safe-tabbar pt-safe mx-auto max-w-5xl px-5 md:mb-0 md:px-10 md:pb-16">
      <header className="flex flex-wrap items-end justify-between gap-5 pt-14 md:pt-12">
        <div>
          <p className="font-mono text-[11px] tracking-[0.22em] text-parchment">OFFICINA</p>
          <h1 className="mt-2 font-serif text-[2.75rem] font-medium leading-none md:text-[3.5rem]">The Forge</h1>
          <p className="mt-2 max-w-lg font-serif text-lg italic text-parchment">
            No principle enters the Canon untested. State it, defend it thrice, then etch it.
          </p>
        </div>
        {stepIndex >= 0 && <StepRail active={stepIndex} />}
      </header>

      <div className="hairline mt-7" />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={session.step}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -18 }}
          transition={springs.card}
          className="mt-8"
        >
          {session.step === "index" && (
            <CrucibleIndex
              axioms={axioms}
              onNew={() => setSession({ ...EMPTY_SESSION, step: "thesis" })}
              onOpen={(id) => void openAxiom(id)}
            />
          )}
          {session.step === "thesis" && (
            <ThesisStep session={session} setSession={setSession} axioms={axioms ?? []} />
          )}
          {session.step === "trials" && session.trials && session.axiomId && (
            <TrialsStep session={session} setSession={setSession} />
          )}
          {session.step === "ceremony" && session.axiomId && (
            <CeremonyStep session={session} setSession={setSession} axioms={axioms ?? []} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function StepRail({ active }: { active: number }) {
  const steps = ["Thesis", "Trials", "Etching"];
  return (
    <ol className="flex items-center gap-1 rounded-full bg-stone p-1 ring-1 ring-white/[0.06]">
      {steps.map((label, i) => (
        <li
          key={label}
          className={`relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] ${
            i === active ? "text-obsidian" : i < active ? "text-gold" : "text-parchment"
          }`}
        >
          {i === active && (
            <motion.span layoutId="forge-step" transition={springs.snappy} className="absolute inset-0 rounded-full bg-gold" />
          )}
          <span className="relative font-mono text-[10px]">{toRoman(i + 1)}</span>
          <span className="relative">{label}</span>
        </li>
      ))}
    </ol>
  );
}

/* ═══════════════════════════════ The Crucible index ═══════════════════════════════ */

function CrucibleIndex({
  axioms,
  onNew,
  onOpen,
}: {
  axioms: Axiom[] | undefined;
  onNew: () => void;
  onOpen: (id: string) => void;
}) {
  const crucible = (axioms ?? []).filter((a) => a.stage === "Crucible").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const sparks = (axioms ?? []).filter((a) => a.stage === "Spark").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div className="space-y-10">
      <motion.button
        type="button"
        onClick={onNew}
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.985 }}
        transition={springs.snappy}
        className="parchment group relative flex w-full items-center gap-5 overflow-hidden rounded-[22px] px-6 py-7 text-left md:px-9"
      >
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-ink text-gold">
          <Hammer size={22} strokeWidth={1.4} />
        </span>
        <span className="flex-1">
          <span className="block font-serif text-[1.8rem] font-semibold leading-tight">Strike a new Spark</span>
          <span className="mt-1 block font-serif text-lg italic text-ink/70">
            Begin with a raw intuition. The trials will tell you whether it is law.
          </span>
        </span>
        <ArrowRight size={22} className="text-ink/60 transition-transform duration-300 group-hover:translate-x-1" />
      </motion.button>

      <SparkList title="In the Crucible" gloss="Questioned, waiting to be reforged" items={crucible} onOpen={onOpen} ember />
      <SparkList title="Sparks" gloss="Untested intuitions" items={sparks} onOpen={onOpen} />
    </div>
  );
}

function SparkList({
  title,
  gloss,
  items,
  onOpen,
  ember,
}: {
  title: string;
  gloss: string;
  items: Axiom[];
  onOpen: (id: string) => void;
  ember?: boolean;
}) {
  return (
    <section>
      <div className="mb-4 flex items-baseline gap-3">
        <h2 className="small-caps text-[14px] text-vellum/90">{title}</h2>
        <span className="font-serif text-[15px] italic text-parchment">{gloss}</span>
        <span className="ml-auto font-mono text-[11px] text-parchment">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 px-6 py-8 text-center font-serif text-lg italic text-parchment">
          {ember ? "Nothing smoulders here." : "No sparks yet. The quill is always at hand."}
        </p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {items.map((axiom) => (
            <li key={axiom.id}>
              <motion.button
                type="button"
                onClick={() => onOpen(axiom.id)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.985 }}
                transition={springs.snappy}
                className="stone-panel flex h-full w-full flex-col rounded-2xl p-5 text-left"
              >
                <span className="flex items-center gap-2 text-[11px] text-parchment">
                  <span style={{ color: realmColor(PILLAR_BY_ID[axiom.pillarId].realm) }}>
                    <PillarGlyph pillarId={axiom.pillarId} size={13} />
                  </span>
                  <span className="small-caps">{PILLAR_BY_ID[axiom.pillarId].name}</span>
                  {ember && <Flame size={12} className="text-[#E0927A]" />}
                  <span className="ml-auto font-mono text-[10px]">{relativeTime(axiom.updatedAt)}</span>
                </span>
                <span className="mt-3 font-serif text-[1.3rem] font-semibold leading-tight text-vellum">{axiom.title}</span>
                <span className="mt-1.5 line-clamp-2 font-serif text-[1.02rem] italic text-vellum/70">{axiom.thesis}</span>
              </motion.button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ═══════════════════════════════ Step I · The Thesis ═══════════════════════════════ */

function AutoTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { minRows?: number }) {
  const { minRows = 2, value, ...rest } = props;
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return <textarea ref={ref} rows={minRows} value={value} {...rest} />;
}

type SessionSetter = React.Dispatch<React.SetStateAction<ForgeSession>>;

function ThesisStep({
  session,
  setSession,
  axioms,
}: {
  session: ForgeSession;
  setSession: SessionSetter;
  axioms: Axiom[];
}) {
  const { draft } = session;
  const [busy, setBusy] = useState(false);
  const existing = session.axiomId ? axioms.find((a) => a.id === session.axiomId) : undefined;

  const setDraft = (patch: Partial<Draft>) =>
    setSession((s) => ({ ...s, draft: { ...s.draft, ...patch } }));

  const opposite = draft.pillarId ? OPPOSITE[draft.pillarId] : undefined;
  const antithesisOptions = opposite
    ? axioms.filter((a) => a.pillarId === opposite && a.id !== session.axiomId)
    : [];

  const valid = Boolean(draft.pillarId) && draft.title.trim().length >= 2 && draft.thesis.trim().length >= MIN_THESIS;

  /** Saves the draft. Entering the trials also moves the axiom into the Crucible. */
  const persist = async (enterTrial: boolean): Promise<string | null> => {
    if (!draft.pillarId) return null;
    const antithesisId = opposite ? draft.antithesisId : null;
    if (!session.axiomId) {
      const created = await createAxiom({
        title: draft.title,
        thesis: draft.thesis,
        bodyMarkdown: draft.body,
        pillarId: draft.pillarId,
        stage: enterTrial ? "Crucible" : "Spark",
        antithesisId,
      });
      return created.id;
    }
    await updateDraft(session.axiomId, {
      title: draft.title.trim(),
      thesis: draft.thesis.trim(),
      bodyMarkdown: draft.body.trim(),
      pillarId: draft.pillarId,
    });
    if ((existing?.antithesisId ?? null) !== antithesisId) await linkAntithesis(session.axiomId, antithesisId);
    if (enterTrial) await beginTrial(session.axiomId);
    return session.axiomId;
  };

  const keepAsSpark = async () => {
    if (!valid || busy) return;
    setBusy(true);
    try {
      await persist(false);
      showToast({
        title: existing?.stage === "Crucible" ? "Kept in the Crucible" : "Kept as a Spark",
        detail: draft.title,
        tone: "gold",
      });
      setSession(EMPTY_SESSION);
    } finally {
      setBusy(false);
    }
  };

  const enterTrials = async () => {
    if (!valid || busy || !draft.pillarId) return;
    setBusy(true);
    try {
      const id = await persist(true);
      if (!id) return;
      const axiom = await db.axioms.get(id);
      const round = `${id}:${axiom?.dialectics.length ?? 0}`;
      setSession((s) => ({
        ...s,
        axiomId: id,
        step: "trials",
        trials: {
          questions: selectTrials(draft.pillarId!, round),
          answers: [],
          index: 0,
          source: "curated",
          round,
        },
      }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]"
      onKeyDown={(event) => {
        if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          void enterTrials();
        }
      }}
    >
      <div className="rounded-[22px] bg-obsidian px-5 py-7 ring-1 ring-white/[0.06] md:px-10 md:py-10">
        {existing && isCanon(existing) && (
          <p className="mb-5 rounded-xl bg-[#B4543A]/10 px-4 py-3 text-[13px] text-[#E0927A] ring-1 ring-[#B4543A]/30">
            This law is Canon. Entering the trials returns it to the Crucible; etching it again marks it Reforged.
          </p>
        )}
        <label className="block">
          <span className="font-mono text-[10.5px] tracking-[0.2em] text-parchment">NOMEN · THE NAME OF THE LAW</span>
          <input
            value={draft.title}
            onChange={(event) => setDraft({ title: event.target.value })}
            placeholder="The Unhurried Ear"
            maxLength={120}
            autoFocus={!draft.title}
            className="mt-2 w-full bg-transparent font-serif text-[2rem] font-semibold leading-tight text-vellum placeholder:text-vellum/20 focus:outline-none md:text-[2.4rem]"
          />
        </label>
        <div className="hairline my-6" />
        <label className="block">
          <span className="font-mono text-[10.5px] tracking-[0.2em] text-parchment">THESIS · AS YOU WOULD CARVE IT</span>
          <AutoTextarea
            value={draft.thesis}
            onChange={(event) => setDraft({ thesis: event.target.value })}
            placeholder="State the principle plainly, in a sentence or two that could be read aloud at dawn…"
            minRows={3}
            className="mt-3 w-full resize-none overflow-hidden bg-transparent font-serif text-[1.6rem] leading-[1.4] text-vellum placeholder:italic placeholder:text-vellum/25 focus:outline-none md:text-[1.85rem]"
          />
        </label>
        <label className="mt-8 block">
          <span className="font-mono text-[10.5px] tracking-[0.2em] text-parchment">GLOSS · SUPPORTING THOUGHTS</span>
          <AutoTextarea
            value={draft.body}
            onChange={(event) => setDraft({ body: event.target.value })}
            placeholder="Where did this come from? What experience taught it? Markdown is welcome: *emphasis*, > quotations, - lists."
            minRows={3}
            className="mt-3 w-full resize-none overflow-hidden bg-transparent text-[15px] leading-relaxed text-vellum/85 placeholder:text-vellum/25 focus:outline-none"
          />
        </label>
      </div>

      <aside className="flex flex-col gap-6">
        <fieldset>
          <legend className="font-mono text-[10.5px] tracking-[0.2em] text-parchment">THE TOME IT BELONGS TO</legend>
          <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-1">
            {PILLARS.map((pillar) => {
              const active = draft.pillarId === pillar.id;
              return (
                <button
                  key={pillar.id}
                  type="button"
                  onClick={() => setDraft({ pillarId: pillar.id, antithesisId: OPPOSITE[pillar.id] ? draft.antithesisId : null })}
                  aria-pressed={active}
                  className={`relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] transition-colors ${
                    active ? "text-vellum" : "text-parchment hover:text-vellum"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="forge-pillar"
                      transition={springs.snappy}
                      className="absolute inset-0 rounded-xl ring-1 ring-gold/50"
                      style={{ background: withAlpha(realmColor(pillar.realm), 0.22) }}
                    />
                  )}
                  <span className="relative" style={{ color: active ? "var(--color-gold)" : realmColor(pillar.realm) }}>
                    <PillarGlyph pillarId={pillar.id} size={15} />
                  </span>
                  <span className="relative leading-tight">{pillar.name}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {opposite && (
          <label className="block">
            <span className="font-mono text-[10.5px] tracking-[0.2em] text-parchment">
              ANTITHESIS IN {PILLAR_BY_ID[opposite].name.toUpperCase()}
            </span>
            <select
              value={draft.antithesisId ?? ""}
              onChange={(event) => setDraft({ antithesisId: event.target.value || null })}
              className="mt-2 w-full rounded-xl bg-stone px-3 py-2.5 text-[13px] text-vellum ring-1 ring-white/10 focus:outline-none focus:ring-gold/50"
            >
              <option value="">None</option>
              {antithesisOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.title}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="mt-auto flex flex-col gap-2.5">
          <motion.button
            type="button"
            disabled={!valid || busy}
            onClick={() => void enterTrials()}
            whileTap={{ scale: 0.97 }}
            transition={springs.press}
            className="flex items-center justify-center gap-2 rounded-xl bg-gold py-3.5 text-[14px] font-semibold text-obsidian disabled:bg-gold/25 disabled:text-obsidian/60"
          >
            Enter the Trials <ArrowRight size={16} />
          </motion.button>
          {!(existing && isCanon(existing)) && (
            <button
              type="button"
              disabled={!valid || busy}
              onClick={() => void keepAsSpark()}
              className="flex items-center justify-center gap-2 rounded-xl py-3 text-[13px] text-parchment ring-1 ring-white/10 hover:text-vellum disabled:opacity-40"
            >
              <Feather size={14} /> {existing?.stage === "Crucible" ? "Save and leave it smouldering" : "Keep as a Spark"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setSession(EMPTY_SESSION)}
            className="py-2 text-[12.5px] text-parchment/70 hover:text-parchment"
          >
            Return to the Crucible
          </button>
          {!valid && (
            <p className="text-center font-mono text-[10px] tracking-[0.12em] text-parchment/60">
              A TOME, A NAME, AND A THESIS OF {MIN_THESIS}+ CHARACTERS
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}

/* ═══════════════════════════════ Step II · The Socratic Trial ═══════════════════════════════ */

function TrialsStep({ session, setSession }: { session: ForgeSession; setSession: SessionSetter }) {
  const trials = session.trials!;
  const axiomId = session.axiomId!;
  const pillarId = session.draft.pillarId!;
  const [defense, setDefense] = useState("");
  const [oracleLoading, setOracleLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const question = trials.questions[trials.index];
  const answeredCount = trials.answers.length;

  const setTrials = (patch: Partial<TrialState>) =>
    setSession((s) => (s.trials ? { ...s, trials: { ...s.trials, ...patch } } : s));

  const toggleOracle = async (useOracle: boolean) => {
    if (oracleLoading) return;
    if (!useOracle) {
      const asked = trials.questions.slice(0, answeredCount);
      const curated = selectTrials(pillarId, trials.round).filter((q) => !asked.includes(q));
      setTrials({ source: "curated", questions: [...asked, ...curated].slice(0, 3) });
      return;
    }
    setOracleLoading(true);
    try {
      const axiom = await db.axioms.get(axiomId);
      const asked = await summonOracle({
        title: session.draft.title,
        thesis: session.draft.thesis,
        body: session.draft.body,
        pillarId,
        previous: axiom?.dialectics ?? [],
      });
      setSession((s) =>
        s.trials
          ? {
              ...s,
              trials: {
                ...s.trials,
                source: "oracle",
                questions: [...s.trials.questions.slice(0, s.trials.answers.length), ...asked].slice(0, 3),
              },
            }
          : s,
      );
    } catch (error) {
      showToast({
        title: "The Oracle is silent",
        detail: `${error instanceof Error ? error.message : "Unavailable"} The curated trials stand.`,
        tone: "crimson",
      });
    } finally {
      setOracleLoading(false);
    }
  };

  const summonAnother = () => {
    const replacement = alternateTrial(pillarId, trials.questions, `${trials.round}:${trials.index}:${Date.now()}`);
    const questions = [...trials.questions];
    questions[trials.index] = replacement;
    setTrials({ questions });
  };

  const submit = async () => {
    const answer = defense.trim();
    if (answer.length < MIN_DEFENSE || submitting || !question) return;
    setSubmitting(true);
    try {
      await appendDialectic(axiomId, { question, answer });
      const answers = [...trials.answers, answer];
      setDefense("");
      if (answers.length >= 3) {
        setSession((s) => ({
          ...s,
          step: "ceremony",
          trials: s.trials ? { ...s.trials, answers, index: 3 } : s.trials,
          finalTitle: s.draft.title,
          finalThesis: s.draft.thesis,
        }));
      } else {
        setTrials({ answers, index: trials.index + 1 });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] tracking-[0.2em] text-parchment">
            TRIAL {toRoman(Math.min(trials.index + 1, 3))} OF III
          </span>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`h-1 w-6 rounded-full transition-colors duration-500 ${
                  i < answeredCount ? "bg-gold" : i === trials.index ? "bg-gold/45" : "bg-white/10"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center rounded-full bg-stone p-1 text-[12px] ring-1 ring-white/[0.06]">
          {(
            [
              ["curated", "Curated", Scroll],
              ["oracle", "Oracle", Bot],
            ] as const
          ).map(([key, label, Icon]) => {
            const active = trials.source === key;
            return (
              <button
                key={key}
                type="button"
                disabled={oracleLoading}
                onClick={() => void toggleOracle(key === "oracle")}
                className={`relative flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${
                  active ? "text-obsidian" : "text-parchment hover:text-vellum"
                }`}
                title={key === "oracle" ? "Ask an LLM adversary for custom challenges" : "Use the curated Socratic engine"}
              >
                {active && (
                  <motion.span layoutId="adversary" transition={springs.snappy} className="absolute inset-0 rounded-full bg-gold" />
                )}
                <Icon size={13} className="relative" />
                <span className="relative">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-6 line-clamp-2 border-l border-gold/40 pl-4 font-serif text-[1.1rem] italic text-parchment">
        {session.draft.thesis}
      </p>

      <div className="relative mt-8 min-h-[150px] overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.h2
            key={`${trials.index}:${question}`}
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: oracleLoading ? 0.12 : 1, y: 0 }}
            exit={{ opacity: 0, y: -48 }}
            transition={springs.card}
            className="font-serif text-[1.75rem] font-medium leading-[1.25] text-vellum md:text-[2.15rem]"
          >
            {question}
          </motion.h2>
        </AnimatePresence>
        <AnimatePresence>
          {oracleLoading && (
            <motion.div
              key="oracle-loading"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={springs.card}
              className="absolute inset-0 flex items-center gap-3 font-serif text-[1.4rem] italic text-parchment"
            >
              <motion.span animate={{ rotate: 360 }} transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}>
                <Loader size={20} className="text-gold" />
              </motion.span>
              The Adversary is reading your thesis…
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-6 rounded-[20px] bg-obsidian p-5 ring-1 ring-white/[0.07] focus-within:ring-gold/40 md:p-6">
        <AutoTextarea
          value={defense}
          onChange={(event) => setDefense(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              void submit();
            }
          }}
          placeholder="Your defense, or the refinement this question forces…"
          minRows={4}
          autoFocus
          className="w-full resize-none overflow-hidden bg-transparent text-[16px] leading-relaxed text-vellum placeholder:text-vellum/25 focus:outline-none"
        />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={summonAnother}
            disabled={oracleLoading}
            className="flex items-center gap-1.5 text-[12.5px] text-parchment hover:text-vellum"
          >
            <RefreshCw size={13} /> Summon another question
          </button>
          {answeredCount === 0 && (
            <button
              type="button"
              onClick={() => setSession((s) => ({ ...s, step: "thesis" }))}
              className="flex items-center gap-1.5 text-[12.5px] text-parchment hover:text-vellum"
            >
              <ArrowLeft size={13} /> Revise the thesis
            </button>
          )}
          <span className="ml-auto font-mono text-[10px] tracking-[0.12em] text-parchment/60">
            {defense.trim().length < MIN_DEFENSE ? `${MIN_DEFENSE - defense.trim().length} MORE` : "⌘↵"}
          </span>
          <motion.button
            type="button"
            disabled={defense.trim().length < MIN_DEFENSE || submitting || oracleLoading}
            onClick={() => void submit()}
            whileTap={{ scale: 0.96 }}
            transition={springs.press}
            className="flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-[13.5px] font-semibold text-obsidian disabled:bg-gold/25 disabled:text-obsidian/60"
          >
            {answeredCount === 2 ? "Final defense" : "Submit defense"} <ArrowRight size={15} />
          </motion.button>
        </div>
      </div>

      {answeredCount > 0 && (
        <ol className="mt-8 space-y-4">
          {trials.answers.map((answer, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-l border-white/10 pl-4"
            >
              <p className="font-mono text-[10px] tracking-[0.16em] text-gold/80">TRIAL {toRoman(i + 1)} · DEFENDED</p>
              <p className="mt-1 font-serif text-[1rem] italic text-parchment">{trials.questions[i]}</p>
              <p className="mt-1 text-[14px] text-vellum/80">{answer}</p>
            </motion.li>
          ))}
        </ol>
      )}
    </div>
  );
}

/* ═══════════════════════════════ Step III · The Canonization Ceremony ═══════════════════════════════ */

function CeremonyStep({
  session,
  setSession,
  axioms,
}: {
  session: ForgeSession;
  setSession: SessionSetter;
  axioms: Axiom[];
}) {
  const nav = useBonumNav();
  const axiomId = session.axiomId!;
  const pillarId = session.draft.pillarId!;
  const pillar = PILLAR_BY_ID[pillarId];
  const etched = session.etchedId === axiomId;
  const [burst, setBurst] = useState<number | null>(null);
  const [pulseKey, setPulseKey] = useState<number | null>(null);
  const stats = usePillarStats(axioms);

  const onComplete = useCallback(() => {
    const key = Date.now();
    setBurst(key);
    void canonize(axiomId, session.finalThesis, session.finalTitle).then((result) => {
      setSession((s) => ({ ...s, etchedId: axiomId }));
      setTimeout(() => setPulseKey(Date.now()), 450);
      if (!result) showToast({ title: "The law could not be found to etch.", tone: "crimson" });
    });
  }, [axiomId, session.finalThesis, session.finalTitle, setSession]);

  const canEtch = session.finalThesis.trim().length >= MIN_THESIS && session.finalTitle.trim().length >= 2;
  const { progress, holding, start, release } = useHoldProgress({ disabled: !canEtch || etched, onComplete });

  const numeral = useMemo(() => {
    const canon = axioms.filter((a) => a.pillarId === pillarId && isCanon(a)).sort(canonOrder);
    const index = canon.findIndex((a) => a.id === axiomId);
    return index >= 0 ? toRoman(index + 1) : toRoman(canon.length + 1);
  }, [axioms, axiomId, pillarId]);

  const axiom = axioms.find((a) => a.id === axiomId);
  const wasReforged = axiom?.stage === "Reforged";
  const trials = session.trials;

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
      <div className="relative mx-auto w-full max-w-[400px]">
        <EtchCard
          title={session.finalTitle}
          thesis={session.finalThesis}
          pillarId={pillarId}
          progress={progress}
          etched={etched}
          numeral={numeral}
          reforged={wasReforged}
        />
        <GoldBurst burstKey={burst} />
      </div>

      <div>
        <AnimatePresence mode="wait" initial={false}>
          {!etched ? (
            <motion.div key="refine" exit={{ opacity: 0, y: -12 }} transition={springs.snappy}>
              <p className="font-mono text-[10.5px] tracking-[0.2em] text-parchment">THE FINAL FORM</p>
              <p className="mt-2 font-serif text-lg italic text-parchment">
                The trials may have changed the law. Refine it once more before it is fixed.
              </p>
              <input
                value={session.finalTitle}
                onChange={(event) => setSession((s) => ({ ...s, finalTitle: event.target.value }))}
                className="mt-6 w-full bg-transparent font-serif text-[1.9rem] font-semibold text-vellum focus:outline-none"
                aria-label="Final title"
                maxLength={120}
              />
              <AutoTextarea
                value={session.finalThesis}
                onChange={(event) => setSession((s) => ({ ...s, finalThesis: event.target.value }))}
                minRows={3}
                aria-label="Final thesis"
                className="mt-3 w-full resize-none overflow-hidden rounded-2xl bg-obsidian p-5 font-serif text-[1.45rem] leading-snug text-vellum ring-1 ring-white/[0.07] focus:outline-none focus:ring-gold/40"
              />

              {trials && (
                <details className="group mt-5 rounded-2xl bg-stone/60 px-5 py-4 ring-1 ring-white/[0.05]">
                  <summary className="cursor-pointer list-none font-mono text-[10.5px] tracking-[0.18em] text-parchment">
                    THE THREE TRIALS <span className="text-gold group-open:hidden">· SHOW</span>
                  </summary>
                  <ol className="mt-4 space-y-4">
                    {trials.answers.map((answer, i) => (
                      <li key={i}>
                        <p className="font-serif italic text-parchment">{trials.questions[i]}</p>
                        <p className="mt-1 text-[14px] text-vellum/80">{answer}</p>
                      </li>
                    ))}
                  </ol>
                </details>
              )}

              <div className="mt-8">
                <HoldToEtch
                  progress={progress}
                  holding={holding}
                  disabled={!canEtch}
                  onStart={start}
                  onRelease={release}
                />
                <p className="mt-3 text-center font-mono text-[10px] tracking-[0.14em] text-parchment/60">
                  PRESS AND HOLD · {(1.5).toFixed(1)} SECONDS · RELEASE TO RECONSIDER
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="etched"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.ceremony, delay: 0.35 }}
              className="flex flex-col items-start"
            >
              <p className="font-mono text-[10.5px] tracking-[0.2em] text-gold">
                {wasReforged ? "REFORGED" : "CANONIZED"} · {pillar.name.toUpperCase()} · LEX {numeral}
              </p>
              <h2 className="mt-3 font-serif text-[2.3rem] font-medium leading-tight text-vellum">It is written.</h2>
              <p className="mt-2 max-w-md font-serif text-lg italic text-parchment">
                {pillar.name} grows brighter. The law will return to you in the Daily Deal, to be affirmed or questioned
                again.
              </p>

              {stats && (
                <div className="mt-6 w-44">
                  <CathedralSigil
                    stats={stats}
                    selectedPillarId={pillarId}
                    pulse={pulseKey ? { pillarId, key: pulseKey } : null}
                  />
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => nav.openTome(pillarId, axiomId)}
                  className="flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-[13px] font-semibold text-obsidian"
                >
                  <BookOpen size={14} /> Read it in the Tome
                </button>
                <button
                  type="button"
                  onClick={() => setSession({ ...EMPTY_SESSION, step: "thesis" })}
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] text-vellum ring-1 ring-white/15 hover:ring-gold/40"
                >
                  <Hammer size={14} /> Forge another
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSession(EMPTY_SESSION);
                    nav.setMode("sanctuary");
                  }}
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] text-parchment hover:text-vellum"
                >
                  <Church size={14} /> Sanctuary
                </button>
                <button
                  type="button"
                  onClick={() => setSession(EMPTY_SESSION)}
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] text-parchment hover:text-vellum"
                >
                  <Library size={14} /> The Crucible
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** The card itself: rough parchment that turns to obsidian and gold once the hold completes. */
function EtchCard({
  title,
  thesis,
  pillarId,
  progress,
  etched,
  numeral,
  reforged,
}: {
  title: string;
  thesis: string;
  pillarId: PillarId;
  progress: MotionValue<number>;
  etched: boolean;
  numeral: string;
  reforged: boolean;
}) {
  const pillar = PILLAR_BY_ID[pillarId];
  const scale = useTransform(progress, [0, 1], [1, 1.025]);
  const warmth = useTransform(progress, [0, 1], [0, 0.4]);
  // A zero-length stroke still paints its end cap; hide the border until the hold begins.
  const borderOpacity = useTransform(progress, [0, 0.015], [0, 1]);

  return (
    <motion.div
      style={{ perspective: 1200 }}
      initial={false}
      animate={etched ? { rotateY: [0, 10, 0], scale: [1, 1.035, 1] } : { rotateY: 0, scale: 1 }}
      transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
    >
    <motion.div className="relative aspect-[4/5] w-full" style={{ scale }}>
      {/* Spark: rough parchment */}
      <motion.div
        className="parchment absolute inset-0 flex flex-col rounded-[22px] p-7"
        animate={{ opacity: etched ? 0 : 1 }}
        transition={{ duration: 0.9 }}
      >
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-[22px]"
          style={{
            opacity: warmth,
            background: "radial-gradient(120% 90% at 50% 100%, rgba(197,160,89,0.9), transparent 70%)",
          }}
        />
        <div className="relative flex items-center gap-2 text-ink/70">
          <PillarGlyph pillarId={pillarId} size={15} />
          <span className="small-caps text-[13px]">{pillar.name}</span>
          <span className="ml-auto font-mono text-[10px] tracking-[0.16em] text-ink/50">CRUCIBLE</span>
        </div>
        <div className="relative my-5 h-px bg-ink/15" />
        <h3 className="relative font-serif text-[1.7rem] font-semibold leading-tight text-ink">{title || "Untitled"}</h3>
        <p className="relative mt-3 line-clamp-[8] font-serif text-[1.25rem] italic leading-snug text-ink/85">{thesis}</p>
      </motion.div>

      {/* Canon: obsidian and gold */}
      <motion.div
        className="obsidian-card absolute inset-0 flex flex-col rounded-[22px] p-7"
        initial={false}
        animate={{ opacity: etched ? 1 : 0 }}
        transition={{ duration: 0.9, delay: 0.15 }}
        style={{ boxShadow: "0 0 80px -20px rgba(197,160,89,0.55), inset 0 0 0 1px rgba(197,160,89,0.6)" }}
        aria-hidden={!etched}
      >
        <div className="flex items-center gap-2 text-gold">
          <PillarGlyph pillarId={pillarId} size={15} />
          <span className="small-caps text-[13px] text-vellum/90">{pillar.name}</span>
          <span className="ml-auto font-mono text-[10px] tracking-[0.16em] text-gold">
            {reforged ? "REFORGED" : "CANON"}
          </span>
        </div>
        <div className="hairline my-5" />
        <span className="gold-text font-serif text-[3rem] font-semibold leading-none">{numeral}.</span>
        <h3 className="mt-3 font-serif text-[1.6rem] font-semibold leading-tight text-vellum">{title}</h3>
        <p className="mt-3 line-clamp-6 font-serif text-[1.2rem] italic leading-snug text-vellum/85">{thesis}</p>
      </motion.div>

      {/* the gold border, drawn by the hold */}
      <svg
        viewBox="0 0 400 500"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 size-full overflow-visible"
        aria-hidden
      >
        <motion.rect
          x={2}
          y={2}
          width={396}
          height={496}
          rx={22}
          fill="none"
          stroke="url(#etch-gold)"
          strokeWidth={3.5}
          strokeLinecap="round"
          style={{ pathLength: progress, opacity: borderOpacity }}
        />
        <defs>
          <linearGradient id="etch-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ECD39A" />
            <stop offset="50%" stopColor="#C5A059" />
            <stop offset="100%" stopColor="#8E6F33" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
    </motion.div>
  );
}
