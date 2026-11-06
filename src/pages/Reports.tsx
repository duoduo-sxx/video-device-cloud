import { useEffect, useState } from 'react';
import { Button, Checkbox, Input, Modal, Select, Steps, Tag, message } from 'antd';
import { FileTextOutlined, PrinterOutlined } from '@ant-design/icons';
import { reportService } from '../services';
import type { Report } from '../types/models';
import { REPORT_STATUS_LABEL, REPORT_TYPE_LABEL } from '../constants/dict';
import { PageHeader, Panel, StatusTag } from '../components/ui';
import { fmtDate } from '../utils/format';

const SECTIONS = ['概述', '标定依据', '标定设备与环境', '标定方案与步骤', '标定数据与曲线', '参数解算结果', '结论', '附录'];

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [wizard, setWizard] = useState(false);
  const [step, setStep] = useState(0);
  const [sections, setSections] = useState<string[]>(SECTIONS.slice(0, 7));
  const [creator, setCreator] = useState('张启明');

  useEffect(() => {
    reportService.list().then((list) => {
      setReports(list);
      setSelectedId(list[0]?.id);
    });
  }, []);

  const report = reports.find((r) => r.id === selectedId);

  const createReport = () => {
    if (!report) return;
    const created: Report = {
      id: `RP-${reports.length + 1}`,
      code: `RPT-CAL-2026-${String(300 + reports.length).padStart(4, '0')}`,
      type: 'CALIBRATION',
      title: `${report.deviceCode} 标定报告`,
      deviceId: report.deviceId,
      deviceCode: report.deviceCode,
      taskId: report.taskId,
      status: 'DRAFT',
      createdBy: creator,
      createdAt: '2026-10-19 10:27:26',
      sections,
    };
    setReports([created, ...reports]);
    setSelectedId(created.id);
    setWizard(false);
    setStep(0);
    message.success(`报告 ${created.code} 已生成草稿`);
  };

  return (
    <div className="page">
      <PageHeader
        title="报告中心"
        description="标定报告、性能测试报告与月度运行报告的生成、审核与归档"
        extra={
          <>
            <Button icon={<PrinterOutlined />} onClick={() => window.print()}>打印 / 导出 PDF</Button>
            <Button type="primary" icon={<FileTextOutlined />} onClick={() => setWizard(true)}>生成报告</Button>
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16, alignItems: 'start' }}>
        <Panel title="报告列表" sub={`${reports.length} 份`}>
          <div style={{ maxHeight: 620, overflow: 'auto' }}>
            {reports.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                style={{
                  padding: '10px 10px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: item.id === selectedId ? '#f0f8ff' : undefined,
                  borderBottom: '1px solid #f5f7fa',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span className="small mono muted">{item.code}</span>
                  <StatusTag
                    text={REPORT_STATUS_LABEL[item.status]}
                    color={item.status === 'ARCHIVED' ? 'success' : item.status === 'REVIEWING' ? 'warning' : 'default'}
                  />
                </div>
                <div style={{ fontSize: 13, marginTop: 4 }}>{item.title}</div>
                <div className="small muted" style={{ marginTop: 2 }}>
                  {REPORT_TYPE_LABEL[item.type]} · {item.createdBy} · {fmtDate(item.createdAt)}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }} className="no-print">
            <div className="row-gap">
              <Tag bordered={false} color="blue">{report?.code}</Tag>
              <StatusTag text={REPORT_STATUS_LABEL[report?.status ?? 'DRAFT']} color={report?.status === 'ARCHIVED' ? 'success' : 'warning'} />
              <span className="small muted">A4 · 纵向 · 共 6 页</span>
            </div>
            <div className="row-gap">
              <Button size="small" onClick={() => message.success('已提交审核，等待质量审核员处理')}>提交审核</Button>
              <Button size="small" onClick={() => message.success('报告已归档，版本 V1.0')}>归档</Button>
            </div>
          </div>

          <div className="report-paper">
            <div style={{ textAlign: 'center', fontSize: 11, letterSpacing: 3, color: '#8a94a6' }}>INERTIAL PARAMETER SENSING SYSTEM</div>
            <h1>惯性器件标定报告</h1>
            <div style={{ textAlign: 'center', fontSize: 15, color: '#444', letterSpacing: 1 }}>
              {report ? report.deviceCode : '—'} · {report ? report.title.replace('标定报告', '') : ''}
            </div>
            <div className="report-meta">
              <table>
                <tbody>
                  <tr><td>报告编号</td><td>{report?.code}</td></tr>
                  <tr><td>受检设备</td><td>{report?.deviceCode}</td></tr>
                  <tr><td>标定日期</td><td>{report ? fmtDate(report.createdAt) : '—'}</td></tr>
                  <tr><td>编制</td><td>{report?.createdBy}</td></tr>
                  <tr><td>审核</td><td>李慧</td></tr>
                  <tr><td>批准</td><td>郑海涛</td></tr>
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 80, textAlign: 'center', fontSize: 11, color: '#8a94a6' }}>
              本报告仅对本次受检样品有效 · 未经许可不得部分复制
            </div>

            <div style={{ pageBreakBefore: 'always', marginTop: 60 }}>
              <h2>1 概述</h2>
              <p>
                受检设备为 {report?.deviceCode ?? '—'} 光纤陀螺惯性测量单元，本次依据《惯性器件标定规范（Q/IS 2024-07）》
                执行六位置静态标定，目的是获取零偏、标度因数与安装误差矩阵，验证器件是否满足出厂技术条件。
              </p>
              <h2>2 标定依据</h2>
              <p>GJB 2427A-2019《惯性导航系统通用规范》；Q/IS 2024-07《惯性器件标定规范》；设备技术协议书（编号 HT-2023-018）。</p>
              <h2>3 标定设备与环境</h2>
              <p>双轴位置速率转台 RT-01（±2″，有效期至 2027-07-17）；高低温试验箱 W-01（±0.5 ℃）；环境温度 23.4 ℃，湿度 46%RH，大气压 101.2 kPa。</p>
              <h2>4 标定方案与步骤</h2>
              <p>依次置于 +X、−X、+Y、−Y、+Z、−Z 六个位置，每位置驻留 60 s，取后 30 s 为有效采样窗口，判稳阈值 0.02 °/h，逐位置判定稳定后进入下一位置。</p>
              <h2>5 标定数据与曲线</h2>
              <p>六位置原始数据完整率 99.4%，无饱和、无丢包。各位置稳定度介于 0.0062 ~ 0.0118 °/h，均优于阈值要求。</p>
              <div style={{ border: '1px solid #e5e9f0', borderRadius: 4, padding: 12, background: '#fafbfd', textAlign: 'center', fontSize: 11, color: '#8a94a6' }}>
                图 1　六位置零偏稳定性趋势（此处嵌入 Allan 方差与残差曲线，打印时按实际图表输出）
              </div>
              <h2>6 参数解算结果</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8, fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#fafbfd' }}>
                    {['参数', 'X 轴', 'Y 轴', 'Z 轴', '限值', '结论'].map((h) => (
                      <th key={h} style={{ border: '1px solid #e5e9f0', padding: '6px 8px', textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['零偏 (°/h)', '0.0312', '−0.0187', '0.0243', '≤ 0.0500', '合格'],
                    ['零偏 1σ (°/h)', '0.0041', '0.0038', '0.0045', '≤ 0.0100', '合格'],
                    ['标度因数', '1.000412', '0.999873', '1.000268', '±0.001', '合格'],
                    ['非线性度 (ppm)', '42', '38', '47', '≤ 50', '合格'],
                    ['安装误差 (″)', '—', '38.6', '−21.4', '≤ 60', '合格'],
                  ].map((row) => (
                    <tr key={row[0]}>
                      {row.map((cell) => <td key={cell} style={{ border: '1px solid #e5e9f0', padding: '6px 8px' }}>{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
              <h2>7 结论</h2>
              <p>
                受检设备零偏、标度因数、非线性度与安装误差均满足技术条件要求，判定本次标定合格。
                建议有效期 12 个月，到期前 30 天安排复标。
              </p>
              <div className="report-sign">
                <div>编制：{report?.createdBy}　　日期：{report ? fmtDate(report.createdAt) : ''}</div>
                <div>审核：李慧　　批准：郑海涛</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        title="生成报告"
        open={wizard}
        width={600}
        onCancel={() => setWizard(false)}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            {step > 0 ? <Button onClick={() => setStep(step - 1)}>上一步</Button> : null}
            {step < 2 ? <Button type="primary" onClick={() => setStep(step + 1)}>下一步</Button> : <Button type="primary" onClick={createReport}>生成报告</Button>}
          </div>
        }
      >
        <Steps size="small" current={step} items={[{ title: '选择模板' }, { title: '选择数据源' }, { title: '章节与签字' }]} style={{ marginBottom: 20 }} />
        {step === 0 ? (
          <div>
            {[
              { name: '标定报告', desc: '含六位置数据、参数表与结论，适用于单台器件标定归档' },
              { name: '性能测试报告', desc: '含 Allan 方差、温度特性与动态性能，适用于研制阶段' },
              { name: '月度运行报告', desc: '汇总当月任务、告警与设备健康度，适用于部门月报' },
            ].map((tpl, i) => (
              <div
                key={tpl.name}
                onClick={() => message.success(`已选择模板：${tpl.name}`)}
                style={{ border: `1px solid ${i === 0 ? '#91caff' : '#e5e9f0'}`, background: i === 0 ? '#f0f8ff' : '#fff', borderRadius: 6, padding: 14, marginBottom: 10, cursor: 'pointer' }}
              >
                <div style={{ fontSize: 13, fontWeight: 500 }}>{tpl.name}</div>
                <div className="small muted" style={{ marginTop: 4 }}>{tpl.desc}</div>
              </div>
            ))}
          </div>
        ) : null}
        {step === 1 ? (
          <div>
            <div className="small muted" style={{ marginBottom: 6 }}>关联标定任务</div>
            <Select
              style={{ width: '100%' }}
              defaultValue={report?.taskId}
              options={[
                { value: 'CT-0001', label: 'CAL-2026-0180 · IMU-2023-0017 · 六位置静态标定法' },
                { value: 'CT-0002', label: 'CAL-2026-0181 · IMU-2024-0042 · 温度循环标定法' },
                { value: 'CT-0003', label: 'CAL-2026-0182 · INS-2025-0003 · 速率试验标定法' },
              ]}
            />
            <div className="small muted" style={{ margin: '14px 0 6px' }}>包含数据</div>
            <Checkbox.Group
              defaultValue={['参数表', '残差曲线', 'Allan 方差']}
              options={['参数表', '残差曲线', 'Allan 方差', '温度特性', '原始数据清单']}
            />
          </div>
        ) : null}
        {step === 2 ? (
          <div>
            <div className="small muted" style={{ marginBottom: 6 }}>报告章节</div>
            <Checkbox.Group value={sections} onChange={(v) => setSections(v as string[])} options={SECTIONS} style={{ display: 'flex', flexDirection: 'column', gap: 8 }} />
            <div className="small muted" style={{ margin: '14px 0 6px' }}>编制人</div>
            <Input value={creator} onChange={(e) => setCreator(e.target.value)} />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
