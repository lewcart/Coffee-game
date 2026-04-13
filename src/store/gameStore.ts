import { create } from 'zustand';
<<<<<<< HEAD
import type {
  DrinkAttempt,
  DrinkRecipe,
  GlassSize,
  LevelSummary,
  ActiveOrder,
  OrderResult,
} from '../types/game';
=======
import type { ActiveOrder, DrinkAttempt, DrinkRecipe, GlassSize, LevelSummary, OrderResult } from '../types/game';
>>>>>>> ffb5171 (Order flash system (Espresso tier 1 orders) (#988a))
import { scoreDrink, buildLevelSummary, MAX_SCORE_PER_DRINK } from '../engine/scoring';
import { generateTier1Orders, TIER_1_ORDER_COUNT, TIER_1_TIME_LIMIT_MS } from '../data/recipes';

type Screen = 'game' | 'levelComplete';

<<<<<<< HEAD
let orderIdCounter = 0;

function makeOrderId(): string {
  return `order-${++orderIdCounter}`;
}

=======
>>>>>>> ffb5171 (Order flash system (Espresso tier 1 orders) (#988a))
interface GameState {
  // ── Screen ─────────────────────────────────────────────────────────────────
  screen: Screen;
  levelSummary: LevelSummary | null;
  currentLevel: number;
  /** Increments each time a level starts or retries — use as <GameScreen key> */
  levelKey: number;

<<<<<<< HEAD
  // ── Level order queue ──────────────────────────────────────────────────────
  /** Total orders to serve this level */
  ordersTotal: number;
  /** Recipes waiting to be flashed, in order */
  orderQueue: DrinkRecipe[];
  /** The order currently being flashed or being made */
  activeOrder: ActiveOrder | null;
  /** Scored results accumulated this level */
  completedOrders: OrderResult[];

  // ── Cup station player input ───────────────────────────────────────────────
  selectedGlass: GlassSize | null;
  /** ingredientId → accumulated amount the player has tapped in */
  currentIngredients: Record<string, number>;

=======
  // ── Order flash state ──────────────────────────────────────────────────────
  /** Recipes waiting to be flashed, in order */
  orderQueue: DrinkRecipe[];
  /** The order currently on screen (flashing or active) */
  activeOrder: ActiveOrder | null;
  /** Scored results accumulated this level (order flash flow) */
  completedOrderResults: OrderResult[];

  // ── Cup station state (used by GameScreen / CupStation) ───────────────────
  ordersTotal: number;
  pendingRecipes: DrinkRecipe[];
  selectedGlass: GlassSize | null;
  /** ingredientId → accumulated amount added by the player */
  currentIngredients: Record<string, number>;
  completedOrders: OrderResult[];

>>>>>>> ffb5171 (Order flash system (Espresso tier 1 orders) (#988a))
  // ── Screen navigation ──────────────────────────────────────────────────────
  showLevelComplete: (summary: LevelSummary) => void;
  continueToNextLevel: () => void;
  retryLevel: () => void;

<<<<<<< HEAD
  // ── Level / order management ───────────────────────────────────────────────
  /** Generate a fresh order queue and reset all in-level state. */
  initLevel: (level: number) => void;
  /** Pull the next recipe from the queue and begin flashing it. */
  flashNextOrder: () => void;
  /**
   * Transition activeOrder from 'flashing' → 'active' and record when
   * the countdown began. Call this after the OrderFlash word-reveal completes.
   */
  activateOrder: () => void;
  /**
   * Mark the active order as expired (timer hit zero without submission).
   * Scores the attempt with whatever ingredients were added and advances.
   */
  expireOrder: () => void;

  // ── Cup station ────────────────────────────────────────────────────────────
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

  // ── Cup station actions ────────────────────────────────────────────────────
  startLevel: (level: number, recipes: DrinkRecipe[]) => void;
>>>>>>> ffb5171 (Order flash system (Espresso tier 1 orders) (#988a))
  selectGlass: (glass: GlassSize) => void;
  tapIngredient: (id: string, amount: number) => void;
  clearIngredients: () => void;
  /** Score the current ingredient set and advance (next order or level complete). */
  submitDrink: (endTimeMs: number) => void;
}

<<<<<<< HEAD
// ── Shared advance helper ──────────────────────────────────────────────────────
// After scoring an order, either flash the next one or trigger level complete.
function resolveNextState(
  s: GameState,
  newCompletedOrders: OrderResult[],
): Partial<GameState> {
  const sharedReset: Partial<GameState> = {
    completedOrders: newCompletedOrders,
    selectedGlass: null,
    currentIngredients: {},
  };

  if (s.orderQueue.length > 0) {
    const [recipe, ...remaining] = s.orderQueue;
    const nextOrder: ActiveOrder = {
      id: makeOrderId(),
      recipe,
      orderIndex: newCompletedOrders.length + 1,
      totalOrders: s.ordersTotal,
      timerStartedAt: 0,
      timeLimitMs: TIER_1_TIME_LIMIT_MS,
      status: 'flashing',
    };
    return {
      ...sharedReset,
      orderQueue: remaining,
      activeOrder: nextOrder,
    };
  }

  const levelResult = {
    level: s.currentLevel,
    orders: newCompletedOrders,
    maxScore: s.ordersTotal * MAX_SCORE_PER_DRINK,
  };
  const summary = buildLevelSummary(levelResult);
  return {
    ...sharedReset,
    activeOrder: null,
    screen: 'levelComplete',
    levelSummary: summary,
  };
}
=======
let orderIdCounter = 0;
>>>>>>> ffb5171 (Order flash system (Espresso tier 1 orders) (#988a))

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'game',
  levelSummary: null,
  currentLevel: 1,
  levelKey: 0,
<<<<<<< HEAD
  ordersTotal: TIER_1_ORDER_COUNT,
  orderQueue: [],
  activeOrder: null,
  completedOrders: [],
=======
  orderQueue: [],
  activeOrder: null,
  completedOrderResults: [],
  ordersTotal: 0,
  pendingRecipes: [],
>>>>>>> ffb5171 (Order flash system (Espresso tier 1 orders) (#988a))
  selectedGlass: null,
  currentIngredients: {},

  // ── Screen navigation ────────────────────────────────────────────────────────

  // ── Screen navigation ──────────────────────────────────────────────────────

  showLevelComplete: (summary) => set({ screen: 'levelComplete', levelSummary: summary }),

  continueToNextLevel: () =>
    set((s) => ({
      screen: 'game',
      levelSummary: null,
      currentLevel: s.currentLevel + 1,
      levelKey: s.levelKey + 1,
<<<<<<< HEAD
      ordersTotal: TIER_1_ORDER_COUNT,
      orderQueue: [],
      activeOrder: null,
      completedOrders: [],
=======
      orderQueue: [],
      activeOrder: null,
      completedOrderResults: [],
      pendingRecipes: [],
>>>>>>> ffb5171 (Order flash system (Espresso tier 1 orders) (#988a))
      selectedGlass: null,
      currentIngredients: {},
    })),

  retryLevel: () =>
    set((s) => ({
      screen: 'game',
      levelSummary: null,
      levelKey: s.levelKey + 1,
<<<<<<< HEAD
      ordersTotal: TIER_1_ORDER_COUNT,
      orderQueue: [],
      activeOrder: null,
      completedOrders: [],
=======
      orderQueue: [],
      activeOrder: null,
      completedOrderResults: [],
      pendingRecipes: [],
>>>>>>> ffb5171 (Order flash system (Espresso tier 1 orders) (#988a))
      selectedGlass: null,
      currentIngredients: {},
    })),

<<<<<<< HEAD
  // ── Level / order management ─────────────────────────────────────────────────

  initLevel: (level) => {
=======
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
  },

  // ── Cup station actions ────────────────────────────────────────────────────

  startLevel: (level, recipes) => {
    const [first, ...rest] = recipes;
>>>>>>> ffb5171 (Order flash system (Espresso tier 1 orders) (#988a))
    set({
      currentLevel: level,
      ordersTotal: TIER_1_ORDER_COUNT,
      orderQueue: generateTier1Orders(TIER_1_ORDER_COUNT),
      activeOrder: null,
      completedOrders: [],
<<<<<<< HEAD
=======
      activeOrder: {
        id: `order-${++orderIdCounter}`,
        recipe: first,
        orderIndex: 0,
        totalOrders: recipes.length,
        timerStartedAt: Date.now(),
        timeLimitMs: first.timeLimitMs,
        status: 'active',
      },
>>>>>>> ffb5171 (Order flash system (Espresso tier 1 orders) (#988a))
      selectedGlass: null,
      currentIngredients: {},
    });
  },

  flashNextOrder: () => {
    const { orderQueue, completedOrders, ordersTotal } = get();
    if (orderQueue.length === 0) return;

    const [recipe, ...remaining] = orderQueue;
    const order: ActiveOrder = {
      id: makeOrderId(),
      recipe,
      orderIndex: completedOrders.length + 1,
      totalOrders: ordersTotal,
      timerStartedAt: 0,
      timeLimitMs: TIER_1_TIME_LIMIT_MS,
      status: 'flashing',
    };
    set({ orderQueue: remaining, activeOrder: order });
  },

  activateOrder: () =>
    set((s) => {
      if (!s.activeOrder) return s;
      return {
        activeOrder: {
          ...s.activeOrder,
          status: 'active',
          timerStartedAt: Date.now(),
        },
      };
    }),

  expireOrder: () => {
    const s = get();
    if (!s.activeOrder) return;

    const { id: orderId, recipe, timerStartedAt, timeLimitMs } = s.activeOrder;

    const attempt: DrinkAttempt = {
      orderId,
      recipeId: recipe.id,
      ingredients: Object.entries(s.currentIngredients).map(([id, amount]) => ({ id, amount })),
      startTimeMs: timerStartedAt,
      // Treat as fully elapsed so speed bonus is 0
      endTimeMs: timerStartedAt + timeLimitMs,
    };

    const result = scoreDrink(recipe, attempt, timeLimitMs);
    const newCompleted = [...s.completedOrders, result.orderResult];
    set(resolveNextState(s, newCompleted));
  },

  // ── Cup station ──────────────────────────────────────────────────────────────

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
    if (!s.activeOrder || s.activeOrder.status !== 'active') return;

<<<<<<< HEAD
    const { id: orderId, recipe, timerStartedAt, timeLimitMs } = s.activeOrder;
=======
    const { id, recipe, orderIndex, timerStartedAt } = s.activeOrder;
>>>>>>> ffb5171 (Order flash system (Espresso tier 1 orders) (#988a))

    const attempt: DrinkAttempt = {
      orderId: id,
      recipeId: recipe.id,
<<<<<<< HEAD
      ingredients: Object.entries(s.currentIngredients).map(([id, amount]) => ({ id, amount })),
=======
      ingredients: Object.entries(s.currentIngredients).map(([ingId, amount]) => ({
        id: ingId,
        amount,
      })),
>>>>>>> ffb5171 (Order flash system (Espresso tier 1 orders) (#988a))
      startTimeMs: timerStartedAt,
      endTimeMs,
    };

<<<<<<< HEAD
    const result = scoreDrink(recipe, attempt, timeLimitMs);
    const newCompleted = [...s.completedOrders, result.orderResult];
    set(resolveNextState(s, newCompleted));
=======
    const result = scoreDrink(recipe, attempt);
    const completedOrders = [...s.completedOrders, result.orderResult];

    if (s.pendingRecipes.length > 0) {
      const [next, ...remainingRecipes] = s.pendingRecipes;
      set({
        pendingRecipes: remainingRecipes,
        completedOrders,
        activeOrder: {
          id: `order-${++orderIdCounter}`,
          recipe: next,
          orderIndex: orderIndex + 1,
          totalOrders: s.ordersTotal,
          timerStartedAt: Date.now(),
          timeLimitMs: next.timeLimitMs,
          status: 'active',
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
>>>>>>> ffb5171 (Order flash system (Espresso tier 1 orders) (#988a))
  },
}));
