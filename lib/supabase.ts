import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

import type { Database } from '@/types/database';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Copy .env.example to .env and fill in the values.',
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

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    storage: isBrowser ? AsyncStorage : noopStorage,
    autoRefreshToken: isBrowser,
    persistSession: isBrowser,
    detectSessionInUrl: false,
  },
});
