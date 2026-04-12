import { useEffect, useRef, useState } from 'react';
import type { LevelSummary, StarRating } from '../../types/game';
import { MAX_SCORE_PER_DRINK } from '../../engine/scoring';
import './LevelComplete.css';

// ── Star SVG ─────────────────────────────────────────────────────────────────

interface StarProps {
  filled: boolean;
  delay: number;
}

function Star({ filled, delay }: StarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <svg
      className={`lc-star ${filled ? 'lc-star--filled' : 'lc-star--empty'} ${visible ? 'lc-star--pop' : ''}`}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

// ── Animated counter ─────────────────────────────────────────────────────────

function useCountUp(target: number, durationMs: number, startDelay: number) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    let startTime: number | null = null;

    const delayTimer = setTimeout(() => {
      const tick = (now: number) => {
        if (!startTime) startTime = now;
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(target * eased));
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(tick);
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    }, startDelay);

    return () => {
      clearTimeout(delayTimer);
      cancelAnimationFrame(rafRef.current);
    };
  }, [target, durationMs, startDelay]);

  return value;
}

// ── Score row ────────────────────────────────────────────────────────────────

interface ScoreRowProps {
  label: string;
  value: number;
  max?: number;
  delay: number;
  accent?: boolean;
}

function ScoreRow({ label, value, max, delay, accent = false }: ScoreRowProps) {
  const [visible, setVisible] = useState(false);
  const displayed = useCountUp(value, 800, delay + 100);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div className={`lc-row ${visible ? 'lc-row--visible' : ''} ${accent ? 'lc-row--accent' : ''}`}>
      <span className="lc-row__label">{label}</span>
      <span className="lc-row__value">
        {displayed.toLocaleString()}
        {max !== undefined && (
          <span className="lc-row__max"> / {max.toLocaleString()}</span>
        )}
        <span className="lc-row__pts"> pts</span>
      </span>
    </div>
  );
}

// ── Order breakdown row ──────────────────────────────────────────────────────

interface OrderRowProps {
  index: number;
  coffeeName: string;
  accuracyScore: number;
  speedBonus: number;
  delay: number;
}

function OrderRow({ index, coffeeName, accuracyScore, speedBonus, delay }: OrderRowProps) {
  const [visible, setVisible] = useState(false);
  const total = accuracyScore + speedBonus;
  const pct = Math.round((total / MAX_SCORE_PER_DRINK) * 100);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div className={`lc-order ${visible ? 'lc-order--visible' : ''}`}>
      <span className="lc-order__num">{index + 1}</span>
      <span className="lc-order__name">{coffeeName}</span>
      <div className="lc-order__bar-wrap">
        <div
          className="lc-order__bar"
          style={{ '--pct': `${pct}%` } as React.CSSProperties}
        />
      </div>
      <span className="lc-order__score">{total.toLocaleString()}</span>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

interface LevelCompleteProps {
  summary: LevelSummary;
  onContinue: () => void;
  onRetry: () => void;
}

const STAR_DELAYS = [600, 900, 1200];

export function LevelComplete({ summary, onContinue, onRetry }: LevelCompleteProps) {
  const [cardVisible, setCardVisible] = useState(false);
  const [buttonsVisible, setButtonsVisible] = useState(false);

  const { level, orders, totalAccuracy, totalSpeedBonus, totalScore, maxScore, stars } = summary;
  const completedOrders = orders.filter((o) => o.completed);

  // Base delay after stars finish popping
  const starsEndDelay = STAR_DELAYS[2] + 400;

  useEffect(() => {
    const t1 = setTimeout(() => setCardVisible(true), 50);
    const t2 = setTimeout(() => setButtonsVisible(true), starsEndDelay + completedOrders.length * 80 + 1200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [starsEndDelay, completedOrders.length]);

  const starLabel: Record<StarRating, string> = {
    1: 'Nice try!',
    2: 'Good work!',
    3: 'Perfect brew!',
  };

  return (
    <div className="lc-overlay" role="dialog" aria-modal="true" aria-label="Level complete">
      <div className={`lc-card ${cardVisible ? 'lc-card--visible' : ''}`}>

        {/* Header */}
        <div className="lc-header">
          <span className="lc-label">Level {level}</span>
          <h1 className="lc-title">Level Complete</h1>
        </div>

        {/* Stars */}
        <div className="lc-stars" aria-label={`${stars} out of 3 stars`}>
          {([1, 2, 3] as const).map((n) => (
            <Star key={n} filled={n <= stars} delay={STAR_DELAYS[n - 1]} />
          ))}
        </div>
        <p className="lc-stars-label">{starLabel[stars]}</p>

        {/* Per-order breakdown */}
        <div className="lc-section-title">Order breakdown</div>
        <div className="lc-orders">
          {completedOrders.map((order, i) => (
            <OrderRow
              key={order.id}
              index={i}
              coffeeName={order.coffeeName}
              accuracyScore={order.accuracyScore}
              speedBonus={order.speedBonus}
              delay={starsEndDelay + i * 80}
            />
          ))}
        </div>

        {/* Score summary */}
        <div className="lc-divider" />
        <div className="lc-scores">
          <ScoreRow
            label="Accuracy"
            value={totalAccuracy}
            delay={starsEndDelay + completedOrders.length * 80 + 100}
          />
          <ScoreRow
            label="Speed bonus"
            value={totalSpeedBonus}
            delay={starsEndDelay + completedOrders.length * 80 + 200}
          />
          <ScoreRow
            label="Total"
            value={totalScore}
            max={maxScore}
            delay={starsEndDelay + completedOrders.length * 80 + 350}
            accent
          />
        </div>

        {/* Buttons */}
        <div className={`lc-actions ${buttonsVisible ? 'lc-actions--visible' : ''}`}>
          <button className="lc-btn lc-btn--secondary" onClick={onRetry}>
            Retry
          </button>
          <button className="lc-btn lc-btn--primary" onClick={onContinue}>
            Continue
          </button>
        </div>

      </div>
    </div>
  );
}
