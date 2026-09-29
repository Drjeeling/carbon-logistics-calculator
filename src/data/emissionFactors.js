/**
 * 高校碳排放核算系统 - 排放因子数据库
 * 因子来源:生态环境部年度公告、GB/T 21371、行业基准值
 * 单位说明:kgCO₂ 为千克二氧化碳当量
 *
 * 可信度等级:
 *   A - 国标/IPCC权威来源,数值稳定
 *   B - 行业LCA研究平均值,可接受
 *   C - 企业报告/估算值,存在不确定性,需调研校准
 */

export const GRADE_INFO = {
  A: { label: 'A', desc: '国标/IPCC权威来源', color: '#059669' },
  B: { label: 'B', desc: '行业LCA研究值', color: '#2563eb' },
  C: { label: 'C', desc: '企业报告/估算值', color: '#d97706' },
};

export const emissionFactors = {
  // 电网排放因子(北京)
  grid: {
    value: 0.57,
    unit: 'kgCO₂/kWh',
    source: '生态环境部年度公告',
    name: '北京电网排放因子',
    grade: 'A',
  },
  // 天然气
  naturalGas: {
    value: 2.16,
    unit: 'kgCO₂/m³',
    source: 'GB/T 21371 / 省级温室气体清单指南',
    name: '天然气排放因子',
    grade: 'A',
  },
  // 柴油
  diesel: {
    value: 2.73,
    unit: 'kgCO₂/L',
    source: 'IPCC 2006 国家温室气体清单指南',
    name: '柴油排放因子',
    grade: 'A',
  },
  // 汽油
  gasoline: {
    value: 2.36,
    unit: 'kgCO₂/L',
    source: 'IPCC 2006 国家温室气体清单指南',
    name: '汽油排放因子',
    grade: 'A',
  },
};

// 自定义因子(行业基准/估算),统一管理可信度
export const customFactors = {
  cardboard: { value: 1.03, unit: 'kgCO₂/kg', source: '纸制品行业LCA研究', grade: 'B', name: '瓦楞纸箱排放因子' },
  plasticBag: { value: 2.17, unit: 'kgCO₂/kg', source: 'PE塑料LCA研究', grade: 'B', name: '塑料包装排放因子' },
  tape: { value: 3.80, unit: 'kgCO₂/kg', source: 'BOPP胶带生产能耗估算', grade: 'C', name: '胶带排放因子(估算)' },
  recycledCardboard: { value: -0.67, unit: 'kgCO₂/kg', source: '顺丰ESG报告参考', grade: 'C', name: '纸箱回收抵扣因子' },
  foodWaste: { value: 0.45, unit: 'kgCO₂/kg', source: '厨余填埋甲烷折算(估算)', grade: 'C', name: '厨余垃圾排放因子' },
  vehicleKm: { value: 0.12, unit: 'kgCO₂/km', source: '燃油三轮平均排放估算', grade: 'C', name: '配送车辆公里排放因子' },
};

/**
 * 板块(大场景)配置
 * 最左侧导航选择板块,板块内包含若干子场景
 */
export const boards = [
  {
    id: 'campus',
    name: '高校',
    icon: '🎓',
    description: '校园内快递驿站、教学楼、宿舍楼、食堂的碳排放核算',
    color: '#1e40af',
  },
  {
    id: 'residential',
    name: '老旧居民区',
    icon: '🏘️',
    description: '老旧社区末端配送车辆、公共用电、包装碳排放核算',
    color: '#b45309',
  },
  {
    id: 'business',
    name: '商务区',
    icon: '🏙️',
    description: '写字楼配送中心、电梯、快递柜、车辆碳排放核算',
    color: '#0e7490',
  },
];

/**
 * 子场景配置
 * 每个子场景包含:id, name, icon, description, color, boardId, fields
 */
export const scenarios = [
  // ========== 高校板块 ==========
  {
    id: 'courier',
    name: '快递驿站',
    icon: '📦',
    description: '校园快递驿站的能耗、包装、配送车辆碳排放',
    color: '#1e40af',
    boardId: 'campus',
    fields: [
      { key: 'stationElectricity', label: '驿站用电量', unit: 'kWh', factorKey: 'grid', category: '电力能耗' },
      { key: 'lockerElectricity', label: '智能快递柜用电量', unit: 'kWh', factorKey: 'grid', category: '电力能耗' },
      { key: 'evCharge', label: '电动三轮车充电量', unit: 'kWh', factorKey: 'grid', category: '电力能耗' },
      { key: 'dieselFuel', label: '燃油配送车柴油消耗', unit: 'L', factorKey: 'diesel', category: '车辆燃油' },
      { key: 'gasolineFuel', label: '燃油配送车汽油消耗', unit: 'L', factorKey: 'gasoline', category: '车辆燃油' },
      { key: 'cardboard', label: '纸箱使用量', unit: 'kg', customKey: 'cardboard', category: '包装材料' },
      { key: 'plasticBag', label: '塑料袋使用量', unit: 'kg', customKey: 'plasticBag', category: '包装材料' },
      { key: 'tape', label: '胶带使用量', unit: 'kg', customKey: 'tape', category: '包装材料' },
      { key: 'recycledCardboard', label: '回收纸箱量(抵扣)', unit: 'kg', customKey: 'recycledCardboard', category: '回收抵扣' },
    ],
  },
  {
    id: 'teaching',
    name: '教学楼',
    icon: '🏫',
    description: '教学楼照明、空调、设备、电梯及供暖碳排放',
    color: '#059669',
    boardId: 'campus',
    fields: [
      { key: 'lighting', label: '照明用电量', unit: 'kWh', factorKey: 'grid', category: '电力能耗' },
      { key: 'aircon', label: '空调用电量', unit: 'kWh', factorKey: 'grid', category: '电力能耗' },
      { key: 'equipment', label: '设备用电量(电脑/投影)', unit: 'kWh', factorKey: 'grid', category: '电力能耗' },
      { key: 'elevator', label: '电梯用电量', unit: 'kWh', factorKey: 'grid', category: '电力能耗' },
      { key: 'heatingGas', label: '供暖天然气用量', unit: 'm³', factorKey: 'naturalGas', category: '供暖能耗' },
    ],
  },
  {
    id: 'dormitory',
    name: '宿舍楼',
    icon: '🏠',
    description: '宿舍楼照明、空调、热水器、供暖及饮水机碳排放',
    color: '#0e7490',
    boardId: 'campus',
    fields: [
      { key: 'lightingSocket', label: '照明/插座用电量', unit: 'kWh', factorKey: 'grid', category: '电力能耗' },
      { key: 'aircon', label: '空调用电量', unit: 'kWh', factorKey: 'grid', category: '电力能耗' },
      { key: 'waterHeaterElec', label: '热水器用电量', unit: 'kWh', factorKey: 'grid', category: '电力能耗' },
      { key: 'waterHeaterGas', label: '热水器天然气用量', unit: 'm³', factorKey: 'naturalGas', category: '燃气能耗' },
      { key: 'heating', label: '供暖天然气用量', unit: 'm³', factorKey: 'naturalGas', category: '供暖能耗' },
      { key: 'waterDispenser', label: '饮水机用电量', unit: 'kWh', factorKey: 'grid', category: '电力能耗' },
    ],
  },
  {
    id: 'cafeteria',
    name: '食堂',
    icon: '🍽️',
    description: '食堂烹饪燃气、冷藏冷冻、设备用电及厨余处理碳排放',
    color: '#b45309',
    boardId: 'campus',
    fields: [
      { key: 'cookingGas', label: '烹饪天然气用量', unit: 'm³', factorKey: 'naturalGas', category: '燃气能耗' },
      { key: 'refrigeration', label: '冷藏冷冻用电量', unit: 'kWh', factorKey: 'grid', category: '电力能耗' },
      { key: 'lightingEquipment', label: '照明/设备用电量', unit: 'kWh', factorKey: 'grid', category: '电力能耗' },
      { key: 'foodWaste', label: '厨余垃圾处理量', unit: 'kg', customKey: 'foodWaste', category: '废弃物处理' },
    ],
  },

  // ========== 老旧居民区板块 ==========
  {
    id: 'res_delivery',
    name: '末端配送',
    icon: '🚲',
    description: '老旧社区快递配送车辆行驶、燃油/电力消耗碳排放',
    color: '#b45309',
    boardId: 'residential',
    fields: [
      { key: 'dieselFuel', label: '燃油三轮车柴油消耗', unit: 'L', factorKey: 'diesel', category: '车辆燃油' },
      { key: 'gasolineFuel', label: '燃油三轮车汽油消耗', unit: 'L', factorKey: 'gasoline', category: '车辆燃油' },
      { key: 'evCharge', label: '电动三轮车充电量', unit: 'kWh', factorKey: 'grid', category: '车辆电力' },
      { key: 'totalKm', label: '配送总行驶里程', unit: 'km', customKey: 'vehicleKm', category: '车辆行驶' },
      { key: 'emptyKm', label: '空驶里程', unit: 'km', customKey: 'vehicleKm', category: '车辆行驶' },
      { key: 'retryKm', label: '重复投递里程', unit: 'km', customKey: 'vehicleKm', category: '车辆行驶' },
    ],
  },
  {
    id: 'res_common',
    name: '公共区域',
    icon: '💡',
    description: '小区公共照明、楼道、快递暂存点等用电碳排放',
    color: '#92400e',
    boardId: 'residential',
    fields: [
      { key: 'totalElectricity', label: '全小区公共用电量', unit: 'kWh', factorKey: 'grid', category: '电力能耗' },
      { key: 'commonLighting', label: '公共照明用电量', unit: 'kWh', factorKey: 'grid', category: '电力能耗' },
      { key: 'stairLighting', label: '楼道照明用电量', unit: 'kWh', factorKey: 'grid', category: '电力能耗' },
      { key: 'tempStationElectricity', label: '快递暂存点用电量', unit: 'kWh', factorKey: 'grid', category: '电力能耗' },
    ],
  },
  {
    id: 'res_packaging',
    name: '包装材料',
    icon: '📦',
    description: '老旧社区快递包装使用与回收碳排放(回收率极低)',
    color: '#7c2d12',
    boardId: 'residential',
    fields: [
      { key: 'cardboard', label: '纸箱使用量', unit: 'kg', customKey: 'cardboard', category: '包装材料' },
      { key: 'plasticBag', label: '塑料袋使用量', unit: 'kg', customKey: 'plasticBag', category: '包装材料' },
      { key: 'tape', label: '胶带使用量', unit: 'kg', customKey: 'tape', category: '包装材料' },
      { key: 'recycledCardboard', label: '回收纸箱量(抵扣)', unit: 'kg', customKey: 'recycledCardboard', category: '回收抵扣' },
    ],
  },

  // ========== 商务区板块 ==========
  {
    id: 'biz_building',
    name: '楼宇配送',
    icon: '🏢',
    description: '写字楼配送中心、电梯、快递柜用电碳排放',
    color: '#0e7490',
    boardId: 'business',
    fields: [
      { key: 'centerElectricity', label: '楼宇配送中心用电量', unit: 'kWh', factorKey: 'grid', category: '电力能耗' },
      { key: 'elevatorElectricity', label: '电梯用电量(配送段)', unit: 'kWh', factorKey: 'grid', category: '电力能耗' },
      { key: 'lockerElectricity', label: '智能快递柜用电量', unit: 'kWh', factorKey: 'grid', category: '电力能耗' },
      { key: 'peakLoad', label: '高峰时段用电量', unit: 'kWh', factorKey: 'grid', category: '电力能耗' },
    ],
  },
  {
    id: 'biz_vehicle',
    name: '配送车辆',
    icon: '🚚',
    description: '商务区新能源轻卡集中配送碳排放',
    color: '#155e75',
    boardId: 'business',
    fields: [
      { key: 'evTruckCharge', label: '新能源轻卡充电量', unit: 'kWh', factorKey: 'grid', category: '车辆电力' },
      { key: 'dieselFuel', label: '燃油配送车柴油消耗', unit: 'L', factorKey: 'diesel', category: '车辆燃油' },
      { key: 'gasolineFuel', label: '燃油配送车汽油消耗', unit: 'L', factorKey: 'gasoline', category: '车辆燃油' },
      { key: 'totalKm', label: '配送总行驶里程', unit: 'km', customKey: 'vehicleKm', category: '车辆行驶' },
    ],
  },
  {
    id: 'biz_packaging',
    name: '包装材料',
    icon: '📦',
    description: '商务区快递包装使用与回收碳排放',
    color: '#164e63',
    boardId: 'business',
    fields: [
      { key: 'cardboard', label: '纸箱使用量', unit: 'kg', customKey: 'cardboard', category: '包装材料' },
      { key: 'plasticBag', label: '塑料袋使用量', unit: 'kg', customKey: 'plasticBag', category: '包装材料' },
      { key: 'tape', label: '胶带使用量', unit: 'kg', customKey: 'tape', category: '包装材料' },
      { key: 'recycledCardboard', label: '回收纸箱量(抵扣)', unit: 'kg', customKey: 'recycledCardboard', category: '回收抵扣' },
    ],
  },
];

/**
 * 获取某个板块下的所有子场景
 */
export function getScenariosByBoard(boardId) {
  return scenarios.filter(s => s.boardId === boardId);
}

/**
 * 字段分组映射(包装 / 仓储 / 配送)
 * 将原有 category 映射到三大物流环节,突出末端配送主题
 */
export const GROUP_ORDER = ['包装', '仓储', '配送'];

export const CATEGORY_TO_GROUP = {
  '电力能耗': '仓储',
  '车辆燃油': '配送',
  '车辆电力': '配送',
  '车辆行驶': '配送',
  '包装材料': '包装',
  '回收抵扣': '包装',
  '燃气能耗': '仓储',
  '供暖能耗': '仓储',
  '废弃物处理': '仓储',
};

export function getFieldGroup(field) {
  return CATEGORY_TO_GROUP[field.category] || '其他';
}

/**
 * 获取某个板块的配置
 */
export function getBoard(boardId) {
  return boards.find(b => b.id === boardId);
}

/**
 * 获取某个输入项的排放因子值
 */
export function getFactorValue(field) {
  if (field.factorKey) {
    return emissionFactors[field.factorKey].value;
  }
  if (field.customKey) {
    return customFactors[field.customKey].value;
  }
  return field.factorValue || 0;
}

/**
 * 获取某个输入项的排放因子单位
 */
export function getFactorUnit(field) {
  if (field.factorKey) {
    return emissionFactors[field.factorKey].unit;
  }
  if (field.customKey) {
    return customFactors[field.customKey].unit;
  }
  return field.factorUnit || '';
}

/**
 * 获取某个输入项的排放因子名称
 */
export function getFactorName(field) {
  if (field.factorKey) {
    return emissionFactors[field.factorKey].name;
  }
  if (field.customKey) {
    return customFactors[field.customKey].name;
  }
  return field.label + '排放因子';
}

/**
 * 获取某个输入项的排放因子来源
 */
export function getFactorSource(field) {
  if (field.factorKey) {
    return emissionFactors[field.factorKey].source;
  }
  if (field.customKey) {
    return customFactors[field.customKey].source;
  }
  return field.source || '自定义';
}

/**
 * 获取某个输入项的可信度等级
 */
export function getFactorGrade(field) {
  if (field.factorKey) {
    return emissionFactors[field.factorKey].grade;
  }
  if (field.customKey) {
    return customFactors[field.customKey].grade;
  }
  return field.grade || 'C';
}
