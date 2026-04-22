import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

import type { Database } from '@/types/database';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Warn instead of throw: a missing env var used to crash the app during
// bundle evaluation (EAS production builds with no baked-in env would show
// the icon, then immediately close). The app now boots; Supabase-backed
// features just fail individually with a clear message in logs.
if (!url || !anonKey) {
  console.warn(
    '[supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Supabase-backed features will not work. Check eas.json (for builds) or .env (for dev).',
  );
}

// AsyncStorage (on web it delegates to localStorage) can't run during Expo's
// static-render step under Node. Fall back to an in-memory noop when there's
// no browser window — the real storage takes over once the app actually runs
// in the browser or on device.
const isBrowser = typeof window !== 'undefined';
const memoryStore = new Map<string, string>();
const noopStorage = {
  getItem: async (key: string) => memoryStore.get(key) ?? null,
  setItem: async (key: string, value: string) => {
    memoryStore.set(key, value);
  },
  removeItem: async (key: string) => {
    memoryStore.delete(key);
  },
};

// Fall back to placeholder strings so client construction never throws. Any
// real query will fail with a Supabase error instead of crashing the app.
export const supabase = createClient<Database>(
  url ?? 'https://missing-supabase-url.invalid',
  anonKey ?? 'missing-supabase-anon-key',
  {
    auth: {
      storage: isBrowser ? AsyncStorage : noopStorage,
      autoRefreshToken: isBrowser,
      persistSession: isBrowser,
      detectSessionInUrl: false,
    },
  },
);
