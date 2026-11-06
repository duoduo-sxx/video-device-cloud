<template>
  <div class="err-page">
    <div class="code">404</div>
    <h2>页面不存在</h2>
    <p>你访问的页面可能已被移除、重命名，或链接输入有误。可以返回工作台继续查看存储资源与服务工单。</p>
    <div class="actions">
      <el-button type="primary" @click="router.push('/dashboard')">返回工作台</el-button>
      <el-button @click="router.back()">返回上一页</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<style scoped>
.err-page {
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 40px;
  margin: 20px;
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
