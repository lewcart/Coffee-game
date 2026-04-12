import type {
  DrinkAttempt,
  DrinkRecipe,
  DrinkScoringResult,
  IngredientScore,
  LevelResult,
  LevelSummary,
  OrderResult,
  PlayerIngredient,
  StarRating,
} from '../types/game';

// ── Per-drink constants (matches GDD: 1000 pts max per drink) ───────────────
export const MAX_ACCURACY_PER_DRINK = 700;
export const MAX_SPEED_PER_DRINK = 300;
export const MAX_SCORE_PER_DRINK = MAX_ACCURACY_PER_DRINK + MAX_SPEED_PER_DRINK;

// ── Star thresholds ─────────────────────────────────────────────────────────
const STAR_3_THRESHOLD = 0.8; // ≥ 80%
const STAR_2_THRESHOLD = 0.5; // ≥ 50%

export function computeStars(percentage: number): StarRating {
  if (percentage >= STAR_3_THRESHOLD) return 3;
  if (percentage >= STAR_2_THRESHOLD) return 2;
  return 1;
}

/**
 * Score accuracy for a single drink.
 * correctIngredients / totalIngredients * MAX_ACCURACY_PER_DRINK
 */
export function scoreAccuracy(correctIngredients: number, totalIngredients: number): number {
  if (totalIngredients === 0) return 0;
  return Math.round((correctIngredients / totalIngredients) * MAX_ACCURACY_PER_DRINK);
}

/**
 * Score speed for a single drink.
 * timeRemaining / totalTime * MAX_SPEED_PER_DRINK
 */
export function scoreSpeed(timeRemainingMs: number, totalTimeMs: number): number {
  if (totalTimeMs === 0) return 0;
  const ratio = Math.max(0, Math.min(1, timeRemainingMs / totalTimeMs));
  return Math.round(ratio * MAX_SPEED_PER_DRINK);
}

/** Aggregate a LevelResult into a displayable LevelSummary */
export function buildLevelSummary(result: LevelResult): LevelSummary {
  const completed = result.orders.filter((o) => o.completed);
  const totalAccuracy = completed.reduce((sum, o) => sum + o.accuracyScore, 0);
  const totalSpeedBonus = completed.reduce((sum, o) => sum + o.speedBonus, 0);
  const totalScore = totalAccuracy + totalSpeedBonus;
  const maxScore = result.maxScore;
  const percentage = maxScore > 0 ? totalScore / maxScore : 0;
  const stars = computeStars(percentage);

  return {
    level: result.level,
    orders: result.orders,
    totalAccuracy,
    totalSpeedBonus,
    totalScore,
    maxScore,
    stars,
    percentage,
  };
}

// ── Per-ingredient & per-drink scoring ──────────────────────────────────────

/**
 * Score a single ingredient on a 0–1 scale.
 *
 * Within ±`tolerance` fraction of the target: full marks (1.0).
 * Beyond that: linear decay reaching 0 when the deviation equals the target
 * amount (i.e. completely wrong quantity or absent).
 *
 * @param targetAmount  The recipe's required amount.
 * @param actualAmount  What the player actually added.
 * @param tolerance     Fraction of target treated as "close enough" (default 15 %).
 */
export function scoreIngredient(
  targetAmount: number,
  actualAmount: number,
  tolerance = 0.15,
): number {
  if (targetAmount <= 0) return 0;
  const deviation = Math.abs(actualAmount - targetAmount) / targetAmount;
  if (deviation <= tolerance) return 1;
  // Linear decay from 1 at the tolerance boundary to 0 at deviation = 1
  return Math.max(0, 1 - (deviation - tolerance) / (1 - tolerance));
}

/**
 * Score a complete drink attempt, combining ingredient accuracy and speed.
 *
 * Accuracy (0–700):
 *   - Each recipe ingredient is scored 0–1 via `scoreIngredient`.
 *   - Missing ingredients score 0; extra (unwanted) ingredients each reduce
 *     the raw accuracy by `EXTRA_INGREDIENT_PENALTY` before scaling to 700.
 *
 * Speed bonus (0–300):
 *   - Full 300 points if completed with time remaining.
 *   - Linear decay to 0 as time runs out.
 *   - 0 if the time limit is exceeded.
 */
const EXTRA_INGREDIENT_PENALTY = 0.1; // fraction deducted per extra ingredient

/**
 * @param timeLimitMs  Optional override for the speed-scoring time limit.
 *                     Defaults to recipe.timeLimitMs. Pass activeOrder.timeLimitMs
 *                     when the countdown differs from the recipe's built-in limit
 *                     (e.g. tier-1 18 s countdown vs. recipe's 30 s default).
 */
export function scoreDrink(
  recipe: DrinkRecipe,
  attempt: DrinkAttempt,
  timeLimitMs = recipe.timeLimitMs,
): DrinkScoringResult {
  const timeTakenMs = attempt.endTimeMs - attempt.startTimeMs;

  // Index player ingredients for O(1) lookup
  const playerMap = new Map<string, number>(attempt.ingredients.map((p) => [p.id, p.amount]));

  // Score each recipe ingredient
  const ingredientBreakdown: IngredientScore[] = recipe.ingredients.map((ri) => {
    const actualAmount = playerMap.get(ri.id) ?? 0;
    const missing = !playerMap.has(ri.id);
    return {
      ingredientId: ri.id,
      name: ri.name,
      targetAmount: ri.amount,
      actualAmount,
      unit: ri.unit,
      score: missing ? 0 : scoreIngredient(ri.amount, actualAmount),
      missing,
      extra: false,
    };
  });

  // Find extra (unwanted) ingredients
  const recipeIds = new Set(recipe.ingredients.map((ri) => ri.id));
  const extraIngredients: PlayerIngredient[] = attempt.ingredients.filter(
    (p) => !recipeIds.has(p.id),
  );

  // Raw accuracy: mean of per-ingredient scores, penalised for extras
  const meanIngredientScore =
    recipe.ingredients.length > 0
      ? ingredientBreakdown.reduce((sum, s) => sum + s.score, 0) / recipe.ingredients.length
      : 0;

  const extraPenalty = Math.min(extraIngredients.length * EXTRA_INGREDIENT_PENALTY, 1);
  const rawAccuracy = Math.max(0, meanIngredientScore - extraPenalty);
  const accuracyScore = Math.round(rawAccuracy * MAX_ACCURACY_PER_DRINK);

  // Speed bonus (uses the caller-supplied timeLimitMs, not necessarily recipe.timeLimitMs)
  const timeRemainingMs = Math.max(0, timeLimitMs - timeTakenMs);
  const speedBonus = scoreSpeed(timeRemainingMs, timeLimitMs);

  const totalScore = accuracyScore + speedBonus;

  const orderResult: OrderResult = {
    id: attempt.orderId,
    coffeeName: recipe.name,
    accuracyScore,
    speedBonus,
    completed: true,
  };

  return {
    orderId: attempt.orderId,
    recipeName: recipe.name,
    timeTakenMs,
    ingredientBreakdown,
    extraIngredients,
    accuracyScore,
    speedBonus,
    totalScore,
    orderResult,
  };
}

// ── Demo data ────────────────────────────────────────────────────────────────

function mockOrder(
  id: string,
  coffeeName: OrderResult['coffeeName'],
  accuracyScore: number,
  speedBonus: number,
): OrderResult {
  return { id, coffeeName, accuracyScore, speedBonus, completed: true };
}

/** Convenience factory for preview / Storybook use */
export function makeDemoResult(level: number, starTarget: 1 | 2 | 3): LevelResult {
  const orderCount = 5;
  const maxScore = orderCount * MAX_SCORE_PER_DRINK;

  const profiles: Record<1 | 2 | 3, [number, number][]> = {
    1: [
      [200, 40],
      [150, 30],
      [300, 60],
      [100, 20],
      [180, 50],
    ],
    2: [
      [400, 120],
      [500, 150],
      [450, 100],
      [380, 90],
      [420, 110],
    ],
    3: [
      [650, 280],
      [700, 300],
      [680, 260],
      [620, 270],
      [700, 290],
    ],
  };

  const names: OrderResult['coffeeName'][] = [
    'Espresso',
    'Double Espresso',
    'Americano',
    'Flat White',
    'Cappuccino',
  ];

  const orders = profiles[starTarget].map(([acc, spd], i) =>
    mockOrder(`order-${i}`, names[i], acc, spd),
  );

  return { level, orders, maxScore };
}
