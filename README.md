# Bonum

A local-first scriptorium for building a personal philosophy: a moral canon in six tomes, a daily
contemplative liturgy, and a forge where ideas must survive three Socratic trials before they become law.

```bash
npm install
npm run dev
```

It works immediately with no configuration. Everything lives in IndexedDB (Dexie), seeded with the
six pillars and starter axioms across every stage.

## The three modes

| Mode | Key | What it does |
| --- | --- | --- |
| Sanctuary | `1` | Matins (03:00–14:59) or Vespers. The Cathedral Sigil, and the Daily Deal: two Canon laws to affirm or question, plus a Void prompt for the emptiest pillar. Arrow keys: → affirm, ← set aside, ↓ question dogma, ↑ to the forge. |
| Six Tomes | `2` | The pillars as volumes, filterable by realm. Opening one morphs into the Tome Reader (Canon in Roman numerals, Sparks tab, Antithesis Flip for Bonus/Malum Adfectus). |
| Forge | `3` | Thesis → three Trials → press & hold to etch into Canon. |

`⌘K` / `Ctrl K` opens quick capture from anywhere.

## Notion sync (optional)

Copy `.env.example` to `.env.local` and set `NOTION_API_KEY` and `NOTION_AXIOMS_DB_ID`, then share the
database with your integration. Without them the app stays in local-first mode; queued changes push
as soon as keys are present.

Properties are matched by name (case-insensitive) and type. Any that are missing are simply skipped,
and the sync indicator lists them:

| Property | Type |
| --- | --- |
| *(title)* | title |
| Pillar | select, or relation to the Pillars DB (set `NOTION_PILLARS_DB_ID`) |
| Realm, Stage | select |
| Thesis, Body, Bonum ID | text |
| Dialectics | text (JSON array of `{question, answer}`) |
| Antithesis | relation to the same database |
| Resonance | number |
| Last Contemplated, Canonized | date |

Echoes of Bonum's own writes are recognised by content hash, not by Notion's minute-precision
timestamps. When an axiom changes on both sides, the later edit wins.

## The Oracle (optional)

Set `ANTHROPIC_API_KEY` to enable the Oracle toggle in the Forge. Claude then writes three
adversarial trials for your exact thesis. Without a key the curated Socratic engine is used.
