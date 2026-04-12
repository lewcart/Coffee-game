import { useEffect, useState } from 'react';
import type { DrinkRecipe } from '../../types/game';
import './CupCrossSection.css';

// ── Ingredient visual config ──────────────────────────────────────────────────

interface IngredientVisual {
  /** SVG fill — may be a gradient reference like `url(#grad-espresso)` */
  fill: string;
  /** Solid colour used in the legend swatch */
  swatchColor: string;
}

const INGREDIENT_VISUAL: Record<string, IngredientVisual> = {
  'espresso-shot': {
    fill: 'url(#ccs-grad-espresso)',
    swatchColor: '#1a0800',
  },
  'hot-water': {
    fill: '#7aafc4',
    swatchColor: '#7aafc4',
  },
  'steamed-milk': {
    fill: 'url(#ccs-grad-milk)',
    swatchColor: '#e8d5b8',
  },
  'milk-foam': {
    fill: 'url(#ccs-grad-foam)',
    swatchColor: '#f5ede0',
  },
};

const FALLBACK_FILLS = ['#7a8c6e', '#8c7a6e', '#6e7a8c', '#8c6e7a'];

// ── Cup geometry (SVG units, viewBox 0 0 200 250) ────────────────────────────

const INNER_TOP_Y = 36;
const INNER_BOTTOM_Y = 190;
const INNER_HEIGHT = INNER_BOTTOM_Y - INNER_TOP_Y; // 154

const OUTER_PATH = 'M 26 28 L 174 28 L 148 196 L 52 196 Z';
const INNER_PATH = 'M 34 36 L 166 36 L 142 190 L 58 190 Z';

// ── Layer computation ────────────────────────────────────────────────────────

function toMl(amount: number, unit: string): number {
  return unit === 'shots' ? amount * 30 : amount;
}

interface LayerDef {
  key: string;
  name: string;
  fill: string;
  swatchColor: string;
  y: number;
  height: number;
}

function buildLayers(recipe: DrinkRecipe): LayerDef[] {
  const items = recipe.ingredients.map((ing, i) => {
    const visual = INGREDIENT_VISUAL[ing.id];
    return {
      key: `${ing.id}-${i}`,
      name: ing.name,
      fill: visual?.fill ?? FALLBACK_FILLS[i % FALLBACK_FILLS.length],
      swatchColor: visual?.swatchColor ?? FALLBACK_FILLS[i % FALLBACK_FILLS.length],
      ml: toMl(ing.amount, ing.unit),
    };
  });

  const totalMl = items.reduce((sum, item) => sum + item.ml, 0);
  const layers: LayerDef[] = [];
  let currentY = INNER_BOTTOM_Y;

  for (const item of items) {
    const h = (item.ml / totalMl) * INNER_HEIGHT;
    layers.push({
      key: item.key,
      name: item.name,
      fill: item.fill,
      swatchColor: item.swatchColor,
      y: currentY - h,
      height: h,
    });
    currentY -= h;
  }

  return layers;
}

// ── Component ────────────────────────────────────────────────────────────────

export interface CupCrossSectionProps {
  recipe: DrinkRecipe;
  /** When true, layers fill in one-by-one. Default: true */
  animate?: boolean;
  /** Increment to replay the animation for the same recipe */
  animationKey?: number;
}

export function CupCrossSection({
  recipe,
  animate = true,
  animationKey = 0,
}: CupCrossSectionProps) {
  const layers = buildLayers(recipe);
  const [revealedCount, setRevealedCount] = useState(animate ? 0 : layers.length);

  useEffect(() => {
    if (!animate) {
      setRevealedCount(layers.length);
      return;
    }

    setRevealedCount(0);
    const timers: ReturnType<typeof setTimeout>[] = [];

    layers.forEach((_, i) => {
      const t = setTimeout(() => setRevealedCount(i + 1), 350 + i * 650);
      timers.push(t);
    });

    return () => timers.forEach(clearTimeout);
  }, [recipe.id, animationKey, animate]); // eslint-disable-line react-hooks/exhaustive-deps

  const clipId = `ccs-clip-${recipe.id}`;

  return (
    <div className="cup-cross-section">
      <svg
        viewBox="0 0 200 250"
        xmlns="http://www.w3.org/2000/svg"
        className="cup-svg"
        aria-label={`${recipe.name} cup cross-section`}
        role="img"
      >
        <defs>
          {/* Interior clip path */}
          <clipPath id={clipId}>
            <path d={INNER_PATH} />
          </clipPath>

          {/* Espresso: dark body with crema band at top */}
          <linearGradient id="ccs-grad-espresso" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c8823a" />
            <stop offset="20%" stopColor="#1a0800" />
            <stop offset="100%" stopColor="#1a0800" />
          </linearGradient>

          {/* Steamed milk: warm cream gradient */}
          <linearGradient id="ccs-grad-milk" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f0e4cc" />
            <stop offset="100%" stopColor="#d8c4a4" />
          </linearGradient>

          {/* Foam: airy white to warm below */}
          <linearGradient id="ccs-grad-foam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#f5ede0" />
            <stop offset="100%" stopColor="#ede0d0" />
          </linearGradient>

          {/* Cup ceramic: side-to-side highlight */}
          <linearGradient id="ccs-grad-ceramic" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#b89070" />
            <stop offset="25%" stopColor="#e8d0b0" />
            <stop offset="65%" stopColor="#d4b896" />
            <stop offset="100%" stopColor="#a87858" />
          </linearGradient>

          {/* Saucer */}
          <linearGradient id="ccs-grad-saucer" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8d0b0" />
            <stop offset="100%" stopColor="#b89070" />
          </linearGradient>
        </defs>

        {/* Saucer */}
        <ellipse cx="100" cy="207" rx="88" ry="14" fill="url(#ccs-grad-saucer)" />
        <ellipse cx="100" cy="204" rx="86" ry="11" fill="url(#ccs-grad-saucer)" opacity="0.6" />

        {/* Cup interior background */}
        <path d={INNER_PATH} fill="#0a0402" />

        {/* Liquid layers — clipped to interior */}
        <g clipPath={`url(#${clipId})`}>
          {layers.map((layer, i) => (
            <rect
              key={layer.key}
              x={0}
              y={layer.y}
              width={200}
              height={layer.height}
              fill={layer.fill}
              className={`cup-layer${i < revealedCount ? ' cup-layer--visible' : ''}`}
            />
          ))}
        </g>

        {/* Cup wall frame — even-odd punch-out keeps walls ceramic */}
        <path
          fillRule="evenodd"
          d={`${OUTER_PATH} ${INNER_PATH}`}
          fill="url(#ccs-grad-ceramic)"
        />

        {/* Rim */}
        <rect x="22" y="22" width="156" height="10" rx="4" fill="url(#ccs-grad-ceramic)" />
        <rect x="22" y="22" width="156" height="5" rx="4" fill="#f5ede0" opacity="0.55" />

        {/* Handle — thick stroke for ceramic look, with inner highlight */}
        <path
          d="M 147 86 C 197 80 197 174 147 168"
          stroke="url(#ccs-grad-ceramic)"
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 147 86 C 197 80 197 174 147 168"
          stroke="#f0e0c8"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          opacity="0.55"
        />

        {/* Cup base foot */}
        <rect x="50" y="194" width="100" height="8" rx="3" fill="url(#ccs-grad-ceramic)" />
      </svg>

      {/* Legend — top layer listed first */}
      <ul className="cup-legend" aria-label="Layers">
        {[...layers].reverse().map((layer, i) => (
          <li key={`legend-${layer.key}-${i}`} className="cup-legend-item">
            <span
              className="cup-legend-swatch"
              style={{ backgroundColor: layer.swatchColor }}
            />
            <span className="cup-legend-label">{layer.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
