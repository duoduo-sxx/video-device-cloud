<template>
  <div class="err-page">
    <div class="code">403</div>
    <h2>没有访问权限</h2>
    <p>当前角色「{{ store.user?.roleName || '未登录' }}」无法访问该页面，请联系管理员调整权限，或切换到有权限的角色查看。</p>
    <div class="actions">
      <el-button type="primary" @click="router.push('/dashboard')">返回工作台</el-button>
      <el-button @click="switchRole">切换为平台管理员</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const store = useUserStore()

function switchRole() {
  store.switchRole('admin')
  ElMessage.success('已切换为平台管理员')
  router.push('/dashboard')
}
</script>

<style scoped>
.err-page {
  min-height: 62vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 40px;
}

.code {
  font-size: 84px;
  font-weight: 600;
  color: #e8eef7;
  line-height: 1;
  letter-spacing: 4px;
}

h2 {
  font-size: 20px;
  font-weight: 600;
  margin: 10px 0 8px;
}

p {
  font-size: 13px;
  color: var(--neutral-400);
  max-width: 460px;
  line-height: 1.8;
  margin: 0 0 22px;
}

.actions {
  display: flex;
  gap: 10px;
}
</style>
