<template>
  <div class="page">
    <PageHeader title="角色权限" desc="基于 RBAC 的角色与权限配置，权限变更在下次登录生效">
      <template #actions>
        <el-button type="primary" :icon="Select" @click="save">保存权限</el-button>
      </template>
    </PageHeader>

    <div class="role-layout">
      <div class="card role-list">
        <div class="card-title" style="margin-bottom: 12px">角色列表</div>
        <div
          v-for="r in ROLES"
          :key="r.code"
          class="role-item"
          :class="{ active: current.code === r.code }"
          @click="selectRole(r.code)"
        >
          <div class="role-top">
            <span class="role-name">{{ r.name }}</span>
            <el-tag size="small" effect="plain" type="info">{{ userCount(r.code) }} 人</el-tag>
          </div>
          <div class="role-desc">{{ r.desc }}</div>
        </div>
      </div>

      <div class="card">
        <div class="perm-head">
          <div>
            <div class="card-title">{{ current.name }} · 功能权限</div>
            <div class="tiny muted" style="margin-top: 4px">数据范围：{{ scopeText }}</div>
          </div>
          <div class="perm-actions">
            <el-button size="small" @click="checkAll(true)">全选</el-button>
            <el-button size="small" @click="checkAll(false)">清空</el-button>
          </div>
        </div>

        <el-tree
          ref="treeRef"
          :key="current.code"
          :data="PERM_TREE"
          show-checkbox
          node-key="id"
          default-expand-all
          :default-checked-keys="current.permissions"
          :props="{ label: 'label', children: 'children' }"
          class="perm-tree"
        >
          <template #default="{ data }">
            <span class="tree-node">
              <span>{{ data.label }}</span>
              <span v-if="data.id.includes(':')" class="tiny muted mono">{{ data.id }}</span>
            </span>
          </template>
        </el-tree>

        <div class="perm-tip">
          说明：权限变更保存后写入角色配置，当前会话的菜单与按钮将在刷新或重新登录后生效。客户管理员的数据范围固定为本客户，工程师为本人负责的工单。
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Select } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import { ROLES, ROLE_MAP } from '@/constants'
import { db } from '@/mock/db'
import type { RoleCode } from '@/types'

const PERM_TREE = [
  { id: 'g-dashboard', label: '工作台', children: [{ id: 'dashboard:view', label: '查看工作台' }] },
  {
    id: 'g-resource',
    label: '资源管理',
    children: [
      { id: 'resource:read', label: '查看集群 / 池 / 设备 / 卷' },
      { id: 'resource:write', label: '资源变更（扩容 / 回收）' }
    ]
  },
  {
    id: 'g-alarm',
    label: '监控告警',
    children: [
      { id: 'alarm:read', label: '查看告警与巡检' },
      { id: 'alarm:handle', label: '确认 / 关闭 / 转工单' }
    ]
  },
  {
    id: 'g-ticket',
    label: '工单管理',
    children: [
      { id: 'ticket:read', label: '查看工单' },
      { id: 'ticket:create', label: '创建工单' },
      { id: 'ticket:assign', label: '派单 / 转派' },
      { id: 'ticket:handle', label: '处理工单' },
      { id: 'ticket:accept', label: '验收工单' },
      { id: 'ticket:close', label: '关闭工单' }
    ]
  },
  {
    id: 'g-change',
    label: '变更管理',
    children: [
      { id: 'change:read', label: '查看变更' },
      { id: 'change:approve', label: '审批变更' }
    ]
  },
  {
    id: 'g-spare',
    label: '备件管理',
    children: [
      { id: 'spare:read', label: '查看库存' },
      { id: 'spare:write', label: '备件出入库' }
    ]
  },
  {
    id: 'g-kb',
    label: '知识库',
    children: [
      { id: 'knowledge:read', label: '查看文章' },
      { id: 'knowledge:write', label: '发布 / 编辑文章' }
    ]
  },
  { id: 'g-contract', label: '服务合同', children: [{ id: 'contract:read', label: '查看合同' }] },
  { id: 'g-report', label: '统计报表', children: [{ id: 'report:view', label: '查看与导出报表' }] },
  { id: 'g-customer', label: '客户管理', children: [{ id: 'customer:read', label: '查看客户与机房' }] },
  { id: 'g-system', label: '系统管理', children: [{ id: 'system:manage', label: '用户 / 角色 / 参数 / 日志' }] }
]

const treeRef = ref()
const currentCode = ref<RoleCode>('admin')
const current = computed(() => ROLE_MAP[currentCode.value])

const scopeText = computed(() => ({ all: '全部客户数据', customer: '仅本客户数据', self: '仅本人负责的数据' }[current.value.scope]))

function userCount(code: RoleCode) {
  return db.users.filter((u) => u.role === code).length
}

function selectRole(code: RoleCode) {
  currentCode.value = code
}

function checkAll(checked: boolean) {
  const all = PERM_TREE.flatMap((g) => g.children?.map((c) => c.id) ?? [])
  treeRef.value?.setCheckedKeys(checked ? all : [])
}

function save() {
  const checked = treeRef.value?.getCheckedKeys(true) as string[]
  const leaf = checked.filter((k) => k.includes(':'))
  ROLE_MAP[currentCode.value].permissions = leaf
  ElMessage.success(`「${current.value.name}」权限已保存，共 ${leaf.length} 项`)
}
</script>

<style scoped>
.role-layout {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.role-item {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.14s ease;
}

.role-item:hover {
  border-color: #b9d2f6;
}

.role-item.active {
  border-color: #1668dc;
  background: #f5f9ff;
  box-shadow: inset 0 0 0 1px #1668dc;
}

.role-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 5px;
}

.role-name {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--neutral-900);
}

.role-desc {
  font-size: 11.5px;
  color: var(--neutral-400);
  line-height: 1.6;
}

.perm-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--divider);
}

.perm-actions {
  display: flex;
  gap: 8px;
}

.perm-tree {
  margin-top: 14px;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}

.perm-tip {
  margin-top: 18px;
  background: #f8fafc;
  border-radius: 6px;
  padding: 12px 14px;
  font-size: 11.5px;
  color: var(--neutral-600);
  line-height: 1.7;
}

:deep(.el-tree-node__content) {
  height: 34px;
}
</style>
