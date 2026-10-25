'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { uid } from '@/lib/utils';
import type { Language } from '@/lib/i18n';

export type ThemeMode = 'system' | 'light' | 'dark';
export type UnitSystem = 'SI' | 'Imperial';
export type NumeralsSetting = 'latin' | 'native';

export interface Settings {
  theme: ThemeMode;
  language: Language;
  units: UnitSystem;
  decimals: number;
  haptics: boolean;
  numerals: NumeralsSetting;
}

export interface HistoryEntry {
  id: string;
  formulaId: string;
  name_fa: string;
  name_en: string;
  inputs: Record<string, string | number | boolean>;
  values: Record<string, unknown>;
  createdAt: number;
}

interface AppState {
  settings: Settings;
  history: HistoryEntry[];
  bookmarks: string[];
  recent: string[];
  hydrated: boolean;
  updateSettings: (patch: Partial<Settings>) => void;
  addHistory: (entry: Omit<HistoryEntry, 'id' | 'createdAt'>) => HistoryEntry;
  deleteHistory: (id: string) => void;
  clearHistory: () => void;
  clearFormulaHistory: (formulaId: string) => void;
  toggleBookmark: (formulaId: string) => boolean;
  pushRecent: (formulaId: string) => void;
  clearAll: () => void;
}

const defaultSettings: Settings = {
  theme: 'dark',
  language: 'fa',
  units: 'SI',
  decimals: 6,
  haptics: true,
  numerals: 'latin',
};

const HISTORY_LIMIT = 200;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      history: [],
      bookmarks: [],
      recent: [],
      hydrated: false,

      updateSettings: (patch) =>
        set((state) => ({ settings: { ...state.settings, ...patch } })),

      addHistory: (entry) => {
        const existing = get().history.find(
          (item) =>
            item.formulaId === entry.formulaId &&
            JSON.stringify(item.inputs) === JSON.stringify(entry.inputs),
        );
        const record: HistoryEntry = existing
          ? { ...existing, values: entry.values, createdAt: Date.now() }
          : { ...entry, id: uid(), createdAt: Date.now() };
        set((state) => ({
          history: [record, ...state.history.filter((item) => item.id !== record.id)].slice(0, HISTORY_LIMIT),
          recent: [entry.formulaId, ...state.recent.filter((id) => id !== entry.formulaId)].slice(0, 12),
        }));
        return record;
      },

      deleteHistory: (id) => set((state) => ({ history: state.history.filter((item) => item.id !== id) })),

      clearHistory: () => set({ history: [] }),

      clearFormulaHistory: (formulaId) =>
        set((state) => ({ history: state.history.filter((item) => item.formulaId !== formulaId) })),

      toggleBookmark: (formulaId) => {
        const exists = get().bookmarks.includes(formulaId);
        set((state) => ({
          bookmarks: exists
            ? state.bookmarks.filter((id) => id !== formulaId)
            : [formulaId, ...state.bookmarks],
        }));
        return !exists;
      },

      pushRecent: (formulaId) =>
        set((state) => ({
          recent: [formulaId, ...state.recent.filter((id) => id !== formulaId)].slice(0, 12),
        })),

      clearAll: () => set({ history: [], bookmarks: [], recent: [], settings: defaultSettings }),
    }),
    {
      name: 'solveeverything.store.v3',
      version: 3,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        settings: state.settings,
        history: state.history,
        bookmarks: state.bookmarks,
        recent: state.recent,
      }),
      migrate: (persisted) => persisted as AppState,
      onRehydrateStorage: () => (state) => {
        state?.hydrated;
        useAppStore.setState({ hydrated: true });
      },
    },
  ),
);

/** True once localStorage has been read — prevents hydration mismatches. */
export const useHydrated = () => useAppStore((state) => state.hydrated);

export const rehydrateStore = () => {
  void useAppStore.persist.rehydrate();
};

export const defaultSettingsForTests = defaultSettings;
