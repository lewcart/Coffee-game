import { useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { RECIPES } from '../../data/recipes';
import type { DrinkRecipe } from '../../types/game';
import { CupStation } from '../CupStation/CupStation';
import './GameScreen.css';

const ORDERS_PER_LEVEL = 3;

function pickRecipes(count: number): DrinkRecipe[] {
  return [...RECIPES].sort(() => Math.random() - 0.5).slice(0, count);
}

interface GameScreenProps {
  level: number;
}

export function GameScreen({ level }: GameScreenProps) {
  const { activeOrder, ordersTotal, startLevel } = useGameStore();

  useEffect(() => {
    startLevel(level, pickRecipes(ORDERS_PER_LEVEL));
  }, [level]);

  return (
    <div className="gs-screen">
      <div className="gs-scroll">
        {activeOrder ? (
          <CupStation
            recipe={activeOrder.recipe}
            orderIndex={activeOrder.orderIndex}
            ordersTotal={ordersTotal}
            startTimeMs={activeOrder.startTimeMs}
          />
        ) : (
          <div className="gs-loading">Brewing…</div>
        )}
      </div>
    </div>
  );
}
