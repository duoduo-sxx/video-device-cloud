<template>
  <div class="page">
    <PageHeader title="用户管理" desc="平台账号、角色与所属部门，支持启停与重置密码">
      <template #actions>
        <el-button type="primary" :icon="Plus" @click="openEdit()">新建用户</el-button>
      </template>
    </PageHeader>

    <div class="card flush">
      <div class="filters-bar">
        <div class="filters">
          <el-input v-model="query.keyword" placeholder="姓名 / 账号 / 部门" :prefix-icon="Search" clearable @keyup.enter="search" />
          <el-select v-model="query.role" placeholder="全部角色" clearable>
            <el-option v-for="r in ROLES" :key="r.code" :label="r.name" :value="r.code" />
          </el-select>
          <el-select v-model="query.status" placeholder="全部状态" clearable>
            <el-option label="启用" value="active" />
            <el-option label="停用" value="disabled" />
          </el-select>
          <el-button type="primary" :icon="Search" @click="search">查询</el-button>
          <el-button :icon="Refresh" @click="reset">重置</el-button>
        </div>
        <span class="tiny muted">共 {{ total }} 个账号</span>
      </div>

      <el-table :data="rows" v-loading="loading">
        <el-table-column label="用户" min-width="190">
          <template #default="{ row }">
            <div class="user-cell">
              <div class="u-avatar" :style="{ background: row.avatarColor }">{{ row.name.slice(0, 1) }}</div>
              <div>
                <div class="u-name">{{ row.name }}</div>
                <div class="tiny muted mono">{{ row.account }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="roleName" label="角色" width="140" />
        <el-table-column prop="department" label="部门" width="150" />
        <el-table-column label="联系方式" min-width="200">
          <template #default="{ row }">
            <div class="tiny">{{ row.phone }}</div>
            <div class="tiny muted">{{ row.email }}</div>
          </template>
        </el-table-column>
        <el-table-column label="最后登录" width="150">
          <template #default="{ row }">{{ formatDateTime(row.lastLoginAt) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }"><StatusTag kind="user" :value="row.status" /></template>
        </el-table-column>
        <el-table-column label="操作" width="190" align="right" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button link type="primary" size="small" @click="resetPwd(row)">重置密码</el-button>
            <el-button link :type="row.status === 'active' ? 'danger' : 'success'" size="small" @click="toggle(row)">{{ row.status === 'active' ? '停用' : '启用' }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="load"
          @size-change="search"
        />
      </div>
    </div>

    <el-drawer v-model="editVisible" :title="form.id ? '编辑用户' : '新建用户'" size="460px">
      <el-form :model="form" label-position="top">
        <el-form-item label="姓名"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="账号"><el-input v-model="form.account" :disabled="Boolean(form.id)" /></el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.role" style="width: 100%" @change="onRoleChange">
            <el-option v-for="r in ROLES" :key="r.code" :label="r.name" :value="r.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="部门"><el-input v-model="form.department" /></el-form-item>
        <el-form-item label="手机号"><el-input v-model="form.phone" /></el-form-item>
        <el-form-item label="邮箱"><el-input v-model="form.email" /></el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio-button value="active">启用</el-radio-button>
            <el-radio-button value="disabled">停用</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import StatusTag from '@/components/StatusTag.vue'
import { getUsers, saveUser, toggleUserStatus } from '@/api'
import type { RoleCode, User } from '@/types'
import { ROLES, ROLE_MAP } from '@/constants'
import { formatDateTime } from '@/utils/format'

const loading = ref(false)
const rows = ref<User[]>([])
const total = ref(0)
const query = reactive({ keyword: '', role: '', status: '', page: 1, pageSize: 10 })
const editVisible = ref(false)
const form = reactive<Partial<User> & { id?: string }>({})

async function load() {
  loading.value = true
  const res = await getUsers({ ...query })
  rows.value = res.list
  total.value = res.total
  loading.value = false
}

function search() {
  query.page = 1
  load()
}

function reset() {
  query.keyword = ''
  query.role = ''
  query.status = ''
  search()
}

function openEdit(row?: User) {
  Object.keys(form).forEach((k) => delete (form as Record<string, unknown>)[k])
  if (row) Object.assign(form, row)
  else Object.assign(form, { name: '', account: '', role: 'engineer' as RoleCode, department: '技术服务部', phone: '', email: '', status: 'active' })
  editVisible.value = true
}

function onRoleChange(role: RoleCode) {
  form.roleName = ROLE_MAP[role].name
}

async function save() {
  if (!form.name || !form.account) {
    ElMessage.warning('请填写姓名与账号')
    return
  }
  form.roleName = ROLE_MAP[form.role as RoleCode].name
  await saveUser(form)
  editVisible.value = false
  ElMessage.success('已保存')
  await load()
}

async function toggle(row: User) {
  const action = row.status === 'active' ? '停用' : '启用'
  const ok = await ElMessageBox.confirm(`确认${action}账号「${row.name}」？`, `${action}账号`, { type: 'warning' }).catch(() => null)
  if (!ok) return
  await toggleUserStatus(row.id)
  ElMessage.success(`已${action}`)
  await load()
}

function resetPwd(row: User) {
  ElMessageBox.confirm(`将账号「${row.name}」密码重置为初始密码 123456？`, '重置密码', { type: 'warning' })
    .then(() => ElMessage.success('密码已重置为 123456'))
    .catch(() => null)
}

onMounted(load)
</script>

<style scoped>
.filters-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--divider);
  flex-wrap: wrap;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 9px;
}

.u-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  color: #fff;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.u-name {
  font-size: 13px;
  color: var(--neutral-900);
}
</style>
