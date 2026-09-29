import { useState } from 'react';
import { boards, getScenariosByBoard } from '../data/emissionFactors';
import { calcScenario } from '../utils/calculator';

/**
 * 侧边栏:手风琴式导航
 * 板块项 hover/active 时展开子场景列表,默认选快递驿站
 */
export default function BoardSidebar({
  activeBoardId,
  activeScenarioId,
  onBoardSelect,
  onScenarioSelect,
  onShowFactors,
  allFormData,
}) {
  const [hoveredBoard, setHoveredBoard] = useState(null);

  return (
    <aside className="sidebar board-sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L4 7v10l8 5 8-5V7l-8-5z" />
            <path d="M12 12l8-5" />
            <path d="M12 12L4 7" />
            <path d="M12 12v10" />
          </svg>
        </div>
        <div className="brand-text">
          <h1>末端配送碳核算</h1>
          <p>Logistics Carbon Calculator</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-label">核算板块</div>
        {boards.map(b => {
          const isActive = activeBoardId === b.id;
          const isHovered = hoveredBoard === b.id;
          const isExpanded = isActive || isHovered;
          const boardScenarios = getScenariosByBoard(b.id);

          return (
            <div
              key={b.id}
              className={`board-group ${isExpanded ? 'expanded' : ''}`}
              onMouseEnter={() => setHoveredBoard(b.id)}
              onMouseLeave={() => setHoveredBoard(null)}
            >
              <button
                className={`nav-item board-item ${isActive ? 'active' : ''}`}
                style={{ '--accent': b.color }}
                onClick={() => onBoardSelect(b.id)}
              >
                <span className="nav-icon" style={{ background: b.color + '15', color: b.color }}>{b.icon}</span>
                <span className="nav-content">
                  <span className="nav-name">{b.name}</span>
                </span>
                <span className={`nav-chevron ${isExpanded ? 'rotated' : ''}`}>›</span>
              </button>

              <div className={`board-children ${isExpanded ? 'show' : ''}`}>
                {boardScenarios.map(s => {
                  const result = calcScenario(s.id, allFormData[s.id] || {});
                  const isChildActive = isActive && s.id === activeScenarioId;
                  return (
                    <button
                      key={s.id}
                      className={`child-item ${isChildActive ? 'active' : ''}`}
                      style={{ '--accent': s.color }}
                      onClick={() => onScenarioSelect(b.id, s.id)}
                    >
                      <span className="child-icon">{s.icon}</span>
                      <span className="child-name">{s.name}</span>
                      {result.total > 0 && (
                        <span className="child-value">{(result.total / 1000).toFixed(2)}t</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="factor-btn" onClick={onShowFactors}>
          <span>📋</span>
          <span>查看排放因子库</span>
        </button>
        <p className="footer-note">因子来源:生态环境部 · GB/T 21371 · 行业基准</p>
      </div>
    </aside>
  );
}
