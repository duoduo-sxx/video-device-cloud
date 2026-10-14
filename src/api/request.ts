/**
 * Axios 请求封装
 * - 全量请求走本地 Mock 适配器（纯前端，无后端依赖）
 * - 统一解包 { code, message, data }，非 0 视为业务错误
 * - 统一处理 401 未授权、网络异常与错误提示
 */
import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { mockAdapter } from '@/mock/adapter'
import type { ApiResponse } from '@/types'

const USE_MOCK = String(import.meta.env.VITE_USE_MOCK ?? 'true') !== 'false'

export const service: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  ...(USE_MOCK ? { adapter: mockAdapter } : {})
})

let unauthorizedShown = false

service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vc_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

service.interceptors.response.use(
  (response) => {
    const payload = response.data as ApiResponse
    if (response.status === 401 || payload?.code === 401) {
      if (!unauthorizedShown) {
        unauthorizedShown = true
        ElMessageBox.alert(payload?.message || '登录状态已失效，请重新登录', '身份验证失败', {
          confirmButtonText: '重新登录',
          type: 'warning',
          callback: () => {
            localStorage.removeItem('vc_token')
            localStorage.removeItem('vc_user')
            window.location.hash = '#/login'
            window.location.reload()
          }
        }).finally(() => {
          unauthorizedShown = false
        })
      }
      return Promise.reject(new Error(payload?.message || '未授权'))
    }
    if (payload && typeof payload.code === 'number' && payload.code !== 0) {
      ElMessage.error(payload.message || '请求失败')
      return Promise.reject(new Error(payload.message))
    }
    return payload?.data
  },
  (error) => {
    const msg = error?.message?.includes('timeout') ? '请求超时，请稍后重试' : '服务异常，请稍后重试'
    ElMessage.error(msg)
    return Promise.reject(error)
  }
)

export function request<T = any>(config: AxiosRequestConfig): Promise<T> {
  return service.request(config) as unknown as Promise<T>
}

export const http = {
  get: <T = any>(url: string, params?: any, config?: AxiosRequestConfig) => request<T>({ ...config, url, method: 'GET', params }),
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => request<T>({ ...config, url, method: 'POST', data }),
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => request<T>({ ...config, url, method: 'PUT', data }),
  del: <T = any>(url: string, params?: any, config?: AxiosRequestConfig) => request<T>({ ...config, url, method: 'DELETE', params })
}

export default service
