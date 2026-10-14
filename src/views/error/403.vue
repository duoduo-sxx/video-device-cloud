<script setup lang="ts">
/**
 * 403 无访问权限
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { MENUS, type MenuNode } from '@/layouts/menu'

const router = useRouter()
const user = useUserStore()

const accessible = computed(() => {
  const flatten = (nodes: MenuNode[]): MenuNode[] =>
    nodes.flatMap((n) => [n, ...(n.children ? flatten(n.children) : [])])
  return flatten(MENUS).filter((m) => m.permission && user.hasPermission(m.permission) && !m.path.includes(':'))
})

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/dashboard')
}
</script>

<template>
  <div class="err-page">
    <div class="err-card">
      <div class="err-code">403</div>
      <h1 class="err-title">抱歉，您没有访问该页面的权限</h1>
      <p class="err-desc">
        当前账号「{{ user.nickname }}」所属角色为「{{ user.roleName }}」，该角色未被授予此功能模块的访问权限。<br />
        如确需使用，请联系系统管理员在「租户与权限 → 角色权限」中为该角色补充授权。
      </p>
      <div class="err-actions">
        <el-button type="primary" @click="router.push('/dashboard')">返回数据驾驶舱</el-button>
        <el-button plain @click="goBack">返回上一页</el-button>
      </div>

      <div v-if="accessible.length" class="err-accessible">
        <p class="err-accessible__title">您当前可访问的模块</p>
        <div class="err-accessible__list">
          <el-tag
            v-for="m in accessible"
            :key="m.path"
            class="err-accessible__tag"
            effect="plain"
            size="small"
            @click="router.push(m.path)"
          >
            {{ m.title }}
          </el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.err-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: var(--vc-bg-page, #f5f7fa);
}

.err-card {
  width: 100%;
  max-width: 620px;
  padding: 44px 40px;
  border-radius: 14px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
  text-align: center;
}

.err-code {
  font-size: 72px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 4px;
  background: linear-gradient(120deg, #1677ff, #722ed1);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.err-title {
  margin: 18px 0 0;
  font-size: 19px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.err-desc {
  margin: 12px 0 0;
  font-size: 13px;
  line-height: 1.9;
  color: var(--el-text-color-secondary);
}

.err-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 26px;
}

.err-accessible {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px dashed var(--el-border-color-lighter);
  text-align: left;
}

.err-accessible__title {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}

.err-accessible__list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.err-accessible__tag {
  cursor: pointer;
}

.err-accessible__tag:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}
</style>
