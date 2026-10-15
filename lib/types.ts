export type Realm = "Social" | "Self" | "Mundo";

export type Stage = "Spark" | "Crucible" | "Canon" | "Reforged";

export type SyncStatus = "synced" | "pending" | "error";

export type PillarId =
  | "relatio"
  | "habitus"
  | "bonus-affectus"
  | "malum-adfectus"
  | "ingenia-et-virtutes"
  | "philosophorum";

export interface Dialectic {
  question: string;
  answer: string;
}

export interface Pillar {
  id: PillarId;
  notionId: string | null;
  name: string;
  realm: Realm;
  /** The emoji used as the page icon in Notion. */
  emoji: string;
  /** A short English rendering of the Latin name. */
  translation: string;
  epigraph: string;
  description: string;
  order: number;
}

export interface Axiom {
  id: string;
  notionId: string | null;
  title: string;
  pillarId: PillarId;
  realm: Realm;
  stage: Stage;
  thesis: string;
  dialectics: Dialectic[];
  bodyMarkdown: string;
  antithesisId: string | null;
  resonance: number;
  /** ISO date string; empty string means never contemplated. */
  lastContemplated: string;
  syncStatus: SyncStatus;
  /** First moment the axiom entered the Canon. Kept through reforging so its numeral is stable. */
  canonizedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Notion's last_edited_time as of our last successful push or pull. */
  notionEditedAt: string | null;
  /**
   * Hash of the page exactly as Notion held it after our last push or pull. Notion timestamps are
   * minute-precision, so echoes of our own writes are recognised by content, not by time.
   */
  notionHash: string | null;
}

export interface SyncQueueEntry {
  seq?: number;
  axiomId: string;
  enqueuedAt: string;
  attempts: number;
  nextAttemptAt: string;
  lastError: string | null;
}

export interface MetaEntry {
  key: string;
  value: string;
}

export type Office = "Matins" | "Vespers";

export type CardOutcome = "affirmed" | "questioned" | "deferred" | "kindled" | "forged";

export type RitualCard =
  | { key: string; kind: "canon"; axiomId: string }
  | { key: string; kind: "void"; pillarId: PillarId; promptIndex: number };

export interface Ritual {
  /** `${YYYY-MM-DD}:${Office}` */
  id: string;
  date: string;
  office: Office;
  cards: RitualCard[];
  outcomes: Record<string, CardOutcome>;
  createdAt: string;
  completedAt: string | null;
}

/** Wire format exchanged with /api/notion. */
export interface AxiomWire {
  id: string;
  notionId: string | null;
  title: string;
  pillar: string;
  realm: Realm;
  stage: Stage;
  thesis: string;
  dialectics: Dialectic[];
  bodyMarkdown: string;
  antithesisId: string | null;
  antithesisNotionId: string | null;
  resonance: number;
  lastContemplated: string;
  canonizedAt: string | null;
  updatedAt: string;
}

export interface PushResult {
  id: string;
  ok: boolean;
  notionId?: string;
  remoteEditedAt?: string;
  /** The page as Notion stored it, read back from the write response. */
  remote?: RemoteAxiom;
  error?: string;
}

/**
 * An axiom as read back from Notion. A field is undefined when the database has no matching
 * property, so a sparse schema never erases data that only lives locally.
 */
export interface RemoteAxiom {
  notionId: string;
  editedAt: string;
  archived: boolean;
  id?: string;
  title?: string;
  pillar?: string;
  stage?: Stage;
  thesis?: string;
  dialectics?: Dialectic[];
  bodyMarkdown?: string;
  antithesisId?: string | null;
  antithesisNotionId?: string | null;
  resonance?: number;
  lastContemplated?: string;
  canonizedAt?: string | null;
}

export interface NotionStatus {
  configured: boolean;
  ok: boolean;
  database?: string;
  missingProperties?: string[];
  error?: string;
}

export interface PullResponse {
  configured: true;
  axioms: RemoteAxiom[];
  serverTime: string;
  complete: boolean;
  nextSince: string | null;
}

export interface PushResponse {
  configured: true;
  results: PushResult[];
}
