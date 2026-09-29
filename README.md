# 末端配送碳核算平台

> 面向末端配送场景的碳排放核算与智能优化工具,支持高校、老旧居民区、商务区三大场景。

## 功能

- **三场景核算**:高校(快递驿站)、老旧居民区(末端配送)、商务区(楼宇配送)
- **包装/仓储/配送分组**:表单按物流环节折叠展示,突出末端配送主题
- **排放因子分级**:A/B/C 可信度等级,标注来源(生态环境部/IPCC/行业LCA)
- **Excel 导入**:拖拽 `.xlsx` 文件批量导入数据,支持下载模板
- **可视化**:饼图(场景内构成)、柱状图(板块对比)、分项明细表
- **DeepSeek AI 分析**:点击按钮调用 AI 动态分析数据,生成量化优化建议

## 技术栈

- React + Vite
- Chart.js(图表)
- xlsx(Excel 解析)
- DeepSeek API(AI 分析)

## 快速开始

```bash
# 安装依赖
npm install

# 配置 API Key
cp .env.example .env
# 编辑 .env 填入你的 DeepSeek API Key

# 启动开发服务器
npm run dev
```

## 项目结构

```
src/
├── components/
│   ├── BoardSidebar.jsx       # 手风琴式侧边栏导航
│   ├── BoardStats.jsx          # 板块总览 + AI分析
│   ├── ScenarioView.jsx        # 场景详情(分组表单+饼图+明细)
│   ├── FactorModal.jsx         # 排放因子库弹窗(含可信度分级)
│   └── FileDropZone.jsx        # Excel拖拽导入
├── data/
│   └── emissionFactors.js      # 排放因子库 + 场景配置
├── utils/
│   ├── calculator.js           # 碳排放计算 + 本地规则分析
│   └── deepseek.js             # DeepSeek AI 分析
├── App.jsx
└── App.css
```

## License

MIT
