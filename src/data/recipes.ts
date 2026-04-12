import type { DrinkRecipe } from '../types/game';

/**
 * Canonical recipes for each drink in the game.
 * Amounts are in realistic barista units (ml / shots / g).
 * timeLimitMs is calibrated to the complexity of the drink.
 */
export const RECIPES: DrinkRecipe[] = [
  {
    id: 'espresso',
    name: 'Espresso',
    description: 'A concentrated shot of coffee brewed under pressure.',
    timeLimitMs: 30_000,
    ingredients: [
      { id: 'espresso-shot', name: 'Espresso shot', unit: 'shots', amount: 1 },
    ],
  },
  {
    id: 'double-espresso',
    name: 'Double Espresso',
    description: 'Two shots of espresso for a bolder, richer brew.',
    timeLimitMs: 35_000,
    ingredients: [
      { id: 'espresso-shot', name: 'Espresso shot', unit: 'shots', amount: 2 },
    ],
  },
  {
    id: 'americano',
    name: 'Americano',
    description: 'Espresso diluted with hot water for a longer drink.',
    timeLimitMs: 40_000,
    ingredients: [
      { id: 'espresso-shot', name: 'Espresso shot', unit: 'shots', amount: 2 },
      { id: 'hot-water', name: 'Hot water', unit: 'ml', amount: 120 },
    ],
  },
  {
    id: 'flat-white',
    name: 'Flat White',
    description: 'Double ristretto with velvety steamed whole milk.',
    timeLimitMs: 50_000,
    ingredients: [
      { id: 'espresso-shot', name: 'Espresso shot', unit: 'shots', amount: 2 },
      { id: 'steamed-milk', name: 'Steamed milk', unit: 'ml', amount: 120 },
    ],
  },
  {
    id: 'latte',
    name: 'Latte',
    description: 'Espresso topped with steamed milk and a thin layer of foam.',
    timeLimitMs: 55_000,
    ingredients: [
      { id: 'espresso-shot', name: 'Espresso shot', unit: 'shots', amount: 2 },
      { id: 'steamed-milk', name: 'Steamed milk', unit: 'ml', amount: 150 },
      { id: 'milk-foam', name: 'Milk foam', unit: 'ml', amount: 10 },
    ],
  },
  {
    id: 'cappuccino',
    name: 'Cappuccino',
    description: 'Equal parts espresso, steamed milk, and dry foam.',
    timeLimitMs: 55_000,
    ingredients: [
      { id: 'espresso-shot', name: 'Espresso shot', unit: 'shots', amount: 2 },
      { id: 'steamed-milk', name: 'Steamed milk', unit: 'ml', amount: 60 },
      { id: 'milk-foam', name: 'Milk foam', unit: 'ml', amount: 60 },
    ],
  },
  {
    id: 'macchiato',
    name: 'Macchiato',
    description: 'Espresso "stained" with a small dollop of milk foam.',
    timeLimitMs: 35_000,
    ingredients: [
      { id: 'espresso-shot', name: 'Espresso shot', unit: 'shots', amount: 1 },
      { id: 'milk-foam', name: 'Milk foam', unit: 'ml', amount: 15 },
    ],
  },
];

/** Look up a recipe by its id. Returns undefined if not found. */
export function getRecipeById(id: string): DrinkRecipe | undefined {
  return RECIPES.find((r) => r.id === id);
}

/** Look up a recipe by drink name. Returns undefined if not found. */
export function getRecipeByName(name: string): DrinkRecipe | undefined {
  return RECIPES.find((r) => r.name === name);
}
