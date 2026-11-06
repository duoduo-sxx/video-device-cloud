<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Bell,
  Check,
  Database,
  FileClock,
  Moon,
  Save,
  Shield,
  Sun,
  User,
  Users
} from 'lucide-vue-next'
import PageHeader from '@/components/ui/PageHeader.vue'
import SectionCard from '@/components/ui/SectionCard.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import { useAppStore } from '@/stores/app'
import { useDataStore } from '@/stores/data'
import { formatDateTime, formatGB } from '@/composables/useFormat'

const app = useAppStore()
const data = useDataStore()
const route = useRoute()
const router = useRouter()

const tabs = [
  { key: 'profile', label: '个人资料', icon: User },
  { key: 'team', label: '团队与权限', icon: Users },
  { key: 'output', label: '输出默认值', icon: Database },
  { key: 'logs', label: '操作日志', icon: FileClock }
]

const activeTab = computed({
  get: () => (route.params.tab as string) || 'profile',
  set: (v: string) => router.replace(`/settings/${v}`)
})

const profile = reactive({
  name: data.currentUser.name,
  email: data.currentUser.email,
  phone: '138 **** 7261',
  job: '修复主管',
  dept: data.currentUser.dept,
  bio: '负责老片修复与 4K 重制交付，主导过 12 部经典影片的数字化修复。'
})

const outputDefaults = reactive({
  codec: 'H.265',
  container: 'MP4',
  bitrateMode: 'CRF',
  crf: 18,
  colorSpace: 'BT.709',
  namingRule: '{name}_enhanced_{res}',
  dir: '/outputs/2026'
})

const codecOptions = [
  { label: 'H.265 / HEVC', value: 'H.265' },
  { label: 'H.264 / AVC', value: 'H.264' },
  { label: 'AV1', value: 'AV1' },
  { label: 'ProRes 422 HQ', value: 'ProRes 422 HQ' }
]
const containerOptions = ['MP4', 'MOV', 'MKV'].map((v) => ({ label: v, value: v }))
const colorOptions = ['BT.709', 'BT.2020', 'DCI-P3'].map((v) => ({ label: v, value: v }))
const bitrateOptions = ['CBR', 'VBR', 'CRF'].map((v) => ({ label: v, value: v }))

const notify = reactive([
  { key: 'taskDone', label: '任务完成', desc: '任务处理完成时通知', app: true, mail: true, desktop: true },
  { key: 'taskFail', label: '任务失败', desc: '任务异常中断时通知', app: true, mail: true, desktop: true },
  { key: 'ticketReply', label: '工单回复', desc: '工程师回复工单时通知', app: true, mail: true, desktop: false },
  { key: 'weekly', label: '每周报表', desc: '每周一发送用量与效果周报', app: false, mail: true, desktop: false }
])

const roles = ['管理员', '算法工程师', '剪辑师', '审片员', '访客']
const permissions = [
  { key: '创建任务', values: [true, true, true, true, false] },
  { key: '删除素材', values: [true, false, false, false, false] },
  { key: '管理模型', values: [true, true, false, false, false] },
  { key: '查看报表', values: [true, true, false, true, false] },
  { key: '团队管理', values: [true, false, false, false, false] },
  { key: '仅查看', values: [false, false, false, false, true] }
]

const logs = Array.from({ length: 14 }, (_, i) => {
  const actions = [
    { a: '创建增强任务', o: 'TSK-20261019-1024', r: '成功' },
    { a: '删除素材', o: 'AST-0009', r: '成功' },
    { a: '修改输出默认值', o: '系统设置', r: '成功' },
    { a: '提交工单', o: 'TK-20261018-0042', r: '成功' },
    { a: '停用模型', o: 'CARN v1.3', r: '成功' },
    { a: '导出质量报告', o: 'quality-report.csv', r: '成功' },
    { a: '登录', o: 'macOS 客户端', r: '成功' }
  ]
  const base = actions[i % actions.length]
  const people = ['陈默', '林知远', '周文彬', '何雨桐', '苏芮']
  return {
    time: new Date(Date.now() - i * 3600000 * 3.4).toISOString(),
    user: people[i % people.length],
    action: base.a,
    obj: base.o,
    ip: `10.24.${18 + (i % 5)}.${40 + i * 3}`,
    result: base.r
  }
})

const storagePct = computed(() => Math.round((data.stats.storage / data.currentUser.storageTotal) * 100))

function save(msg = '设置已保存') {
  app.toast('success', msg, '修改已写入本地配置')
}

function clearCache() {
  app.toast('success', '缓存已清理', '已释放 1.2 GB 临时文件，素材与任务数据未受影响')
}
</script>

<template>
  <div class="page">
    <PageHeader title="系统设置" desc="账户信息、团队权限、默认输出与操作审计" />

    <div class="layout">
      <aside class="side">
        <button
          v-for="t in tabs"
          :key="t.key"
          class="side-item"
          :class="{ on: activeTab === t.key }"
          @click="activeTab = t.key"
        >
          <component :is="t.icon" :size="15" />
          {{ t.label }}
        </button>
      </aside>

      <div class="content">
        <!-- 个人资料 -->
        <template v-if="activeTab === 'profile'">
          <SectionCard title="账户信息">
            <div class="profile-top">
              <div class="avatar-big">{{ data.currentUser.avatar }}</div>
              <div class="pt-main">
                <div class="pt-name">{{ profile.name }}</div>
                <div class="pt-mail">{{ profile.email }}</div>
                <div class="row gap-8" style="margin-top: 8px">
                  <span class="tag tag-primary">{{ data.currentUser.plan }}</span>
                  <span class="tag">{{ data.currentUser.role }}</span>
                  <span class="tag">到期 {{ data.currentUser.planExpire }}</span>
                </div>
              </div>
              <button class="btn btn-ghost btn-sm" @click="app.toast('info', '更换头像', '支持 JPG / PNG，建议 256×256')">更换头像</button>
            </div>

            <div class="form-grid">
              <div class="field">
                <label class="label">昵称</label>
                <input v-model="profile.name" class="input" />
              </div>
              <div class="field">
                <label class="label">邮箱</label>
                <input v-model="profile.email" class="input" />
              </div>
              <div class="field">
                <label class="label">手机</label>
                <input v-model="profile.phone" class="input" />
              </div>
              <div class="field">
                <label class="label">职位</label>
                <input v-model="profile.job" class="input" />
              </div>
              <div class="field">
                <label class="label">部门</label>
                <input v-model="profile.dept" class="input" />
              </div>
              <div class="field">
                <label class="label">角色</label>
                <input :value="data.currentUser.role" class="input" disabled />
              </div>
              <div class="field span-2">
                <label class="label">个人简介</label>
                <textarea v-model="profile.bio" class="input" rows="3" />
              </div>
            </div>

            <div class="save-row">
              <button class="btn btn-primary" @click="save('个人资料已更新')"><Save :size="13" /> 保存修改</button>
            </div>
          </SectionCard>

          <SectionCard title="外观">
            <div class="theme-row">
              <button class="theme-card" :class="{ on: app.theme === 'dark' }" @click="app.theme = 'dark'">
                <div class="theme-prev dark"><span /></div>
                <div class="th-label"><Moon :size="12" /> 深色（推荐）</div>
              </button>
              <button class="theme-card" :class="{ on: app.theme === 'light' }" @click="app.theme = 'light'">
                <div class="theme-prev light"><span /></div>
                <div class="th-label"><Sun :size="12" /> 浅色</div>
              </button>
            </div>
          </SectionCard>

          <SectionCard title="通知设置" desc="选择接收通知的渠道">
            <div class="notify-table">
              <div class="nt-head">
                <span>通知类型</span>
                <span>站内</span>
                <span>邮件</span>
                <span>桌面</span>
              </div>
              <div v-for="n in notify" :key="n.key" class="nt-row">
                <div class="nt-label">
                  <div class="nt-name">{{ n.label }}</div>
                  <div class="nt-desc">{{ n.desc }}</div>
                </div>
                <BaseSwitch v-model="n.app" :label="n.label + '站内'" />
                <BaseSwitch v-model="n.mail" :label="n.label + '邮件'" />
                <BaseSwitch v-model="n.desktop" :label="n.label + '桌面'" />
              </div>
            </div>
          </SectionCard>
        </template>

        <!-- 团队与权限 -->
        <template v-else-if="activeTab === 'team'">
          <SectionCard title="团队成员" :desc="`${data.team.length} 名成员`" no-pad>
            <template #actions>
              <button class="btn btn-ghost btn-sm" @click="app.toast('info', '邀请成员', '邀请链接已复制到剪贴板')">邀请成员</button>
            </template>
            <table class="tbl">
              <thead>
                <tr>
                  <th>成员</th>
                  <th>角色</th>
                  <th>部门</th>
                  <th>状态</th>
                  <th>最近活跃</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="m in data.team" :key="m.id">
                  <td>
                    <div class="member">
                      <div class="m-av">{{ m.name.slice(-1) }}</div>
                      <div>
                        <div class="m-name">{{ m.name }}</div>
                        <div class="m-mail">{{ m.email }}</div>
                      </div>
                    </div>
                  </td>
                  <td><span class="tag" :class="m.role === '管理员' ? 'tag-primary' : ''">{{ m.role }}</span></td>
                  <td class="t2">{{ m.dept }}</td>
                  <td>
                    <span class="online" :class="m.status === '在线' ? 'on' : m.status === '停用' ? 'off' : ''">
                      <i />{{ m.status }}
                    </span>
                  </td>
                  <td class="num t3 f12">{{ formatDateTime(m.lastActive) }}</td>
                </tr>
              </tbody>
            </table>
          </SectionCard>

          <SectionCard title="权限矩阵" desc="角色对应的功能权限">
            <table class="perm">
              <thead>
                <tr>
                  <th>权限项</th>
                  <th v-for="r in roles" :key="r">{{ r }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in permissions" :key="p.key">
                  <td class="pk">{{ p.key }}</td>
                  <td v-for="(v, i) in p.values" :key="i">
                    <Check v-if="v" :size="13" class="yes" />
                    <span v-else class="no">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </SectionCard>

          <div class="perm-tip">
            <Shield :size="13" />
            权限变更会在成员下次刷新页面后生效。管理员可管理模型启停与团队配置，访客仅可查看。
          </div>
        </template>

        <!-- 输出默认值 -->
        <template v-else-if="activeTab === 'output'">
          <SectionCard title="默认输出参数" desc="新建任务时会自动填入这些值，仍可在向导中覆盖">
            <div class="form-grid">
              <div class="field">
                <label class="label">默认编码器</label>
                <BaseSelect v-model="outputDefaults.codec" :options="codecOptions" />
              </div>
              <div class="field">
                <label class="label">默认封装</label>
                <BaseSelect v-model="outputDefaults.container" :options="containerOptions" />
              </div>
              <div class="field">
                <label class="label">码率模式</label>
                <BaseSelect v-model="outputDefaults.bitrateMode" :options="bitrateOptions" />
              </div>
              <div class="field">
                <label class="label">CRF 值</label>
                <input v-model.number="outputDefaults.crf" class="input num" type="number" min="12" max="32" />
              </div>
              <div class="field">
                <label class="label">色彩空间</label>
                <BaseSelect v-model="outputDefaults.colorSpace" :options="colorOptions" />
              </div>
              <div class="field">
                <label class="label">输出目录</label>
                <input v-model="outputDefaults.dir" class="input mono" />
              </div>
              <div class="field span-2">
                <label class="label">命名规则</label>
                <input v-model="outputDefaults.namingRule" class="input" />
                <div class="hint">可用变量：{name} {res} {codec} {date}</div>
              </div>
            </div>
            <div class="save-row">
              <button class="btn btn-primary" @click="save('输出默认值已保存')"><Save :size="13" /> 保存默认值</button>
            </div>
          </SectionCard>

          <SectionCard title="存储管理">
            <div class="storage">
              <div class="st-ring">
                <div class="st-pct num">{{ storagePct }}<i>%</i></div>
                <div class="st-l">已使用</div>
              </div>
              <div class="st-main">
                <div class="st-row">
                  <span>素材库占用</span>
                  <span class="num">{{ formatGB(data.stats.storage) }} / {{ data.currentUser.storageTotal }} TB</span>
                </div>
                <div class="st-bar"><div :style="{ width: storagePct + '%' }" /></div>
                <div class="st-meta">
                  <span>按类型：视频 96.4% · 缩略图 2.1% · 日志 1.5%</span>
                  <button class="btn btn-ghost btn-sm" @click="clearCache">清理缓存</button>
                </div>
              </div>
            </div>
          </SectionCard>
        </template>

        <!-- 操作日志 -->
        <template v-else>
          <SectionCard title="操作日志" desc="近 7 天的关键操作记录，保留 180 天" no-pad>
            <table class="tbl">
              <thead>
                <tr>
                  <th style="width: 160px">时间</th>
                  <th style="width: 100px">操作人</th>
                  <th style="width: 150px">动作</th>
                  <th>对象</th>
                  <th style="width: 130px">IP</th>
                  <th style="width: 80px">结果</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(l, i) in logs" :key="i">
                  <td class="num t2 f12">{{ formatDateTime(l.time) }}</td>
                  <td>{{ l.user }}</td>
                  <td>{{ l.action }}</td>
                  <td class="mono f12 t2">{{ l.obj }}</td>
                  <td class="mono f12 t3">{{ l.ip }}</td>
                  <td><span class="tag tag-success">{{ l.result }}</span></td>
                </tr>
              </tbody>
            </table>
          </SectionCard>
          <div class="perm-tip">
            <Bell :size="13" />
            日志为只读记录，包含账号、动作、对象与来源 IP，可用于审计追溯。
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}
.side {
  display: flex;
  flex-direction: column;
  gap: 2px;
  position: sticky;
  top: 0;
}
.side-item {
  display: flex;
  align-items: center;
  gap: 9px;
  height: 36px;
  padding: 0 11px;
  border-radius: 7px;
  font-size: 12.5px;
  color: var(--text-2);
  text-align: left;
}
.side-item:hover {
  background: var(--bg-card);
  color: var(--text-1);
}
.side-item.on {
  background: var(--primary-soft);
  color: var(--primary);
}
.content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}
.profile-top {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 18px;
}
.avatar-big {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, #2c3a5e, #1c2438);
  border: 1px solid var(--border-strong);
  display: grid;
  place-items: center;
  font-size: 18px;
  font-weight: 500;
  color: var(--text-1);
  flex: none;
}
.pt-main {
  flex: 1;
  min-width: 0;
}
.pt-name {
  font-size: 15px;
  color: var(--text-1);
  font-weight: 500;
}
.pt-mail {
  font-size: 11.5px;
  color: var(--text-3);
  margin-top: 2px;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px 24px;
}
.span-2 {
  grid-column: span 2;
}
.hint {
  margin-top: 6px;
  font-size: 10.5px;
  color: var(--text-3);
}
.save-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border-subtle);
}
.theme-row {
  display: flex;
  gap: 14px;
}
.theme-card {
  width: 180px;
  text-align: left;
}
.theme-prev {
  height: 92px;
  border-radius: 9px;
  border: 1px solid var(--border);
  overflow: hidden;
  position: relative;
  padding: 8px;
  display: flex;
  gap: 6px;
}
.theme-prev.dark {
  background: #0b0e14;
}
.theme-prev.light {
  background: #f1f4f9;
}
.theme-prev span {
  display: block;
  border-radius: 4px;
  flex: 1;
}
.theme-prev.dark span {
  background: linear-gradient(160deg, #1a2233, #121724);
  border: 1px solid #232b3a;
}
.theme-prev.light span {
  background: #ffffff;
  border: 1px solid #e2e8f2;
}
.theme-card.on .theme-prev {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary-soft);
}
.th-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  color: var(--text-2);
  margin-top: 8px;
}
.theme-card.on .th-label {
  color: var(--text-1);
}
.notify-table {
  display: flex;
  flex-direction: column;
}
.nt-head,
.nt-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 70px 70px 70px;
  align-items: center;
  gap: 12px;
}
.nt-head {
  font-size: 10.5px;
  color: var(--text-3);
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}
.nt-head span:not(:first-child) {
  text-align: center;
}
.nt-row {
  padding: 12px 0;
  border-bottom: 1px solid var(--border-subtle);
}
.nt-row:last-child {
  border-bottom: none;
}
.nt-row > :not(:first-child) {
  justify-self: center;
}
.nt-name {
  font-size: 12px;
  color: var(--text-1);
}
.nt-desc {
  font-size: 10.5px;
  color: var(--text-3);
  margin-top: 2px;
}
.member {
  display: flex;
  align-items: center;
  gap: 9px;
}
.m-av {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  background: var(--bg-inset);
  border: 1px solid var(--border);
  display: grid;
  place-items: center;
  font-size: 10px;
  color: var(--text-2);
  flex: none;
}
.m-name {
  font-size: 12.5px;
  color: var(--text-1);
}
.m-mail {
  font-size: 10px;
  color: var(--text-3);
}
.online {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--text-3);
}
.online i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--text-3);
}
.online.on {
  color: var(--text-2);
}
.online.on i {
  background: var(--success);
}
.online.off {
  opacity: 0.6;
}
.perm {
  width: 100%;
  border-collapse: collapse;
  font-size: 11.5px;
}
.perm th {
  text-align: left;
  font-weight: 500;
  font-size: 10.5px;
  color: var(--text-3);
  padding: 8px 10px;
  border-bottom: 1px solid var(--border);
}
.perm th:not(:first-child) {
  text-align: center;
}
.perm td {
  padding: 9px 10px;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-2);
  text-align: center;
}
.perm td.pk {
  text-align: left;
  color: var(--text-1);
}
.yes {
  color: var(--success);
}
.no {
  color: var(--text-3);
  opacity: 0.6;
}
.perm-tip {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 10.5px;
  color: var(--text-3);
  padding: 0 2px;
}
.storage {
  display: flex;
  align-items: center;
  gap: 22px;
}
.st-ring {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  border: 5px solid var(--border);
  border-top-color: var(--primary);
  border-right-color: var(--primary);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: none;
}
.st-pct {
  font-size: 19px;
  color: var(--text-1);
  font-weight: 500;
}
.st-pct i {
  font-style: normal;
  font-size: 10px;
  color: var(--text-3);
}
.st-l {
  font-size: 9.5px;
  color: var(--text-3);
}
.st-main {
  flex: 1;
}
.st-row {
  display: flex;
  justify-content: space-between;
  font-size: 11.5px;
  color: var(--text-2);
}
.st-bar {
  height: 6px;
  background: var(--border);
  border-radius: 99px;
  margin: 9px 0;
  overflow: hidden;
}
.st-bar div {
  height: 100%;
  background: var(--gradient);
  border-radius: 99px;
}
.st-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 10.5px;
  color: var(--text-3);
}
@media (max-width: 1100px) {
  .layout {
    grid-template-columns: minmax(0, 1fr);
  }
  .side {
    flex-direction: row;
    flex-wrap: wrap;
    position: static;
  }
  .form-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .span-2 {
    grid-column: auto;
  }
}
</style>
