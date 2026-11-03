/**
 * ai.ts – Nachrichten im Verlauf eines KI-Chats (Kompendium Modul 05)
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Christoph Hauser
 */

export type Rolle = 'system' | 'user' | 'assistant';

/** Nachricht im lokalen Verlauf. An die LLM-API gehen nur role und content. */
export interface Nachricht {
  id: string; // stabiler React-Listenkey
  role: Rolle;
  content: string;
}
