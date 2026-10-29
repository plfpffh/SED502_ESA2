export type Rolle = 'system' | 'user' | 'assistant';

/** Nachricht im lokalen Verlauf. An die LLM-API gehen nur role und content. */
export interface Nachricht {
  id: string; // stabiler React-Listenkey
  role: Rolle;
  content: string;
}
