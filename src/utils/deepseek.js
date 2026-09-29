/**
 * DeepSeek AI 分析模块
 * 将碳排放数据发送给 DeepSeek API,获取动态优化建议
 */
import { calcBoard, calcScenario, formatEmission } from './calculator';
import { getScenariosByBoard, getFieldGroup } from '../data/emissionFactors';

const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

/**
 * 构建发送给 DeepSeek 的 prompt
 * 把当前板块的所有碳排放数据结构化输出
 */
function buildPrompt(boardId, board, allFormData) {
  const { boardTotal, scenarioTotals, categoryTotals } = calcBoard(boardId, allFormData);
  const boardScenarios = getScenariosByBoard(boardId);
  const boardName = board?.name || '';

  // 各子场景明细
  const scenarioDetails = boardScenarios.map(s => {
    const result = calcScenario(s.id, allFormData[s.id] || {});
    const items = result.items
      .filter(i => i.value > 0)
      .map(i => `  - ${i.field.label}: ${i.value}${i.field.unit} → ${i.emission.toFixed(2)}kgCO₂ (分组:${getFieldGroup(i.field)})`)
      .join('\n');
    return `【${s.name}】总排放: ${(scenarioTotals[s.id] || 0).toFixed(2)} kgCO₂\n${items || '  (无数据)'}`;
  }).join('\n\n');

  // 类别汇总
  const catSummary = Object.entries(categoryTotals)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}: ${v.toFixed(2)}kgCO₂ (${((v / boardTotal) * 100).toFixed(1)}%)`)
    .join('、');

  const prompt = `你是一名碳排放核算与绿色物流专家。请基于以下"${boardName}"末端配送碳排放数据,给出优化建议。

## 数据概览
- 板块: ${boardName}
- 总碳排放: ${boardTotal.toFixed(2)} kgCO₂
- 排放类别构成: ${catSummary}

## 各子场景明细
${scenarioDetails}

## 请按以下格式输出(使用中文):
1. 先输出一句话总结当前碳排放状况
2. 输出3-5条优化建议,每条格式如下:
[优先级:高/中/低] 标题
描述说明(1-2句)
💡 量化潜力: (如"若降低XX 20%,预计可减少XX kgCO₂")

3. 最后输出一句综合建议

注意:
- 建议必须针对末端配送场景(包装、仓储、配送三大环节)
- 优先级高的建议针对排放占比最大的环节
- 每条建议都要给出量化的减碳潜力
- 不要输出无关的markdown格式标记`;

  return { prompt, boardTotal, hasData: boardTotal > 0 };
}

/**
 * 调用 DeepSeek API 获取分析建议
 */
export async function fetchDeepSeekAnalysis(boardId, board, allFormData) {
  const { prompt, hasData } = buildPrompt(boardId, board, allFormData);

  if (!hasData) {
    return { text: '请先录入活动数据,系统将自动分析优化方向。', hasData: false };
  }

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`API ${response.status}: ${errText || response.statusText}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content || 'AI分析结果为空';

  return { text, hasData: true };
}

/**
 * 解析 DeepSeek 返回的文本,提取结构化建议
 * 兼容多种格式,提取不了就原样返回
 */
export function parseDeepSeekResponse(text) {
  if (!text) return { summary: '', suggestions: [], raw: '' };

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // 第一行通常是总结
  const summary = lines[0] || '';

  // 提取 [优先级:高/中/低] 开头的建议块
  const suggestions = [];
  let current = null;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    // 匹配 [优先级:高] 或 [高优先级] 等变体
    const priorityMatch = line.match(/\[?\s*(?:优先级[:：]\s*)?(高|中|低)\s*\]?/);
    if (priorityMatch) {
      // 保存上一条
      if (current) suggestions.push(current);

      const priority = priorityMatch[1];
      const title = line.replace(/\[?\s*(?:优先级[:：]\s*)?(高|中|低)\s*\]?\s*/, '').trim();

      current = {
        priority: priority === '高' ? 'high' : priority === '中' ? 'medium' : 'low',
        title: title || '优化建议',
        desc: '',
        potential: '',
      };
    } else if (current && line.startsWith('💡')) {
      current.potential = line.replace(/^💡\s*/, '').trim();
    } else if (current && !current.desc) {
      current.desc = line;
    } else if (current && current.desc) {
      current.desc += '\n' + line;
    }
  }
  if (current) suggestions.push(current);

  // 如果解析失败,把原文作为一条建议返回
  if (suggestions.length === 0) {
    return {
      summary: '',
      suggestions: [{
        priority: 'medium',
        title: 'AI分析结果',
        desc: text,
        potential: '',
      }],
      raw: text,
    };
  }

  return { summary, suggestions, raw: text };
}
