import { useState } from 'react'
import { CornerDownLeft, Sparkles } from 'lucide-react'
import { useUI } from '../../store/ui'
import { Drawer } from '../ui'

interface Msg {
  id: string
  role: 'user' | 'assistant'
  text: string
}

const SUGGESTIONS = ['响度不达标怎么处理？', '为什么会出现冻帧？', '帮我总结这份检测报告', '介绍一下技术支持服务']

function answer(q: string): string {
  const s = q.toLowerCase()
  if (s.includes('响度') || s.includes('lufs') || s.includes('lkfs')) {
    return '响度类问题对应缺陷 A-LVL，判定口径为 ITU-R BS.1770 积分响度。\n\n• 广电播出：-24 LKFS ±2，真峰值 ≤ -1 dBTP\n• 流媒体：-14 LUFS ±1\n\n推荐算法链：ALG-14 响度归一化（线性增益优先，动态不足时切限幅）→ 二次校验至 ±1 LKFS。\n若原片动态范围小于 6 LU，建议先做轻度多段压缩再归一化，否则会出现"压死"的听感。'
  }
  if (s.includes('冻帧') || s.includes('卡住')) {
    return '冻帧（V-FRZ）通常来自采集端丢包、转码帧缓存异常或磁带复制中断。\n\n判定：连续相同帧 ≥12 帧（25p 下约 480ms）。\n修复：ALG-01 光流插帧，双向运动估计；场景切换处必须强制断点，否则会产生拖影。\n注意：超过 2 秒的冻帧建议人工确认，插帧结果可能不自然。'
  }
  if (s.includes('同步') || s.includes('口型') || s.includes('音画')) {
    return '音画不同步（V-SYN）判定阈值为 |offset| > 80ms。\n\n本例检测到 +120ms（音频滞后），属于恒定偏移，来自推流缓冲累积。\n处理：ALG-17 音画对齐，整体时移 120ms，不做时间拉伸以保持音调。\n复检标准：偏差 ≤ 40ms 视为通过。'
  }
  if (s.includes('报告') || s.includes('总结')) {
    return '当前待签署报告共 3 份，其中 1 份含致命缺陷（等级 C，禁止直接交付）。\n\n整体情况：近 30 天检测 18 个任务，平均评分 79.6；缺陷以底噪（A-NOI）与块效应（V-MOS）为主，占 41%。\n建议：对《澜沧江》系列统一做一次响度归一化，可一次性消除 5 条 A-LVL 缺陷。'
  }
  if (s.includes('服务') || s.includes('报价') || s.includes('价格')) {
    return '技术服务共 6 个服务包：标准质检 ¥3.5/分钟、深度修复 ¥8/分钟、响度合规整改 ¥120/条、老片修复 ¥30/分钟、批量转码 ¥0.8/分钟、驻场 ¥2000/人日。\n\n报价 = 时长 × 单价 × 难度系数（1.0 / 1.3 / 1.6）× 加急系数（1.0 / 1.5 / 2.0）+ 增值项，最低 ¥800，含税 6%。\n例：96 分钟 4K 老片修复 = 96 × 30 × 1.3 = ¥3,744，含税 ¥3,969。'
  }
  if (s.includes('底噪') || s.includes('噪声')) {
    return '底噪（A-NOI）判定：噪声底高于 -50 dBFS。\n\n本批素材实测 -36 dBFS，主要成分是空调低频与话筒本底噪声。\n修复：ALG-10 深度降噪，降噪量 14dB，齿音保护开启，残留底噪整形到 -56 dBFS。\n经验：降噪量超过 18dB 容易产生"水下音"，建议配合轻度存在感提升。'
  }
  return '我检索了缺陷目录与历史案例，可以从三个方向回答：\n\n1. 缺陷判定口径与阈值（27 类，含编码、单位、默认阈值）\n2. 推荐修复算法链与参数建议\n3. 交付规范与报价口径\n\n你可以直接问某个缺陷名称，例如"A-HUM 交流哼声怎么修"。'
}

export function AssistantDrawer() {
  const { setAssistantOpen } = useUI()
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: 'm0',
      role: 'assistant',
      text: '我是平台内的修复助手，基于缺陷目录、算法库与历史案例作答。可以问我某个缺陷怎么判定、怎么修，或者让我总结某份报告。',
    },
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)

  const send = (text: string) => {
    const value = text.trim()
    if (!value) return
    setMessages((m) => [...m, { id: `u${Date.now()}`, role: 'user', text: value }])
    setInput('')
    setTyping(true)
    window.setTimeout(() => {
      setMessages((m) => [...m, { id: `a${Date.now()}`, role: 'assistant', text: answer(value) }])
      setTyping(false)
    }, 620)
  }

  return (
    <Drawer
      open
      onClose={() => setAssistantOpen(false)}
      title={
        <span className="flex items-center gap-1.5">
          <Sparkles size={14} className="text-[var(--purple)]" />
          修复助手
        </span>
      }
      desc="基于缺陷目录与算法库的规则化回答（演示数据）"
      width={520}
      footer={
        <div>
          <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send(input)}
              placeholder="输入问题，回车发送…"
              className="h-9 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[var(--text-3)]"
            />
            <button onClick={() => send(input)} className="rounded p-1 text-[var(--text-3)] hover:text-[var(--primary)]">
              <CornerDownLeft size={14} />
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--text-3)] hover:border-[var(--border-str)] hover:text-[var(--text-2)]"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div
              className={
                m.role === 'user'
                  ? 'max-w-[86%] rounded-xl rounded-br-sm bg-[var(--primary-10)] px-3 py-2 text-[13px] leading-6 text-[var(--text-1)]'
                  : 'max-w-[92%] rounded-xl rounded-bl-sm border border-[var(--border)] bg-[var(--bg-2)] px-3 py-2.5 text-[13px] leading-6 whitespace-pre-wrap text-[var(--text-2)]'
              }
            >
              {m.text}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-2)] px-3 py-2.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--text-3)]"
                style={{ animationDelay: `${i * 120}ms` }}
              />
            ))}
          </div>
        )}
      </div>
    </Drawer>
  )
}
