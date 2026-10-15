import Dexie, { type EntityTable } from "dexie";
import { PILLARS, PILLAR_BY_ID } from "./pillars";
import type { Axiom, MetaEntry, Pillar, Ritual, SyncQueueEntry } from "./types";
import { daysAgoISO } from "./util";

export { PILLARS, PILLAR_BY_ID, PILLAR_BY_NAME, pillarByName } from "./pillars";


/* ═══════════════════════════════ Starter Axioms ═══════════════════════════════ */

type SeedAxiom = Omit<Axiom, "realm" | "notionId" | "notionEditedAt" | "notionHash" | "syncStatus" | "createdAt" | "updatedAt"> & {
  createdDaysAgo: number;
};

const SEED_AXIOMS: readonly SeedAxiom[] = [
  /* ── Relatio ───────────────────────────────────────────── */
  {
    id: "seed-relatio-unhurried-ear",
    title: "The Unhurried Ear",
    pillarId: "relatio",
    stage: "Canon",
    thesis:
      "Attention is the first form of love. When another speaks, I listen to understand, not to reply; my rebuttal can wait until their meaning has fully arrived.",
    dialectics: [
      {
        question:
          "Does this principle still hold when the other person acts in bad faith, or is it merely a covert contract?",
        answer:
          "It holds, but it changes shape. I can grant full attention to someone acting in bad faith; attention is not agreement and it is not surrender. Listening fully is how I learn that it is bad faith.",
      },
      {
        question: "What does this principle cost you, concretely, the next time it is tested?",
        answer:
          "The pleasure of being quick. I lose the small victory of the clever interruption, and sometimes I lose the argument because I took time to understand the other side.",
      },
      {
        question: "If everyone you love lived by this rule toward you, would you feel more known or more managed?",
        answer: "More known. Being managed feels like technique; being heard feels like presence. The test is whether I stop rehearsing.",
      },
    ],
    bodyMarkdown:
      "Most conversations are two people taking turns waiting.\n\nThe practice: when I notice my reply forming, I set it down and ask one more question. *Tell me more about that* is almost always the right sentence.\n\n> To be heard is to be granted existence a second time.",
    antithesisId: null,
    resonance: 4,
    lastContemplated: daysAgoISO(9),
    canonizedAt: daysAgoISO(48),
    createdDaysAgo: 52,
  },
  {
    id: "seed-relatio-repair-before-nightfall",
    title: "Repair Before Nightfall",
    pillarId: "relatio",
    stage: "Canon",
    thesis:
      "A rupture with someone I love is tended the same day, even if only by naming it. Silence compounds like interest; a small repair today saves a large reckoning later.",
    dialectics: [
      {
        question: "What would the most generous person you know say about this principle?",
        answer:
          "That repair is not always confession. Sometimes it is just saying: something went wrong between us earlier, and I care about that. Naming is enough to stop the compounding.",
      },
      {
        question: "Where does this principle end and self-erasure begin?",
        answer:
          "It ends where I would be repairing a harm I did not cause by absorbing all of the blame. The rule asks me to tend the bond, not to always be the one at fault.",
      },
      {
        question: "Does this principle still hold when the other person needs time and space before they can talk?",
        answer:
          "Yes, if I adapt the form. I can name the rupture and offer to return to it when they are ready. Repair begins with acknowledgement, not with forcing a conversation.",
      },
    ],
    bodyMarkdown:
      "From Ephesians, loosely: *let not the sun go down upon your wrath.* I keep the time limit and drop the guilt.\n\nA single sentence counts: \"I didn't like how that went. Can we come back to it?\"",
    antithesisId: null,
    resonance: 2,
    lastContemplated: daysAgoISO(21),
    canonizedAt: daysAgoISO(30),
    createdDaysAgo: 34,
  },
  {
    id: "seed-relatio-gifts-without-ledgers",
    title: "Gifts Without Ledgers",
    pillarId: "relatio",
    stage: "Spark",
    thesis: "Help offered with an invoice attached is a loan. I give only what I can release without keeping score.",
    dialectics: [],
    bodyMarkdown:
      "Noticed resentment rising when a favour went unthanked. That resentment means it was never a gift. Either give freely, or say plainly that it is an exchange.",
    antithesisId: null,
    resonance: 0,
    lastContemplated: "",
    canonizedAt: null,
    createdDaysAgo: 4,
  },

  /* ── Habitus ───────────────────────────────────────────── */
  {
    id: "seed-habitus-smallest-honest-unit",
    title: "The Smallest Honest Unit",
    pillarId: "habitus",
    stage: "Canon",
    thesis:
      "When resolve fails, I do not wait for resolve to return. I shrink the task until it is too small to refuse, and then I do that.",
    dialectics: [
      {
        question: "If you repeated this action daily for ten years, who would you become?",
        answer:
          "Someone who never fully stops. Ten years of two-minute starts would make me a person whose identity is continuity rather than intensity.",
      },
      {
        question: "Is this a habit you chose, or one that was chosen for you and you are now defending?",
        answer:
          "Chosen. I inherited the opposite belief: that unless I can do it properly I should not do it at all. That belief produced years of nothing.",
      },
      {
        question: "What is the smallest honest version of this principle you could practise tomorrow?",
        answer: "Open the file. Write one sentence. Permission to stop after that, which I almost never take.",
      },
    ],
    bodyMarkdown:
      "Perfectionism is procrastination in formal dress.\n\n- One push-up.\n- One sentence.\n- One minute of silence.\n\nThe unit is honest if I would actually do it on my worst day.",
    antithesisId: null,
    resonance: 5,
    lastContemplated: daysAgoISO(3),
    canonizedAt: daysAgoISO(60),
    createdDaysAgo: 63,
  },
  {
    id: "seed-habitus-morning-belongs-to-the-work",
    title: "The Morning Belongs to the Work",
    pillarId: "habitus",
    stage: "Reforged",
    thesis:
      "The first focused hour of my day is spent on what I chose the night before, not on what the world chose for me this morning. Messages wait; the work does not.",
    dialectics: [
      {
        question: "If you repeated this action daily for ten years, who would you become?",
        answer: "Someone with a body of work. Ten years of first hours is roughly two thousand five hundred hours of undivided attention.",
      },
      {
        question: "Under what circumstances would breaking this habit be the virtuous choice?",
        answer: "When someone I love needs me in the morning. A sick child outranks a manuscript.",
      },
      {
        question: "What does the version of you who never adopts this habit gain?",
        answer: "Responsiveness, and the approval of people who expect immediate replies. I have decided that approval is overpriced.",
      },
      {
        question: "Was the original rule (the first two hours of the day, before anything else) a law or a vanity?",
        answer:
          "Partly a vanity. It ignored mornings that genuinely belong to others. Reforged: the first focused hour, whenever it comes, belongs to the work I chose.",
      },
      {
        question: "Does this principle survive a season of life with no control over your mornings?",
        answer: "Only in its reforged form. The essence is that the day's best attention goes to deliberate work, not that the clock reads seven.",
      },
      {
        question: "What would you lose if you held this loosely instead of as law?",
        answer: "Everything. Held loosely, the inbox wins every single day. It must be a law, but a humane one.",
      },
    ],
    bodyMarkdown:
      "Originally canonized as *the first two hours, before anything*. Questioned after a month of failing it during a family illness. Reforged into something I can keep without cruelty.",
    antithesisId: null,
    resonance: 3,
    lastContemplated: daysAgoISO(14),
    canonizedAt: daysAgoISO(90),
    createdDaysAgo: 95,
  },
  {
    id: "seed-habitus-no-zero-days",
    title: "No Zero Days",
    pillarId: "habitus",
    stage: "Crucible",
    thesis: "Every day must contain at least one deliberate act toward the work that matters most to me.",
    dialectics: [
      {
        question: "If you repeated this action daily for ten years, who would you become?",
        answer: "Either a master, or someone who has never once rested without guilt. That is why it is back in the crucible.",
      },
    ],
    bodyMarkdown:
      "Sent back to the crucible: is a sabbath a zero day? I suspect the law needs a clause for deliberate rest.",
    antithesisId: null,
    resonance: 1,
    lastContemplated: daysAgoISO(6),
    canonizedAt: daysAgoISO(40),
    createdDaysAgo: 44,
  },

  /* ── Bonus Affectus ────────────────────────────────────── */
  {
    id: "seed-bonus-gratitude-attention-backward",
    title: "Gratitude Is Attention Paid Backward",
    pillarId: "bonus-affectus",
    stage: "Canon",
    thesis:
      "Before sleep I name three particular goods from the day. The particular trains the eye; the general only flatters it.",
    dialectics: [
      {
        question: "Is this feeling a response to reality, or a performance you have learned to give?",
        answer:
          "It becomes a performance when it is general: 'I am grateful for my health'. Particulars keep it honest: the way the light hit the kitchen at four o'clock.",
      },
      {
        question: "What would it look like to cultivate this passion without needing anyone to witness it?",
        answer: "Exactly this practice: three lines in a notebook no one reads, before sleep, in the dark.",
      },
      {
        question: "Could this good feeling be quietly feeding a vice?",
        answer:
          "It could curdle into complacency, gratitude used to avoid changing what should be changed. The guard is that gratitude describes; it does not excuse.",
      },
    ],
    bodyMarkdown:
      "Three goods, each one specific enough that it could not have happened on any other day.\n\n*Antithesis:* Resentment Rehearses the Wound.",
    antithesisId: "seed-malum-resentment-rehearses",
    resonance: 3,
    lastContemplated: daysAgoISO(11),
    canonizedAt: daysAgoISO(25),
    createdDaysAgo: 27,
  },
  {
    id: "seed-bonus-joy-is-serious",
    title: "Joy Is Serious",
    pillarId: "bonus-affectus",
    stage: "Canon",
    thesis:
      "Real joy is not excitement but the quiet consent to what is good. I will not trade it for stimulation that only resembles it.",
    dialectics: [
      {
        question: "Is this feeling a response to reality, or a performance you have learned to give?",
        answer: "Stimulation is the performance. Joy is the response. The test: does it survive silence?",
      },
      {
        question: "What would the most generous person you know say about this principle?",
        answer: "That it sounds a little dour. Fair. The law does not ban fun; it forbids mistaking fun for the deeper thing.",
      },
      {
        question: "When did this feeling last fail you?",
        answer: "During a week of constant novelty I felt nothing at all. Joy returned on an ordinary walk with no phone.",
      },
    ],
    bodyMarkdown: "Seneca, Letter 23: *verum gaudium res severa est*. True joy is a serious matter.",
    antithesisId: null,
    resonance: 1,
    lastContemplated: daysAgoISO(28),
    canonizedAt: daysAgoISO(28),
    createdDaysAgo: 31,
  },
  {
    id: "seed-bonus-awe-as-medicine",
    title: "Awe as Medicine",
    pillarId: "bonus-affectus",
    stage: "Spark",
    thesis: "When I feel small in the bad way, I go somewhere that makes me small in the good way.",
    dialectics: [],
    bodyMarkdown: "The sea, the night sky, a cathedral nave, a very old tree. Smallness that dissolves the ego instead of wounding it.",
    antithesisId: null,
    resonance: 0,
    lastContemplated: "",
    canonizedAt: null,
    createdDaysAgo: 2,
  },

  /* ── Malum Adfectus ────────────────────────────────────── */
  {
    id: "seed-malum-resentment-rehearses",
    title: "Resentment Rehearses the Wound",
    pillarId: "malum-adfectus",
    stage: "Canon",
    thesis:
      "Each time I retell a grievance I inflict it on myself again. I may remember what was done; I will not rehearse it.",
    dialectics: [
      {
        question: "What secret reward or comfort are you getting from keeping this vice alive?",
        answer:
          "Righteousness. Each retelling confirms that I was wronged and therefore good. It is a warm, cheap kind of virtue.",
      },
      {
        question: "What is this passion trying to protect?",
        answer: "My sense that what happened mattered. I can honour that by naming it once, clearly, rather than replaying it forever.",
      },
      {
        question: "If you are wrong about this, who pays the price?",
        answer:
          "If I suppress a real injustice instead of addressing it, the next person it is done to pays. So the law forbids rehearsal, not justice.",
      },
    ],
    bodyMarkdown:
      "Remembering is filing; rehearsing is performing. When I catch myself narrating the old story to an imagined audience, I say: *filed*.\n\n*Antithesis:* Gratitude Is Attention Paid Backward.",
    antithesisId: "seed-bonus-gratitude-attention-backward",
    resonance: 2,
    lastContemplated: daysAgoISO(17),
    canonizedAt: daysAgoISO(25),
    createdDaysAgo: 26,
  },
  {
    id: "seed-malum-anger-asks-delay",
    title: "Anger Asks for a Delay",
    pillarId: "malum-adfectus",
    stage: "Canon",
    thesis:
      "Anger may speak, but it may not decide. Any decision made in anger is postponed until I have slept on it.",
    dialectics: [
      {
        question: "What secret reward or comfort are you getting from keeping this vice alive?",
        answer: "The feeling of strength. Anger feels like clarity. It is mostly speed.",
      },
      {
        question: "What does the first ten seconds of this passion look like, and what will you do in them?",
        answer: "Heat in the face, a sentence already loaded. In those seconds I say aloud: tomorrow. Then I leave the room if I can.",
      },
      {
        question: "Is there an injustice this rule would make you too slow to oppose?",
        answer: "Only an emergency, and emergencies are rare. Delay applies to decisions, not to protecting someone in immediate danger.",
      },
    ],
    bodyMarkdown: "Horace: *ira furor brevis est*. Anger is a brief madness. The cure for brief things is time.",
    antithesisId: null,
    resonance: 1,
    lastContemplated: daysAgoISO(35),
    canonizedAt: daysAgoISO(35),
    createdDaysAgo: 36,
  },
  {
    id: "seed-malum-envy-is-information",
    title: "Envy Is Information",
    pillarId: "malum-adfectus",
    stage: "Spark",
    thesis: "Envy points at a desire I have not dared to own. I will read it as a map, not obey it as a verdict.",
    dialectics: [],
    bodyMarkdown: "Whom did I envy this week, and what exactly did they have? Usually it is not the thing, but the permission they gave themselves.",
    antithesisId: null,
    resonance: 0,
    lastContemplated: "",
    canonizedAt: null,
    createdDaysAgo: 6,
  },

  /* ── Ingenia et virtutes ───────────────────────────────── */
  {
    id: "seed-ingenia-courage-small-coins",
    title: "Courage Is Paid in Small Coins",
    pillarId: "ingenia-et-virtutes",
    stage: "Canon",
    thesis:
      "Courage is rarely heroic. It is mostly the willingness to be briefly embarrassed for the sake of what is true.",
    dialectics: [
      {
        question: "Is this virtue, or merely your temperament flattered with a noble name?",
        answer: "My temperament is to avoid embarrassment at almost any cost, so if anything this rule cuts against my nature.",
      },
      {
        question: "Where is the line where this virtue curdles into its excess?",
        answer: "Recklessness: seeking embarrassment as a badge. The coin must be spent for truth, not for the story about my bravery.",
      },
      {
        question: "Who taught you this, and would they still recognise it?",
        answer: "A teacher who asked the obvious question in every meeting. She would recognise it, and laugh that it took me so long.",
      },
    ],
    bodyMarkdown: "Ask the question everyone else is pretending to understand. Admit the mistake before it is discovered. Say *I don't know*.",
    antithesisId: null,
    resonance: 2,
    lastContemplated: daysAgoISO(19),
    canonizedAt: daysAgoISO(22),
    createdDaysAgo: 24,
  },
  {
    id: "seed-ingenia-unseen-hours",
    title: "Mastery Prefers the Unseen Hours",
    pillarId: "ingenia-et-virtutes",
    stage: "Spark",
    thesis: "The quality of my work is decided in the hours no one will ever see or praise.",
    dialectics: [],
    bodyMarkdown: "",
    antithesisId: null,
    resonance: 0,
    lastContemplated: "",
    canonizedAt: null,
    createdDaysAgo: 8,
  },

  /* ── Philosophorum ─────────────────────────────────────── */
  {
    id: "seed-philosophorum-dichotomy-revised",
    title: "The Dichotomy of Control, Revised",
    pillarId: "philosophorum",
    stage: "Spark",
    thesis:
      "What is up to me is not only my judgement but my attention. The world may take my circumstances; it cannot take where I choose to look.",
    dialectics: [],
    bodyMarkdown: "Epictetus, Enchiridion 1, extended. Is attention truly free, though, or is it trained by circumstance too?",
    antithesisId: null,
    resonance: 0,
    lastContemplated: "",
    canonizedAt: null,
    createdDaysAgo: 3,
  },
  {
    id: "seed-philosophorum-mortality-editor",
    title: "Mortality as Editor",
    pillarId: "philosophorum",
    stage: "Spark",
    thesis: "Remembering that I will die is not morbid. It is an editor that cuts whatever does not matter.",
    dialectics: [],
    bodyMarkdown: "*Memento mori* as a design tool rather than a mood.",
    antithesisId: null,
    resonance: 0,
    lastContemplated: "",
    canonizedAt: null,
    createdDaysAgo: 1,
  },
];

function buildSeedAxioms(): Axiom[] {
  return SEED_AXIOMS.map(({ createdDaysAgo, ...seed }) => {
    const createdAt = daysAgoISO(createdDaysAgo);
    return {
      ...seed,
      realm: PILLAR_BY_ID[seed.pillarId].realm,
      notionId: null,
      notionEditedAt: null,
      notionHash: null,
      // Seeds are pending so that, once Notion is configured, the starter canon is pushed too.
      syncStatus: "pending",
      createdAt,
      updatedAt: seed.lastContemplated || seed.canonizedAt || createdAt,
    } satisfies Axiom;
  });
}

/* ═══════════════════════════════════ Database ═══════════════════════════════════ */

export class BonumDB extends Dexie {
  pillars!: EntityTable<Pillar, "id">;
  axioms!: EntityTable<Axiom, "id">;
  syncQueue!: EntityTable<SyncQueueEntry, "seq">;
  meta!: EntityTable<MetaEntry, "key">;
  rituals!: EntityTable<Ritual, "id">;

  constructor() {
    super("bonum");

    this.version(1).stores({
      pillars: "id, realm, order, notionId",
      axioms: "id, notionId, pillarId, stage, realm, lastContemplated, syncStatus, updatedAt, [pillarId+stage]",
      syncQueue: "++seq, &axiomId, nextAttemptAt",
      meta: "key",
      rituals: "id, date, completedAt",
    });

    this.on("populate", async (tx) => {
      await seedStarterData({ pillars: tx.table("pillars"), axioms: tx.table("axioms"), queue: tx.table("syncQueue") });
    });
  }
}

interface SeedTargets {
  pillars: { bulkPut(items: Pillar[]): PromiseLike<unknown> };
  axioms: { bulkAdd(items: Axiom[]): PromiseLike<unknown> };
  queue: { bulkAdd(items: SyncQueueEntry[]): PromiseLike<unknown> };
}

async function seedStarterData({ pillars, axioms: axiomsTable, queue }: SeedTargets): Promise<void> {
  await pillars.bulkPut([...PILLARS]);
  const axioms = buildSeedAxioms();
  await axiomsTable.bulkAdd(axioms);
  const enqueuedAt = new Date().toISOString();
  await queue.bulkAdd(
    axioms.map<SyncQueueEntry>((axiom) => ({
      axiomId: axiom.id,
      enqueuedAt,
      attempts: 0,
      nextAttemptAt: enqueuedAt,
      lastError: null,
    })),
  );
}

/**
 * Dexie only touches IndexedDB when the first query runs, so constructing it during SSR is inert.
 * All reads happen inside client effects / live queries.
 */
export const db = new BonumDB();

export const CANON_STAGES = ["Canon", "Reforged"] as const;

export function isCanon(axiom: Pick<Axiom, "stage">): boolean {
  return axiom.stage === "Canon" || axiom.stage === "Reforged";
}

export function isUntested(axiom: Pick<Axiom, "stage">): boolean {
  return axiom.stage === "Spark" || axiom.stage === "Crucible";
}

/** Canon laws of a pillar, in the order they were first etched (their Roman numeral order). */
export function canonOrder(a: Axiom, b: Axiom): number {
  return (a.canonizedAt ?? a.createdAt).localeCompare(b.canonizedAt ?? b.createdAt);
}

export async function getMeta(key: string): Promise<string | null> {
  const entry = await db.meta.get(key);
  return entry?.value ?? null;
}

export async function setMeta(key: string, value: string): Promise<void> {
  await db.meta.put({ key, value });
}

/** Wipes every table. With `starter`, the six pillars and the starter canon are restored. */
export async function resetDatabase(options: { starter: boolean }): Promise<void> {
  await db.transaction("rw", [db.pillars, db.axioms, db.syncQueue, db.meta, db.rituals], async () => {
    await Promise.all([db.pillars.clear(), db.axioms.clear(), db.syncQueue.clear(), db.meta.clear(), db.rituals.clear()]);
    if (options.starter) {
      await seedStarterData({ pillars: db.pillars, axioms: db.axioms, queue: db.syncQueue });
    } else {
      await db.pillars.bulkPut([...PILLARS]);
    }
  });
}
