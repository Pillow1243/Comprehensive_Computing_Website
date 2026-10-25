'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { uid } from '@/lib/utils';
import type { Language } from '@/lib/i18n';

export type ThemeMode = 'system' | 'light' | 'dark';
export type UnitSystem = 'SI' | 'Imperial';
export type NumeralsSetting = 'latin' | 'native';
/** Brand accent palettes (v4.1) — `data-accent` values in globals.css. */
export type AccentId = 'violet' | 'ocean' | 'emerald' | 'sunset' | 'rose' | 'amber';

export interface Settings {
  theme: ThemeMode;
  accent: AccentId;
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

/** Practice (quiz) progress, stored locally — v4. */
export interface PracticeState {
  xp: number;
  answered: number;
  correct: number;
  streak: number;
  bestStreak: number;
  lastPlayedDay: string | null;
  dailyDoneDay: string | null;
}

/** A pinned item in the personal study workspace — v4. */
export interface WorkspaceItem {
  id: string;
  title: string;
  note: string;
  formulaId: string | null;
  inputs: Record<string, string | number | boolean>;
  values: Record<string, unknown>;
  createdAt: number;
}

export const defaultPractice: PracticeState = {
  xp: 0,
  answered: 0,
  correct: 0,
  streak: 0,
  bestStreak: 0,
  lastPlayedDay: null,
  dailyDoneDay: null,
};

interface AppState {
  settings: Settings;
  history: HistoryEntry[];
  bookmarks: string[];
  recent: string[];
  practice: PracticeState;
  learnDone: string[];
  workspace: WorkspaceItem[];
  whatsNewSeen: string;
  hydrated: boolean;
  updateSettings: (patch: Partial<Settings>) => void;
  addHistory: (entry: Omit<HistoryEntry, 'id' | 'createdAt'>) => HistoryEntry;
  deleteHistory: (id: string) => void;
  clearHistory: () => void;
  clearFormulaHistory: (formulaId: string) => void;
  toggleBookmark: (formulaId: string) => boolean;
  pushRecent: (formulaId: string) => void;
  recordPracticeAnswer: (correct: boolean, xp: number, dayKey: string) => void;
  markDailyDone: (dayKey: string) => void;
  toggleLearnDone: (formulaId: string) => boolean;
  addWorkspaceItem: (item: Omit<WorkspaceItem, 'id' | 'createdAt'>) => WorkspaceItem;
  updateWorkspaceItem: (id: string, patch: Partial<Pick<WorkspaceItem, 'title' | 'note'>>) => void;
  deleteWorkspaceItem: (id: string) => void;
  markWhatsNewSeen: (version: string) => void;
  clearAll: () => void;
}

const defaultSettings: Settings = {
  theme: 'dark',
  accent: 'violet',
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
      practice: defaultPractice,
      learnDone: [],
      workspace: [],
      whatsNewSeen: '',
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

      recordPracticeAnswer: (correct, xp, dayKey) =>
        set((state) => {
          // `streak` counts consecutive correct answers; a wrong answer resets it.
          const streak = correct ? state.practice.streak + 1 : 0;
          return {
            practice: {
              ...state.practice,
              xp: state.practice.xp + (correct ? xp : 0),
              answered: state.practice.answered + 1,
              correct: state.practice.correct + (correct ? 1 : 0),
              streak,
              bestStreak: Math.max(state.practice.bestStreak, streak),
              lastPlayedDay: dayKey,
            },
          };
        }),

      markDailyDone: (dayKey) =>
        set((state) => ({ practice: { ...state.practice, dailyDoneDay: dayKey } })),

      toggleLearnDone: (formulaId) => {
        const exists = get().learnDone.includes(formulaId);
        set((state) => ({
          learnDone: exists
            ? state.learnDone.filter((id) => id !== formulaId)
            : [formulaId, ...state.learnDone],
        }));
        return !exists;
      },

      addWorkspaceItem: (item) => {
        const record: WorkspaceItem = { ...item, id: uid(), createdAt: Date.now() };
        set((state) => ({ workspace: [record, ...state.workspace].slice(0, 100) }));
        return record;
      },

      updateWorkspaceItem: (id, patch) =>
        set((state) => ({
          workspace: state.workspace.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        })),

      deleteWorkspaceItem: (id) =>
        set((state) => ({ workspace: state.workspace.filter((item) => item.id !== id) })),

      markWhatsNewSeen: (version) => set({ whatsNewSeen: version }),

      clearAll: () =>
        set({
          history: [],
          bookmarks: [],
          recent: [],
          learnDone: [],
          workspace: [],
          whatsNewSeen: '',
          practice: defaultPractice,
          settings: defaultSettings,
        }),
    }),
    {
      name: 'solveeverything.store.v3',
      version: 5,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        settings: state.settings,
        history: state.history,
        bookmarks: state.bookmarks,
        recent: state.recent,
        practice: state.practice,
        learnDone: state.learnDone,
        workspace: state.workspace,
        whatsNewSeen: state.whatsNewSeen,
      }),
      migrate: (persisted) => {
        const state = (persisted ?? {}) as Partial<AppState>;
        return {
          ...state,
          settings: { ...defaultSettings, ...(state.settings ?? {}) },
          practice: { ...defaultPractice, ...(state.practice ?? {}) },
          learnDone: state.learnDone ?? [],
          workspace: state.workspace ?? [],
          whatsNewSeen: state.whatsNewSeen ?? '',
        } as AppState;
      },
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
