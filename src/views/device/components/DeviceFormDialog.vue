<script setup lang="ts">
/**
 * 设备新增 / 编辑弹窗
 * 校验规则与 Mock 层保持一致（SN 唯一、格式校验由后端二次兜底）
 */
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { deviceApi, storageApi } from '@/api'
import { DEVICE_CATEGORY_OPTIONS, PROTOCOL_OPTIONS, VENDOR_OPTIONS } from '@/utils/dict'
import type { Device, DeviceGroup } from '@/types'

interface Props {
  modelValue: boolean
  editing?: Device | null
  tenants: any[]
  groups: DeviceGroup[]
}

const props = withDefaults(defineProps<Props>(), { editing: null })
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'saved'): void }>()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const formRef = ref<FormInstance>()
const submitting = ref(false)
const pools = ref<any[]>([])

const RESOLUTIONS = ['1920×1080', '2560×1440', '3840×2160', '1280×720', '704×576']
const CODECS = ['H.265', 'H.264', 'MJPEG', 'SVAC 2.0']
const TAG_POOL = ['重点监控', '高清', '室外', '防爆', '待验收', '临期维保', '出入口', '周界']

const emptyForm = () => ({
  name: '',
  sn: '',
  vendor: '海康威视',
  model: '',
  category: '枪型摄像机',
  protocol: 'GB/T 28181-2016',
  ip: '10.20.30.100',
  port: 8000,
  mac: '',
  firmware: 'V6.1.0',
  hardwareVersion: 'HW-B2',
  tenantId: '',
  groupId: '',
  channelCount: 1,
  onlineStatus: 'pending',
  resolution: '1920×1080',
  codec: 'H.265',
  bitrateKbps: 4096,
  frameRate: 25,
  healthScore: 85,
  installAddress: '',
  province: '',
  city: '',
  district: '',
  longitude: 120.155,
  latitude: 30.274,
  installDate: new Date().toISOString().slice(0, 10),
  warrantyEndDate: new Date(Date.now() + 3 * 365 * 86400000).toISOString().slice(0, 10),
  storagePoolId: '',
  tags: [] as string[],
  remark: ''
})

const form = reactive<any>(emptyForm())

const rules: FormRules = {
  name: [
    { required: true, message: '请输入设备名称', trigger: 'blur' },
    { min: 2, max: 40, message: '长度在 2 到 40 个字符', trigger: 'blur' }
  ],
  sn: [
    { required: true, message: '请输入设备序列号', trigger: 'blur' },
    { pattern: /^[A-Za-z0-9-]{6,32}$/, message: '仅允许字母、数字与短横线，长度 6-32 位', trigger: 'blur' }
  ],
  vendor: [{ required: true, message: '请选择厂商', trigger: 'change' }],
  model: [{ required: true, message: '请输入设备型号', trigger: 'blur' }],
  category: [{ required: true, message: '请选择设备类型', trigger: 'change' }],
  protocol: [{ required: true, message: '请选择接入协议', trigger: 'change' }],
  ip: [
    { required: true, message: '请输入设备 IP', trigger: 'blur' },
    { pattern: /^(\d{1,3}\.){3}\d{1,3}$/, message: 'IP 地址格式不正确', trigger: 'blur' }
  ],
  port: [{ required: true, message: '请输入端口', trigger: 'blur' }],
  tenantId: [{ required: true, message: '请选择所属租户', trigger: 'change' }],
  channelCount: [{ required: true, message: '请输入通道数', trigger: 'blur' }],
  longitude: [{ required: true, message: '请输入经度', trigger: 'blur' }],
  latitude: [{ required: true, message: '请输入纬度', trigger: 'blur' }]
}

const groupOptions = computed(() => {
  const out: { label: string; value: string }[] = []
  const walk = (nodes: DeviceGroup[], prefix = '') => {
    nodes.forEach((n) => {
      out.push({ label: prefix + n.name, value: n.id })
      if (n.children?.length) walk(n.children, `${prefix}${n.name} / `)
    })
  }
  walk(props.groups || [])
  return out
})

watch(
  () => props.modelValue,
  async (v) => {
    if (!v) return
    const res = await storageApi.pools({ page: 1, pageSize: 100 }).catch(() => ({ list: [] as any[] }))
    pools.value = (res as any).list || []
    Object.assign(form, emptyForm())
    if (props.editing) Object.assign(form, JSON.parse(JSON.stringify(props.editing)))
    formRef.value?.clearValidate()
  }
)

async function submit() {
  const ok = await formRef.value?.validate().catch(() => false)
  if (!ok) return
  submitting.value = true
  try {
    const payload = { ...form }
    if (props.editing) {
      await deviceApi.update(props.editing.id, payload)
      ElMessage.success(`设备「${payload.name}」已更新`)
    } else {
      await deviceApi.create(payload)
      ElMessage.success(`设备「${payload.name}」已录入，通道已自动创建`)
    }
    emit('saved')
  } catch {
    /* 错误提示由请求层统一处理 */
  } finally {
    submitting.value = false
  }
}

function fillSnByRule() {
  const seq = String(Math.floor(Math.random() * 99999)).padStart(5, '0')
  const prefix = form.vendor === '海康威视' ? 'HK' : form.vendor === '大华股份' ? 'DH' : form.vendor === '宇视科技' ? 'UNV' : 'DEV'
  form.sn = `${prefix}-${new Date().getFullYear()}-${seq}`
  if (!form.mac) {
    form.mac = Array.from({ length: 6 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()).join(':')
  }
}
</script>

<template>
  <el-dialog v-model="visible" :title="editing ? '编辑设备' : '新增设备'" width="880px" top="6vh" destroy-on-close>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
      <el-divider content-position="left">基本信息</el-divider>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="设备名称" prop="name">
            <el-input v-model="form.name" placeholder="如：杭西-园区南门-03" maxlength="40" show-word-limit />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="序列号" prop="sn">
            <el-input v-model="form.sn" placeholder="如：HK-2026-01983" class="vc-mono">
              <template #append>
                <el-button @click="fillSnByRule">按规则生成</el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="厂商" prop="vendor">
            <el-select v-model="form.vendor" style="width: 100%">
              <el-option v-for="v in VENDOR_OPTIONS" :key="v.value" :label="v.label" :value="v.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="型号" prop="model">
            <el-input v-model="form.model" placeholder="如：DS-2CD3T46WDV3-I3" class="vc-mono" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="设备类型" prop="category">
            <el-select v-model="form.category" style="width: 100%">
              <el-option v-for="c in DEVICE_CATEGORY_OPTIONS" :key="c.value" :label="c.label" :value="c.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="接入协议" prop="protocol">
            <el-select v-model="form.protocol" style="width: 100%">
              <el-option v-for="p in PROTOCOL_OPTIONS" :key="p.value" :label="p.label" :value="p.value" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">接入参数</el-divider>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="IP 地址" prop="ip">
            <el-input v-model="form.ip" class="vc-mono" />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="端口" prop="port">
            <el-input-number v-model="form.port" :min="1" :max="65535" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="通道数" prop="channelCount">
            <el-input-number v-model="form.channelCount" :min="1" :max="128" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="MAC 地址">
            <el-input v-model="form.mac" placeholder="如：3C:2A:F4:1B:77:0D" class="vc-mono" />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="固件版本">
            <el-input v-model="form.firmware" class="vc-mono" />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="在线状态">
            <el-select v-model="form.onlineStatus" style="width: 100%">
              <el-option label="待接入" value="pending" />
              <el-option label="在线" value="online" />
              <el-option label="离线" value="offline" />
              <el-option label="未知" value="unknown" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">视频参数</el-divider>
      <el-row :gutter="16">
        <el-col :span="6">
          <el-form-item label="分辨率">
            <el-select v-model="form.resolution" style="width: 100%">
              <el-option v-for="r in RESOLUTIONS" :key="r" :label="r" :value="r" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="编码格式">
            <el-select v-model="form.codec" style="width: 100%">
              <el-option v-for="c in CODECS" :key="c" :label="c" :value="c" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="码率(Kbps)">
            <el-input-number v-model="form.bitrateKbps" :min="128" :max="32768" :step="512" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="帧率">
            <el-input-number v-model="form.frameRate" :min="1" :max="60" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">归属与安装</el-divider>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="所属租户" prop="tenantId">
            <el-select v-model="form.tenantId" filterable placeholder="请选择租户" style="width: 100%">
              <el-option v-for="t in tenants" :key="t.id" :label="`${t.name}（${t.code}）`" :value="t.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="设备分组">
            <el-select v-model="form.groupId" clearable placeholder="请选择分组" style="width: 100%">
              <el-option v-for="g in groupOptions" :key="g.value" :label="g.label" :value="g.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="安装地址">
            <el-input v-model="form.installAddress" placeholder="如：杭州市西湖区文三路 100 号园区南门立杆" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="省份">
            <el-input v-model="form.province" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="城市">
            <el-input v-model="form.city" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="区县">
            <el-input v-model="form.district" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="经度" prop="longitude">
            <el-input-number v-model="form.longitude" :precision="6" :step="0.0001" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="纬度" prop="latitude">
            <el-input-number v-model="form.latitude" :precision="6" :step="0.0001" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="安装日期">
            <el-date-picker v-model="form.installDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="质保到期">
            <el-date-picker v-model="form.warrantyEndDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="存储池">
            <el-select v-model="form.storagePoolId" clearable placeholder="默认按租户策略分配" style="width: 100%">
              <el-option v-for="p in pools" :key="p.id" :label="`${p.name}（已用 ${p.usageRate}%）`" :value="p.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="标签">
            <el-select v-model="form.tags" multiple allow-create filterable default-first-option placeholder="选择或输入标签" style="width: 100%">
              <el-option v-for="t in TAG_POOL" :key="t" :label="t" :value="t" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="备注">
            <el-input v-model="form.remark" type="textarea" :rows="2" maxlength="200" show-word-limit />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">{{ editing ? '保存修改' : '确认录入' }}</el-button>
    </template>
  </el-dialog>
</template>
