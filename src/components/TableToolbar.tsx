import { useState, type ReactNode } from 'react';
import { Button, Checkbox, Input, Popover, Tooltip, type TableColumnsType } from 'antd';
import {
  DownloadOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { exportCsv } from '../utils/format';

interface ToolbarProps {
  search?: string;
  onSearch?: (v: string) => void;
  placeholder?: string;
  filters?: ReactNode;
  onRefresh?: () => void;
  exportRows?: Record<string, unknown>[];
  exportName?: string;
  extra?: ReactNode;
}

export default function TableToolbar({
  search,
  onSearch,
  placeholder = '搜索',
  filters,
  onRefresh,
  exportRows,
  exportName = 'export.csv',
  extra,
}: ToolbarProps) {
  return (
    <div className="table-toolbar">
      <div className="table-toolbar-left">
        {onSearch && (
          <Input
            allowClear
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={placeholder}
            prefix={<SearchOutlined style={{ color: 'var(--text-3)' }} />}
            style={{ width: 260 }}
          />
        )}
        {filters}
      </div>
      <div className="table-toolbar-right">
        {extra}
        {onRefresh && (
          <Tooltip title="刷新">
            <Button type="text" icon={<ReloadOutlined />} onClick={onRefresh} />
          </Tooltip>
        )}
        {exportRows && (
          <Tooltip title="导出 CSV">
            <Button
              type="text"
              icon={<DownloadOutlined />}
              onClick={() => exportCsv(exportName, exportRows)}
            />
          </Tooltip>
        )}
      </div>
    </div>
  );
}

export function useColumnSetting<T>(all: TableColumnsType<T>) {
  const [hidden, setHidden] = useState<string[]>([]);
  const keyOf = (c: unknown): string => {
    const col = c as { key?: string; dataIndex?: string | string[] };
    if (col.key) return String(col.key);
    if (Array.isArray(col.dataIndex)) return col.dataIndex.join('.');
    return String(col.dataIndex ?? '');
  };
  const columns = all.filter((c) => !hidden.includes(keyOf(c)));
  const node = (
    <Popover
      trigger="click"
      placement="bottomRight"
      content={
        <div style={{ width: 170 }}>
          {all.map((c) => {
            const k = keyOf(c);
            const title = (c as { title?: ReactNode }).title;
            if (!k || k === 'action') return null;
            return (
              <div key={k} style={{ marginBottom: 8 }}>
                <Checkbox
                  checked={!hidden.includes(k)}
                  onChange={(e) =>
                    setHidden((h) => (e.target.checked ? h.filter((x) => x !== k) : [...h, k]))
                  }
                >
                  <span style={{ fontSize: 13 }}>{title}</span>
                </Checkbox>
              </div>
            );
          })}
        </div>
      }
    >
      <Button type="text" icon={<SettingOutlined />} />
    </Popover>
  );
  return { columns, node };
}
