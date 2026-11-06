<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowRight,
  BookOpen,
  Check,
  Clock,
  Headphones,
  Server,
  ShieldCheck,
  Ticket,
  Zap
} from 'lucide-vue-next'
import PageHeader from '@/components/ui/PageHeader.vue'
import SectionCard from '@/components/ui/SectionCard.vue'
import { useDataStore } from '@/stores/data'
import { useAppStore } from '@/stores/app'

const data = useDataStore()
const app = useAppStore()
const router = useRouter()

const openTickets = computed(() => data.tickets.filter((t) => t.status !== '已解决' && t.status !== '已关闭').length)

const entries = [
  { icon: Ticket, title: '服务工单', desc: `${openTickets.value} 个工单处理中`, path: '/service/tickets', color: 'var(--primary)' },
  { icon: BookOpen, title: '知识库', desc: '12 篇调优与排障文档', path: '/service/kb', color: 'var(--success)' },
  { icon: Server, title: '节点状态', desc: '6 个服务节点运行中', path: '/service/nodes', color: 'var(--purple)' },
  { icon: Headphones, title: '提交工单', desc: '平均 28 分钟响应', path: '/service/tickets?new=1', color: 'var(--warning)' }
]

const plans = [
  { name: '基础版', price: '¥299', unit: '/ 月', features: ['每月 20 小时处理时长', '2 个并发任务', '6 个基础模型', '工单支持（工作日）', '标准 SLA 99.5%'] },
  { name: '专业版', price: '¥1,299', unit: '/ 月', current: true, features: ['每月 200 小时处理时长', '10 个并发任务', '全部 12 个模型', '工单 + 电话支持', 'SLA 99.9%'] },
  { name: '企业版', price: '定制', unit: '', features: ['处理时长不限', '50 个并发任务', '全部模型 + 私有模型', '专属客户经理', 'SLA 99.95% + 私有化部署'] }
]

const uptimeBars = Array.from({ length: 30 }, (_, i) => ({
  day: i,
  ok: i !== 12 && i !== 21,
  partial: i === 21
}))

const usage = computed(() => ({
  used: Math.round((1 - data.currentUser.remainingHours / 200) * 100),
  remaining: data.currentUser.remainingHours
}))
</script>

<template>
  <div class="page">
    <PageHeader title="技术服务" desc="套餐用量、SLA 保障、工单与知识库支持" />

    <div class="hero">
      <div class="hero-main">
        <div class="row gap-8">
          <span class="plan-tag">{{ data.currentUser.plan }}</span>
          <span class="sla"><ShieldCheck :size="12" /> SLA 99.9%</span>
        </div>
        <div class="hero-title">本月剩余 <b class="num">{{ data.currentUser.remainingHours }}</b> 小时处理时长</div>
        <div class="usage-bar">
          <div class="usage-fill" :style="{ width: usage.used + '%' }" />
        </div>
        <div class="usage-meta">
          <span>已用 {{ usage.used }}%</span>
          <span>配额 200 小时 / 月</span>
          <span>到期 {{ data.currentUser.planExpire }}</span>
        </div>
      </div>
      <div class="hero-side">
        <div class="hs-item">
          <span class="l">本月可用率</span>
          <span class="v num">99.97<i>%</i></span>
        </div>
        <div class="hs-item">
          <span class="l">平均响应</span>
          <span class="v num">28<i>min</i></span>
        </div>
        <div class="hs-item">
          <span class="l">未关闭工单</span>
          <span class="v num">{{ openTickets }}</span>
        </div>
      </div>
    </div>

    <div class="entries">
      <button v-for="e in entries" :key="e.title" class="entry card card-hover" @click="router.push(e.path)">
        <div class="e-icon" :style="{ color: e.color, background: 'var(--bg-inset)' }">
          <component :is="e.icon" :size="16" />
        </div>
        <div class="e-main">
          <div class="e-title">{{ e.title }}</div>
          <div class="e-desc">{{ e.desc }}</div>
        </div>
        <ArrowRight :size="14" class="e-arrow" />
      </button>
    </div>

    <div class="grid2">
      <SectionCard title="套餐对比" desc="专业版适合 10 人以下制作团队">
        <div class="plans">
          <div v-for="p in plans" :key="p.name" class="plan" :class="{ current: p.current }">
            <div class="p-head">
              <span class="p-name">{{ p.name }}</span>
              <span v-if="p.current" class="p-badge">当前套餐</span>
            </div>
            <div class="p-price">
              <b>{{ p.price }}</b><span>{{ p.unit }}</span>
            </div>
            <ul class="p-list">
              <li v-for="f in p.features" :key="f"><Check :size="11" />{{ f }}</li>
            </ul>
            <button
              class="p-btn"
              :class="p.current ? 'current-btn' : ''"
              @click="app.toast('info', p.current ? '当前已是专业版' : '正在联系商务', p.current ? '无需重复订阅' : '我们会在 1 个工作日内联系你')"
            >
              {{ p.current ? '已订阅' : p.name === '企业版' ? '联系商务' : '升级' }}
            </button>
          </div>
        </div>
      </SectionCard>

      <div class="side-col">
        <SectionCard title="近 30 天服务可用率" desc="可用 28 天 · 部分降级 1 天 · 故障 1 天">
          <div class="bars">
            <div
              v-for="b in uptimeBars"
              :key="b.day"
              class="ubar"
              :class="{ bad: !b.ok && !b.partial, part: b.partial }"
              :title="`第 ${b.day + 1} 天 · ${b.ok ? '正常' : b.partial ? '部分降级' : '故障'}`"
            />
          </div>
          <div class="bar-legend">
            <span><i style="background: var(--success)" />正常</span>
            <span><i style="background: var(--warning)" />降级</span>
            <span><i style="background: var(--danger)" />故障</span>
            <span class="spacer" />
            <span class="mono">99.97%</span>
          </div>
        </SectionCard>

        <SectionCard title="服务保障">
          <div class="guarantee">
            <div class="g-item">
              <div class="g-icon"><Clock :size="14" /></div>
              <div>
                <div class="g-t">7×24 工单响应</div>
                <div class="g-d">工作日 30 分钟内首次响应，非工作日 2 小时内</div>
              </div>
            </div>
            <div class="g-item">
              <div class="g-icon"><Zap :size="14" /></div>
              <div>
                <div class="g-t">故障赔付</div>
                <div class="g-d">月度可用率低于 99.9% 时，按比例返还处理时长</div>
              </div>
            </div>
            <div class="g-item">
              <div class="g-icon"><Headphones :size="14" /></div>
              <div>
                <div class="g-t">专属技术顾问</div>
                <div class="g-d">企业版提供专属客户经理与季度调优复盘</div>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero {
  display: flex;
  align-items: stretch;
  gap: 20px;
  padding: 20px 24px;
  border: 1px solid var(--border);
  border-radius: var(--r-card);
  background:
    radial-gradient(100% 160% at 92% 0%, rgba(79, 124, 255, 0.14), transparent 62%),
    var(--bg-card);
  margin-bottom: 16px;
}
.hero-main {
  flex: 1;
  min-width: 0;
}
.plan-tag {
  font-size: 10.5px;
  color: var(--primary);
  background: var(--primary-soft);
  border-radius: 4px;
  padding: 2px 7px;
  font-weight: 500;
}
.sla {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 10.5px;
  color: var(--success);
  background: var(--success-soft);
  border-radius: 4px;
  padding: 2px 7px;
}
.hero-title {
  font-size: 19px;
  color: var(--text-1);
  margin-top: 14px;
  font-weight: 400;
}
.hero-title b {
  font-size: 26px;
  font-weight: 500;
  letter-spacing: -0.02em;
}
.usage-bar {
  height: 6px;
  background: var(--border);
  border-radius: 99px;
  margin-top: 14px;
  overflow: hidden;
  max-width: 520px;
}
.usage-fill {
  height: 100%;
  background: var(--gradient);
  border-radius: 99px;
  transition: width 0.6s var(--ease);
}
.usage-meta {
  display: flex;
  gap: 18px;
  margin-top: 8px;
  font-size: 10.5px;
  color: var(--text-3);
}
.hero-side {
  display: flex;
  gap: 20px;
  align-items: center;
  flex: none;
  padding-left: 24px;
  border-left: 1px solid var(--border);
}
.hs-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.hs-item .l {
  font-size: 10.5px;
  color: var(--text-3);
}
.hs-item .v {
  font-size: 20px;
  color: var(--text-1);
  font-weight: 500;
  letter-spacing: -0.02em;
}
.hs-item .v i {
  font-style: normal;
  font-size: 11px;
  color: var(--text-3);
  margin-left: 1px;
}
.entries {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}
.entry {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  text-align: left;
}
.e-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  flex: none;
}
.e-main {
  flex: 1;
  min-width: 0;
}
.e-title {
  font-size: 12.5px;
  color: var(--text-1);
  font-weight: 500;
}
.e-desc {
  font-size: 10.5px;
  color: var(--text-3);
  margin-top: 3px;
}
.e-arrow {
  color: var(--text-3);
  opacity: 0;
  transition: opacity 0.14s;
}
.entry:hover .e-arrow {
  opacity: 1;
}
.grid2 {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}
.side-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.plans {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.plan {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px;
  background: var(--bg-inset);
  display: flex;
  flex-direction: column;
}
.plan.current {
  border-color: var(--primary);
  background: linear-gradient(170deg, var(--primary-soft), var(--bg-card) 55%);
  box-shadow: 0 0 0 1px var(--primary-soft-2);
}
.p-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.p-name {
  font-size: 12.5px;
  color: var(--text-1);
  font-weight: 500;
}
.p-badge {
  font-size: 9px;
  color: var(--primary);
  background: var(--primary-soft-2);
  border-radius: 3px;
  padding: 1px 5px;
}
.p-price {
  margin: 12px 0 14px;
  display: flex;
  align-items: baseline;
  gap: 3px;
}
.p-price b {
  font-size: 22px;
  font-weight: 500;
  color: var(--text-1);
  letter-spacing: -0.03em;
}
.p-price span {
  font-size: 10.5px;
  color: var(--text-3);
}
.p-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
  flex: 1;
}
.p-list li {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 10.5px;
  color: var(--text-2);
  line-height: 1.5;
}
.p-list svg {
  color: var(--success);
  flex: none;
  margin-top: 2px;
}
.p-btn {
  margin-top: 14px;
  height: 30px;
  border-radius: 6px;
  font-size: 11.5px;
  color: var(--text-1);
  border: 1px solid var(--border-strong);
  background: var(--bg-card);
}
.p-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}
.current-btn {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}
.current-btn:hover {
  color: #fff;
  background: var(--primary-hover);
}
.bars {
  display: flex;
  gap: 3px;
  height: 44px;
  align-items: flex-end;
}
.ubar {
  flex: 1;
  height: 100%;
  border-radius: 2px;
  background: var(--success);
  opacity: 0.85;
}
.ubar.part {
  background: var(--warning);
  height: 62%;
}
.ubar.bad {
  background: var(--danger);
  height: 34%;
}
.bar-legend {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 9px;
  font-size: 10px;
  color: var(--text-3);
}
.bar-legend span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.bar-legend i {
  width: 7px;
  height: 7px;
  border-radius: 2px;
}
.spacer {
  flex: 1;
}
.guarantee {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.g-item {
  display: flex;
  gap: 10px;
}
.g-icon {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: var(--bg-inset);
  color: var(--text-2);
  display: grid;
  place-items: center;
  flex: none;
}
.g-t {
  font-size: 12px;
  color: var(--text-1);
}
.g-d {
  font-size: 10.5px;
  color: var(--text-3);
  line-height: 1.6;
  margin-top: 3px;
}
@media (max-width: 1280px) {
  .entries {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .grid2 {
    grid-template-columns: minmax(0, 1fr);
  }
  .hero-side {
    display: none;
  }
}
</style>
