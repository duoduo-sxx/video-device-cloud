<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  Cpu,
  Film,
  GripVertical,
  Layers,
  Sparkles,
  Trash2,
  Zap
} from 'lucide-vue-next'
import { capabilities, capabilityMap } from '@/mock/capabilities'
import { step } from '@/mock/seed'
import type { CapabilityId, PipelineStep, TaskOutput } from '@/types'
import { useDataStore } from '@/stores/data'
import { useAppStore } from '@/stores/app'
import ParamForm from '@/components/task/ParamForm.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import {
  estimateText,
  formatBytes,
  formatDuration,
  resolutionLabel
} from '@/composables/useFormat'

const route = useRoute()
const router = useRouter()
const data = useDataStore()
const app = useAppStore()

const stepIndex = ref(1)
const selectedAssets = ref<string[]>([])
const pipeline = ref<PipelineStep[]>([])
const priority = ref<1 | 2 | 3>(2)
const saveAsTemplate = ref(false)
const templateName = ref('')
const expanded = ref<string[]>([])
const dragIndex = ref<number | null>(null)

const steps = [
  { n: 1, label: '选择素材' },
  { n: 2, label: '增强能力' },
  { n: 3, label: '参数配置' },
  { n: 4, label: '输出设置' },
  { n: 5, label: '确认提交' }
]

const assetList = computed(() => data.assets.filter((a) => a.status === 'ready'))

const targetRes = ref('3840x2160')
const resOptions = [
  { label: '保持源尺寸', value: 'source' },
  { label: '1920 × 1080（1080p）', value: '1920x1080' },
  { label: '2560 × 1440（2K）', value: '2560x1440' },
  { label: '3840 × 2160（4K）', value: '3840x2160' },
  { label: '7680 × 4320（8K）', value: '7680x4320' }
]

const output = reactive<Omit<TaskOutput, 'width' | 'height'>>({
  codec: 'H.265',
  bitrateMode: 'CRF',
  bitrate: 24000,
  crf: 18,
  container: 'MP4',
  fps: 60,
  colorSpace: 'BT.709',
  audioMode: 'copy',
  namingRule: '{name}_enhanced_{res}'
})

const codecOptions = [
  { label: 'H.265 / HEVC（体积小，推荐）', value: 'H.265' },
  { label: 'H.264 / AVC（兼容性最好）', value: 'H.264' },
  { label: 'AV1（同码率画质最优）', value: 'AV1' },
  { label: 'ProRes 422 HQ（后期母版）', value: 'ProRes 422 HQ' }
]
const containerOptions = [
  { label: 'MP4', value: 'MP4' },
  { label: 'MOV', value: 'MOV' },
  { label: 'MKV', value: 'MKV' }
]
const fpsOptions = [
  { label: '跟随源帧率', value: 0 },
  { label: '50 fps', value: 50 },
  { label: '60 fps', value: 60 },
  { label: '120 fps', value: 120 }
]
const colorOptions = [
  { label: 'BT.709（SDR 标准）', value: 'BT.709' },
  { label: 'BT.2020（广色域）', value: 'BT.2020' },
  { label: 'DCI-P3', value: 'DCI-P3' }
]
const audioOptions = [
  { label: '直通（保留原始音轨）', value: 'copy' },
  { label: '重采样 AAC 192kbps', value: 'aac192' },
  { label: '移除音轨', value: 'none' }
]

const totalDuration = computed(() =>
  selectedAssets.value.reduce((s, id) => s + (data.assetById(id)?.duration ?? 0), 0)
)

const totalSize = computed(() => selectedAssets.value.reduce((s, id) => s + (data.assetById(id)?.size ?? 0), 0))

const estimated = computed(() => totalDuration.value * (1.6 + pipeline.value.length * 1.55))

const vram = computed(() => 6.4 + pipeline.value.length * 2.6)

const resolvedRes = computed(() => {
  if (targetRes.value === 'source') {
    const first = data.assetById(selectedAssets.value[0])
    return first ? { w: first.width, h: first.height } : { w: 1920, h: 1080 }
  }
  const [w, h] = targetRes.value.split('x').map(Number)
  return { w, h }
})

const previewName = computed(() => {
  const first = data.assetById(selectedAssets.value[0])
  if (!first) return '—'
  const base = first.name.replace(/\.[^.]+$/, '')
  return output.namingRule
    .replace('{name}', base)
    .replace('{res}', resolutionLabel(resolvedRes.value.w, resolvedRes.value.h))
    .replace('{codec}', output.codec.replace(/\s/g, ''))
})

function toggleAsset(id: string) {
  const i = selectedAssets.value.indexOf(id)
  if (i >= 0) selectedAssets.value.splice(i, 1)
  else selectedAssets.value.push(id)
}

function selectedIndex(id: string) {
  return selectedAssets.value.indexOf(id) + 1
}

function toggleCap(id: CapabilityId) {
  const idx = pipeline.value.findIndex((p) => p.capabilityId === id)
  if (idx >= 0) {
    pipeline.value = pipeline.value.filter((p) => p.capabilityId !== id)
    expanded.value = expanded.value.filter((e) => e !== id)
  } else {
    pipeline.value = [...pipeline.value, step(id)]
  }
}

function capIndex(id: CapabilityId) {
  return pipeline.value.findIndex((p) => p.capabilityId === id) + 1
}

function removeStep(id: CapabilityId) {
  pipeline.value = pipeline.value.filter((p) => p.capabilityId !== id)
}

function onDragStart(i: number) {
  dragIndex.value = i
}
function onDrop(i: number) {
  if (dragIndex.value === null || dragIndex.value === i) {
    dragIndex.value = null
    return
  }
  const arr = [...pipeline.value]
  const [moved] = arr.splice(dragIndex.value, 1)
  arr.splice(i, 0, moved)
  pipeline.value = arr
  dragIndex.value = null
}

function toggleExpand(id: CapabilityId) {
  if (expanded.value.includes(id)) expanded.value = expanded.value.filter((e) => e !== id)
  else expanded.value = [...expanded.value, id]
}

function updateParams(id: CapabilityId, params: Record<string, number | string | boolean>) {
  const target = pipeline.value.find((p) => p.capabilityId === id)
  if (target) target.params = params
}

function applyTemplate(tplId: string) {
  const tpl = data.templates.find((t) => t.id === tplId)
  if (!tpl) return
  pipeline.value = tpl.pipeline.map((p) => ({ ...p, params: { ...p.params } }))
  app.toast('success', '已应用模板', `${tpl.name} · ${tpl.pipeline.length} 项能力`)
}

function next() {
  if (stepIndex.value === 1 && !selectedAssets.value.length) {
    app.toast('warning', '请先选择素材', '至少选择一个待处理素材')
    return
  }
  if (stepIndex.value === 2 && !pipeline.value.length) {
    app.toast('warning', '请选择增强能力', '至少选择一项能力才能继续')
    return
  }
  if (stepIndex.value === 5) {
    submit()
    return
  }
  stepIndex.value = Math.min(5, stepIndex.value + 1)
}

function prev() {
  stepIndex.value = Math.max(1, stepIndex.value - 1)
}

function goStep(n: number) {
  if (n < stepIndex.value) stepIndex.value = n
}

function submit() {
  const payloadOutput: TaskOutput = {
    ...output,
    width: resolvedRes.value.w,
    height: resolvedRes.value.h,
    fps: output.fps || data.assetById(selectedAssets.value[0])?.fps || 25
  }
  const created = data.createTask({
    assetIds: selectedAssets.value,
    pipeline: pipeline.value,
    output: payloadOutput,
    templateId: null,
    priority: priority.value
  })
  if (saveAsTemplate.value && templateName.value.trim()) {
    data.addTemplate({
      name: templateName.value.trim(),
      description: `基于 ${pipeline.value.length} 项能力创建的自定义模板`,
      pipeline: pipeline.value,
      avgGain: 0
    })
  }
  app.toast('success', `已创建 ${created.length} 个任务`, `预计 ${estimateText(estimated.value)} 完成，可在任务列表查看进度`)
  router.push('/tasks/list')
}

onMounted(() => {
  const q = route.query.assets
  if (typeof q === 'string' && q) selectedAssets.value = q.split(',').filter(Boolean)
  const tq = route.query.template
  if (typeof tq === 'string' && tq) {
    const tpl = data.templates.find((t) => t.id === tq)
    if (tpl) {
      pipeline.value = tpl.pipeline.map((p) => ({ ...p, params: { ...p.params } }))
      templateName.value = tpl.name
    }
  }
  const first = data.assetById(selectedAssets.value[0])
  if (first) {
    targetRes.value = first.width >= 3840 ? 'source' : '3840x2160'
    output.fps = 0
  }
  expanded.value = pipeline.value.map((p) => p.capabilityId as CapabilityId)
})
</script>

<template>
  <div class="wizard">
    <header class="wz-head">
      <div class="head-left">
        <button class="btn btn-subtle btn-icon" aria-label="返回" @click="router.push('/tasks/list')">
          <ArrowLeft :size="16" />
        </button>
        <div>
          <h1>新建增强任务</h1>
          <div class="head-sub">配置增强流水线并提交到 GPU 队列</div>
        </div>
      </div>
      <div class="stepper">
        <button
          v-for="s in steps"
          :key="s.n"
          class="stp"
          :class="{ on: stepIndex === s.n, done: stepIndex > s.n }"
          :disabled="s.n > stepIndex"
          @click="goStep(s.n)"
        >
          <span class="stp-num">
            <Check v-if="stepIndex > s.n" :size="11" :stroke-width="3" />
            <template v-else>{{ s.n }}</template>
          </span>
          <span class="stp-label">{{ s.label }}</span>
          <i v-if="s.n < 5" class="stp-line" />
        </button>
      </div>
    </header>

    <div class="wz-body">
      <!-- Step 1 -->
      <section v-if="stepIndex === 1" class="step-pane fade-up">
        <div class="pane-head">
          <div>
            <h2>选择待处理素材</h2>
            <p>已选 {{ selectedAssets.length }} 个素材 · 总时长 {{ formatDuration(totalDuration) }} · 合计 {{ formatBytes(totalSize) }}</p>
          </div>
          <div class="pane-ops">
            <button class="btn btn-ghost btn-sm" @click="selectedAssets = assetList.slice(0, 6).map((a) => a.id)">
              选择前 6 个
            </button>
            <button class="btn btn-ghost btn-sm" @click="selectedAssets = []">清空</button>
          </div>
        </div>

        <div class="asset-grid">
          <button
            v-for="a in assetList"
            :key="a.id"
            class="a-card"
            :class="{ picked: selectedAssets.includes(a.id) }"
            @click="toggleAsset(a.id)"
          >
            <div
              class="a-thumb"
              :style="{ background: `linear-gradient(140deg, ${a.thumbnailColor[0]}, ${a.thumbnailColor[1]})` }"
            >
              <span class="a-res">{{ resolutionLabel(a.width, a.height) }}</span>
              <span class="a-dur mono">{{ formatDuration(a.duration) }}</span>
              <span class="a-pick">
                <Check v-if="selectedIndex(a.id)" :size="11" :stroke-width="3" />
              </span>
              <span v-if="selectedIndex(a.id)" class="a-order">{{ selectedIndex(a.id) }}</span>
            </div>
            <div class="a-info">
              <div class="a-name ellipsis">{{ a.name }}</div>
              <div class="a-meta">{{ a.qualityScore }} 分 · {{ a.codec }}</div>
            </div>
          </button>
        </div>
      </section>

      <!-- Step 2 -->
      <section v-else-if="stepIndex === 2" class="step-pane fade-up">
        <div class="pane-head">
          <div>
            <h2>选择增强能力</h2>
            <p>可组合多项能力，执行顺序由下方流水线决定，拖拽可调整</p>
          </div>
          <div class="tpl-bar">
            <span class="tpl-label">模板快选</span>
            <button
              v-for="t in data.templates.slice(0, 4)"
              :key="t.id"
              class="tpl-chip"
              @click="applyTemplate(t.id)"
            >
              {{ t.name.split('（')[0] }}
            </button>
          </div>
        </div>

        <div class="cap-grid">
          <button
            v-for="c in capabilities"
            :key="c.id"
            class="cap-card"
            :class="{ picked: capIndex(c.id) > 0 }"
            @click="toggleCap(c.id)"
          >
            <div class="cap-top">
              <div class="cap-icon"><Sparkles :size="15" /></div>
              <span class="cap-cat">{{ c.category }}</span>
              <span v-if="capIndex(c.id)" class="cap-order">{{ capIndex(c.id) }}</span>
            </div>
            <div class="cap-name">{{ c.name }}</div>
            <div class="cap-desc">{{ c.description }}</div>
            <div class="cap-foot">
              <span>{{ c.modelCount }} 个模型</span>
              <i class="sep" />
              <span>本月 {{ c.monthlyCalls }} 次</span>
            </div>
          </button>
        </div>

        <div v-if="pipeline.length" class="pipeline">
          <div class="pl-head">
            <span class="pl-title"><Layers :size="13" /> 处理流水线</span>
            <span class="pl-hint">按顺序执行 · 共 {{ pipeline.length }} 步</span>
          </div>
          <div class="pl-list">
            <div
              v-for="(p, i) in pipeline"
              :key="p.capabilityId"
              class="pl-item"
              draggable="true"
              :class="{ dragging: dragIndex === i }"
              @dragstart="onDragStart(i)"
              @dragover.prevent
              @drop="onDrop(i)"
            >
              <GripVertical :size="13" class="grip" />
              <span class="pl-num">{{ i + 1 }}</span>
              <span class="pl-name">{{ capabilityMap[p.capabilityId].name }}</span>
              <ArrowRight v-if="i < pipeline.length - 1" :size="12" class="pl-arrow" />
              <button class="pl-del" aria-label="移除" @click.stop="removeStep(p.capabilityId)">
                <Trash2 :size="12" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Step 3 -->
      <section v-else-if="stepIndex === 3" class="step-pane fade-up">
        <div class="pane-head">
          <div>
            <h2>参数配置</h2>
            <p>按需调整各项能力参数，默认值为该场景的推荐配置</p>
          </div>
        </div>

        <div class="acc">
          <div v-for="p in pipeline" :key="p.capabilityId" class="acc-item card" :class="{ open: expanded.includes(p.capabilityId) }">
            <button class="acc-head" @click="toggleExpand(p.capabilityId)">
              <span class="acc-idx">{{ pipeline.findIndex((x) => x.capabilityId === p.capabilityId) + 1 }}</span>
              <span class="acc-name">{{ capabilityMap[p.capabilityId].name }}</span>
              <span class="acc-cat">{{ capabilityMap[p.capabilityId].category }}</span>
              <ChevronDown :size="15" class="acc-chev" />
            </button>
            <div v-if="expanded.includes(p.capabilityId)" class="acc-body">
              <ParamForm
                :capability="capabilityMap[p.capabilityId]"
                :model-value="p.params"
                @update:model-value="(v) => updateParams(p.capabilityId, v)"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- Step 4 -->
      <section v-else-if="stepIndex === 4" class="step-pane fade-up">
        <div class="pane-head">
          <div>
            <h2>输出设置</h2>
            <p>决定成片的分辨率、编码与封装方式</p>
          </div>
        </div>

        <div class="form-grid">
          <div class="field">
            <label class="label">目标分辨率</label>
            <BaseSelect v-model="targetRes" :options="resOptions" />
            <div class="hint">输出 {{ resolvedRes.w }} × {{ resolvedRes.h }}</div>
          </div>
          <div class="field">
            <label class="label">编码器</label>
            <BaseSelect v-model="output.codec" :options="codecOptions" />
            <div class="hint">H.265 在同画质下体积比 H.264 小约 40%</div>
          </div>
          <div class="field">
            <label class="label">码率控制</label>
            <div class="seg wide">
              <button
                v-for="m in ['CBR', 'VBR', 'CRF']"
                :key="m"
                :class="{ on: output.bitrateMode === m }"
                @click="output.bitrateMode = m as 'CBR' | 'VBR' | 'CRF'"
              >
                {{ m }}
              </button>
            </div>
            <div class="hint">CRF 为恒定质量，推荐交付使用</div>
          </div>
          <div class="field">
            <label class="label">{{ output.bitrateMode === 'CRF' ? 'CRF 值' : '目标码率（kbps）' }}</label>
            <input
              v-if="output.bitrateMode !== 'CRF'"
              v-model.number="output.bitrate"
              class="input num"
              type="number"
            />
            <input v-else v-model.number="output.crf" class="input num" type="number" min="12" max="32" />
            <div class="hint">{{ output.bitrateMode === 'CRF' ? '18–22 为高质量区间，数值越小画质越好' : 'VBR 会围绕该值动态浮动' }}</div>
          </div>
          <div class="field">
            <label class="label">封装格式</label>
            <BaseSelect v-model="output.container" :options="containerOptions" />
            <div class="hint">MOV 更适合后期剪辑，MP4 通用性最好</div>
          </div>
          <div class="field">
            <label class="label">输出帧率</label>
            <BaseSelect v-model="output.fps" :options="fpsOptions" />
            <div class="hint">选择插帧能力时建议显式指定 60fps</div>
          </div>
          <div class="field">
            <label class="label">色彩空间</label>
            <BaseSelect v-model="output.colorSpace" :options="colorOptions" />
            <div class="hint">与源素材不一致时会触发色彩转换</div>
          </div>
          <div class="field">
            <label class="label">音频处理</label>
            <BaseSelect v-model="output.audioMode" :options="audioOptions" />
            <div class="hint">插帧任务建议重采样，避免音画不同步</div>
          </div>
          <div class="field span-2">
            <label class="label">输出命名规则</label>
            <input v-model="output.namingRule" class="input" />
            <div class="hint">
              可用变量：<code>{name}</code> <code>{res}</code> <code>{codec}</code> · 预览：<span class="prev mono">{{ previewName }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Step 5 -->
      <section v-else class="step-pane fade-up">
        <div class="pane-head">
          <div>
            <h2>确认并提交</h2>
            <p>请核对以下配置，提交后将进入 GPU 调度队列</p>
          </div>
        </div>

        <div class="confirm-grid">
          <div class="card confirm-card">
            <div class="cc-head"><Film :size="14" /> 素材（{{ selectedAssets.length }}）</div>
            <div class="cc-body">
              <div v-for="id in selectedAssets.slice(0, 6)" :key="id" class="cc-row">
                <span class="ellipsis">{{ data.assetById(id)?.name }}</span>
                <span class="t3 num">{{ formatDuration(data.assetById(id)?.duration ?? 0) }}</span>
              </div>
              <div v-if="selectedAssets.length > 6" class="cc-more">…等 {{ selectedAssets.length }} 个素材</div>
            </div>
          </div>

          <div class="card confirm-card">
            <div class="cc-head"><Layers :size="14" /> 增强流水线（{{ pipeline.length }} 步）</div>
            <div class="cc-body">
              <div v-for="(p, i) in pipeline" :key="p.capabilityId" class="cc-row">
                <span class="row gap-8">
                  <i class="pl-badge">{{ i + 1 }}</i>
                  <span>{{ capabilityMap[p.capabilityId].name }}</span>
                </span>
                <span class="t3 f11">{{ Object.keys(p.params).length }} 项参数</span>
              </div>
            </div>
          </div>

          <div class="card confirm-card">
            <div class="cc-head"><Cpu :size="14" /> 输出设置</div>
            <div class="cc-body">
              <div class="cc-row"><span class="t3">分辨率</span><span class="num">{{ resolvedRes.w }} × {{ resolvedRes.h }}</span></div>
              <div class="cc-row"><span class="t3">编码 / 封装</span><span>{{ output.codec }} · {{ output.container }}</span></div>
              <div class="cc-row">
                <span class="t3">码率</span>
                <span class="num">{{ output.bitrateMode === 'CRF' ? `CRF ${output.crf}` : `${output.bitrate} kbps` }}</span>
              </div>
              <div class="cc-row"><span class="t3">帧率 / 色彩</span><span class="num">{{ output.fps || '跟随源' }} · {{ output.colorSpace }}</span></div>
              <div class="cc-row"><span class="t3">命名预览</span><span class="mono f11 ellipsis">{{ previewName }}</span></div>
            </div>
          </div>

          <div class="card confirm-card">
            <div class="cc-head"><Zap :size="14" /> 资源预估</div>
            <div class="cc-body">
              <div class="cc-row"><span class="t3">预计耗时</span><span class="est">{{ estimateText(estimated) }}</span></div>
              <div class="cc-row"><span class="t3">显存占用</span><span class="num">{{ vram.toFixed(1) }} GB / 24 GB</span></div>
              <div class="cc-row"><span class="t3">执行节点</span><span>NVIDIA A10 24GB</span></div>
              <div class="cc-row"><span class="t3">积分消耗</span><span class="num">{{ Math.ceil((totalDuration / 60) * pipeline.length * 0.8) }} 点</span></div>
            </div>
          </div>
        </div>

        <div class="extras">
          <div class="field">
            <label class="label">任务优先级</label>
            <div class="prio">
              <button :class="{ on: priority === 1 }" @click="priority = 1">
                <b>P1</b><span>优先处理，插队执行</span>
              </button>
              <button :class="{ on: priority === 2 }" @click="priority = 2">
                <b>P2</b><span>普通优先级</span>
              </button>
              <button :class="{ on: priority === 3 }" @click="priority = 3">
                <b>P3</b><span>低优先，空闲时执行</span>
              </button>
            </div>
          </div>
          <div class="tpl-save">
            <BaseSwitch v-model="saveAsTemplate" label="保存为模板" />
            <div class="tpl-save-main">
              <span class="f13">保存为我的模板</span>
              <input
                v-if="saveAsTemplate"
                v-model="templateName"
                class="input"
                placeholder="给模板起个名字，例如：夜间路口车牌方案"
              />
              <span v-else class="f11 t3">勾选后可将当前能力与参数组合保存，下次一键复用</span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <footer class="wz-foot">
      <div class="foot-hint">
        <Clock :size="13" />
        <span v-if="selectedAssets.length">
          预估 {{ estimateText(estimated) }} · {{ pipeline.length }} 项能力 · 显存 {{ vram.toFixed(1) }}GB
        </span>
        <span v-else>请先选择素材</span>
      </div>
      <div class="foot-ops">
        <button class="btn btn-ghost" @click="prev" :disabled="stepIndex === 1">上一步</button>
        <button class="btn btn-primary" @click="next">
          {{ stepIndex === 5 ? '提交任务' : '下一步' }}
          <ArrowRight v-if="stepIndex < 5" :size="14" />
          <Check v-else :size="14" />
        </button>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.wizard {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.wz-head {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  padding: 18px 24px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-app);
}
.head-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
h1 {
  font-size: 17px;
  font-weight: 500;
  color: var(--text-1);
}
.head-sub {
  font-size: 11.5px;
  color: var(--text-3);
  margin-top: 2px;
}
.stepper {
  display: flex;
  align-items: center;
  gap: 0;
  flex: none;
}
.stp {
  display: flex;
  align-items: center;
  gap: 7px;
  padding-right: 26px;
  position: relative;
  color: var(--text-3);
  font-size: 12px;
}
.stp:last-child {
  padding-right: 0;
}
.stp:disabled {
  cursor: default;
}
.stp-num {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid var(--border-strong);
  display: grid;
  place-items: center;
  font-size: 10.5px;
  font-variant-numeric: tabular-nums;
  flex: none;
  transition: all 0.18s;
}
.stp.on {
  color: var(--text-1);
}
.stp.on .stp-num {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
  box-shadow: 0 0 0 3px var(--primary-soft);
}
.stp.done .stp-num {
  background: var(--success-soft);
  border-color: transparent;
  color: var(--success);
}
.stp.done {
  color: var(--text-2);
}
.stp-line {
  position: absolute;
  right: 6px;
  top: 50%;
  width: 14px;
  height: 1px;
  background: var(--border-strong);
}
.wz-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  min-height: 0;
}
.step-pane {
  max-width: 1200px;
  margin: 0 auto;
}
.pane-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}
.pane-head h2 {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-1);
}
.pane-head p {
  font-size: 12.5px;
  color: var(--text-3);
  margin-top: 4px;
}
.pane-ops {
  display: flex;
  gap: 8px;
}
.tpl-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.tpl-label {
  font-size: 11px;
  color: var(--text-3);
  margin-right: 2px;
}
.tpl-chip {
  height: 26px;
  padding: 0 10px;
  border-radius: 6px;
  font-size: 11.5px;
  color: var(--text-2);
  border: 1px solid var(--border);
  background: var(--bg-card);
}
.tpl-chip:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-soft);
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}
.a-card {
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  background: var(--bg-card);
  text-align: left;
  transition: all 0.16s var(--ease);
}
.a-card:hover {
  border-color: var(--border-strong);
  transform: translateY(-2px);
}
.a-card.picked {
  border-color: var(--primary);
  box-shadow: 0 0 0 1px var(--primary);
}
.a-thumb {
  aspect-ratio: 16 / 9;
  position: relative;
}
.a-res,
.a-dur {
  position: absolute;
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 3px;
  background: rgba(6, 9, 15, 0.55);
  color: rgba(255, 255, 255, 0.9);
}
.a-res {
  top: 7px;
  left: 7px;
}
.a-dur {
  bottom: 7px;
  right: 7px;
}
.a-pick {
  position: absolute;
  top: 7px;
  right: 7px;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  display: grid;
  place-items: center;
  color: #fff;
}
.picked .a-pick {
  background: var(--primary);
  border-color: var(--primary);
}
.a-order {
  position: absolute;
  bottom: 7px;
  left: 7px;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background: var(--primary);
  color: #fff;
  font-size: 9.5px;
  display: grid;
  place-items: center;
  font-weight: 600;
}
.a-info {
  padding: 9px 10px 10px;
}
.a-name {
  font-size: 12px;
  color: var(--text-1);
}
.a-meta {
  font-size: 10px;
  color: var(--text-3);
  margin-top: 3px;
}

.cap-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(268px, 1fr));
  gap: 12px;
}
.cap-card {
  text-align: left;
  padding: 14px 16px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-card);
  transition: all 0.16s var(--ease);
  position: relative;
}
.cap-card:hover {
  border-color: var(--border-strong);
  transform: translateY(-2px);
}
.cap-card.picked {
  border-color: var(--primary);
  background: linear-gradient(160deg, var(--primary-soft), var(--bg-card) 60%);
}
.cap-top {
  display: flex;
  align-items: center;
  gap: 8px;
}
.cap-icon {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  background: var(--bg-inset);
  color: var(--primary);
  display: grid;
  place-items: center;
  flex: none;
}
.cap-cat {
  font-size: 10px;
  color: var(--text-3);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 0 5px;
  line-height: 16px;
}
.cap-order {
  margin-left: auto;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  font-size: 10px;
  display: grid;
  place-items: center;
  font-weight: 600;
}
.cap-name {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text-1);
  margin-top: 10px;
}
.cap-desc {
  font-size: 11.5px;
  color: var(--text-3);
  line-height: 1.6;
  margin-top: 5px;
  min-height: 36px;
}
.cap-foot {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 10px;
  color: var(--text-3);
  margin-top: 10px;
  padding-top: 9px;
  border-top: 1px solid var(--border-subtle);
}
.sep {
  width: 1px;
  height: 8px;
  background: var(--border-strong);
}
.pipeline {
  margin-top: 20px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-card);
  overflow: hidden;
}
.pl-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-subtle);
}
.pl-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-1);
  font-weight: 500;
}
.pl-hint {
  font-size: 10.5px;
  color: var(--text-3);
}
.pl-list {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 14px;
  overflow-x: auto;
  flex-wrap: wrap;
}
.pl-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px 5px 5px;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: var(--bg-inset);
  cursor: grab;
  font-size: 11.5px;
  color: var(--text-2);
  transition: border-color 0.14s;
}
.pl-item:hover {
  border-color: var(--border-strong);
}
.pl-item.dragging {
  opacity: 0.4;
}
.grip {
  color: var(--text-3);
  cursor: grab;
}
.pl-num {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 9.5px;
  display: grid;
  place-items: center;
  font-weight: 600;
}
.pl-name {
  color: var(--text-1);
}
.pl-arrow {
  color: var(--text-3);
  margin-left: 2px;
}
.pl-del {
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  border-radius: 4px;
  color: var(--text-3);
}
.pl-del:hover {
  background: var(--danger-soft);
  color: var(--danger);
}

.acc {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.acc-item {
  overflow: hidden;
}
.acc-head {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 16px;
  text-align: left;
}
.acc-idx {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 10px;
  display: grid;
  place-items: center;
  font-weight: 600;
  flex: none;
}
.acc-name {
  font-size: 13px;
  color: var(--text-1);
  font-weight: 500;
}
.acc-cat {
  font-size: 10px;
  color: var(--text-3);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 0 5px;
  line-height: 15px;
}
.acc-chev {
  margin-left: auto;
  color: var(--text-3);
  transition: transform 0.18s;
}
.acc-item.open .acc-chev {
  transform: rotate(180deg);
}
.acc-body {
  padding: 4px 16px 18px;
  border-top: 1px solid var(--border-subtle);
  padding-top: 18px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px 28px;
  max-width: 880px;
}
.field {
  min-width: 0;
}
.span-2 {
  grid-column: span 2;
}
.hint {
  margin-top: 7px;
  font-size: 10.5px;
  color: var(--text-3);
  line-height: 1.5;
}
.hint code {
  font-family: var(--font-mono);
  background: var(--bg-inset);
  border: 1px solid var(--border);
  border-radius: 3px;
  padding: 0 4px;
  font-size: 10px;
}
.prev {
  color: var(--primary);
}
.seg {
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  background: var(--bg-inset);
  border: 1px solid var(--border);
  border-radius: 8px;
}
.seg.wide {
  display: flex;
}
.seg.wide button {
  flex: 1;
}
.seg button {
  height: 28px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 12px;
  color: var(--text-2);
}
.seg button.on {
  background: var(--bg-card);
  color: var(--text-1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.confirm-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.confirm-card {
  overflow: hidden;
}
.cc-head {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 11px 14px;
  font-size: 12px;
  color: var(--text-1);
  font-weight: 500;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-panel);
}
.cc-body {
  padding: 8px 14px 12px;
}
.cc-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 6px 0;
  font-size: 11.5px;
  color: var(--text-1);
  border-bottom: 1px dashed var(--border-subtle);
}
.cc-row:last-child {
  border-bottom: none;
}
.cc-more {
  font-size: 10.5px;
  color: var(--text-3);
  padding-top: 6px;
}
.pl-badge {
  width: 15px;
  height: 15px;
  border-radius: 4px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 9px;
  display: grid;
  place-items: center;
  font-style: normal;
  font-weight: 600;
}
.est {
  color: var(--primary);
  font-weight: 500;
}

.extras {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.prio {
  display: flex;
  gap: 10px;
}
.prio button {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  padding: 11px 14px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--bg-card);
  text-align: left;
  transition: all 0.14s;
  max-width: 240px;
}
.prio button:hover {
  border-color: var(--border-strong);
}
.prio button.on {
  border-color: var(--primary);
  background: var(--primary-soft);
}
.prio b {
  font-size: 12.5px;
  color: var(--text-1);
  font-weight: 500;
}
.prio span {
  font-size: 10.5px;
  color: var(--text-3);
}
.tpl-save {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-card);
}
.tpl-save-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.tpl-save-main .f13 {
  color: var(--text-1);
}

.wz-foot {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  border-top: 1px solid var(--border);
  background: var(--bg-sidebar);
}
.foot-hint {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 11.5px;
  color: var(--text-3);
}
.foot-ops {
  display: flex;
  gap: 10px;
}
@media (max-width: 1180px) {
  .stepper {
    display: none;
  }
  .confirm-grid,
  .form-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .span-2 {
    grid-column: auto;
  }
}
</style>
