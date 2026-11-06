const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const root = __dirname + '/..';
const file = 'file://' + path.resolve(root, 'dist/mediaforge.html');

const routes = [
  ['/assets', ['媒体资产', 'asset-card']],
  ['/assets/ast_0012', ['转写文本', '元信息']],
  ['/upload', ['上传中心', '上传队列']],
  ['/tools', ['智能工具集', '语音转写']],
  ['/tools/asr', ['转写参数', '热词表']],
  ['/tools/subtitle/ast_0012', ['字幕工坊', '字幕列表']],
  ['/tools/enhance', ['画质增强', '前后对比']],
  ['/tools/audio', ['音频处理', '处理链']],
  ['/tools/tts', ['语音合成', '音色库']],
  ['/tools/translate', ['多语译配', '逐句对照']],
  ['/tools/review', ['内容审核', '风险时间轴']],
  ['/tools/insight', ['智能理解', '开始分析']],
  ['/pipelines', ['流水线', '节点']],
  ['/pipelines/pl_01', ['节点库', '节点属性']],
  ['/tasks', ['任务中心', '队列概览']],
  ['/tasks/tsk_20261019_0001', ['任务', '参数快照']],
  ['/templates', ['模板市场', '短视频']],
  ['/usage', ['用量与计费', '用量明细']],
  ['/developer', ['API 与技术服务', '调用']],
  ['/team', ['团队与权限', '成员']],
  ['/settings', ['系统设置', '通用']],
  ['/audit', ['审计日志', '操作人']],
];

let pass = 0;
const fails = [];

routes.forEach(([route, sigs], i) => {
  const dir = path.join(root, `.rt${i}`);
  let dom = '';
  try {
    dom = execFileSync(
      CHROME,
      ['--headless=new', '--disable-gpu', '--no-sandbox', `--user-data-dir=${dir}`, '--virtual-time-budget=5000', '--dump-dom', file + '#' + route],
      { encoding: 'utf8', maxBuffer: 40 * 1024 * 1024, timeout: 45000, stdio: ['ignore', 'pipe', 'ignore'] },
    );
  } catch (e) {
    dom = (e.stdout || '').toString();
  }
  const ok = dom.length > 0 && sigs.every((s) => dom.includes(s));
  if (ok) {
    pass++;
    console.log(`PASS ${route}`);
  } else {
    fails.push(route);
    console.log(`FAIL ${route} (len=${dom.length}, ${sigs.map((s) => `${s}:${dom.includes(s)}`).join(',')})`);
  }
});

console.log(`\n${pass}/${routes.length} 通过`);
if (fails.length) console.log('失败路由：', fails.join(', '));
