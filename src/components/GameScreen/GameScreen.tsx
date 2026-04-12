import { useEffect, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import { OrderFlash } from '../OrderFlash/OrderFlash';
import { CupStation } from '../CupStation/CupStation';
import './GameScreen.css';

interface GameScreenProps {
  level: number;
}

export function GameScreen({ level }: GameScreenProps) {
  const { activeOrder, initLevel, flashNextOrder, activateOrder, expireOrder } = useGameStore();

  // Initialise level and flash the first order when GameScreen mounts.
  // Zustand set() is synchronous, so flashNextOrder() immediately sees the
  // queue that initLevel() just populated.
  useEffect(() => {
    initLevel(level);
    flashNextOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReadingComplete = useCallback(() => {
    activateOrder();
  }, [activateOrder]);

  const handleExpired = useCallback(() => {
    expireOrder();
  }, [expireOrder]);

  return (
    <div className="gs-screen">
      <div className="gs-scroll">
        {!activeOrder && <div className="gs-loading">Brewing…</div>}

        {activeOrder?.status === 'flashing' && (
          <OrderFlash
            order={activeOrder}
            onReadingComplete={handleReadingComplete}
            onExpired={handleExpired}
          />
        )}

        {activeOrder?.status === 'active' && (
          <CupStation
            recipe={activeOrder.recipe}
            orderIndex={activeOrder.orderIndex}
            ordersTotal={activeOrder.totalOrders}
            timerStartedAt={activeOrder.timerStartedAt}
            timeLimitMs={activeOrder.timeLimitMs}
          />
        )}
      </div>
    </div>
  );
}
