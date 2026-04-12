import { create } from 'zustand';
import type { DrinkAttempt, DrinkRecipe, GlassSize, LevelSummary, OrderResult } from '../types/game';
import { scoreDrink, buildLevelSummary, MAX_SCORE_PER_DRINK } from '../engine/scoring';

type Screen = 'game' | 'levelComplete';

export interface ActiveOrder {
  orderId: string;
  recipe: DrinkRecipe;
  /** 0-based index within the level */
  orderIndex: number;
  startTimeMs: number;
}

interface GameState {
  screen: Screen;
  levelSummary: LevelSummary | null;

  currentLevel: number;
  /** Increments on startLevel/retry to force re-mount of GameScreen */
  levelKey: number;
  ordersTotal: number;
  pendingRecipes: DrinkRecipe[];
  activeOrder: ActiveOrder | null;
  selectedGlass: GlassSize | null;
  /** ingredientId → accumulated amount added by the player */
  currentIngredients: Record<string, number>;
  completedOrders: OrderResult[];

  showLevelComplete: (summary: LevelSummary) => void;
  continueToNextLevel: () => void;
  retryLevel: () => void;

  startLevel: (level: number, recipes: DrinkRecipe[]) => void;
  selectGlass: (glass: GlassSize) => void;
  tapIngredient: (id: string, amount: number) => void;
  clearIngredients: () => void;
  submitDrink: (endTimeMs: number) => void;
}

function makeOrderId() {
  return `order-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'game',
  levelSummary: null,

  currentLevel: 1,
  levelKey: 0,
  ordersTotal: 0,
  pendingRecipes: [],
  activeOrder: null,
  selectedGlass: null,
  currentIngredients: {},
  completedOrders: [],

  showLevelComplete: (summary) => set({ screen: 'levelComplete', levelSummary: summary }),

  continueToNextLevel: () =>
    set((s) => ({
      screen: 'game',
      levelSummary: null,
      currentLevel: s.currentLevel + 1,
      levelKey: s.levelKey + 1,
      pendingRecipes: [],
      activeOrder: null,
      selectedGlass: null,
      currentIngredients: {},
      completedOrders: [],
    })),

  retryLevel: () =>
    set((s) => ({
      screen: 'game',
      levelSummary: null,
      levelKey: s.levelKey + 1,
      pendingRecipes: [],
      activeOrder: null,
      selectedGlass: null,
      currentIngredients: {},
      completedOrders: [],
    })),

  startLevel: (level, recipes) => {
    const [first, ...rest] = recipes;
    set({
      currentLevel: level,
      ordersTotal: recipes.length,
      pendingRecipes: rest,
      completedOrders: [],
      activeOrder: {
        orderId: makeOrderId(),
        recipe: first,
        orderIndex: 0,
        startTimeMs: Date.now(),
      },
      selectedGlass: null,
      currentIngredients: {},
    });
  },

  selectGlass: (glass) => set({ selectedGlass: glass }),

  tapIngredient: (id, amount) =>
    set((s) => ({
      currentIngredients: {
        ...s.currentIngredients,
        [id]: (s.currentIngredients[id] ?? 0) + amount,
      },
    })),

  clearIngredients: () => set({ currentIngredients: {} }),

  submitDrink: (endTimeMs) => {
    const s = get();
    if (!s.activeOrder) return;

    const { orderId, recipe, orderIndex, startTimeMs } = s.activeOrder;

    const attempt: DrinkAttempt = {
      orderId,
      recipeId: recipe.id,
      ingredients: Object.entries(s.currentIngredients).map(([id, amount]) => ({ id, amount })),
      startTimeMs,
      endTimeMs,
    };

    const result = scoreDrink(recipe, attempt);
    const completedOrders = [...s.completedOrders, result.orderResult];

    if (s.pendingRecipes.length > 0) {
      const [next, ...remainingRecipes] = s.pendingRecipes;
      set({
        pendingRecipes: remainingRecipes,
        completedOrders,
        activeOrder: {
          orderId: makeOrderId(),
          recipe: next,
          orderIndex: orderIndex + 1,
          startTimeMs: Date.now(),
        },
        selectedGlass: null,
        currentIngredients: {},
      });
    } else {
      const levelResult = {
        level: s.currentLevel,
        orders: completedOrders,
        maxScore: s.ordersTotal * MAX_SCORE_PER_DRINK,
      };
      const summary = buildLevelSummary(levelResult);
      set({ completedOrders, activeOrder: null });
      get().showLevelComplete(summary);
    }
  },
}));
