<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance } from 'element-plus'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const user = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: 'admin',
  password: 'admin123',
  remember: true
})

const rules = {
  username: [{ required: true, message: '请输入登录账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入登录密码', trigger: 'blur' }]
}

async function submit() {
  await formRef.value?.validate()
  loading.value = true
  try {
    await user.login({ ...form })
    ElMessage.success(`欢迎回来，${user.nickname}`)
    const redirect = (route.query.redirect as string) || '/dashboard'
    router.push(redirect)
  } catch {
    /* 错误信息由请求层统一提示 */
  } finally {
    loading.value = false
  }
}

async function demoLogin(account: { username: string; password: string }) {
  form.username = account.username
  form.password = account.password
  loading.value = true
  try {
    await user.login({ ...form })
    ElMessage.success(`已以「${user.roleName}」身份登录`)
    router.push('/dashboard')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login">
    <div class="login__brand">
      <div class="login__brand-inner">
        <div class="login__logo">
          <el-icon :size="26"><component :is="'VideoCameraFilled'" /></el-icon>
        </div>
        <h1>视频设备云数据服务系统</h1>
        <p class="login__slogan">Video Device Cloud Data Service & Technical Service Platform</p>

        <ul class="login__features">
          <li><el-icon><component :is="'Select'" /></el-icon>设备接入 · 云存储 · 流媒体转码 · AI 智能分析</li>
          <li><el-icon><component :is="'Select'" /></el-icon>告警处置 · 服务工单 · SLA 考核 · 备件知识库</li>
          <li><el-icon><component :is="'Select'" /></el-icon>开放平台 · 运维监控 · 用量计费 · 租户权限</li>
        </ul>

        <div class="login__stats">
          <div class="login__stat"><strong>860</strong><span>纳管设备</span></div>
          <div class="login__stat"><strong>32</strong><span>企业租户</span></div>
          <div class="login__stat"><strong>3.2 PB</strong><span>云存储总量</span></div>
          <div class="login__stat"><strong>99.96%</strong><span>平台可用率</span></div>
        </div>

        <p class="login__tip">本系统仅限授权用户访问，请妥善保管账号信息；如账号异常请联系系统管理员 400-800-1000。</p>
      </div>
    </div>

    <div class="login__form-wrap">
      <div class="login__form">
        <h2>账号登录</h2>
        <p class="login__sub">请使用平台分配的账号登录，也可选择下方角色快速进入对应工作台</p>

        <el-form ref="formRef" :model="form" :rules="rules" size="large" @keyup.enter="submit">
          <el-form-item prop="username">
            <el-input v-model="form.username" placeholder="登录账号">
              <template #prefix><el-icon><component :is="'User'" /></el-icon></template>
            </el-input>
          </el-form-item>
          <el-form-item prop="password">
            <el-input v-model="form.password" type="password" show-password placeholder="登录密码">
              <template #prefix><el-icon><component :is="'Lock'" /></el-icon></template>
            </el-input>
          </el-form-item>
          <div class="login__row">
            <el-checkbox v-model="form.remember">记住登录状态</el-checkbox>
            <span class="vc-link" @click="ElMessage.info('请联系系统管理员重置密码（400-800-1000）')">忘记密码？</span>
          </div>
          <el-button type="primary" size="large" class="login__submit" :loading="loading" @click="submit">登 录</el-button>
        </el-form>

        <div class="login__demo">
          <div class="login__demo-title">角色快捷登录</div>
          <div class="login__demo-grid">
            <div v-for="d in user.DEMO_USERS" :key="d.username" class="login__demo-item" @click="demoLogin(d)">
              <span class="login__demo-label">{{ d.label }}</span>
              <span class="login__demo-desc">{{ d.desc }}</span>
              <span class="login__demo-account">{{ d.username }} / {{ d.password }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login {
  height: 100%;
  display: flex;
  background: var(--el-bg-color);
  overflow: hidden;
}

.login__brand {
  flex: 1.1;
  background: linear-gradient(150deg, #0b2545 0%, #124e7c 45%, #1b6ca8 100%);
  color: #eaf2fb;
  display: flex;
  align-items: center;
  padding: 56px 64px;
  position: relative;
  overflow: hidden;
}

.login__brand::after {
  content: '';
  position: absolute;
  right: -120px;
  bottom: -140px;
  width: 460px;
  height: 460px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.login__brand-inner {
  position: relative;
  z-index: 1;
  max-width: 560px;
}

.login__logo {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.14);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 22px;
}

.login__brand h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 500;
  letter-spacing: 1px;
}

.login__slogan {
  margin: 10px 0 30px;
  font-size: 12px;
  opacity: 0.62;
  letter-spacing: 0.5px;
}

.login__features {
  list-style: none;
  padding: 0;
  margin: 0 0 34px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.login__features li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  opacity: 0.9;
}

.login__stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  padding: 18px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.14);
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
}

.login__stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.login__stat strong {
  font-size: 19px;
  font-weight: 500;
}

.login__stat span {
  font-size: 11px;
  opacity: 0.6;
}

.login__tip {
  margin: 24px 0 0;
  font-size: 11px;
  opacity: 0.5;
  line-height: 1.7;
}

.login__form-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  overflow: auto;
}

.login__form {
  width: 100%;
  max-width: 400px;
}

.login__form h2 {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 500;
}

.login__sub {
  margin: 0 0 24px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.login__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  font-size: 12px;
}

.login__submit {
  width: 100%;
  letter-spacing: 4px;
}

.login__demo {
  margin-top: 26px;
  padding-top: 18px;
  border-top: 1px dashed var(--el-border-color);
}

.login__demo-title {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 10px;
}

.login__demo-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.login__demo-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.16s;
}

.login__demo-item:hover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  transform: translateY(-1px);
}

.login__demo-label {
  font-size: 12px;
  font-weight: 500;
}

.login__demo-desc {
  font-size: 10px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

.login__demo-account {
  font-size: 10px;
  color: var(--el-text-color-placeholder);
  font-family: ui-monospace, monospace;
}

@media (max-width: 1180px) {
  .login__brand {
    display: none;
  }
}
</style>
