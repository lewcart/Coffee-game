import { useState, useEffect, useRef } from 'react';
import type { ActiveOrder } from '../../types/game';
import './OrderFlash.css';

/** ms each word stays hidden before popping in */
const WORD_INTERVAL_MS = 500;
/** How often the countdown timer re-renders (ms) */
const TIMER_TICK_MS = 50;
/** How many ms before end the timer turns urgent */
const URGENT_THRESHOLD_MS = 5_000;
/** Entrance animation duration — must match CSS */
const ENTER_DURATION_MS = 280;

type Phase = 'entering' | 'reading' | 'active' | 'expired';

export interface OrderFlashProps {
  order: ActiveOrder;
  /** Called once all words in the drink name have been revealed */
  onReadingComplete?: () => void;
  /** Called when the countdown reaches zero */
  onExpired?: () => void;
}

export function OrderFlash({ order, onReadingComplete, onExpired }: OrderFlashProps) {
  const words = order.recipe.name.split(' ');
  const wordCount = words.length;

  const [phase, setPhase] = useState<Phase>('entering');
  const [revealedCount, setRevealedCount] = useState(0);
  const [msRemaining, setMsRemaining] = useState(order.timeLimitMs);

  // Keep callback refs stable so effects don't need them as deps
  const onReadingCompleteRef = useRef(onReadingComplete);
  const onExpiredRef = useRef(onExpired);
  onReadingCompleteRef.current = onReadingComplete;
  onExpiredRef.current = onExpired;

  // Reset all state whenever a new order arrives
  useEffect(() => {
    setPhase('entering');
    setRevealedCount(0);
    setMsRemaining(order.timeLimitMs);
  }, [order.id, order.timeLimitMs]);

  // Phase: entering → reading (after entrance animation completes)
  useEffect(() => {
    if (phase !== 'entering') return;
    const t = setTimeout(() => setPhase('reading'), ENTER_DURATION_MS);
    return () => clearTimeout(t);
  }, [phase]);

  // Phase: reading — reveal words one by one at WORD_INTERVAL_MS each
  useEffect(() => {
    if (phase !== 'reading') return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    // Reveal each word in sequence
    for (let i = 0; i < wordCount; i++) {
      timers.push(
        setTimeout(() => setRevealedCount(i + 1), i * WORD_INTERVAL_MS),
      );
    }

    // Transition to active after all words are visible
    timers.push(
      setTimeout(() => {
        setPhase('active');
        onReadingCompleteRef.current?.();
      }, wordCount * WORD_INTERVAL_MS),
    );

    return () => timers.forEach(clearTimeout);
  }, [phase, wordCount]);

  // Phase: active — live countdown
  useEffect(() => {
    if (phase !== 'active') return;

    const startedAt = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, order.timeLimitMs - elapsed);
      setMsRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        setPhase('expired');
        onExpiredRef.current?.();
      }
    }, TIMER_TICK_MS);

    return () => clearInterval(interval);
  }, [phase, order.timeLimitMs]);

  const timerProgress = msRemaining / order.timeLimitMs; // 1.0 → 0.0
  const timerSeconds = (msRemaining / 1000).toFixed(1);
  const isUrgent = phase === 'active' && msRemaining < URGENT_THRESHOLD_MS;
  const isTicking = phase === 'active' || phase === 'expired';

  function formatIngredient(amount: number, unit: string, name: string): string {
    if (unit === 'shots') {
      return `${amount} ${amount === 1 ? 'shot' : 'shots'} ${name}`;
    }
    return `${amount}${unit} ${name}`;
  }

  return (
    <div
      className={[
        'of',
        `of--${phase}`,
        isUrgent ? 'of--urgent' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      key={order.id}
      aria-live="assertive"
      aria-label={`New order: ${order.recipe.name}. Order ${order.orderIndex} of ${order.totalOrders}.`}
    >
      {/* Order number badge */}
      <div className="of__badge" aria-hidden="true">
        <span className="of__badge-num">Order {order.orderIndex}</span>
        <span className="of__badge-of">of {order.totalOrders}</span>
      </div>

      {/* Steam wisps */}
      <div className="of__steam" aria-hidden="true">
        <span className="of__steam-wisp of__steam-wisp--1" />
        <span className="of__steam-wisp of__steam-wisp--2" />
        <span className="of__steam-wisp of__steam-wisp--3" />
      </div>

      {/* Drink name — word-by-word reveal */}
      <h2 className="of__name" aria-hidden="true">
        {words.map((word, i) => (
          <span
            key={i}
            className={`of__word ${i < revealedCount ? 'of__word--visible' : ''}`}
          >
            {word}
          </span>
        ))}
      </h2>

      {/* Ingredient list */}
      <ul className="of__ingredients" aria-hidden="true">
        {order.recipe.ingredients.map((ing) => (
          <li key={ing.id} className="of__ingredient">
            <span className="of__ingredient-dot" />
            {formatIngredient(ing.amount, ing.unit, ing.name)}
          </li>
        ))}
      </ul>

      {/* Timer */}
      <div className="of__timer" aria-hidden="true">
        <div className="of__timer-track">
          <div
            className="of__timer-bar"
            style={{
              transform: `scaleX(${isTicking ? timerProgress : 1})`,
            }}
          />
        </div>
        <div className="of__timer-label">
          {isTicking ? (
            <span className="of__timer-count">{timerSeconds}s</span>
          ) : (
            <span className="of__timer-ready">Get ready…</span>
          )}
        </div>
      </div>
    </div>
  );
}
