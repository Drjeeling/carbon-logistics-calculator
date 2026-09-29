import {
  scenarios,
  emissionFactors,
  customFactors,
  GRADE_INFO,
  getFactorValue,
  getFactorUnit,
  getFactorGrade,
  getFactorSource,
} from '../data/emissionFactors';

/**
 * 排放因子库弹窗
 * 展示所有内置排放因子的来源、数值、单位、可信度等级
 */
export default function FactorModal({ onClose }) {
  // 合并通用因子和自定义因子
  const allFactors = [
    ...Object.entries(emissionFactors).map(([key, f]) => ({ key, ...f, type: '通用' })),
    ...Object.entries(customFactors).map(([key, f]) => ({ key, ...f, type: '通用' })),
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>排放因子库</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* 可信度等级说明 */}
          <div className="grade-legend">
            <span className="grade-legend-title">可信度等级:</span>
            {Object.entries(GRADE_INFO).map(([grade, info]) => (
              <span key={grade} className="grade-legend-item">
                <span className="grade-badge" style={{ background: info.color }}>{grade}</span>
                {info.desc}
              </span>
            ))}
          </div>

          <div className="factor-section">
            <h3>通用排放因子</h3>
            <table className="factor-table">
              <thead>
                <tr>
                  <th>因子名称</th>
                  <th>数值</th>
                  <th>单位</th>
                  <th>等级</th>
                  <th>来源</th>
                </tr>
              </thead>
              <tbody>
                {allFactors.map(f => (
                  <tr key={f.key}>
                    <td>{f.name}</td>
                    <td className="factor-value">{f.value}</td>
                    <td>{f.unit}</td>
                    <td>
                      <span className="grade-badge" style={{ background: GRADE_INFO[f.grade].color }}>
                        {f.grade}
                      </span>
                    </td>
                    <td>{f.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="factor-section">
            <h3>各场景专用因子</h3>
            {scenarios.map(s => (
              <div className="scenario-factor-group" key={s.id}>
                <h4 style={{ color: s.color }}>{s.icon} {s.name}</h4>
                <table className="factor-table">
                  <thead>
                    <tr>
                      <th>排放源</th>
                      <th>类别</th>
                      <th>排放因子</th>
                      <th>单位</th>
                      <th>等级</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.fields.map(f => (
                      <tr key={f.key}>
                        <td>{f.label}</td>
                        <td>{f.category}</td>
                        <td className="factor-value">{getFactorValue(f)}</td>
                        <td>{getFactorUnit(f)}</td>
                        <td>
                          <span className="grade-badge" style={{ background: GRADE_INFO[getFactorGrade(f)].color }}>
                            {getFactorGrade(f)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          <div className="factor-note">
            <p><strong>说明:</strong></p>
            <ul>
              <li><span className="grade-badge" style={{ background: GRADE_INFO.A.color }}>A</span> 级因子来自国标或IPCC指南,数值稳定,可直接使用</li>
              <li><span className="grade-badge" style={{ background: GRADE_INFO.B.color }}>B</span> 级因子来自行业LCA研究,为平均值,实际值可能有±20%波动</li>
              <li><span className="grade-badge" style={{ background: GRADE_INFO.C.color }}>C</span> 级因子为企业报告或估算值,存在不确定性,建议实地调研校准</li>
              <li>电网排放因子采用北京市生态环境局年度公布的区域电网平均排放因子</li>
              <li>天然气、柴油、汽油排放因子依据国家标准 GB/T 21371 及 IPCC 指南</li>
              <li>回收纸箱为抵扣项,因子为负值,表示减少的碳排放</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
