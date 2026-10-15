import type { PillarId } from "./types";
import { seededSample } from "./util";

/**
 * The curated Socratic engine: questions designed to find the crack in a principle before it is
 * allowed into the permanent Canon. Each pillar has its own adversary; a few universal trials
 * apply to every law.
 */
export const PILLAR_TRIALS: Readonly<Record<PillarId, readonly string[]>> = {
  relatio: [
    "Does this principle still hold when the other person acts in bad faith, or is it merely a covert contract?",
    "If everyone you love lived by this rule toward you, would you feel more known or more managed?",
    "Whose comfort does this principle actually protect: theirs, or yours?",
    "Where does this principle end and self-erasure begin?",
    "Would you keep this rule toward someone who could never repay you, or find out you kept it?",
    "What would the person you have hurt most say about this principle?",
    "Does this hold with strangers, or only with the people you have already decided deserve it?",
    "Is this kindness, or a way of avoiding a conflict that needs to happen?",
  ],
  habitus: [
    "If you repeated this action daily for ten years, who would you become?",
    "Is this a habit you chose, or one that was chosen for you and you are now defending?",
    "What is the smallest honest version of this principle you could practise tomorrow?",
    "Under what circumstances would breaking this habit be the virtuous choice?",
    "What cue in your environment will trigger this, and what currently occupies that cue?",
    "What does the version of you who never adopts this habit gain?",
    "Is this a discipline, or a punishment wearing the costume of one?",
    "What will you do on the day you break it, so that one lapse does not become a collapse?",
  ],
  "bonus-affectus": [
    "Is this feeling a response to reality, or a performance you have learned to give?",
    "Could this good feeling be quietly feeding a vice?",
    "What would it look like to cultivate this passion without needing anyone to witness it?",
    "When did this feeling last fail you, and what did you do instead?",
    "Does this survive grief, or only a good week?",
    "Is this gratitude, or a way of not asking for what you need?",
    "What does this passion require you to notice that you currently walk past?",
    "If this feeling never arrived on its own, what practice would summon it?",
  ],
  "malum-adfectus": [
    "What secret reward or comfort are you getting from keeping this vice alive?",
    "What is this passion trying to protect?",
    "What does the first ten seconds of this passion look like, and what will you do in them?",
    "Is there an injustice this rule would make you too slow to oppose?",
    "Whose voice is this anger, envy or despair speaking in, and is it yours?",
    "Are you condemning the passion, or the information it carries?",
    "What would you have to grieve if you let this go?",
    "Does this law starve the passion, or only hide it from view?",
  ],
  "ingenia-et-virtutes": [
    "Is this virtue, or merely your temperament flattered with a noble name?",
    "Where is the line where this virtue curdles into its excess?",
    "Who taught you this, and would they still recognise it?",
    "What would it cost to practise this when no one is watching and nothing is gained?",
    "Which gift of yours is this principle quietly excusing you from developing?",
    "Is this excellence in service of something, or only in service of being seen as excellent?",
    "How would this virtue look in a body more tired and less talented than yours?",
    "What is the next concrete act this virtue asks of you, this week?",
  ],
  philosophorum: [
    "What would the strongest thinker who disagrees with you say, stated in its most persuasive form?",
    "Is this a conclusion you reasoned toward, or a temperament you found reasons for?",
    "What would have to be true about the world for this to be false?",
    "Does this survive the death of someone you love?",
    "If this were universally believed, what kind of world would it build?",
    "Which ancient school would claim this principle, and which would laugh at it?",
    "Is this a belief you would teach a child, and if not, why do you trust it yourself?",
    "What does this principle require you to give up that you have not yet given up?",
  ],
};

export const UNIVERSAL_TRIALS: readonly string[] = [
  "If you are wrong about this, who pays the price?",
  "What does this principle cost you, concretely, the next time it is tested?",
  "What would you lose if you held this loosely instead of as law?",
  "What would the most generous person you know say about this principle?",
];

/**
 * Three trials for a forge session: two specific to the pillar and one universal, chosen
 * deterministically per axiom and round so a reload shows the same questions.
 */
export function selectTrials(pillarId: PillarId, seed: string): string[] {
  const specific = seededSample(PILLAR_TRIALS[pillarId], 2, `${seed}:pillar`);
  const universal = seededSample(UNIVERSAL_TRIALS, 1, `${seed}:universal`);
  return [...specific, ...universal];
}

/** A replacement question for "summon another", never one already on the table. */
export function alternateTrial(pillarId: PillarId, exclude: readonly string[], seed: string): string {
  const pool = [...PILLAR_TRIALS[pillarId], ...UNIVERSAL_TRIALS].filter((q) => !exclude.includes(q));
  return seededSample(pool, 1, seed)[0] ?? PILLAR_TRIALS[pillarId][0];
}
