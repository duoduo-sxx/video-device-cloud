import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { RoleCode, User } from '@/types'
import { ROLE_MAP } from '@/constants'
import { db } from '@/mock/db'

const TOKEN_KEY = 'soc.token'
const USER_KEY = 'soc.user'

function readUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem(TOKEN_KEY) ?? '')
  const user = ref<User | null>(readUser())

  const permissions = computed<string[]>(() => (user.value ? ROLE_MAP[user.value.role].permissions : []))
  const roles = computed(() => ROLE_MAP)
  const isLogin = computed(() => Boolean(token.value && user.value))
  const scope = computed(() => (user.value ? ROLE_MAP[user.value.role].scope : 'self'))

  function has(permission?: string | string[]) {
    if (!permission) return true
    const list = Array.isArray(permission) ? permission : [permission]
    return list.some((p) => permissions.value.includes(p))
  }

  function persistUser(u: User) {
    user.value = u
    token.value = `mock-token-${u.account}-${Date.now()}`
    localStorage.setItem(TOKEN_KEY, token.value)
    localStorage.setItem(USER_KEY, JSON.stringify(u))
  }

  function login(account: string, password: string): { ok: boolean; message?: string } {
    if (!account || !password) return { ok: false, message: '请输入账号与密码' }
    const found = db.users.find((u) => u.account === account)
    if (!found || password !== '123456') return { ok: false, message: '账号或密码错误（演示密码 123456）' }
    if (found.status === 'disabled') return { ok: false, message: '该账号已停用，请联系管理员' }
    persistUser(found)
    return { ok: true }
  }

  function switchRole(role: RoleCode) {
    const preset = db.users.find((u) => u.role === role && u.status === 'active')
    if (preset) persistUser(preset)
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  return { token, user, permissions, roles, isLogin, scope, has, login, switchRole, logout }
})
