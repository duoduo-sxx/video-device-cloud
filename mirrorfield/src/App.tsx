import { ConfigProvider, App as AntApp, theme as antTheme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import AppRouter from '@/router'

export default function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: antTheme.darkAlgorithm,
        token: {
          colorPrimary: '#22D3EE',
          colorInfo: '#22D3EE',
          colorSuccess: '#34D399',
          colorWarning: '#FBBF24',
          colorError: '#F87171',
          colorBgBase: '#070B14',
          colorBgContainer: '#0E1526',
          colorBgElevated: '#121A2C',
          colorBorder: 'rgba(148,163,184,0.16)',
          colorText: '#E6EDF7',
          colorTextSecondary: '#93A4BE',
          colorTextTertiary: '#5D6E8A',
          borderRadius: 8,
          fontSize: 13,
          fontFamily: 'Inter, "HarmonyOS Sans SC", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
          controlHeight: 32,
        },
        components: {
          Menu: {
            itemBg: 'transparent',
            subMenuItemBg: 'transparent',
            itemSelectedBg: 'rgba(34,211,238,0.12)',
            itemSelectedColor: '#22D3EE',
            itemColor: '#93A4BE',
            itemHoverBg: 'rgba(148,163,184,0.08)',
            itemHeight: 38,
            iconSize: 15,
          },
          Table: { headerBg: '#121A2C', rowHoverBg: '#1A2438', borderColor: 'rgba(148,163,184,0.12)' },
          Card: { colorBgContainer: '#0E1526' },
          Tabs: { itemColor: '#93A4BE', itemSelectedColor: '#22D3EE', inkBarColor: '#22D3EE' },
          Select: { optionSelectedBg: 'rgba(34,211,238,0.12)' },
          Modal: { contentBg: '#0E1526', headerBg: '#0E1526' },
          Drawer: { colorBgElevated: '#0E1526' },
        },
      }}
    >
      <AntApp>
        <AppRouter />
      </AntApp>
    </ConfigProvider>
  )
}
