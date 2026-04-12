// ── Core game types ──────────────────────────────────────────────────────────

export type GlassSize = 'small' | 'medium' | 'large';

export type CoffeeName =
  | 'Espresso'
  | 'Double Espresso'
  | 'Americano'
  | 'Flat White'
  | 'Latte'
  | 'Cappuccino'
  | 'Macchiato';

/** A single order result after scoring */
export interface OrderResult {
  id: string;
  coffeeName: CoffeeName;
  /** 0–700: ingredient accuracy component */
  accuracyScore: number;
  /** 0–300: speed bonus component */
  speedBonus: number;
  /** true if the order was completed (even incorrectly) */
  completed: boolean;
}

/** Aggregated level result passed to the level complete screen */
export interface LevelResult {
  level: number;
  orders: OrderResult[];
  /** Max possible score for this level (ordersTotal * 1000) */
  maxScore: number;
}

/** Star rating 1–3 */
export type StarRating = 1 | 2 | 3;

/** What the LevelComplete screen receives */
export interface LevelSummary {
  level: number;
  orders: OrderResult[];
  totalAccuracy: number;
  totalSpeedBonus: number;
  totalScore: number;
  maxScore: number;
  stars: StarRating;
  percentage: number;
}

// ── Drink recipe & attempt types ─────────────────────────────────────────────

export type DrinkUnit = 'ml' | 'shots' | 'g';

/** One ingredient in a recipe with its target amount */
export interface RecipeIngredient {
  id: string;
  name: string;
  unit: DrinkUnit;
  amount: number;
}

/** Full recipe definition for a drink */
export interface DrinkRecipe {
  id: string;
  name: CoffeeName;
  description: string;
  ingredients: RecipeIngredient[];
  /** Time limit in ms: speed score is 300 at 0 remaining, 0 at limit */
  timeLimitMs: number;
}

/** A single ingredient as added by the player */
export interface PlayerIngredient {
  /** Must match a RecipeIngredient.id (or be novel for extras) */
  id: string;
  amount: number;
}

/** Everything captured when a player submits a drink */
export interface DrinkAttempt {
  orderId: string;
  recipeId: string;
  ingredients: PlayerIngredient[];
  /** Date.now() when the order timer started */
  startTimeMs: number;
  /** Date.now() when the player submitted */
  endTimeMs: number;
}

// ── Order flash / active order types ────────────────────────────────────────

export type OrderStatus = 'flashing' | 'active' | 'completed' | 'expired';

export interface ActiveOrder {
  /** Unique order id (used to key renders and scoring) */
  id: string;
  recipe: DrinkRecipe;
  /** 1-based position in the current level queue */
  orderIndex: number;
  /** Total number of orders this level */
  totalOrders: number;
  /** Date.now() when the 18-sec countdown begins (0 while still flashing) */
  timerStartedAt: number;
  /** Duration of the countdown in ms (18 000 for tier 1) */
  timeLimitMs: number;
  status: OrderStatus;
}

// ── Per-drink scoring detail ─────────────────────────────────────────────────

/** Accuracy breakdown for a single ingredient */
export interface IngredientScore {
  ingredientId: string;
  name: string;
  targetAmount: number;
  actualAmount: number;
  unit: DrinkUnit;
  /** 0–1: continuous accuracy for this ingredient */
  score: number;
  missing: boolean;
  extra: boolean;
}

/** Full scoring result for one drink attempt */
export interface DrinkScoringResult {
  orderId: string;
  recipeName: CoffeeName;
  timeTakenMs: number;
  ingredientBreakdown: IngredientScore[];
  /** Ingredients the player added that aren't in the recipe */
  extraIngredients: PlayerIngredient[];
  /** 0–700 */
  accuracyScore: number;
  /** 0–300 */
  speedBonus: number;
  /** accuracyScore + speedBonus (0–1000) */
  totalScore: number;
  /** Convenience cast — directly usable in LevelResult.orders */
  orderResult: OrderResult;
}
