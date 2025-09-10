import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface StoreState {
  wArray: number[];
  n: number;
  t: number;
  q: number;
  score: number;
  index: number | null;
  dailyGrammar: any; // You might want to define a proper type for grammar
  updateT: () => void;
  increaseN: () => void;
  increaseQ: () => void;
  upIndex: () => void;
  updateScore: () => void;
  removeN: () => void;
  clearQ: () => void;
  killScore: () => void;
  setIndex: (i: number) => void;
  pushToArray: (r: number[]) => void;
  setDailyGrammar: (grammar: any) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      wArray: [],
      n: 0,
      t: 0,
      q: 0,
      score: 0,
      index: null,
      dailyGrammar: null,
      updateT: () => set((state) => ({ t: state.t + 1 })),
      increaseN: () => set((state) => ({ n: state.n + 1 })),
      increaseQ: () => set((state) => ({ q: state.q + 1 })),
      upIndex: () => set((state) => ({ index: (state.index ?? -1) + 1 })),
      updateScore: () => set((state) => ({ score: state.score + 1 })),
      removeN: () => set({ n: 0 }),
      clearQ: () => set({ q: 0 }),
      killScore: () => set({ score: 0 }),
      setIndex: (i) => set({ index: i }),
      setDailyGrammar: (grammar) => set({ dailyGrammar: grammar }),
      pushToArray: (r) => {
        if (r && r.length > 0) {
          set((state) => ({ wArray: [...state.wArray, ...r] }));
        }
      },
    }),
    {
      name: 'n-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    }
  )
);

interface BearsStoreState {
  tScore: number;
  qAnswered: number;
  qCorrect: number;
  isFinish: boolean;
  updateScore: () => void;
  updateQAnswered: () => void;
  updateQCorrect: () => void;
  removeQAnswered: () => void;
  removeQCorrect: () => void;
  setIsFinish: (state: boolean) => void;
}

export const useBearsStore = create<BearsStoreState>()(
  persist(
    (set) => ({
      tScore: 0,
      qAnswered: 0,
      qCorrect: 0,
      isFinish: false,
      updateScore: () => set((state) => ({ tScore: state.tScore + 1 })),
      updateQAnswered: () => set((state) => ({ qAnswered: state.qAnswered + 1 })),
      updateQCorrect: () => set((state) => ({ qCorrect: state.qCorrect + 1 })),
      removeQAnswered: () => set({ qAnswered: 0 }),
      removeQCorrect: () => set({ qCorrect: 0 }),
      setIsFinish: (state) => set({ isFinish: state }),
    }),
    {
      name: 'bears-storage', // Changed name to be unique
      storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
    }
  )
);

interface RefreshState {
  refresh: boolean;
  setRefresh: (par: boolean) => void;
}

export const useRefresh = create<RefreshState>((set) => ({
  refresh: false,
  setRefresh: (par) => set({ refresh: par }),
}));

interface DarkModeState {
  isDarkMode: boolean;
  setDarkMode: (par: boolean) => void;
}

export const toggleDarkMode = create<DarkModeState>((set) => ({
  isDarkMode: false,
  setDarkMode: (par) => set({ isDarkMode: par }),
}));