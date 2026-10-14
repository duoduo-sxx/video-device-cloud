<script setup lang="ts">
/**
 * 个人中心：基本资料、安全设置、我的权限、我的消息与登录日志
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { systemApi, userApi } from '@/api'
import { useUserStore } from '@/stores/user'
import { MENUS, type MenuNode } from '@/layouts/menu'
import PageContainer from '@/components/PageContainer.vue'
import EmptyState from '@/components/EmptyState.vue'
import { formatDateTime } from '@/utils/format'

const router = useRouter()
const user = useUserStore()

const browserName = computed(() => {
  const ua = navigator.userAgent
  if (/Edg\//.test(ua)) return 'Microsoft Edge'
  if (/OPR\//.test(ua)) return 'Opera'
  if (/Chrome\//.test(ua)) return 'Google Chrome'
  if (/Firefox\//.test(ua)) return 'Mozilla Firefox'
  if (/Safari\//.test(ua)) return 'Apple Safari'
  return '现代浏览器'
})

const activeTab = ref('basic')
const info = computed(() => user.userInfo)

/* ---------------- 基本资料 ---------------- */
const profileForm = reactive({ nickname: '', phone: '', email: '' })
const saving = ref(false)

function syncProfile() {
  profileForm.nickname = info.value?.nickname || ''
  profileForm.phone = (info.value as any)?.phone || ''
  profileForm.email = (info.value as any)?.email || ''
}

async function saveProfile() {
  if (!profileForm.nickname) return ElMessage.warning('昵称不能为空')
  if (profileForm.phone && !/^1[3-9]\d{9}$/.test(profileForm.phone)) return ElMessage.warning('手机号格式不正确')
  if (profileForm.email && !/^[\w.-]+@[\w-]+(\.[\w-]+)+$/.test(profileForm.email)) return ElMessage.warning('邮箱格式不正确')
  saving.value = true
  try {
    if (info.value?.id) {
      try {
        await userApi.update(info.value.id, { nickname: profileForm.nickname, phone: profileForm.phone, email: profileForm.email })
      } catch {
        /* 演示环境：接口失败时仅更新本地登录信息 */
      }
    }
    user.updateProfile({
      nickname: profileForm.nickname,
      ...({ phone: profileForm.phone, email: profileForm.email } as any)
    })
    ElMessage.success('基本资料已保存')
  } finally {
    saving.value = false
  }
}

function resetProfile() {
  syncProfile()
  ElMessage.info('已还原为当前账号信息')
}

/* ---------------- 安全设置 ---------------- */
const pwdForm = reactive({ oldPwd: '', newPwd: '', confirmPwd: '' })

function checkStrength(pwd: string) {
  let score = 0
  if (pwd.length >= 8) score++
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++
  if (/\d/.test(pwd)) score++
  if (/[^\w]/.test(pwd)) score++
  return score
}

const strength = computed(() => checkStrength(pwdForm.newPwd))
const strengthText = computed(() => ['', '弱', '中', '较强', '强'][strength.value] || '')
const strengthColor = computed(() => ['#FF4D4F', '#FF4D4F', '#FAAD14', '#1677FF', '#52C41A'][strength.value])

function changePassword() {
  if (!pwdForm.oldPwd) return ElMessage.warning('请输入当前密码')
  if (pwdForm.newPwd.length < 8) return ElMessage.warning('新密码长度不能少于 8 位')
  if (!/(?=.*[A-Za-z])(?=.*\d)/.test(pwdForm.newPwd)) return ElMessage.warning('新密码需同时包含字母和数字')
  if (pwdForm.newPwd !== pwdForm.confirmPwd) return ElMessage.warning('两次输入的新密码不一致')
  if (pwdForm.newPwd === pwdForm.oldPwd) return ElMessage.warning('新密码不能与当前密码相同')
  ElMessageBox.confirm('密码修改成功后需要重新登录，确认继续？', '修改密码', { type: 'warning' })
    .then(async () => {
      ElMessage.success('密码已修改，正在退出登录')
      setTimeout(async () => {
        await user.logout()
        router.push('/login')
      }, 900)
    })
    .catch(() => undefined)
}

/* ---------------- 我的权限 ---------------- */
const permissionTree = computed(() => {
  const flatten = (nodes: MenuNode[]): MenuNode[] =>
    nodes.flatMap((n) => [n, ...(n.children ? flatten(n.children) : [])])
  return flatten(MENUS)
})

const grantedCount = computed(() => permissionTree.value.filter((m) => user.hasPermission(m.permission || '')).length)

/* ---------------- 我的消息 ---------------- */
const messages = ref<any[]>([])
const unread = ref(0)
const msgLoading = ref(false)

async function loadMessages() {
  msgLoading.value = true
  try {
    const res: any = await systemApi.messages({ limit: 30 })
    messages.value = res?.list || []
    unread.value = res?.unread || 0
  } finally {
    msgLoading.value = false
  }
}

async function readOne(row: any) {
  if (row.read) return
  await systemApi.readMessages([row.id])
  row.read = true
  unread.value = Math.max(0, unread.value - 1)
}

async function readAll() {
  await systemApi.readMessages([])
  ElMessage.success('已全部标记为已读')
  loadMessages()
}

const msgTypeMeta: Record<string, { label: string; type: any }> = {
  alarm: { label: '告警通知', type: 'danger' },
  workorder: { label: '工单动态', type: 'warning' },
  system: { label: '系统消息', type: 'primary' }
}

/* ---------------- 登录日志 ---------------- */
const loginLogs = ref<any[]>([])
const logLoading = ref(false)

async function loadLogs() {
  logLoading.value = true
  try {
    const res: any = await userApi.operationLogs({ page: 1, pageSize: 30, keyword: info.value?.username || '' })
    loginLogs.value = res?.list || []
  } finally {
    logLoading.value = false
  }
}

/* ---------------- 其他 ---------------- */
function openTab(path: string) {
  router.push(path)
}

onMounted(() => {
  syncProfile()
  loadMessages()
  loadLogs()
})
</script>

<template>
  <PageContainer title="个人中心" subtitle="维护个人资料、账号安全与查看个人权限范围">
    <template #header>
      <el-button plain :icon="'HomeFilled'" @click="openTab('/dashboard')">返回驾驶舱</el-button>
    </template>

    <div class="profile-layout">
      <!-- 左侧名片 -->
      <el-card shadow="never" class="profile-card">
        <div class="profile-card__avatar">
          <el-avatar :size="88" :src="info?.avatar">
            {{ (info?.nickname || '用').slice(-2) }}
          </el-avatar>
          <p class="profile-card__name">{{ info?.nickname || '未登录' }}</p>
          <p class="profile-card__account">@{{ info?.username }}</p>
          <el-tag type="primary" effect="light" size="small">{{ info?.roleName || '-' }}</el-tag>
        </div>
        <el-divider />
        <ul class="profile-meta">
          <li>
            <span class="profile-meta__label">所属租户</span>
            <span class="profile-meta__value">{{ info?.tenantName || '平台级账号' }}</span>
          </li>
          <li>
            <span class="profile-meta__label">账号编号</span>
            <span class="profile-meta__value">{{ info?.id || '-' }}</span>
          </li>
          <li>
            <span class="profile-meta__label">角色标识</span>
            <span class="profile-meta__value">{{ info?.roleCode || '-' }}</span>
          </li>
          <li>
            <span class="profile-meta__label">可访问模块</span>
            <span class="profile-meta__value">{{ grantedCount }} / {{ permissionTree.length }}</span>
          </li>
          <li>
            <span class="profile-meta__label">运行环境</span>
            <span class="profile-meta__value">Web · {{ browserName }}</span>
          </li>
        </ul>
        <el-divider />
        <div class="profile-card__actions">
          <el-button type="primary" plain class="full-btn" @click="activeTab = 'basic'">编辑资料</el-button>
          <el-button plain class="full-btn" @click="activeTab = 'security'">修改密码</el-button>
        </div>
      </el-card>

      <!-- 右侧内容 -->
      <el-card shadow="never" class="profile-main">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="基本资料" name="basic">
            <el-form label-width="110px" style="max-width: 520px">
              <el-form-item label="登录账号">
                <el-input :model-value="info?.username" disabled />
              </el-form-item>
              <el-form-item label="昵称" required>
                <el-input v-model="profileForm.nickname" maxlength="20" show-word-limit placeholder="请输入昵称" />
              </el-form-item>
              <el-form-item label="手机号">
                <el-input v-model="profileForm.phone" maxlength="11" placeholder="用于接收告警短信与工单通知" />
              </el-form-item>
              <el-form-item label="邮箱">
                <el-input v-model="profileForm.email" placeholder="用于接收报表与系统通知邮件" />
              </el-form-item>
              <el-form-item label="所属租户">
                <el-input :model-value="info?.tenantName || '平台级账号'" disabled />
              </el-form-item>
              <el-form-item label=" ">
                <el-button type="primary" :loading="saving" @click="saveProfile">保存修改</el-button>
                <el-button plain @click="resetProfile">还原</el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <el-tab-pane label="安全设置" name="security">
            <el-form label-width="110px" style="max-width: 520px">
              <el-form-item label="当前密码" required>
                <el-input v-model="pwdForm.oldPwd" type="password" show-password placeholder="请输入当前登录密码" />
              </el-form-item>
              <el-form-item label="新密码" required>
                <el-input v-model="pwdForm.newPwd" type="password" show-password placeholder="至少 8 位，须包含字母与数字" />
                <div v-if="pwdForm.newPwd" class="strength">
                  <span class="strength__bar">
                    <i v-for="i in 4" :key="i" :style="{ background: i <= strength ? strengthColor : 'var(--el-border-color-lighter)' }" />
                  </span>
                  <span class="strength__text" :style="{ color: strengthColor }">密码强度：{{ strengthText }}</span>
                </div>
              </el-form-item>
              <el-form-item label="确认新密码" required>
                <el-input v-model="pwdForm.confirmPwd" type="password" show-password placeholder="请再次输入新密码" />
              </el-form-item>
              <el-form-item label=" ">
                <el-button type="primary" @click="changePassword">确认修改</el-button>
              </el-form-item>
            </el-form>
            <el-alert
              type="warning"
              :closable="false"
              show-icon
              title="演示环境密码由 Mock 服务维护（admin 账号为 admin123，其余账号为 123456），此处修改仅演示交互流程。"
            />
          </el-tab-pane>

          <el-tab-pane name="permission">
            <template #label>
              <span>我的权限</span>
            </template>
            <el-alert
              type="info"
              :closable="false"
              show-icon
              :title="`当前角色「${info?.roleName || '-'}」共可访问 ${grantedCount} 个功能模块，未授权模块在菜单中隐藏且直接访问将跳转至无权限页。`"
              style="margin-bottom: 12px"
            />
            <el-table :data="permissionTree" border stripe size="small">
              <el-table-column prop="title" label="功能模块" min-width="200" />
              <el-table-column prop="path" label="路由地址" min-width="180" />
              <el-table-column prop="permission" label="权限标识" min-width="140" />
              <el-table-column label="授权状态" width="120" align="center">
                <template #default="{ row }">
                  <el-tag :type="user.hasPermission(row.permission || '') ? 'success' : 'info'" size="small" effect="plain">
                    {{ user.hasPermission(row.permission || '') ? '已授权' : '未授权' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100" align="center">
                <template #default="{ row }">
                  <el-button link type="primary" :disabled="!user.hasPermission(row.permission || '')" @click="openTab(row.path)">
                    前往
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane name="message">
            <template #label>
              <span>我的消息</span>
              <el-badge v-if="unread" :value="unread" class="tab-badge" />
            </template>
            <div class="msg-toolbar">
              <span class="unread-tip">未读 {{ unread }} 条</span>
              <el-button plain :icon="'Select'" :disabled="!unread" @click="readAll">全部已读</el-button>
            </div>
            <div v-loading="msgLoading" class="msg-list">
              <EmptyState v-if="!messages.length" description="暂无消息" tips="告警与工单通知将在此汇总" />
              <div v-for="m in messages" :key="m.id" :class="['msg-item', { 'is-unread': !m.read }]" @click="readOne(m)">
                <el-tag :type="msgTypeMeta[m.type]?.type || 'info'" size="small" effect="plain">
                  {{ msgTypeMeta[m.type]?.label || m.type }}
                </el-tag>
                <div class="msg-item__body">
                  <p class="msg-item__title">{{ m.title }}</p>
                  <p class="msg-item__content">{{ m.content }}</p>
                </div>
                <span class="msg-item__time">{{ formatDateTime(m.createTime) }}</span>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="登录日志" name="logs">
            <el-table v-loading="logLoading" :data="loginLogs" border stripe size="small">
              <el-table-column prop="createTime" label="操作时间" width="180" />
              <el-table-column prop="module" label="所属模块" width="140" />
              <el-table-column prop="action" label="操作行为" min-width="160" />
              <el-table-column prop="target" label="操作对象" min-width="180" show-overflow-tooltip />
              <el-table-column prop="ip" label="IP 地址" width="150" />
              <el-table-column label="结果" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.result === 'success' ? 'success' : 'danger'" size="small" effect="plain">
                    {{ row.result === 'success' ? '成功' : '失败' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="duration" label="耗时(ms)" width="110" align="right" />
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </div>
  </PageContainer>
</template>

<style scoped>
.profile-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 12px;
  align-items: start;
}

@media (max-width: 1100px) {
  .profile-layout {
    grid-template-columns: 1fr;
  }
}

.profile-card__avatar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
}

.profile-card__name {
  margin: 6px 0 0;
  font-size: 17px;
  font-weight: 600;
}

.profile-card__account {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.profile-meta {
  list-style: none;
  margin: 0;
  padding: 0;
}

.profile-meta li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 0;
  font-size: 13px;
  border-bottom: 1px dashed var(--el-border-color-lighter);
}

.profile-meta li:last-child {
  border-bottom: none;
}

.profile-meta__label {
  color: var(--el-text-color-secondary);
}

.profile-meta__value {
  font-weight: 500;
  text-align: right;
  word-break: break-all;
}

.profile-card__actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.full-btn {
  width: 100%;
  margin-left: 0 !important;
}

.profile-main {
  min-width: 0;
}

.strength {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.strength__bar {
  display: flex;
  gap: 4px;
}

.strength__bar i {
  width: 34px;
  height: 5px;
  border-radius: 3px;
  display: inline-block;
  transition: background 0.2s;
}

.strength__text {
  font-size: 12px;
}

.tab-badge {
  margin-left: 6px;
  margin-top: -2px;
}

.msg-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.unread-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.msg-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 160px;
}

.msg-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.msg-item:hover {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
}

.msg-item.is-unread {
  background: var(--el-color-primary-light-9);
}

.msg-item__body {
  flex: 1;
  min-width: 0;
}

.msg-item__title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
}

.msg-item__content {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.msg-item__time {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
</style>
