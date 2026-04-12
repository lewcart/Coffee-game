import { create } from 'zustand';
import type {
  DrinkAttempt,
  DrinkRecipe,
  GlassSize,
  LevelSummary,
  ActiveOrder,
  OrderResult,
} from '../types/game';
import { scoreDrink, buildLevelSummary, MAX_SCORE_PER_DRINK } from '../engine/scoring';
import { generateTier1Orders, TIER_1_ORDER_COUNT, TIER_1_TIME_LIMIT_MS } from '../data/recipes';

type Screen = 'game' | 'levelComplete';

let orderIdCounter = 0;

function makeOrderId(): string {
  return `order-${++orderIdCounter}`;
}

interface GameState {
  // ── Screen ─────────────────────────────────────────────────────────────────
  screen: Screen;
  levelSummary: LevelSummary | null;
  currentLevel: number;
  /** Increments each time a level starts or retries — use as <GameScreen key> */
  levelKey: number;

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

  // ── Screen navigation ──────────────────────────────────────────────────────
  showLevelComplete: (summary: LevelSummary) => void;
  continueToNextLevel: () => void;
  retryLevel: () => void;

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
  selectGlass: (glass: GlassSize) => void;
  tapIngredient: (id: string, amount: number) => void;
  clearIngredients: () => void;
  /** Score the current ingredient set and advance (next order or level complete). */
  submitDrink: (endTimeMs: number) => void;
}

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

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'game',
  levelSummary: null,
  currentLevel: 1,
  levelKey: 0,
  ordersTotal: TIER_1_ORDER_COUNT,
  orderQueue: [],
  activeOrder: null,
  completedOrders: [],
  selectedGlass: null,
  currentIngredients: {},

  // ── Screen navigation ────────────────────────────────────────────────────────

  showLevelComplete: (summary) => set({ screen: 'levelComplete', levelSummary: summary }),

  continueToNextLevel: () =>
    set((s) => ({
      screen: 'game',
      levelSummary: null,
      currentLevel: s.currentLevel + 1,
      levelKey: s.levelKey + 1,
      ordersTotal: TIER_1_ORDER_COUNT,
      orderQueue: [],
      activeOrder: null,
      completedOrders: [],
      selectedGlass: null,
      currentIngredients: {},
    })),

  retryLevel: () =>
    set((s) => ({
      screen: 'game',
      levelSummary: null,
      levelKey: s.levelKey + 1,
      ordersTotal: TIER_1_ORDER_COUNT,
      orderQueue: [],
      activeOrder: null,
      completedOrders: [],
      selectedGlass: null,
      currentIngredients: {},
    })),

  // ── Level / order management ─────────────────────────────────────────────────

  initLevel: (level) => {
    set({
      currentLevel: level,
      ordersTotal: TIER_1_ORDER_COUNT,
      orderQueue: generateTier1Orders(TIER_1_ORDER_COUNT),
      activeOrder: null,
      completedOrders: [],
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

    const { id: orderId, recipe, timerStartedAt, timeLimitMs } = s.activeOrder;

    const attempt: DrinkAttempt = {
      orderId,
      recipeId: recipe.id,
      ingredients: Object.entries(s.currentIngredients).map(([id, amount]) => ({ id, amount })),
      startTimeMs: timerStartedAt,
      endTimeMs,
    };

    const result = scoreDrink(recipe, attempt, timeLimitMs);
    const newCompleted = [...s.completedOrders, result.orderResult];
    set(resolveNextState(s, newCompleted));
  },
}));
