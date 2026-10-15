import type { PillarId } from "./types";

/**
 * Void Prompts: dealt on the third card of each office for whichever pillar has the
 * fewest canonized laws. Each is meant to provoke a new Spark.
 */
export const VOID_PROMPTS: Readonly<Record<PillarId, readonly string[]>> = {
  relatio: [
    "Name the person you are quietly keeping score with. What rule would end the ledger?",
    "What do you owe someone who can never repay you?",
    "When should you tell a friend a truth they did not ask for?",
    "Describe the last time you were truly listened to. What law did that person keep?",
    "What do you refuse to do even for the people you love most, and why?",
    "How should you treat someone who has stopped deserving it?",
  ],
  habitus: [
    "Which small daily act, repeated for a decade, would most change who you are?",
    "What do you do in the dead minutes, and what should you do instead?",
    "Write the rule for the first ten minutes of your day.",
    "What habit are you defending only because you have always had it?",
    "What would make the right action the easiest action tomorrow?",
    "How should you begin again after a broken streak?",
  ],
  "bonus-affectus": [
    "What good feeling do you neglect because it never demands your attention?",
    "Where did you feel awe this month, and how could you return on purpose?",
    "What would it mean to take your own joy seriously?",
    "Whose good fortune could you learn to celebrate as if it were your own?",
    "What should you do with hope that has not yet looked at the evidence?",
    "Write a law for tenderness toward yourself that does not become indulgence.",
  ],
  "malum-adfectus": [
    "Which passion most often decides for you before you have decided? Write the protocol.",
    "What grievance are you keeping warm, and what does it pay you?",
    "Whom do you envy, and what does that envy know that you do not admit?",
    "What will you do in the first ten seconds of your next rage?",
    "When does contempt slip into your voice, and what is it hiding?",
    "Write the law that stands between despair and action.",
  ],
  "ingenia-et-virtutes": [
    "Which of your gifts are you hoarding instead of spending?",
    "What does courage look like at the scale of an ordinary Tuesday?",
    "What virtue do you admire in others but excuse yourself from?",
    "Write the rule for doing excellent work no one will ever see.",
    "Where is your diligence secretly perfectionism, and where is your ease secretly sloth?",
    "What practice would make you more trustworthy, not more impressive?",
  ],
  philosophorum: [
    "What do you believe a human life is for? Write it as a law, not a wish.",
    "Is your attention up to you? Defend an answer you could live by.",
    "How should you stand before your own death on an ordinary afternoon?",
    "Which ancient doctrine do you live by without having ever examined it?",
    "What is your answer to suffering that you did not cause and cannot fix?",
    "Write the principle you would still hold if no one ever agreed with you.",
  ],
};
