import { create } from 'zustand'
import { nanoid } from 'nanoid'
import dayjs from 'dayjs'
import type { ChatMessage, ExecResult, ParsedIntent } from '@/types'
import { resolve } from '@/mock/intent'
import { useDataStore } from './dataStore'

const stamp = () => dayjs().format('YYYY-MM-DDTHH:mm:ssZ')

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    '交互引擎已就绪。你可以直接说需求，例如「启动晨间迎宾」「把多功能厅温度调到 24 度」「关闭所有投影」。涉及多台设备或应急场景时，我会先请你确认。',
  createdAt: stamp(),
}

interface InteractionState {
  messages: ChatMessage[]
  thinking: boolean
  voiceState: 'idle' | 'listening' | 'recognizing' | 'streaming'
  streamText: string
  lastIntent: ParsedIntent | null
  setVoiceState: (s: InteractionState['voiceState']) => void
  setStreamText: (t: string) => void
  send: (text: string, mode?: ChatMessage['inputMode']) => void
  confirm: (msgId: string) => void
  cancelConfirm: (msgId: string) => void
  undo: (msgId: string) => void
  clear: () => void
}

function execFor(action: ReturnType<typeof resolve>['action']): ExecResult | null {
  const data = useDataStore.getState()
  if (action.kind === 'scene') {
    return data.runScene(action.sceneId)
  }
  if (action.kind === 'batchPower') {
    data.batchPower(action.ids, action.power)
    return {
      status: 'success',
      title: action.power ? '设备已开启' : '设备已关闭',
      devices: action.ids.length,
      cost: 1200 + action.ids.length * 180,
      undoable: true,
    }
  }
  if (action.kind === 'setValue') {
    data.setDeviceValue(action.deviceId, action.value)
    return { status: 'success', title: action.label, devices: 1, cost: 860, undoable: true }
  }
  if (action.kind === 'adjust') {
    const dev = data.db.devices.find((d) => d.id === action.deviceId)
    const next = Math.max(0, Math.min(100, (dev?.value ?? 50) + action.delta))
    data.setDeviceValue(action.deviceId, next)
    return { status: 'success', title: `${dev?.name ?? '设备'} ${action.label}`, devices: 1, cost: 720, undoable: true }
  }
  return null
}

export const useInteractionStore = create<InteractionState>((set, get) => ({
  messages: [WELCOME],
  thinking: false,
  voiceState: 'idle',
  streamText: '',
  lastIntent: null,
  setVoiceState: (s) => set({ voiceState: s }),
  setStreamText: (t) => set({ streamText: t }),

  send: (text, mode = 'text') => {
    const value = text.trim()
    if (!value) return
    const userMsg: ChatMessage = {
      id: nanoid(8),
      role: 'user',
      content: value,
      createdAt: stamp(),
      inputMode: mode,
    }
    set({ messages: [...get().messages, userMsg], thinking: true })
    const db = useDataStore.getState().db

    window.setTimeout(() => {
      const { intent, action, needConfirm } = resolve(value, db)
      const msg: ChatMessage = {
        id: nanoid(8),
        role: 'assistant',
        content: '',
        createdAt: stamp(),
        intent,
      }

      if (action.kind === 'unknown') {
        msg.content = '没有识别到可执行的动作。你可以试试：启动晨间迎宾 / 关闭所有投影 / 查看当前告警 / 帮我建个工单。'
      } else if (needConfirm && action.kind === 'scene') {
        msg.content = `「${action.sceneName}」将影响 ${action.devices} 台设备${action.highRisk ? '，且属于高风险场景' : ''}。请确认后执行，10 秒内未确认将自动取消。`
        msg.needConfirm = {
          sceneId: action.sceneId,
          sceneName: action.sceneName,
          devices: action.devices,
          expireAt: Date.now() + 10000,
        }
      } else if (needConfirm && action.kind === 'batchPower') {
        msg.content = `该指令将${action.power ? '开启' : '关闭'} ${action.ids.length} 台设备，影响范围较大。请确认后执行。`
        msg.needConfirm = {
          sceneId: `batch:${action.ids.join(',')}:${action.power}`,
          sceneName: action.label,
          devices: action.ids.length,
          expireAt: Date.now() + 10000,
        }
      } else if (action.kind === 'ticket') {
        msg.content = '已为你打开工单创建向导，请选择服务类型并填写问题描述。'
        msg.card = { type: 'ticket', payload: null }
      } else if (action.kind === 'mute') {
        msg.content = '已静音全局语音播报，设置可在「系统设置 → 交互」中恢复。'
        msg.exec = { status: 'success', title: '播报已静音', devices: 0, cost: 220, undoable: false }
      } else if (action.kind === 'query') {
        const data = useDataStore.getState().db
        if (action.card === 'alertSummary') {
          const list = data.alerts.filter((a) => a.status !== 'closed' && a.status !== 'recovered').slice(0, 3)
          msg.content = `当前共有 ${data.alerts.filter((a) => a.status !== 'closed' && a.status !== 'recovered').length} 条未闭环告警，其中 P1 级 ${data.alerts.filter((a) => a.level === 'P1' && a.status !== 'closed' && a.status !== 'recovered').length} 条。以下是最近三条：`
          msg.card = { type: 'alertSummary', payload: list }
        } else if (action.card === 'deviceList') {
          msg.content = `已按你的条件检索到 ${data.devices.length} 台设备，以下是需要关注的部分：`
          msg.card = {
            type: 'deviceList',
            payload: [...data.devices].sort((a, b) => a.health - b.health).slice(0, 5),
          }
        } else {
          const total = data.commands.length
          const scenes = data.scenes.reduce((s, x) => s + x.usedCount, 0)
          msg.content = `近 7 天共记录 ${total} 条交互指令，场景累计执行 ${scenes} 次，任务完成率 94.6%。`
          msg.card = {
            type: 'stat',
            payload: {
              total,
              scenes,
              done: 34,
              rate: '94.6%',
            },
          }
        }
      } else {
        const result = execFor(action)
        msg.content = result ? `${result.title}。` : '指令已提交。'
        if (result) msg.exec = result
      }

      set({ messages: [...get().messages, msg], thinking: false, lastIntent: intent })
    }, 720)
  },

  confirm: (msgId) => {
    const msg = get().messages.find((m) => m.id === msgId)
    if (!msg?.needConfirm) return
    const { sceneId, sceneName, devices } = msg.needConfirm
    let result: ExecResult
    if (sceneId.startsWith('batch:')) {
      const [, ids, power] = sceneId.split(':')
      const list = ids.split(',')
      useDataStore.getState().batchPower(list, power === 'true')
      result = {
        status: 'success',
        title: power === 'true' ? '设备已开启' : '设备已关闭',
        devices: list.length,
        cost: 1400 + list.length * 160,
        undoable: true,
      }
    } else {
      result = useDataStore.getState().runScene(sceneId)
    }
    const ack: ChatMessage = {
      id: nanoid(8),
      role: 'assistant',
      content: result.status === 'success' ? '执行完成。' : result.status === 'partial' ? '部分设备未响应，其余已完成。' : '执行失败，请查看失败项。',
      createdAt: stamp(),
      exec: result,
    }
    set({
      messages: get().messages.map((m) => (m.id === msgId ? { ...m, needConfirm: undefined } : m)).concat(ack),
    })
    if (!result.sceneId) {
      const d = useDataStore.getState()
      d.addAudit('确认执行指令', sceneName, 'scene', { devices })
    }
  },

  cancelConfirm: (msgId) => {
    const ack: ChatMessage = {
      id: nanoid(8),
      role: 'assistant',
      content: '已取消本次执行，设备状态未发生变化。',
      createdAt: stamp(),
    }
    set({
      messages: get().messages
        .map((m) => (m.id === msgId ? { ...m, needConfirm: undefined } : m))
        .concat(ack),
    })
  },

  undo: (msgId) => {
    set({
      messages: get().messages.map((m) =>
        m.id === msgId && m.exec ? { ...m, exec: { ...m.exec, undoable: false, status: 'success' } } : m,
      ),
    })
  },

  clear: () => set({ messages: [WELCOME], lastIntent: null, streamText: '' }),
}))
