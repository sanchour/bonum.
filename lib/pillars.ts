import type { Pillar, PillarId, Realm } from "./types";

/* ═══════════════════════════════ The Six Pillars ═══════════════════════════════ */

export const PILLARS: readonly Pillar[] = [
  {
    id: "relatio",
    notionId: null,
    name: "Relatio",
    realm: "Social",
    emoji: "🧡",
    translation: "On Relation",
    epigraph: "Homo, sacra res homini. — Seneca",
    order: 0,
    description: [
      "Relatio is the book of the between. No one is good alone; goodness is tested where my will meets another's, at the kitchen table, in the unanswered message, in the long marriage and the brief transaction at the shop counter. The laws written here govern how I hold other people: as ends or as means, as faces or as functions.",
      "Its first teaching is that attention is the rarest form of generosity. To be truly seen is to be granted existence a second time, and most of what passes for kindness is only the performance of it. Relatio asks for the slower discipline: to listen without composing my reply, to keep promises that no one is tracking, to repair the rupture before it hardens into history.",
      "Its harder teaching is reciprocity without accounting. A bond kept as a ledger is a contract wearing the mask of love. The laws of this tome must hold when gratitude does not come back, when the other is difficult, when I am tired. What survives those conditions is not niceness. It is fidelity.",
    ].join("\n\n"),
  },
  {
    id: "habitus",
    notionId: null,
    name: "Habitus",
    realm: "Self",
    emoji: "🪄",
    translation: "On Habit",
    epigraph: "Consuetudo, altera natura. — after Cicero",
    order: 1,
    description: [
      "Habitus is the only real magic, and it is slow. The scholastics used the word for a settled disposition of the soul, a second nature laid down in thin layers like sediment, one repeated act at a time. What I do daily I become; what I become, I no longer have to decide.",
      "This tome holds the laws of practice: when I rise, what I consume, how I begin the work and how I leave it, what I do in the dead minutes. Grand resolutions rarely enter here. The wand is small: a two-minute version, a cue placed where the eye will find it, a rule that makes the right action the easy one.",
      "Habitus distrusts motivation and honours structure. It asks of every principle a single question: if this were repeated ten thousand times, what shape would it carve? Character is not what I intend at my best. It is what I default to at my most ordinary.",
    ].join("\n\n"),
  },
  {
    id: "bonus-affectus",
    notionId: null,
    name: "Bonus Affectus",
    realm: "Self",
    emoji: "🌈",
    translation: "On the Good Passions",
    epigraph: "Verum gaudium res severa est. — Seneca",
    order: 2,
    description: [
      "Bonus Affectus is the book of the passions worth cultivating: gratitude, wonder, tenderness, delight, hope that has looked at the evidence. The Stoics called them eupatheiai, the good feelings that arise from right judgement rather than ambush it. They are not moods that happen to me. They are capacities I can train.",
      "Its laws teach the deliberate turning of attention toward what is good, not to deny what is broken but to keep the ledger honest. The mind has a natural bias toward threat; joy, left untended, is outcompeted. So this tome holds practices of noticing: the particular good named before sleep, the pause at beauty, the gladness at another's fortune.",
      "Every law here has a shadow in Malum Adfectus, and the two volumes should be read together. Gratitude stands opposite resentment, admiration opposite envy, equanimity opposite rage. To flip a card from this tome is to see what it protects me from.",
    ].join("\n\n"),
  },
  {
    id: "malum-adfectus",
    notionId: null,
    name: "Malum Adfectus",
    realm: "Self",
    emoji: "💢",
    translation: "On the Destructive Passions",
    epigraph: "Ira furor brevis est. — Horace",
    order: 3,
    description: [
      "Malum Adfectus is the bestiary of the inner life: anger, envy, contempt, despair, the cold pleasure of a grievance kept warm. These passions are not simply evil. Each one carries information, a value threatened or a desire unadmitted, and each one lies about what should be done with that information.",
      "The laws of this tome are not prohibitions but protocols. What I do in the first ten seconds of rage. How I read envy as a map instead of a verdict. How I keep from rehearsing the wound. They are written in calm so that they can be obeyed in storm.",
      "Its most uncomfortable question is about payment. Every vice survives because it pays me something: a sense of righteousness, an excuse, a familiar warmth. A law in this book is only as strong as my honesty about that wage. Each card here is paired, where it can be, with its antithesis in Bonus Affectus: the passion that starves it.",
    ].join("\n\n"),
  },
  {
    id: "ingenia-et-virtutes",
    notionId: null,
    name: "Ingenia et virtutes",
    realm: "Self",
    emoji: "🏃",
    translation: "On Talents and Virtues",
    epigraph: "Virtutis laus omnis in actione consistit. — Cicero",
    order: 4,
    description: [
      "Ingenia et virtutes is the book of excellence in motion. Ingenium is native gift, the bent of a particular mind and body; virtus is the strength by which gift is made trustworthy. A talent without virtue is a weapon left lying in the street. A virtue without exercise is only a compliment I pay myself.",
      "Its laws concern courage, diligence, craft, temperance and the practical wisdom that knows which one the moment requires. Their proving ground is action: the hard conversation actually had, the unglamorous hour of practice, the risk taken while visibly afraid.",
      "This tome resists the cult of self-improvement. It does not ask me to become remarkable. It asks me to become reliable in the things that matter, and to spend whatever gifts I was handed in service of something larger than their display.",
    ].join("\n\n"),
  },
  {
    id: "philosophorum",
    notionId: null,
    name: "Philosophorum",
    realm: "Mundo",
    emoji: "🤔",
    translation: "Of the Philosophers",
    epigraph: "Sapere aude. — Horace",
    order: 5,
    description: [
      "Philosophorum is the book of the world-view: what I take to be real, what I think a life is for, how I stand before death, chance, suffering and the vastness of things I did not make. It is where the borrowed wisdom of the Stoics, the Epicureans, the mystics and the sceptics is tested until it becomes my own or is set down.",
      "Laws here are the foundations the other tomes rest on. Whether I believe I control my judgements, whether meaning is found or made, whether the self is a fortress or a river: each answer quietly rewrites the rules of every other book.",
      "Philosophorum demands the most rigour and offers the least comfort. It asks me to hold my beliefs as hypotheses, to steelman the doctrines I reject, and to dare to know, even when knowing costs the consolations of a simpler story.",
    ].join("\n\n"),
  },
];

export const PILLAR_BY_ID: Readonly<Record<PillarId, Pillar>> = Object.fromEntries(
  PILLARS.map((pillar) => [pillar.id, pillar]),
) as Record<PillarId, Pillar>;

export const PILLAR_BY_NAME: ReadonlyMap<string, Pillar> = new Map(
  PILLARS.map((pillar) => [pillar.name.toLowerCase(), pillar]),
);

export function pillarByName(name: string | null | undefined): Pillar | undefined {
  if (!name) return undefined;
  return PILLAR_BY_NAME.get(name.trim().toLowerCase());
}

export function realmOfPillar(id: PillarId): Realm {
  return PILLAR_BY_ID[id].realm;
}

export function isPillarId(value: unknown): value is PillarId {
  return typeof value === "string" && value in PILLAR_BY_ID;
}
