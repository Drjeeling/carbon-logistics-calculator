import { useMemo, useState, useCallback } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { getScenariosByBoard } from '../data/emissionFactors';
import { calcBoard, formatEmission } from '../utils/calculator';
import { fetchDeepSeekAnalysis, parseDeepSeekResponse } from '../utils/deepseek';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const priorityStyle = {
  high: { bg: '#fef2f2', border: '#fecaca', color: '#dc2626', label: '高优先级' },
  medium: { bg: '#fffbeb', border: '#fde68a', color: '#b45309', label: '中优先级' },
  low: { bg: '#f0fdf4', border: '#bbf7d0', color: '#059669', label: '低优先级' },
};

/**
 * 板块碳排放总览 + DeepSeek AI 智能优化分析
 */
export default function BoardStats({ boardId, board, allFormData }) {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiResult, setAiResult] = useState(null);

  const { boardTotal, scenarioTotals, categoryTotals } = useMemo(
    () => calcBoard(boardId, allFormData),
    [boardId, allFormData]
  );

  const boardScenarios = getScenariosByBoard(boardId);

  const barData = {
    labels: boardScenarios.map(s => s.name),
    datasets: [{
      label: '碳排放量 (kgCO₂)',
      data: boardScenarios.map(s => Number((scenarioTotals[s.id] || 0).toFixed(2))),
      backgroundColor: boardScenarios.map(s => s.color),
      borderRadius: 6,
      barThickness: 40,
    }],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => formatEmission(ctx.raw),
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: '碳排放 (kgCO₂)', font: { size: 11 }, color: '#94a3b8' },
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: { font: { size: 11 }, color: '#94a3b8' },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 12 }, color: '#64748b' },
      },
    },
  };

  const filledCount = boardScenarios.filter(s => (scenarioTotals[s.id] || 0) > 0).length;

  // 调用 DeepSeek API
  const handleAnalyze = useCallback(async () => {
    if (boardTotal <= 0) {
      setShowAnalysis(true);
      setAiResult(null);
      return;
    }

    setShowAnalysis(true);
    setLoading(true);
    setError(null);
    setAiResult(null);

    try {
      const result = await fetchDeepSeekAnalysis(boardId, board, allFormData);
      const parsed = parseDeepSeekResponse(result.text);
      setAiResult(parsed);
    } catch (err) {
      setError(err.message || 'AI 分析失败,请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [boardId, board, allFormData, boardTotal]);

  return (
    <div className="board-stats">
      <div className="stats-hero">
        <div className="hero-card" style={{ background: `linear-gradient(135deg, ${board.color} 0%, #1d4ed8 60%, #059669 100%)` }}>
          <div className="hero-label">{board.name}碳排放总量</div>
          <div className="hero-value">{formatEmission(boardTotal)}</div>
          <div className="hero-sub">
            {filledCount === 0
              ? '请录入各场景活动数据'
              : `已核算 ${filledCount} / ${boardScenarios.length} 个子场景`}
          </div>
        </div>

        <div className="hero-meta">
          {boardScenarios.map(s => (
            <div className="meta-item" key={s.id}>
              <span className="meta-dot" style={{ background: s.color }} />
              <span>{s.name}</span>
              <strong>{formatEmission(scenarioTotals[s.id] || 0)}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="stats-chart">
        <div className="chart-header">
          <h3 className="panel-title" style={{ marginBottom: 0 }}>各子场景碳排放对比</h3>
          <button
            className={`analyze-btn ${showAnalysis ? 'active' : ''}`}
            style={{ '--accent': board.color }}
            onClick={() => {
              if (showAnalysis) {
                setShowAnalysis(false);
              } else {
                handleAnalyze();
              }
            }}
            disabled={loading}
          >
            {loading ? '⏳ AI 分析中...' : showAnalysis ? '收起分析' : '🤖 智能优化分析'}
          </button>
        </div>

        {boardTotal > 0 ? (
          <div className="bar-wrapper">
            <Bar data={barData} options={barOptions} />
          </div>
        ) : (
          <div className="empty-state small">
            <p>暂无数据,请先录入各场景活动数据</p>
          </div>
        )}

        {/* DeepSeek AI 智能优化分析面板 */}
        {showAnalysis && (
          <div className="analysis-panel">
            {boardTotal <= 0 ? (
              <p className="analysis-empty">请先录入活动数据,系统将自动分析优化方向。</p>
            ) : loading ? (
              <div className="ai-loading">
                <div className="ai-loading-spinner" />
                <p>正在调用 DeepSeek AI 分析当前碳排放数据...</p>
                <p className="ai-loading-hint">AI 会根据您输入的实际数据动态生成优化建议</p>
              </div>
            ) : error ? (
              <div className="ai-error">
                <p className="ai-error-msg">❌ {error}</p>
                <button className="ai-retry-btn" onClick={handleAnalyze}>重新分析</button>
              </div>
            ) : aiResult ? (
              <>
                {aiResult.summary && (
                  <div className="analysis-summary">
                    <span className="analysis-summary-label">AI 分析概述</span>
                    <span className="analysis-summary-value">{aiResult.summary}</span>
                  </div>
                )}

                {aiResult.suggestions.length > 0 ? (
                  <div className="suggestion-list">
                    {aiResult.suggestions.map((sug, i) => {
                      const style = priorityStyle[sug.priority] || priorityStyle.medium;
                      return (
                        <div
                          key={i}
                          className="suggestion-card"
                          style={{ background: style.bg, borderColor: style.border }}
                        >
                          <div className="suggestion-head">
                            <span className="priority-tag" style={{ background: style.color }}>
                              {style.label}
                            </span>
                            <span className="suggestion-title">{sug.title}</span>
                          </div>
                          <p className="suggestion-desc">{sug.desc}</p>
                          {sug.potential && (
                            <p className="suggestion-potential">💡 {sug.potential}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <pre className="ai-raw-text">{aiResult.raw}</pre>
                )}

                <div className="ai-powered">
                  由 DeepSeek AI 基于实时数据动态生成
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
