import { useMemo, useState, useCallback } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { scenarios, getFactorValue, getFactorUnit, getFieldGroup, GROUP_ORDER } from '../data/emissionFactors';
import { calcScenario, analyzeScenario, formatEmission } from '../utils/calculator';
import FileDropZone from './FileDropZone';

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = ['#1e40af', '#059669', '#0e7490', '#b45309', '#7c3aed', '#dc2626', '#475569', '#0d9488'];

const priorityStyle = {
  high: { bg: '#fef2f2', border: '#fecaca', color: '#dc2626', label: '高' },
  medium: { bg: '#fffbeb', border: '#fde68a', color: '#b45309', label: '中' },
  low: { bg: '#f0fdf4', border: '#bbf7d0', color: '#059669', label: '低' },
};

const GROUP_META = {
  '包装': { icon: '📦', desc: '包装材料与回收' },
  '仓储': { icon: '⚡', desc: '站点能耗与仓储' },
  '配送': { icon: '🚚', desc: '车辆配送与行驶' },
};

/**
 * 单个场景视图
 * 表单按 包装/仓储/配送 三大分组折叠展示
 */
export default function ScenarioView({ scenarioId, formData, onChange }) {
  const scenario = scenarios.find(s => s.id === scenarioId);
  const [collapsed, setCollapsed] = useState({});

  const result = useMemo(
    () => calcScenario(scenarioId, formData),
    [scenarioId, formData]
  );

  const suggestions = useMemo(
    () => analyzeScenario(result, scenario),
    [result, scenario]
  );

  const groupedFields = useMemo(() => {
    const groups = {};
    scenario.fields.forEach(field => {
      const group = getFieldGroup(field);
      if (!groups[group]) groups[group] = [];
      groups[group].push(field);
    });
    // 按 GROUP_ORDER 排序,未列出的组排后面
    const ordered = GROUP_ORDER.filter(g => groups[g]);
    const others = Object.keys(groups).filter(g => !GROUP_ORDER.includes(g));
    return [...ordered, ...others].map(g => ({ group: g, fields: groups[g] }));
  }, [scenario]);

  const pieData = useMemo(() => {
    const entries = Object.entries(result.categoryTotals).filter(([, v]) => v > 0);
    return {
      labels: entries.map(([k]) => k),
      datasets: [{
        data: entries.map(([, v]) => Number(v.toFixed(2))),
        backgroundColor: entries.map((_, i) => COLORS[i % COLORS.length]),
        borderWidth: 0,
      }],
    };
  }, [result]);

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { padding: 12, font: { size: 12 }, usePointStyle: true, pointStyle: 'circle' },
      },
      tooltip: {
        callbacks: {
          label: ctx => `${ctx.label}: ${ctx.raw} kgCO₂`,
        },
      },
    },
  };

  const handleInput = (key, value) => {
    onChange(scenarioId, key, value);
  };

  const toggleGroup = (group) => {
    setCollapsed(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const handleFileImport = useCallback((imported) => {
    // 批量更新表单数据
    Object.entries(imported).forEach(([key, value]) => {
      onChange(scenarioId, key, value);
    });
    // 展开所有分组以便看到导入的数据
    setCollapsed({});
  }, [scenarioId, onChange]);

  return (
    <div className="scenario-view" style={{ '--accent': scenario.color }}>
      <header className="scenario-header">
        <div className="scenario-title">
          <span className="scenario-icon" style={{ background: scenario.color + '15', color: scenario.color }}>{scenario.icon}</span>
          <div>
            <h2>{scenario.name}</h2>
            <p>{scenario.description}</p>
          </div>
        </div>
        <div className="scenario-total" style={{ background: scenario.color }}>
          <span className="total-label">本场景碳排放</span>
          <span className="total-value">{formatEmission(result.total)}</span>
        </div>
      </header>

      <div className="scenario-body">
        {/* 左侧:分组折叠输入表单 */}
        <div className="input-panel">
          <div className="input-header">
            <h3 className="panel-title" style={{ marginBottom: 0 }}>活动数据录入</h3>
            <FileDropZone scenario={scenario} onImport={handleFileImport} />
          </div>
          <div className="form-grid" style={{ marginTop: '14px' }}>
            {groupedFields.map(({ group, fields }) => {
              const isCollapsed = collapsed[group];
              const meta = GROUP_META[group] || { icon: '▪', desc: '' };
              return (
                <div className="form-group" key={group}>
                  <button
                    className="form-group-header"
                    onClick={() => toggleGroup(group)}
                    style={{ '--accent-color': scenario.color }}
                  >
                    <span className="group-chevron">{isCollapsed ? '▸' : '▾'}</span>
                    <span className="group-icon">{meta.icon}</span>
                    <span className="group-name">{group}</span>
                    <span className="group-desc">{meta.desc}</span>
                    <span className="group-count">{fields.length}项</span>
                  </button>
                  <div className={`form-group-body ${isCollapsed ? 'collapsed' : ''}`}>
                    {fields.map(field => {
                      const factor = getFactorValue(field);
                      const unit = getFactorUnit(field);
                      return (
                        <div className="form-row" key={field.key}>
                          <label className="form-label">{field.label}</label>
                          <div className="form-input-row">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              placeholder="0"
                              value={formData[field.key] || ''}
                              onChange={e => handleInput(field.key, e.target.value)}
                            />
                            <span className="form-unit">{field.unit}</span>
                          </div>
                          <span className="form-factor">因子 <strong>{factor} {unit}</strong></span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 右侧:可视化 */}
        <div className="viz-panel">
          <h3 className="panel-title">碳排放来源构成</h3>
          {result.total > 0 ? (
            <div className="pie-wrapper">
              <Pie data={pieData} options={pieOptions} />
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <p>请在左侧录入活动数据</p>
              <p className="empty-hint">系统将自动计算碳排放并生成图表</p>
            </div>
          )}
        </div>
      </div>

      {/* 分项明细 */}
      {result.total > 0 && (
        <div className="detail-panel">
          <h3 className="panel-title">碳排放分项明细</h3>
          <table className="detail-table">
            <thead>
              <tr>
                <th>排放源</th>
                <th>分组</th>
                <th>活动数据</th>
                <th>排放因子</th>
                <th>碳排放量</th>
                <th>占比</th>
              </tr>
            </thead>
            <tbody>
              {result.items.filter(i => i.emission !== 0).map(item => (
                <tr key={item.field.key}>
                  <td>{item.field.label}</td>
                  <td><span className="category-tag">{getFieldGroup(item.field)}</span></td>
                  <td>{item.value} {item.field.unit}</td>
                  <td>{getFactorValue(item.field)} {getFactorUnit(item.field)}</td>
                  <td className={item.emission < 0 ? 'credit' : ''}>
                    {item.emission.toFixed(2)} kgCO₂
                  </td>
                  <td>
                    <div className="progress-cell">
                      <div className="progress-track">
                        <div
                          className="progress-bar"
                          style={{ width: `${Math.abs(item.emission / result.total * 100).toFixed(1)}%` }}
                        />
                      </div>
                      <span>{(Math.abs(item.emission / result.total * 100)).toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 智能优化建议 */}
      {result.total > 0 && suggestions.length > 0 && (
        <div className="detail-panel">
          <h3 className="panel-title">智能优化建议</h3>
          <div className="suggestion-list">
            {suggestions.map((sug, i) => {
              const style = priorityStyle[sug.priority] || priorityStyle.low;
              return (
                <div
                  key={i}
                  className="suggestion-card"
                  style={{ background: style.bg, borderColor: style.border }}
                >
                  <div className="suggestion-head">
                    <span className="priority-tag" style={{ background: style.color }}>
                      {style.label}优先级
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
        </div>
      )}
    </div>
  );
}
