<template>
  <div class="page">
    <PageHeader title="个人设置" desc="账号信息、通知偏好与安全设置" />

    <div class="profile">
      <div class="card side-card">
        <div class="avatar" :style="{ background: user?.avatarColor || '#1668DC' }">{{ user?.name?.slice(0, 1) }}</div>
        <div class="p-name">{{ user?.name }}</div>
        <div class="p-role">{{ user?.roleName }}</div>
        <div class="p-dept">{{ user?.department }}</div>
        <el-divider />
        <div class="p-item"><el-icon :size="14"><Iphone /></el-icon>{{ user?.phone || '--' }}</div>
        <div class="p-item"><el-icon :size="14"><Message /></el-icon>{{ user?.email || '--' }}</div>
        <div class="p-item"><el-icon :size="14"><Clock /></el-icon>最后登录 {{ formatDateTime(user?.lastLoginAt) }}</div>
      </div>

      <div class="main-card">
        <div class="card">
          <div class="card-title">基本信息</div>
          <el-form label-width="100px" label-position="left" style="margin-top: 16px; max-width: 520px">
            <el-form-item label="姓名"><el-input v-model="form.name" /></el-form-item>
            <el-form-item label="账号"><el-input v-model="form.account" disabled /></el-form-item>
            <el-form-item label="手机号"><el-input v-model="form.phone" /></el-form-item>
            <el-form-item label="邮箱"><el-input v-model="form.email" /></el-form-item>
            <el-form-item label="部门"><el-input v-model="form.department" /></el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveProfile">保存修改</el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="card">
          <div class="card-title">通知偏好</div>
          <div class="pref">
            <div class="pref-row">
              <div>
                <div class="pref-name">告警通知</div>
                <div class="tiny muted">P1/P2 告警实时推送，P3/P4 每小时汇总</div>
              </div>
              <el-switch v-model="pref.alarm" />
            </div>
            <div class="pref-row">
              <div>
                <div class="pref-name">工单动态</div>
                <div class="tiny muted">派单、解决、验收时通知我</div>
              </div>
              <el-switch v-model="pref.ticket" />
            </div>
            <div class="pref-row">
              <div>
                <div class="pref-name">审批提醒</div>
                <div class="tiny muted">变更单待审批时通知</div>
              </div>
              <el-switch v-model="pref.approval" />
            </div>
            <div class="pref-row">
              <div>
                <div class="pref-name">周报邮件</div>
                <div class="tiny muted">每周一 09:00 推送服务周报</div>
              </div>
              <el-switch v-model="pref.weekly" />
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-title">安全设置</div>
          <el-form label-width="100px" label-position="left" style="margin-top: 16px; max-width: 520px">
            <el-form-item label="当前密码"><el-input type="password" v-model="pwd.old" placeholder="演示环境任意输入" /></el-form-item>
            <el-form-item label="新密码"><el-input type="password" v-model="pwd.next" placeholder="至少 6 位" /></el-form-item>
            <el-form-item label="确认密码"><el-input type="password" v-model="pwd.confirm" placeholder="再次输入新密码" /></el-form-item>
            <el-form-item>
              <el-button @click="changePwd">修改密码</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Clock, Iphone, Message } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import { useUserStore } from '@/stores/user'
import { formatDateTime } from '@/utils/format'

const store = useUserStore()
const user = computed(() => store.user)

const form = reactive({ name: '', account: '', phone: '', email: '', department: '' })
const pwd = reactive({ old: '', next: '', confirm: '' })
const pref = reactive({ alarm: true, ticket: true, approval: true, weekly: false })

function saveProfile() {
  if (user.value) {
    user.value.name = form.name
    user.value.phone = form.phone
    user.value.email = form.email
    user.value.department = form.department
    localStorage.setItem('soc.user', JSON.stringify(user.value))
  }
  ElMessage.success('个人信息已保存')
}

function changePwd() {
  if (!pwd.next || pwd.next.length < 6) {
    ElMessage.warning('新密码至少 6 位')
    return
  }
  if (pwd.next !== pwd.confirm) {
    ElMessage.warning('两次输入的新密码不一致')
    return
  }
  ElMessage.success('密码已修改（演示环境不会真实生效）')
  pwd.old = ''
  pwd.next = ''
  pwd.confirm = ''
}

onMounted(() => {
  Object.assign(form, {
    name: user.value?.name ?? '',
    account: user.value?.account ?? '',
    phone: user.value?.phone ?? '',
    email: user.value?.email ?? '',
    department: user.value?.department ?? ''
  })
})
</script>

<style scoped>
.profile {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.side-card {
  text-align: center;
  padding: 26px 20px;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  color: #fff;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
}

.p-name {
  font-size: 17px;
  font-weight: 600;
  color: var(--neutral-900);
}

.p-role {
  font-size: 12px;
  color: #1668dc;
  margin-top: 4px;
}

.p-dept {
  font-size: 12px;
  color: var(--neutral-400);
  margin-top: 2px;
}

.p-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--neutral-600);
  padding: 6px 0;
  justify-content: center;
}

.main-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pref {
  margin-top: 14px;
}

.pref-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 12px 0;
  border-bottom: 1px dashed var(--divider);
}

.pref-name {
  font-size: 13px;
  color: var(--neutral-900);
  margin-bottom: 2px;
}
</style>
