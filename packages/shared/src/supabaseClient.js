// Client Supabase partagé (boutique + admin).
// Les variables d'env sont lues via Vite (préfixe VITE_). Voir .env.example.
//
// Tant que le projet Supabase n'est pas configuré, `supabase` vaut `null` et
// `isSupabaseConfigured` vaut `false` : le prototype continue alors de
// fonctionner avec ses données en mémoire (voir SEED_* dans src/App.jsx).
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey)
  : null;

if (!isSupabaseConfigured && import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.warn(
    "[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY absents — " +
      "le prototype tourne en mémoire. Voir .env.example et CLAUDE.md §8."
  );
}
