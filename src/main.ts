// 本地存储兼容层：必须最先导入（防止 Electron file:// / 隐私模式下 localStorage 不可用）
import './utils/safeStorage'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import '@/styles/index.scss'

import App from './App.vue'
import router from './router'
import { setupMock } from './mock'

// 纯前端项目：启动本地 Mock 数据服务（拦截所有 axios 请求）
setupMock()

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: zhCn, size: 'default', zIndex: 3000 })

app.config.errorHandler = (err, _instance, info) => {
  // eslint-disable-next-line no-console
  console.error('[全局异常]', err, info)
}

app.mount('#app')
