export interface Entry {
  id: string;
  title: string;
  body: string;
}

export interface Section {
  title: string;
  entries: Entry[];
}

export interface Pillar {
  id: string;
  icon: string;
  name: string;
  subtitle: string;
  category: string;
  color: string;
  sections: Section[];
}

export type PillarsRecord = Record<string, Pillar>;
