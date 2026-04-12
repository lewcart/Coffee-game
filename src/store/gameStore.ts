import { create } from 'zustand';
<<<<<<< HEAD
import type { DrinkAttempt, DrinkRecipe, GlassSize, LevelSummary, OrderResult } from '../types/game';
import { scoreDrink, buildLevelSummary, MAX_SCORE_PER_DRINK } from '../engine/scoring';
=======
import type { LevelSummary, ActiveOrder, OrderResult, DrinkRecipe } from '../types/game';
import { generateTier1Orders, TIER_1_ORDER_COUNT, TIER_1_TIME_LIMIT_MS } from '../data/recipes';
>>>>>>> df3aeff (COF-010: Order flash system — Espresso tier-1 orders)

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

<<<<<<< HEAD
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

=======
  // ── Order flash state ──────────────────────────────────────────────────────
  /** Recipes waiting to be flashed, in order */
  orderQueue: DrinkRecipe[];
  /** The order currently on screen (flashing or active) */
  activeOrder: ActiveOrder | null;
  /** Scored results accumulated this level */
  completedOrderResults: OrderResult[];

  // ── Screen navigation ──────────────────────────────────────────────────────
>>>>>>> df3aeff (COF-010: Order flash system — Espresso tier-1 orders)
  showLevelComplete: (summary: LevelSummary) => void;
  continueToNextLevel: () => void;
  retryLevel: () => void;

<<<<<<< HEAD
  startLevel: (level: number, recipes: DrinkRecipe[]) => void;
  selectGlass: (glass: GlassSize) => void;
  tapIngredient: (id: string, amount: number) => void;
  clearIngredients: () => void;
  submitDrink: (endTimeMs: number) => void;
}

function makeOrderId() {
  return `order-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
=======
  // ── Order flash actions ────────────────────────────────────────────────────

  /** Initialise a new level: generate a fresh tier-1 order queue and reset results. */
  initLevel: (level: number) => void;

  /**
   * Pull the next recipe from the queue and set it as the activeOrder with
   * status 'flashing'. No-op if the queue is empty.
   */
  flashNextOrder: () => void;

  /**
   * Transition the active order from 'flashing' → 'active' and record when
   * the 18-second countdown began. Call this after the word-reveal completes.
   */
  activateOrder: () => void;

  /** Record a scored result and mark the active order as 'completed'. */
  completeOrder: (result: OrderResult) => void;

  /** Mark the active order as 'expired' (timer hit zero). */
  expireOrder: () => void;
}

let orderIdCounter = 0;
>>>>>>> df3aeff (COF-010: Order flash system — Espresso tier-1 orders)

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'game',
  levelSummary: null,
  currentLevel: 1,
  orderQueue: [],
  activeOrder: null,
  completedOrderResults: [],

  // ── Screen navigation ──────────────────────────────────────────────────────

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

<<<<<<< HEAD
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
=======
  retryLevel: () => set({ screen: 'game', levelSummary: null }),

  // ── Order flash actions ────────────────────────────────────────────────────

  initLevel: (level) => {
    set({
      currentLevel: level,
      orderQueue: generateTier1Orders(TIER_1_ORDER_COUNT),
      activeOrder: null,
      completedOrderResults: [],
    });
  },

  flashNextOrder: () => {
    const { orderQueue, completedOrderResults } = get();
    if (orderQueue.length === 0) return;

    const [recipe, ...remaining] = orderQueue;
    const order: ActiveOrder = {
      id: `order-${++orderIdCounter}`,
      recipe,
      orderIndex: completedOrderResults.length + 1,
      totalOrders: TIER_1_ORDER_COUNT,
      timerStartedAt: 0,
      timeLimitMs: TIER_1_TIME_LIMIT_MS,
      status: 'flashing',
    };
    set({ orderQueue: remaining, activeOrder: order });
  },

  activateOrder: () => {
    set((s) => {
      if (!s.activeOrder) return s;
      return {
        activeOrder: {
          ...s.activeOrder,
          status: 'active',
          timerStartedAt: Date.now(),
        },
      };
    });
  },

  completeOrder: (result) => {
    set((s) => {
      if (!s.activeOrder) return s;
      return {
        activeOrder: { ...s.activeOrder, status: 'completed' },
        completedOrderResults: [...s.completedOrderResults, result],
      };
    });
  },

  expireOrder: () => {
    set((s) => {
      if (!s.activeOrder) return s;
      return { activeOrder: { ...s.activeOrder, status: 'expired' } };
    });
>>>>>>> df3aeff (COF-010: Order flash system — Espresso tier-1 orders)
  },
}));
