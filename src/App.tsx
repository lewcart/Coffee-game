<<<<<<< HEAD
import { useGameStore } from './store/gameStore';
import { GameScreen } from './components/GameScreen/GameScreen';
import { LevelComplete } from './components/LevelComplete/LevelComplete';
import './App.css';

export default function App() {
  const { screen, levelSummary, currentLevel, levelKey, continueToNextLevel, retryLevel } =
    useGameStore();
=======
import { useState, useCallback } from 'react';
import { LevelComplete } from './components/LevelComplete/LevelComplete';
import { CupCrossSection } from './components/CupCrossSection/CupCrossSection';
import { OrderFlash } from './components/OrderFlash/OrderFlash';
import { buildLevelSummary, makeDemoResult } from './engine/scoring';
import { RECIPES, TIER_1_ESPRESSO_RECIPES, TIER_1_TIME_LIMIT_MS } from './data/recipes';
import type { LevelSummary, ActiveOrder } from './types/game';
import './App.css';

type StarPreview = 1 | 2 | 3;

let previewOrderId = 0;

export default function App() {
  const [summary, setSummary] = useState<LevelSummary | null>(null);
  const [level, setLevel] = useState(1);
  const [starPreview, setStarPreview] = useState<StarPreview>(3);

  const [selectedRecipeId, setSelectedRecipeId] = useState(RECIPES[4].id); // Latte default
  const [animKey, setAnimKey] = useState(0);

  // OrderFlash preview state
  const [flashRecipeId, setFlashRecipeId] = useState(TIER_1_ESPRESSO_RECIPES[0].id);
  const [previewOrder, setPreviewOrder] = useState<ActiveOrder | null>(null);
  const [orderFlashStatus, setOrderFlashStatus] = useState<string>('—');

  const selectedRecipe = RECIPES.find((r) => r.id === selectedRecipeId) ?? RECIPES[0];

  function launch(stars: StarPreview, lvl: number) {
    const result = makeDemoResult(lvl, stars);
    setSummary(buildLevelSummary(result));
  }
>>>>>>> df3aeff (COF-010: Order flash system — Espresso tier-1 orders)

  const flashOrder = useCallback(() => {
    const recipe =
      TIER_1_ESPRESSO_RECIPES.find((r) => r.id === flashRecipeId) ?? TIER_1_ESPRESSO_RECIPES[0];
    setPreviewOrder({
      id: `preview-${++previewOrderId}`,
      recipe,
      orderIndex: 1,
      totalOrders: 5,
      timerStartedAt: 0,
      timeLimitMs: TIER_1_TIME_LIMIT_MS,
      status: 'flashing',
    });
    setOrderFlashStatus('flashing…');
  }, [flashRecipeId]);

  return (
    <div className="app">
<<<<<<< HEAD
      {screen === 'game' && <GameScreen key={levelKey} level={currentLevel} />}
      {screen === 'levelComplete' && levelSummary && (
=======
      {/* ── Cup cross-section demo ─────────────────────────────────────────── */}
      <div className="demo-controls">
        <h2>Cup Cross-Section — Preview</h2>
        <div className="demo-row">
          <label>Recipe</label>
          <select
            value={selectedRecipeId}
            onChange={(e) => {
              setSelectedRecipeId(e.target.value);
              setAnimKey((k) => k + 1);
            }}
          >
            {RECIPES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <button className="demo-launch" onClick={() => setAnimKey((k) => k + 1)}>
          Replay Animation
        </button>
        <CupCrossSection recipe={selectedRecipe} animationKey={animKey} />
      </div>

      {/* ── Order flash demo ───────────────────────────────────────────────── */}
      <div className="demo-controls">
        <h2>Order Flash — Preview</h2>
        <div className="demo-row">
          <label>Drink</label>
          <select
            value={flashRecipeId}
            onChange={(e) => setFlashRecipeId(e.target.value)}
          >
            {TIER_1_ESPRESSO_RECIPES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div className="demo-row">
          <label>Status</label>
          <span className="demo-status">{orderFlashStatus}</span>
        </div>
        <button className="demo-launch" onClick={flashOrder}>
          Flash Order
        </button>
        {previewOrder && (
          <div className="demo-order-wrap">
            <OrderFlash
              order={previewOrder}
              onReadingComplete={() => setOrderFlashStatus('active — 18 s countdown')}
              onExpired={() => setOrderFlashStatus('expired')}
            />
          </div>
        )}
      </div>

      {/* ── Level complete demo ────────────────────────────────────────────── */}
      <div className="demo-controls">
        <h2>Level Complete — Preview</h2>
        <div className="demo-row">
          <label>Level</label>
          <input
            type="number"
            min={1}
            max={35}
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
          />
        </div>
        <div className="demo-row">
          <label>Stars</label>
          <div className="demo-btns">
            {([1, 2, 3] as const).map((s) => (
              <button
                key={s}
                className={`demo-btn ${starPreview === s ? 'demo-btn--active' : ''}`}
                onClick={() => setStarPreview(s)}
              >
                {'★'.repeat(s)}{'☆'.repeat(3 - s)}
              </button>
            ))}
          </div>
        </div>
        <button className="demo-launch" onClick={() => launch(starPreview, level)}>
          Show Screen
        </button>
      </div>

      {summary && (
>>>>>>> df3aeff (COF-010: Order flash system — Espresso tier-1 orders)
        <LevelComplete
          summary={levelSummary}
          onContinue={continueToNextLevel}
          onRetry={retryLevel}
        />
      )}
    </div>
  );
}
