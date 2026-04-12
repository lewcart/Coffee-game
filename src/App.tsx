import { useState } from 'react';
import { LevelComplete } from './components/LevelComplete/LevelComplete';
import { CupCrossSection } from './components/CupCrossSection/CupCrossSection';
import { buildLevelSummary, makeDemoResult } from './engine/scoring';
import { RECIPES } from './data/recipes';
import type { LevelSummary } from './types/game';
import './App.css';

type StarPreview = 1 | 2 | 3;

export default function App() {
  const [summary, setSummary] = useState<LevelSummary | null>(null);
  const [level, setLevel] = useState(1);
  const [starPreview, setStarPreview] = useState<StarPreview>(3);

  const [selectedRecipeId, setSelectedRecipeId] = useState(RECIPES[4].id); // Latte default
  const [animKey, setAnimKey] = useState(0);

  const selectedRecipe = RECIPES.find((r) => r.id === selectedRecipeId) ?? RECIPES[0];

  function launch(stars: StarPreview, lvl: number) {
    const result = makeDemoResult(lvl, stars);
    setSummary(buildLevelSummary(result));
  }

  return (
    <div className="app">
      {/* Cup cross-section demo */}
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

      {/* Level complete demo */}
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
        <LevelComplete
          summary={summary}
          onContinue={() => {
            setLevel((l) => l + 1);
            setSummary(null);
          }}
          onRetry={() => setSummary(null)}
        />
      )}
    </div>
  );
}
