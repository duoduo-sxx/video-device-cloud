import type { ThemeConfig } from 'antd';

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1668FF',
    colorInfo: '#1668FF',
    colorSuccess: '#00B894',
    colorWarning: '#F59E0B',
    colorError: '#EF4444',
    colorText: '#0F172A',
    colorTextSecondary: '#5A6B87',
    colorTextTertiary: '#8A99B0',
    colorBorder: '#E9EEF6',
    colorBorderSecondary: '#EEF2F8',
    colorBgLayout: '#F5F7FB',
    borderRadius: 8,
    borderRadiusLG: 10,
    fontSize: 14,
    controlHeight: 34,
    fontFamily:
      'Inter, "PingFang SC", "Microsoft YaHei", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  components: {
    Layout: {
      headerBg: '#FFFFFF',
      headerHeight: 56,
      headerPadding: '0 20px',
      siderBg: '#0B1220',
      bodyBg: '#F5F7FB',
    },
    Menu: {
      darkItemBg: 'transparent',
      darkSubMenuItemBg: 'transparent',
      darkItemSelectedBg: 'rgba(22, 104, 255, 0.18)',
      darkItemSelectedColor: '#FFFFFF',
      darkItemColor: 'rgba(255,255,255,0.68)',
      darkItemHoverBg: 'rgba(255,255,255,0.06)',
      itemHeight: 38,
      itemMarginInline: 8,
      itemBorderRadius: 8,
      iconMarginInlineEnd: 10,
      fontSize: 13,
    },
    Table: {
      headerBg: '#F7F9FD',
      headerColor: '#5A6B87',
      headerSplitColor: 'transparent',
      borderColor: '#EEF2F8',
      rowHoverBg: '#F7F9FD',
      cellPaddingBlock: 12,
      headerBorderRadius: 8,
    },
    Card: {
      borderRadiusLG: 10,
    },
    Button: {
      primaryShadow: 'none',
      defaultShadow: 'none',
    },
    Tabs: {
      titleFontSize: 13,
      horizontalItemPadding: '10px 0',
    },
    Tag: {
      defaultBg: '#F1F5FB',
    },
    Segmented: {
      itemSelectedBg: '#FFFFFF',
    },
  },
};
