import { useState, useCallback } from 'react';
import BoardSidebar from './components/BoardSidebar';
import ScenarioView from './components/ScenarioView';
import FactorModal from './components/FactorModal';
import BoardStats from './components/BoardStats';
import { boards, getScenariosByBoard } from './data/emissionFactors';
import './App.css';

/**
 * 末端配送碳核算系统主应用
 * 手风琴式侧边栏:板块展开即见子场景,默认选快递驿站
 */
export default function App() {
  const [activeBoardId, setActiveBoardId] = useState('campus');
  const [activeScenarioId, setActiveScenarioId] = useState('courier');
  const [showFactors, setShowFactors] = useState(false);
  const [allFormData, setAllFormData] = useState({});

  const handleBoardChange = (boardId) => {
    setActiveBoardId(boardId);
    const firstScenario = getScenariosByBoard(boardId)[0];
    setActiveScenarioId(firstScenario?.id);
  };

  const handleScenarioSelect = (boardId, scenarioId) => {
    setActiveBoardId(boardId);
    setActiveScenarioId(scenarioId);
  };

  const handleFieldChange = useCallback((scenarioId, fieldKey, value) => {
    setAllFormData(prev => ({
      ...prev,
      [scenarioId]: {
        ...prev[scenarioId],
        [fieldKey]: value,
      },
    }));
  }, []);

  const board = boards.find(b => b.id === activeBoardId);

  return (
    <div className="app">
      <BoardSidebar
        activeBoardId={activeBoardId}
        activeScenarioId={activeScenarioId}
        onBoardSelect={handleBoardChange}
        onScenarioSelect={handleScenarioSelect}
        onShowFactors={() => setShowFactors(true)}
        allFormData={allFormData}
      />

      <main className="main-content">
        <div className="content-scroll">
          <BoardStats
            boardId={activeBoardId}
            board={board}
            allFormData={allFormData}
          />

          {activeScenarioId && (
            <ScenarioView
              key={activeScenarioId}
              scenarioId={activeScenarioId}
              formData={allFormData[activeScenarioId] || {}}
              onChange={handleFieldChange}
            />
          )}
        </div>
      </main>

      {showFactors && <FactorModal onClose={() => setShowFactors(false)} />}
    </div>
  );
}
