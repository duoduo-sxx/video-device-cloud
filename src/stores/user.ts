import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api'
import type { AppUserInfo } from '@/types'

const TOKEN_KEY = 'vc_token'
const USER_KEY = 'vc_user'

function readUser(): AppUserInfo | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as AppUserInfo) : null
  } catch {
    return null
  }
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem(TOKEN_KEY) || '')
  const userInfo = ref<AppUserInfo | null>(readUser())
  const buttons = ref<string[]>((readUser() as any)?.buttons || [])

  const isLogin = computed(() => !!token.value)
  const nickname = computed(() => userInfo.value?.nickname || '未登录')
  const roleName = computed(() => userInfo.value?.roleName || '-')
  const permissions = computed<string[]>(() => userInfo.value?.permissions || [])
  const isSuperAdmin = computed(() => userInfo.value?.roleCode === 'admin')

  function persist(): void {
    localStorage.setItem(TOKEN_KEY, token.value)
    localStorage.setItem(USER_KEY, JSON.stringify(userInfo.value))
  }

  async function login(payload: { username: string; password: string; captchaId?: string; captcha?: string }): Promise<AppUserInfo> {
    const data = await authApi.login(payload)
    token.value = data.token
    userInfo.value = {
      id: data.id,
      username: data.username,
      nickname: data.nickname,
      avatar: data.avatar,
      tenantId: data.tenantId,
      tenantName: data.tenantName,
      roleCode: data.roleCode,
      roleName: data.roleName,
      permissions: data.permissions,
      token: data.token
    }
    buttons.value = data.buttons || []
    persist()
    return userInfo.value
  }

  /** 按角色切换演示账号（一键登录） */
  const DEMO_USERS = [
    { username: 'admin', password: 'admin123', label: '平台超级管理员', desc: '全部菜单 / 全部数据权限' },
    { username: 'tenant', password: '123456', label: '租户管理员', desc: '本租户设备、账单、成员' },
    { username: 'ops', password: '123456', label: '运维工程师', desc: '设备、告警、监控、工单' },
    { username: 'support', password: '123456', label: '技术支持工程师', desc: '工单接管、派单、备件' },
    { username: 'ai', password: '123456', label: '算法运营', desc: '算法市场、任务编排、事件' }
  ]

  async function logout(): Promise<void> {
    try {
      if (token.value) await authApi.logout(token.value)
    } catch {
      /* 忽略登出接口异常 */
    }
    token.value = ''
    userInfo.value = null
    buttons.value = []
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  /** 刷新用户信息（例如角色权限变更后） */
  async function refresh(): Promise<void> {
    if (!token.value) return
    const data = await authApi.userinfo(token.value)
    userInfo.value = {
      id: data.id,
      username: data.username,
      nickname: data.nickname,
      avatar: data.avatar,
      tenantId: data.tenantId,
      tenantName: data.tenantName,
      roleCode: data.roleCode,
      roleName: data.roleName,
      permissions: data.permissions,
      token: token.value
    }
    buttons.value = data.buttons || []
    persist()
  }

  function hasPermission(code: string): boolean {
    if (isSuperAdmin.value) return true
    return permissions.value.includes(code)
  }

  function hasButton(code: string): boolean {
    if (isSuperAdmin.value) return true
    return buttons.value.includes(code)
  }

  function updateProfile(partial: Partial<AppUserInfo>): void {
    if (!userInfo.value) return
    userInfo.value = { ...userInfo.value, ...partial }
    persist()
  }

  return {
    token,
    userInfo,
    buttons,
    isLogin,
    nickname,
    roleName,
    permissions,
    isSuperAdmin,
    DEMO_USERS,
    login,
    logout,
    refresh,
    hasPermission,
    hasButton,
    updateProfile
  }
})
