import { theme as antdTheme } from 'antd';
import type { ThemeConfig } from 'antd';

export type ThemeMode = 'light' | 'dark';

const shared: ThemeConfig['token'] = {
  colorPrimary: '#4B5BF5',
  colorSuccess: '#17B26A',
  colorWarning: '#F79009',
  colorError: '#F04438',
  colorInfo: '#0BA5EC',
  borderRadius: 8,
  borderRadiusLG: 12,
  borderRadiusSM: 6,
  fontSize: 13,
  fontSizeHeading1: 28,
  fontSizeHeading2: 20,
  fontSizeHeading3: 16,
  controlHeight: 32,
  controlHeightLG: 36,
  controlHeightSM: 26,
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif",
  wireframe: false,
  boxShadow: '0 1px 2px rgba(16,24,40,.05)',
  boxShadowSecondary: '0 4px 12px rgba(16,24,40,.08)',
};

export function buildAntdTheme(mode: ThemeMode): ThemeConfig {
  if (mode === 'dark') {
    return {
      algorithm: antdTheme.darkAlgorithm,
      token: {
        ...shared,
        colorBgBase: '#0D1117',
        colorBgContainer: '#161B22',
        colorBgElevated: '#1C232C',
        colorBgLayout: '#0D1117',
        colorBorder: '#2A313C',
        colorBorderSecondary: '#2A313C',
        colorText: '#E6EAF0',
        colorTextSecondary: '#A7B0BE',
        colorTextTertiary: '#6E7887',
        colorTextQuaternary: '#4A535F',
        colorFillAlter: '#1C232C',
        colorFillSecondary: '#212934',
      },
      components: {
        Table: {
          headerBg: '#1C232C',
          headerColor: '#A7B0BE',
          rowHoverBg: '#212934',
          borderColor: '#2A313C',
          headerSplitColor: 'transparent',
        },
        Menu: {
          itemBg: 'transparent',
          subMenuItemBg: 'transparent',
          itemSelectedBg: '#232A52',
          itemSelectedColor: '#A8B2FF',
          itemHoverBg: '#1C232C',
          itemColor: '#A7B0BE',
        },
        Card: { colorBgContainer: '#161B22' },
        Layout: { bodyBg: '#0D1117', headerBg: '#161B22', siderBg: '#0D1117' },
      },
    };
  }

  return {
    algorithm: antdTheme.defaultAlgorithm,
    token: {
      ...shared,
      colorBgBase: '#FFFFFF',
      colorBgContainer: '#FFFFFF',
      colorBgElevated: '#FFFFFF',
      colorBgLayout: '#F7F8FA',
      colorBorder: '#E7EAF0',
      colorBorderSecondary: '#EEF0F4',
      colorText: '#101828',
      colorTextSecondary: '#475467',
      colorTextTertiary: '#8A94A6',
      colorTextQuaternary: '#B4BCC9',
      colorFillAlter: '#F2F4F7',
      colorFillSecondary: '#F5F7FA',
    },
    components: {
      Table: {
        headerBg: '#F2F4F7',
        headerColor: '#475467',
        rowHoverBg: '#F5F7FA',
        borderColor: '#E7EAF0',
        headerSplitColor: 'transparent',
      },
      Menu: {
        itemBg: 'transparent',
        subMenuItemBg: 'transparent',
        itemSelectedBg: '#EEF1FF',
        itemSelectedColor: '#3A48D9',
        itemHoverBg: '#F5F7FA',
        itemColor: '#475467',
      },
      Card: { colorBgContainer: '#FFFFFF' },
      Layout: { bodyBg: '#F7F8FA', headerBg: '#FFFFFF', siderBg: '#FFFFFF' },
    },
  };
}
