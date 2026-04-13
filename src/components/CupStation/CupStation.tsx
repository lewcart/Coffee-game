import { useEffect, useRef, useState } from 'react';
import type { DrinkRecipe, GlassSize } from '../../types/game';
import { useGameStore } from '../../store/gameStore';
import './CupStation.css';

// ── Ingredient config ──────────────────────────────────────────────────────

/** Fixed display order of layers in the cup visual (bottom → top) */
const LAYER_ORDER = ['espresso-shot', 'hot-water', 'steamed-milk', 'milk-foam'];

const INGREDIENT_COLORS: Record<string, string> = {
  'espresso-shot': '#2c1505',
  'hot-water':     '#7aacbf',
  'steamed-milk':  '#d4c4aa',
  'milk-foam':     '#f0e8da',
};

const INGREDIENT_LABEL: Record<string, string> = {
  'espresso-shot': 'Espresso',
  'hot-water':     'Hot Water',
  'steamed-milk':  'Steamed Milk',
  'milk-foam':     'Milk Foam',
};

/** Amount added per single tap */
const TAP_INCREMENT: Record<string, { amount: number; unit: string }> = {
  'espresso-shot': { amount: 1,  unit: 'shot' },
  'hot-water':     { amount: 40, unit: 'ml'   },
  'steamed-milk':  { amount: 30, unit: 'ml'   },
  'milk-foam':     { amount: 10, unit: 'ml'   },
};

/** All taps shown in the UI, in display order */
const ALL_TAPS = ['espresso-shot', 'hot-water', 'steamed-milk', 'milk-foam'];

/** Converts an ingredient amount to ml-equivalent for the cup visual */
function toMlEquiv(_id: string, amount: number, unit: string): number {
  if (unit === 'shots') return amount * 30;
  return amount; // ml and g treated 1:1
}

/** Max visual capacity (ml-equiv) per glass size */
const GLASS_CAPACITY: Record<GlassSize, number> = {
  small:  90,
  medium: 200,
  large:  260,
};

/** Recommended glass per recipe id */
const RECIPE_GLASS: Record<string, GlassSize> = {
  'espresso':        'small',
  'double-espresso': 'small',
  'americano':       'medium',
  'flat-white':      'medium',
  'cappuccino':      'medium',
  'latte':           'large',
  'macchiato':       'small',
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatAdded(id: string, amount: number): string {
  const { unit } = TAP_INCREMENT[id];
  if (unit === 'shot') return amount === 1 ? '1 shot' : `${amount} shots`;
  return `${amount}${unit}`;
}

function formatIngredient(name: string, unit: string, amount: number): string {
  if (unit === 'shots') return amount === 1 ? `1 shot ${name}` : `${amount} shots ${name}`;
  return `${amount}${unit} ${name}`;
}

function formatTime(ms: number): string {
  const s = Math.ceil(ms / 1000);
  return `${s}s`;
}

// ── Sub-components ─────────────────────────────────────────────────────────

interface GlassButtonProps {
  size: GlassSize;
  selected: boolean;
  onClick: () => void;
}

function GlassButton({ size, selected, onClick }: GlassButtonProps) {
  const labels: Record<GlassSize, string> = { small: 'Small', medium: 'Medium', large: 'Large' };
  return (
    <button
      className={`cs-glass-btn ${selected ? 'cs-glass-btn--selected' : ''}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      <span className={`cs-glass-icon cs-glass-icon--${size}`} aria-hidden="true" />
      <span className="cs-glass-label">{labels[size]}</span>
    </button>
  );
}

interface CupVisualProps {
  ingredients: Record<string, number>;
  recipe: DrinkRecipe;
  glass: GlassSize;
}

function CupVisual({ ingredients, recipe, glass }: CupVisualProps) {
  const capacity = GLASS_CAPACITY[glass];

  // Build layers from bottom to top
  const layers = LAYER_ORDER.map((id) => {
    const amount = ingredients[id] ?? 0;
    // Find unit from recipe or TAP_INCREMENT
    const recipeIng = recipe.ingredients.find((ri) => ri.id === id);
    const unit = recipeIng?.unit ?? (id === 'espresso-shot' ? 'shots' : 'ml');
    const mlEq = toMlEquiv(id, amount, unit);
    return { id, mlEq };
  }).filter((l) => l.mlEq > 0);

  const totalMl = layers.reduce((s, l) => s + l.mlEq, 0);
  const fillPct = Math.min(totalMl / capacity, 1);
  const overflowing = totalMl > capacity;

  return (
    <div className="cs-cup-wrap">
      <div className={`cs-cup ${overflowing ? 'cs-cup--overflow' : ''}`}>
        {/* Fill area */}
        <div className="cs-cup-fill" style={{ height: `${fillPct * 100}%` }}>
          {layers.map((layer, i) => {
            const layerPct = (layer.mlEq / Math.max(totalMl, 1)) * 100;
            return (
              <div
                key={layer.id}
                className="cs-cup-layer"
                style={{
                  height: `${layerPct}%`,
                  background: INGREDIENT_COLORS[layer.id] ?? '#888',
                  // Bottom layer gets rounded corners
                  borderRadius: i === 0 ? '0 0 10px 10px' : '0',
                }}
                title={`${INGREDIENT_LABEL[layer.id]}: ${layer.mlEq}ml`}
              />
            );
          })}
        </div>
      </div>
      <p className={`cs-cup-label ${overflowing ? 'cs-cup-label--overflow' : ''}`}>
        {overflowing ? 'Overflow!' : `${Math.round(totalMl)}ml`}
      </p>
    </div>
  );
}

interface TapButtonProps {
  id: string;
  currentAmount: number;
  inRecipe: boolean;
  onTap: () => void;
}

function TapButton({ id, currentAmount, inRecipe, onTap }: TapButtonProps) {
  const { amount, unit } = TAP_INCREMENT[id];
  const label = INGREDIENT_LABEL[id];
  const incrementLabel = unit === 'shot' ? `+${amount} shot` : `+${amount}${unit}`;
  const added = currentAmount > 0;

  return (
    <button
      className={`cs-tap ${added ? 'cs-tap--active' : ''} ${!inRecipe ? 'cs-tap--extra' : ''}`}
      onClick={onTap}
    >
      <span
        className="cs-tap-swatch"
        style={{ background: INGREDIENT_COLORS[id] }}
        aria-hidden="true"
      />
      <span className="cs-tap-name">{label}</span>
      <span className="cs-tap-increment">{incrementLabel}</span>
      {added && (
        <span className="cs-tap-added">{formatAdded(id, currentAmount)}</span>
      )}
    </button>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

interface CupStationProps {
  recipe: DrinkRecipe;
  /** 1-based position in the current level */
  orderIndex: number;
  ordersTotal: number;
  /** Date.now() when the countdown started (after OrderFlash word-reveal) */
  timerStartedAt: number;
  /** Duration of the countdown in ms */
  timeLimitMs: number;
}

export function CupStation({ recipe, orderIndex, ordersTotal, timerStartedAt, timeLimitMs }: CupStationProps) {
  const { selectedGlass, currentIngredients, selectGlass, tapIngredient, clearIngredients, submitDrink } =
    useGameStore();

  const [timeRemainingMs, setTimeRemainingMs] = useState(
<<<<<<< HEAD
    () => Math.max(0, timeLimitMs - (Date.now() - timerStartedAt)),
=======
    () => Math.max(0, recipe.timeLimitMs - (Date.now() - startTimeMs)),
>>>>>>> ffb5171 (Order flash system (Espresso tier 1 orders) (#988a))
  );
  const submittedRef = useRef(false);

  // Reset submitted flag when order changes
  useEffect(() => {
    submittedRef.current = false;
  }, [timerStartedAt]);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, timeLimitMs - (Date.now() - timerStartedAt));
      setTimeRemainingMs(remaining);

      if (remaining === 0 && !submittedRef.current) {
        submittedRef.current = true;
        submitDrink(Date.now());
      }
    }, 100);

    return () => clearInterval(interval);
  }, [timeLimitMs, timerStartedAt, submitDrink]);

  const activeGlass = selectedGlass ?? RECIPE_GLASS[recipe.id] ?? 'medium';
  const timerPct = (timeRemainingMs / timeLimitMs) * 100;
  const timerUrgent = timerPct < 25;

  const recipeIngredientIds = new Set(recipe.ingredients.map((ri) => ri.id));

  function handleSubmit() {
    if (submittedRef.current) return;
    submittedRef.current = true;
    submitDrink(Date.now());
  }

  return (
    <div className="cs-root">
      {/* ── Order header ── */}
      <header className="cs-header">
        <div className="cs-order-meta">
          <span className="cs-order-badge">Order {orderIndex}/{ordersTotal}</span>
          <h1 className="cs-drink-name">{recipe.name}</h1>
        </div>
        <ul className="cs-recipe-hint" aria-label="Recipe ingredients">
          {recipe.ingredients.map((ri) => (
            <li key={ri.id}>{formatIngredient(ri.name, ri.unit, ri.amount)}</li>
          ))}
        </ul>

        {/* Timer bar */}
        <div className="cs-timer-wrap" aria-label={`Time remaining: ${formatTime(timeRemainingMs)}`}>
          <div
            className={`cs-timer-bar ${timerUrgent ? 'cs-timer-bar--urgent' : ''}`}
            style={{ width: `${timerPct}%` }}
          />
          <span className={`cs-timer-label ${timerUrgent ? 'cs-timer-label--urgent' : ''}`}>
            {formatTime(timeRemainingMs)}
          </span>
        </div>
      </header>

      {/* ── Glass selector ── */}
      <section className="cs-glass-section" aria-label="Select glass size">
        <p className="cs-section-label">Glass</p>
        <div className="cs-glass-row">
          {(['small', 'medium', 'large'] as const).map((size) => (
            <GlassButton
              key={size}
              size={size}
              selected={activeGlass === size}
              onClick={() => selectGlass(size)}
            />
          ))}
        </div>
      </section>

      {/* ── Cup visual ── */}
      <CupVisual
        ingredients={currentIngredients}
        recipe={recipe}
        glass={activeGlass}
      />

      {/* ── Ingredient taps ── */}
      <section className="cs-taps-section" aria-label="Ingredient taps">
        <p className="cs-section-label">Add ingredients</p>
        <div className="cs-taps-grid">
          {ALL_TAPS.map((id) => (
            <TapButton
              key={id}
              id={id}
              currentAmount={currentIngredients[id] ?? 0}
              inRecipe={recipeIngredientIds.has(id)}
              onTap={() => tapIngredient(id, TAP_INCREMENT[id].amount)}
            />
          ))}
        </div>
      </section>

      {/* ── Actions ── */}
      <div className="cs-actions">
        <button className="cs-btn cs-btn--secondary" onClick={clearIngredients}>
          Clear
        </button>
        <button className="cs-btn cs-btn--primary" onClick={handleSubmit}>
          Submit
        </button>
      </div>
    </div>
  );
}
