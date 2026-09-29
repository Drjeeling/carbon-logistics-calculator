/**
 * 碳排放计算工具 + 智能优化分析
 */
import { scenarios, getFactorValue, getScenariosByBoard } from '../data/emissionFactors';

/**
 * 计算单个输入项的碳排放
 */
export function calcItemEmission(field, value) {
  if (!value || isNaN(value)) return 0;
  const factor = getFactorValue(field);
  return Number(value) * factor;
}

/**
 * 计算某个场景的总碳排放及分项
 */
export function calcScenario(scenarioId, formData) {
  const scenario = scenarios.find(s => s.id === scenarioId);
  if (!scenario) return { total: 0, items: [], categoryTotals: {} };

  const items = scenario.fields.map(field => {
    const value = formData[field.key] || 0;
    const emission = calcItemEmission(field, value);
    return {
      field,
      value: Number(value) || 0,
      emission,
      category: field.category,
    };
  });

  const total = items.reduce((sum, item) => sum + item.emission, 0);

  const categoryTotals = {};
  items.forEach(item => {
    if (!categoryTotals[item.category]) categoryTotals[item.category] = 0;
    categoryTotals[item.category] += item.emission;
  });

  return { total, items, categoryTotals };
}

/**
 * 计算某个板块下所有场景的碳排放
 */
export function calcBoard(boardId, allFormData) {
  const boardScenarios = getScenariosByBoard(boardId);
  const scenarioTotals = {};
  let boardTotal = 0;
  const categoryTotals = {};

  boardScenarios.forEach(s => {
    const result = calcScenario(s.id, allFormData[s.id] || {});
    scenarioTotals[s.id] = result.total;
    boardTotal += result.total;
    Object.entries(result.categoryTotals).forEach(([cat, val]) => {
      categoryTotals[cat] = (categoryTotals[cat] || 0) + val;
    });
  });

  return { boardTotal, scenarioTotals, categoryTotals };
}

/**
 * 计算所有场景的总碳排放
 */
export function calcGrandTotal(allFormData) {
  const scenarioTotals = {};
  let grandTotal = 0;

  scenarios.forEach(s => {
    const result = calcScenario(s.id, allFormData[s.id] || {});
    scenarioTotals[s.id] = result.total;
    grandTotal += result.total;
  });

  return { grandTotal, scenarioTotals };
}

/**
 * 格式化碳排放数值
 */
export function formatEmission(value) {
  if (Math.abs(value) >= 1000) {
    return (value / 1000).toFixed(2) + ' tCO₂';
  }
  return value.toFixed(2) + ' kgCO₂';
}

/* ============================================
   智能优化分析模块
   ============================================ */

/**
 * 分析单个场景的优化建议
 * @param {object} result - calcScenario 返回的结果
 * @param {object} scenario - 场景配置
 * @returns {Array} 优化建议列表 [{priority, category, title, desc, potential}]
 */
export function analyzeScenario(result, scenario) {
  const suggestions = [];
  if (result.total <= 0) return suggestions;

  const { categoryTotals, items, total } = result;

  // 1. 找出占比最高的类别
  const sortedCats = Object.entries(categoryTotals)
    .filter(([k]) => !k.includes('抵扣'))
    .sort((a, b) => b[1] - a[1]);

  if (sortedCats.length > 0) {
    const [topCat, topVal] = sortedCats[0];
    const pct = ((topVal / total) * 100).toFixed(1);
    suggestions.push({
      priority: 'high',
      category: topCat,
      title: `${topCat}是最大排放源`,
      desc: `${topCat}占本场景碳排放的 ${pct}%,是减碳的首要突破口,建议优先针对该环节制定优化方案。`,
      potential: `若降低 ${topCat} 排放 20%,预计可减少 ${(topVal * 0.2).toFixed(1)} kgCO₂`,
    });
  }

  // 2. 车辆燃油占比高 → 电动化建议
  const fuelEmission = (categoryTotals['车辆燃油'] || 0);
  if (fuelEmission / total > 0.15) {
    const pct = ((fuelEmission / total) * 100).toFixed(1);
    suggestions.push({
      priority: 'high',
      category: '车辆燃油',
      title: '燃油车辆占比较高,建议电动化替换',
      desc: `车辆燃油排放占 ${pct}%,燃油三轮车每升柴油排放 2.73 kgCO₂,替换为电动三轮车可显著降低排放。`,
      potential: `若 50% 燃油车替换为电动车,预计可减少 ${(fuelEmission * 0.5).toFixed(1)} kgCO₂`,
    });
  }

  // 3. 空驶率分析
  const totalKm = items.find(i => i.field.key === 'totalKm');
  const emptyKm = items.find(i => i.field.key === 'emptyKm');
  if (totalKm && emptyKm && totalKm.value > 0) {
    const emptyRate = (emptyKm.value / totalKm.value) * 100;
    if (emptyRate > 15) {
      suggestions.push({
        priority: 'high',
        category: '车辆行驶',
        title: `空驶率达 ${emptyRate.toFixed(1)}%,建议优化配送路径`,
        desc: `空驶里程占总行驶里程 ${emptyRate.toFixed(1)}%,存在较大优化空间。引入AI路径规划可降低空驶率。`,
        potential: `若空驶率降至 10%,预计可减少 ${((emptyKm.value - totalKm.value * 0.1) * 0.12).toFixed(1)} kgCO₂`,
      });
    }
  }

  // 4. 包装回收率分析
  const cardboardUse = items.find(i => i.field.key === 'cardboard');
  const recycled = items.find(i => i.field.key === 'recycledCardboard');
  if (cardboardUse && recycled && cardboardUse.value > 0) {
    const recycleRate = (recycled.value / cardboardUse.value) * 100;
    if (recycleRate < 15) {
      suggestions.push({
        priority: 'medium',
        category: '包装材料',
        title: `纸箱回收率仅 ${recycleRate.toFixed(1)}%,建议推广循环包装`,
        desc: `纸箱回收率偏低,大量包装直接废弃。推广循环包装箱或驿站集中回收可提升回收率至 30% 以上。`,
        potential: `若回收率提升至 30%,预计可抵扣 ${((cardboardUse.value * 0.3 - recycled.value) * 0.67).toFixed(1)} kgCO₂`,
      });
    }
  }

  // 5. 电力占比高 → 光伏/绿电
  const elecEmission = (categoryTotals['电力能耗'] || 0) + (categoryTotals['车辆电力'] || 0);
  if (elecEmission / total > 0.4) {
    const pct = ((elecEmission / total) * 100).toFixed(1);
    suggestions.push({
      priority: 'medium',
      category: '电力能耗',
      title: `电力排放占 ${pct}%,建议引入光伏或绿电交易`,
      desc: `电力消耗是主要排放源。安装屋顶光伏或参与绿电交易,可直接降低电网用电带来的碳排放。`,
      potential: `若 30% 用电来自光伏,预计可减少 ${(elecEmission * 0.3).toFixed(1)} kgCO₂`,
    });
  }

  // 6. 快递柜/电梯等独有排放源(商务区)
  const lockerElec = items.find(i => i.field.key === 'lockerElectricity');
  if (lockerElec && lockerElec.emission > 0) {
    const pct = ((lockerElec.emission / total) * 100).toFixed(1);
    if (pct > 8) {
      suggestions.push({
        priority: 'low',
        category: '电力能耗',
        title: `快递柜待机能耗占 ${pct}%,建议启用节能模式`,
        desc: `智能快递柜 24 小时待机,显示屏和通信模块持续耗电。启用定时休眠节能模式可降低 30% 待机能耗。`,
        potential: `预计可减少 ${(lockerElec.emission * 0.3).toFixed(1)} kgCO₂`,
      });
    }
  }

  return suggestions;
}

/**
 * 分析整个板块的优化建议
 */
export function analyzeBoard(boardId, allFormData) {
  const { boardTotal, scenarioTotals, categoryTotals } = calcBoard(boardId, allFormData);
  const suggestions = [];

  if (boardTotal <= 0) return { suggestions, summary: null };

  // 板块内排放最高的子场景
  const boardScenarios = getScenariosByBoard(boardId);
  const sortedScenarios = boardScenarios
    .map(s => ({ s, total: scenarioTotals[s.id] || 0 }))
    .sort((a, b) => b.total - a.total);

  const topScenario = sortedScenarios[0];
  if (topScenario && topScenario.total > 0) {
    const pct = ((topScenario.total / boardTotal) * 100).toFixed(1);
    suggestions.push({
      priority: 'high',
      title: `"${topScenario.s.name}"是本板块最大排放源`,
      desc: `占板块总碳排放的 ${pct}%,减碳资源应优先投入该环节。`,
    });
  }

  // 板块层面的类别建议(复用单场景分析逻辑)
  boardScenarios.forEach(s => {
    const result = calcScenario(s.id, allFormData[s.id] || {});
    const subSuggestions = analyzeScenario(result, s);
    // 只取高优先级
    subSuggestions.filter(sug => sug.priority === 'high').forEach(sug => {
      suggestions.push({
        ...sug,
        title: `[${s.name}] ${sug.title}`,
      });
    });
  });

  // 汇总统计
  const summary = {
    boardTotal,
    topCategory: Object.entries(categoryTotals)
      .filter(([k]) => !k.includes('抵扣'))
      .sort((a, b) => b[1] - a[1])[0],
    scenarioCount: sortedScenarios.filter(x => x.total > 0).length,
  };

  return { suggestions, summary };
}
