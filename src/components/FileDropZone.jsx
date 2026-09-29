import { useState, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';

/**
 * Excel 文件拖拽导入组件
 * 拖入 Excel 文件后自动解析并填充表单
 * 同时提供模板下载功能
 */
export default function FileDropZone({ scenario, onImport, onDownloadTemplate }) {
  const [dragOver, setDragOver] = useState(false);
  const [parseError, setParseError] = useState(null);
  const [parseSuccess, setParseSuccess] = useState(null);
  const [fileName, setFileName] = useState(null);
  const inputRef = useRef(null);

  const handleFiles = useCallback(async (files) => {
    const file = files[0];
    if (!file) return;

    const validExts = ['.xlsx', '.xls', '.csv'];
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExts.includes(ext)) {
      setParseError('请上传 .xlsx、.xls 或 .csv 格式的文件');
      setParseSuccess(null);
      return;
    }

    setFileName(file.name);
    setParseError(null);
    setParseSuccess(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (rows.length < 2) {
        setParseError('文件内容为空,请检查格式');
        return;
      }

      // 解析: 第一列=项目名称, 第二列=数值
      // 兼容多种表头写法
      const imported = {};
      let matched = 0;
      let unmatched = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row || !row[0]) continue;

        const label = String(row[0]).trim();
        const value = row[1];

        // 跳过表头行(含"项目""数值"等关键词)
        if (i === 0 && (label.includes('项目') || label.includes('名称') || label.includes('指标'))) {
          continue;
        }

        // 尝试匹配场景字段
        const field = scenario.fields.find(f => {
          const fl = f.label.replace(/\s/g, '').toLowerCase();
          const ll = label.replace(/\s/g, '').toLowerCase();
          return fl === ll || fl.includes(ll) || ll.includes(fl);
        });

        if (field && value !== undefined && value !== null && value !== '') {
          const numValue = parseFloat(value);
          if (!isNaN(numValue) && numValue >= 0) {
            imported[field.key] = String(numValue);
            matched++;
          }
        } else if (value !== undefined && value !== null && value !== '') {
          unmatched.push(label);
        }
      }

      if (matched === 0) {
        setParseError('未匹配到任何字段,请确认文件格式与模板一致');
        return;
      }

      onImport(imported);
      setParseSuccess(`成功导入 ${matched} 项数据${unmatched.length > 0 ? `,${unmatched.length} 项未匹配` : ''}`);
    } catch (err) {
      setParseError(`文件解析失败: ${err.message}`);
      setParseSuccess(null);
    }
  }, [scenario, onImport]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleInputChange = useCallback((e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    // 重置以便可以重复选择同一文件
    e.target.value = '';
  }, [handleFiles]);

  const handleDownloadTemplate = useCallback(() => {
    // 生成模板 Excel
    const templateData = [
      ['项目', '数值', '单位'],
      ...scenario.fields.map(f => [f.label, '', f.unit]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    // 设置列宽
    ws['!cols'] = [{ wch: 22 }, { wch: 12 }, { wch: 10 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '数据录入');
    XLSX.writeFile(wb, `${scenario.name}_数据模板.xlsx`);
  }, [scenario]);

  return (
    <div className="file-drop-zone">
      <div
        className={`drop-area ${dragOver ? 'drag-over' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleInputChange}
          style={{ display: 'none' }}
        />
        <div className="drop-content">
          <span className="drop-icon">📄</span>
          <span className="drop-text">
            {fileName ? fileName : '拖拽 Excel 文件到此处'}
          </span>
          <span className="drop-hint">
            {fileName ? '点击重新上传' : '或点击选择文件 (.xlsx / .csv)'}
          </span>
        </div>
      </div>

      <button className="template-btn" onClick={handleDownloadTemplate}>
        <span>📥</span>
        <span>下载模板</span>
      </button>

      {parseSuccess && (
        <div className="file-msg success">{parseSuccess}</div>
      )}
      {parseError && (
        <div className="file-msg error">{parseError}</div>
      )}
    </div>
  );
}
