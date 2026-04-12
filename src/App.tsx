import { useGameStore } from './store/gameStore';
import { GameScreen } from './components/GameScreen/GameScreen';
import { LevelComplete } from './components/LevelComplete/LevelComplete';
import './App.css';

export default function App() {
  const { screen, levelSummary, currentLevel, levelKey, continueToNextLevel, retryLevel } =
    useGameStore();

  return (
    <div className="app">
      {screen === 'game' && <GameScreen key={levelKey} level={currentLevel} />}
      {screen === 'levelComplete' && levelSummary && (
        <LevelComplete
          summary={levelSummary}
          onContinue={continueToNextLevel}
          onRetry={retryLevel}
        />
      )}
    </div>
  );
}
