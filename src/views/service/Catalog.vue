<template>
  <div class="page">
    <PageHeader title="服务目录" desc="标准化技术服务项，明确 SLA、计价方式与交付物，可直接下单">
      <template #actions>
        <el-button :icon="Tickets" @click="router.push('/service/tickets')">我的工单</el-button>
      </template>
    </PageHeader>

    <div class="banner">
      <div class="banner-left">
        <div class="banner-title">已签约 {{ items.length }} 项标准服务</div>
        <div class="banner-sub">本年度累计交付 {{ totalOrders }} 单，平均响应 28 分钟，SLA 达成率 98.2%</div>
      </div>
      <div class="banner-stats">
        <div class="bs"><span>7×24</span><i>服务覆盖</i></div>
        <div class="bs"><span>4h</span><i>现场响应</i></div>
        <div class="bs"><span>8 项</span><i>标准服务</i></div>
      </div>
    </div>

    <div class="catalog" v-loading="loading">
      <div v-for="s in items" :key="s.id" class="service-card">
        <div class="sc-head">
          <div class="sc-icon">
            <el-icon :size="20"><component :is="s.icon" /></el-icon>
          </div>
          <div class="sc-title">
            <div class="sc-name">{{ s.name }}</div>
            <div class="tiny muted">{{ s.id }}</div>
          </div>
          <el-tag size="small" effect="plain" type="info">{{ s.orderCount }} 单</el-tag>
        </div>
        <div class="sc-desc">{{ s.desc }}</div>
        <div class="sc-sla">
          <div class="sla-item">
            <span class="sla-label">响应时限</span>
            <span class="sla-value">{{ s.responseHours }} 小时</span>
          </div>
          <div class="sla-item">
            <span class="sla-label">解决时限</span>
            <span class="sla-value">{{ s.resolveHours }} 小时</span>
          </div>
        </div>
        <div class="sc-meta">
          <div><span class="muted">计价</span>{{ s.pricing }}</div>
          <div><span class="muted">交付物</span>{{ s.delivery }}</div>
          <div><span class="muted">适用</span>{{ s.scope }}</div>
        </div>
        <el-button type="primary" plain class="sc-btn" @click="order(s.name)">立即下单</el-button>
      </div>
    </div>

    <div class="card tips">
      <div class="card-title">服务说明</div>
      <div class="tips-grid">
        <div class="tip-item"><b>下单即计时</b>工单创建后立即开始 SLA 计时，响应与解决时限按合同服务级别自动匹配。</div>
        <div class="tip-item"><b>交付留痕</b>处理过程、附件、工时与验收评价全程留痕，可导出至月度服务报告。</div>
        <div class="tip-item"><b>超时升级</b>达时限 80% 触发预警，超时自动升级至服务经理并计入 SLA 统计。</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Tickets } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import { getServiceItems } from '@/api'
import type { ServiceItem } from '@/types'

const router = useRouter()
const loading = ref(true)
const items = ref<ServiceItem[]>([])

const totalOrders = computed(() => items.value.reduce((s, i) => s + i.orderCount, 0))

function order(name: string) {
  router.push({ path: '/service/tickets/new', query: { serviceItem: name } })
}

onMounted(async () => {
  items.value = await getServiceItems()
  loading.value = false
})
</script>

<style scoped>
.banner {
  background: linear-gradient(100deg, #0f2a4d 0%, #14406f 65%, #17649f 100%);
  border-radius: 12px;
  padding: 20px 24px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.banner-title {
  font-size: 18px;
  font-weight: 600;
}

.banner-sub {
  font-size: 12.5px;
  color: #b0c9e5;
  margin-top: 6px;
}

.banner-stats {
  display: flex;
  gap: 32px;
}

.bs {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.bs span {
  font-size: 20px;
  font-weight: 600;
  color: #7fd8d8;
  font-variant-numeric: tabular-nums;
}

.bs i {
  font-style: normal;
  font-size: 11px;
  color: #9ab6d6;
  margin-top: 2px;
}

.catalog {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.service-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.16s ease, transform 0.16s ease;
}

.service-card:hover {
  box-shadow: 0 8px 22px rgba(16, 24, 40, 0.07);
  transform: translateY(-2px);
}

.sc-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sc-icon {
  width: 38px;
  height: 38px;
  border-radius: 9px;
  background: #e8f1ff;
  color: #1668dc;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.sc-title {
  flex: 1;
}

.sc-name {
  font-size: 14.5px;
  font-weight: 600;
  color: var(--neutral-900);
}

.sc-desc {
  font-size: 12px;
  color: var(--neutral-600);
  line-height: 1.7;
  margin: 12px 0;
  min-height: 60px;
}

.sc-sla {
  display: flex;
  gap: 10px;
  background: #f7faff;
  border: 1px solid #e6effc;
  border-radius: 7px;
  padding: 9px 12px;
}

.sla-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sla-label {
  font-size: 10.5px;
  color: #8aa3c2;
}

.sla-value {
  font-size: 13px;
  font-weight: 600;
  color: #1668dc;
}

.sc-meta {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 11.5px;
  color: var(--neutral-700);
  margin: 12px 0 14px;
}

.sc-meta .muted {
  display: inline-block;
  width: 44px;
}

.sc-btn {
  margin-top: auto;
  width: 100%;
}

.tips-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-top: 12px;
}

.tip-item {
  font-size: 12px;
  color: var(--neutral-600);
  line-height: 1.8;
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px 14px;
}

.tip-item b {
  display: block;
  color: var(--neutral-900);
  font-size: 13px;
  margin-bottom: 3px;
  font-weight: 500;
}

@media (max-width: 1500px) {
  .catalog {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
