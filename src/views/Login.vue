<template>
  <div class="login">
    <div class="brand">
      <div class="brand-inner">
        <div class="brand-logo">
          <svg viewBox="0 0 32 32" width="34" height="34" fill="none">
            <rect x="3" y="4" width="26" height="7" rx="3" fill="#5B9BFF" />
            <rect x="3" y="12.5" width="26" height="7" rx="3" fill="#8FC0FF" />
            <rect x="3" y="21" width="26" height="7" rx="3" fill="#4FD6D6" />
          </svg>
          <span>储维台</span>
        </div>
        <h1>数据存储系统与技术服务</h1>
        <p class="slogan">统一纳管每 TB 容量，闭环每一次服务</p>

        <div class="brand-points">
          <div class="point">
            <span class="idx">01</span>
            <div>
              <div class="point-title">存储资源一张图</div>
              <div class="point-desc">18 套集群、46 个存储池、126 台设备统一台账</div>
            </div>
          </div>
          <div class="point">
            <span class="idx">02</span>
            <div>
              <div class="point-title">告警到工单一条链</div>
              <div class="point-desc">自动带出客户、资源与 SLA，全过程留痕</div>
            </div>
          </div>
          <div class="point">
            <span class="idx">03</span>
            <div>
              <div class="point-title">SLA 可量化</div>
              <div class="point-desc">响应/解决双计时，超时自动升级与月报</div>
            </div>
          </div>
        </div>
      </div>

      <svg class="brand-art" viewBox="0 0 520 260" fill="none" aria-hidden="true">
        <rect x="30" y="150" width="120" height="22" rx="6" fill="#1B3563" />
        <rect x="30" y="178" width="120" height="22" rx="6" fill="#1B3563" />
        <rect x="30" y="206" width="120" height="22" rx="6" fill="#1B3563" />
        <circle cx="45" cy="161" r="3" fill="#4FD6D6" />
        <circle cx="45" cy="189" r="3" fill="#5B9BFF" />
        <circle cx="45" cy="217" r="3" fill="#4FD6D6" />
        <path d="M150 161 H240" stroke="#2E5A9E" stroke-width="1.5" stroke-dasharray="4 4" />
        <path d="M150 189 H240" stroke="#2E5A9E" stroke-width="1.5" stroke-dasharray="4 4" />
        <path d="M150 217 H240" stroke="#2E5A9E" stroke-width="1.5" stroke-dasharray="4 4" />
        <rect x="240" y="130" width="130" height="118" rx="10" stroke="#2E5A9E" stroke-width="1.5" fill="#0F2547" />
        <rect x="258" y="150" width="94" height="8" rx="4" fill="#1B3563" />
        <rect x="258" y="168" width="72" height="8" rx="4" fill="#1B3563" />
        <rect x="258" y="186" width="86" height="8" rx="4" fill="#1B3563" />
        <rect x="258" y="204" width="52" height="8" rx="4" fill="#1B3563" />
        <rect x="258" y="222" width="94" height="8" rx="4" fill="#1B3563" />
        <path d="M370 189 H440" stroke="#4FD6D6" stroke-width="1.5" />
        <circle cx="450" cy="189" r="10" fill="#123A5C" stroke="#4FD6D6" stroke-width="1.5" />
        <circle cx="450" cy="189" r="3" fill="#4FD6D6" />
        <path d="M300 130 V96 H196" stroke="#2E5A9E" stroke-width="1.5" stroke-dasharray="4 4" />
        <rect x="136" y="78" width="60" height="36" rx="8" fill="#123A5C" stroke="#2E5A9E" stroke-width="1.5" />
        <text x="166" y="101" fill="#8FC0FF" font-size="12" text-anchor="middle">SLA</text>
        <path d="M370 96 H440" stroke="#2E5A9E" stroke-width="1.5" stroke-dasharray="4 4" />
        <rect x="440" y="80" width="56" height="32" rx="8" fill="#123A5C" stroke="#2E5A9E" stroke-width="1.5" />
        <text x="468" y="101" fill="#8FC0FF" font-size="12" text-anchor="middle">告警</text>
      </svg>
    </div>

    <div class="panel">
      <div class="form-wrap">
        <div class="form-head">
          <h2>登录控制台</h2>
          <p>使用企业账号登录，或选择下方演示角色快速体验</p>
        </div>

        <el-form :model="form" :rules="rules" ref="formRef" label-position="top" @submit.prevent>
          <el-form-item label="账号" prop="account">
            <el-input v-model="form.account" size="large" placeholder="请输入账号" :prefix-icon="User" clearable />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input v-model="form.password" type="password" size="large" placeholder="演示密码 123456" :prefix-icon="Lock" show-password @keyup.enter="submit" />
          </el-form-item>
          <div class="row-between">
            <el-checkbox v-model="remember">记住账号</el-checkbox>
            <span class="link tiny">忘记密码？</span>
          </div>
          <el-button type="primary" size="large" class="submit" :loading="loading" @click="submit">登 录</el-button>
        </el-form>

        <div class="divider"><span>演示账号一键登录</span></div>
        <div class="quick">
          <button v-for="q in quickRoles" :key="q.account" class="quick-btn" @click="quickLogin(q.account)">
            <span class="q-name">{{ q.name }}</span>
            <span class="q-role">{{ q.role }}</span>
          </button>
        </div>
        <p class="tip">当前为 Mock 演示环境，所有数据存储于浏览器本地，不对外发起任何请求。</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Lock, User } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const store = useUserStore()

const form = reactive({ account: 'admin', password: '123456' })
const remember = ref(true)
const loading = ref(false)
const formRef = ref<FormInstance>()

const rules: FormRules = {
  account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const quickRoles = [
  { name: '系统管理员', account: 'admin', role: '全部权限' },
  { name: '张伟', account: 'manager', role: '服务经理' },
  { name: '陈立', account: 'engineer', role: '运维工程师' },
  { name: '李建国', account: 'customer', role: '客户管理员' },
  { name: '林悦', account: 'desk', role: '服务台坐席' },
  { name: '周敏', account: 'viewer', role: '领导 / 审计' }
]

async function submit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  const res = store.login(form.account, form.password)
  loading.value = false
  if (!res.ok) {
    ElMessage.error(res.message ?? '登录失败')
    return
  }
  ElMessage.success(`欢迎回来，${store.user?.name}`)
  const redirect = (route.query.redirect as string) || '/dashboard'
  router.push(redirect)
}

function quickLogin(account: string) {
  form.account = account
  form.password = '123456'
  submit()
}
</script>

<style scoped>
.login {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 58% 42%;
  background: #fff;
}

.brand {
  position: relative;
  background: linear-gradient(150deg, #091a31 0%, #10294d 55%, #0d2342 100%);
  color: #fff;
  padding: 56px 64px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
}

.brand-inner {
  position: relative;
  z-index: 2;
  max-width: 520px;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 17px;
  letter-spacing: 2px;
  color: #dce9ff;
  margin-bottom: 40px;
}

h1 {
  font-size: 34px;
  line-height: 1.35;
  margin: 0 0 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.slogan {
  color: #8fb3e0;
  font-size: 15px;
  margin: 0 0 44px;
  letter-spacing: 0.5px;
}

.brand-points {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.point {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.idx {
  font-size: 12px;
  color: #4fd6d6;
  border: 1px solid rgba(79, 214, 214, 0.35);
  border-radius: 4px;
  padding: 2px 6px;
  margin-top: 2px;
  font-variant-numeric: tabular-nums;
}

.point-title {
  font-size: 14px;
  color: #e6f0ff;
  margin-bottom: 3px;
}

.point-desc {
  font-size: 12.5px;
  color: #7f9dc4;
  line-height: 1.6;
}

.brand-art {
  position: absolute;
  right: -20px;
  bottom: -6px;
  width: 78%;
  opacity: 0.5;
  z-index: 1;
}

.panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 56px;
}

.form-wrap {
  width: 100%;
  max-width: 380px;
}

.form-head {
  margin-bottom: 28px;
}

.form-head h2 {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px;
  color: var(--neutral-900);
}

.form-head p {
  font-size: 13px;
  color: var(--neutral-400);
  margin: 0;
}

.row-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: -4px 0 18px;
}

.submit {
  width: 100%;
  height: 42px;
  font-size: 15px;
  letter-spacing: 4px;
}

.divider {
  position: relative;
  text-align: center;
  margin: 26px 0 16px;
  color: var(--neutral-400);
  font-size: 12px;
}

.divider::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  background: var(--divider);
}

.divider span {
  position: relative;
  background: #fff;
  padding: 0 10px;
}

.quick {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.quick-btn {
  border: 1px solid var(--border);
  background: #fafbfd;
  border-radius: 7px;
  padding: 9px 8px;
  cursor: pointer;
  text-align: left;
  transition: all 0.14s ease;
}

.quick-btn:hover {
  border-color: #a9c8f2;
  background: var(--brand-50);
}

.q-name {
  display: block;
  font-size: 12.5px;
  color: var(--neutral-900);
  line-height: 16px;
}

.q-role {
  display: block;
  font-size: 10.5px;
  color: var(--neutral-400);
  margin-top: 2px;
}

.tip {
  margin-top: 22px;
  font-size: 11.5px;
  color: #a7b0bf;
  line-height: 1.7;
}

:deep(.el-form-item__label) {
  font-size: 13px;
  color: var(--neutral-600);
  padding-bottom: 4px;
}

@media (max-width: 1100px) {
  .login {
    grid-template-columns: 1fr;
  }

  .brand {
    display: none;
  }
}
</style>
