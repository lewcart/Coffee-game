import { create } from 'zustand';
import type { LevelSummary } from '../types/game';

type Screen = 'game' | 'levelComplete';

interface GameState {
  screen: Screen;
  levelSummary: LevelSummary | null;

  showLevelComplete: (summary: LevelSummary) => void;
  continueToNextLevel: () => void;
  retryLevel: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  screen: 'game',
  levelSummary: null,

  showLevelComplete: (summary) => set({ screen: 'levelComplete', levelSummary: summary }),

  continueToNextLevel: () => set({ screen: 'game', levelSummary: null }),

  retryLevel: () => set({ screen: 'game', levelSummary: null }),
}));
