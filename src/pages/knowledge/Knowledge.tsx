import React, { useEffect, useMemo, useState } from 'react';
import {
  Card, Table, Button, Input, Select, Tag, Space, Modal, Form, Switch, TreeSelect, Popconfirm,
  Drawer, Typography, List, Upload, message, Empty,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, ImportOutlined,
  RiseOutlined, CheckSquareOutlined, StopOutlined, ExperimentOutlined,
} from '@ant-design/icons';
import * as api from '@/api';
import { KNOWLEDGE_CATEGORIES, SENSITIVE_WORDS } from '@/constants';
import type { KnowledgeItem } from '@/types';

const emptyItem = (): KnowledgeItem => ({
  id: '', title: '', category: '产品咨询', question: '', similar: [''], answer: '',
  status: 'enabled', updatedAt: '',
});

const Knowledge: React.FC = () => {
  const [data, setData] = useState<KnowledgeItem[]>([]);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [editing, setEditing] = useState<KnowledgeItem | null>(null);
  const [form] = Form.useForm();
  const [testVisible, setTestVisible] = useState(false);
  const [testQ, setTestQ] = useState('');
  const [testResults, setTestResults] = useState<{ item: KnowledgeItem; score: number; method: string }[]>([]);
  const [importPreview, setImportPreview] = useState<KnowledgeItem[] | null>(null);

  const load = async () => {
    const res = await api.listKnowledge({ keyword, category, status });
    setData(res.data);
  };
  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [category, status]);

  const openEdit = (item?: KnowledgeItem) => {
    const target = item ?? emptyItem();
    setEditing(target);
    form.setFieldsValue(target);
  };

  const save = async () => {
    const values = await form.validateFields();
    await api.saveKnowledge({ ...editing!, ...values, similar: values.similar.filter((s: string) => s.trim()) });
    message.success('保存成功');
    setEditing(null);
    await load();
  };

  const toggle = async (on: boolean) => {
    if (selectedKeys.length === 0) return message.warning('请先选择条目');
    await api.toggleKnowledge(selectedKeys as string[], on ? 'enabled' : 'disabled');
    message.success(`已${on ? '启用' : '停用'} ${selectedKeys.length} 条`);
    setSelectedKeys([]);
    await load();
  };

  const remove = async () => {
    if (selectedKeys.length === 0) return message.warning('请先选择条目');
    await api.deleteKnowledge(selectedKeys as string[]);
    message.success(`已删除 ${selectedKeys.length} 条`);
    setSelectedKeys([]);
    await load();
  };

  const doImport = async () => {
    const res = await api.importKnowledge(8);
    setImportPreview(res.data);
  };
  const confirmImport = async () => {
    setImportPreview(null);
    await load();
    message.success('模拟导入成功（已写入内存）');
  };

  const doTest = async () => {
    if (!testQ.trim()) return;
    const res = await api.searchKnowledgeSimilar(testQ);
    setTestResults(res.data);
  };

  const columns = [
    { title: '标题', dataIndex: 'title', width: 240, render: (v: string) => <Typography.Text ellipsis style={{ maxWidth: 230 }}>{v}</Typography.Text> },
    { title: '分类', dataIndex: 'category', width: 100, render: (v: string) => <Tag>{v}</Tag> },
    { title: '标准问法', dataIndex: 'question', ellipsis: true },
    { title: '相似问法', dataIndex: 'similar', width: 90, render: (v: string[]) => `${v.length} 条` },
    { title: '状态', dataIndex: 'status', width: 80, render: (v: string) => <Tag color={v === 'enabled' ? 'green' : 'default'}>{v === 'enabled' ? '启用' : '停用'}</Tag> },
    { title: '更新时间', dataIndex: 'updatedAt', width: 150 },
    {
      title: '操作', width: 80,
      render: (_: unknown, r: KnowledgeItem) => <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>,
    },
  ];

  return (
    <Card
      size="small"
      title={`知识库管理（共 ${data.length} 条）`}
      extra={
        <Space>
          <Button icon={<ExperimentOutlined />} onClick={() => setTestVisible(true)}>检索测试</Button>
          <Upload showUploadList={false} beforeUpload={() => false} onChange={() => void doImport()}>
            <Button icon={<ImportOutlined />}>模拟导入</Button>
          </Upload>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openEdit()}>新建</Button>
        </Space>
      }
    >
      <Space style={{ marginBottom: 12 }} wrap>
        <Input allowClear prefix={<SearchOutlined />} placeholder="搜索标题/问法" style={{ width: 220 }}
          value={keyword} onChange={(e) => { setKeyword(e.target.value); }} onPressEnter={() => void load()} />
        <TreeSelect
          style={{ width: 160 }} allowClear placeholder="全部分类"
          treeData={KNOWLEDGE_CATEGORIES.map((c) => ({ title: c, value: c }))}
          value={category} onChange={setCategory}
        />
        <Select style={{ width: 110 }} allowClear placeholder="状态"
          options={[{ value: 'enabled', label: '启用' }, { value: 'disabled', label: '停用' }]}
          value={status} onChange={setStatus}
        />
        <Button onClick={() => void load()}>查询</Button>
      </Space>
      <Space style={{ marginBottom: 12 }}>
        <Button size="small" icon={<RiseOutlined />} onClick={() => toggle(true)} disabled={!selectedKeys.length}>批量启用</Button>
        <Button size="small" icon={<StopOutlined />} onClick={() => toggle(false)} disabled={!selectedKeys.length}>批量停用</Button>
        <Popconfirm title={`确认删除选中的 ${selectedKeys.length} 条？`}>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={remove} disabled={!selectedKeys.length}>批量删除</Button>
        </Popconfirm>
      </Space>
      <Table
        size="small"
        rowKey="id"
        rowSelection={{ selectedRowKeys: selectedKeys, onChange: setSelectedKeys }}
        columns={columns}
        dataSource={data}
        pagination={{ pageSize: 12, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
      />

      {/* 编辑抽屉 */}
      <Drawer
        open={!!editing} title={editing?.id ? '编辑知识条目' : '新建知识条目'} width={560}
        onClose={() => setEditing(null)}
        extra={<Button type="primary" onClick={save}>保存</Button>}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input maxLength={40} showCount />
          </Form.Item>
          <Form.Item name="category" label="分类" rules={[{ required: true }]}>
            <Select options={KNOWLEDGE_CATEGORIES.map((c) => ({ value: c, label: c }))} />
          </Form.Item>
          <Form.Item name="question" label="标准问法" rules={[{ required: true, message: '请输入标准问法' }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="similar" label="相似问法（可增删）">
            <Select mode="tags" open={false} suffixIcon={null} placeholder="输入后回车添加" />
          </Form.Item>
          <Form.Item name="answer" label="答案（支持简单文本）" rules={[{ required: true, message: '请输入答案' }]}>
            <Input.TextArea rows={5} />
          </Form.Item>
          <Form.Item name="status" label="状态" valuePropName="checked" getValueFromEvent={(v: boolean) => (v ? 'enabled' : 'disabled')} getValueProps={(v) => ({ checked: v === 'enabled' })}>
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>
        </Form>
      </Drawer>

      {/* 检索测试 */}
      <Modal open={testVisible} title="检索测试" footer={null} onCancel={() => setTestVisible(false)} width={640}>
        <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
          <Input value={testQ} onChange={(e) => setTestQ(e.target.value)} placeholder="输入用户问题，测试知识命中情况" onPressEnter={doTest} />
          <Button type="primary" onClick={doTest}>测试</Button>
        </Space.Compact>
        {testResults.length === 0 ? (
          <Empty description="输入问题后点击测试" />
        ) : (
          <List
            dataSource={testResults}
            renderItem={(r, i) => (
              <List.Item>
                <Typography.Text mark>#{i + 1}</Typography.Text>
                <div style={{ flex: 1, marginLeft: 8 }}>
                  <div>{r.item.question}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>{r.item.title}</div>
                </div>
                <Tag color="blue">{r.method}</Tag>
                <Tag color="green">相似度 {r.score}%</Tag>
              </List.Item>
            )}
          />
        )}
      </Modal>

      {/* 导入预览 */}
      <Modal
        open={!!importPreview} title="模拟导入预览（8 条）" okText="确认入库" cancelText="取消"
        onOk={confirmImport} onCancel={() => setImportPreview(null)} width={560}
      >
        <List
          size="small"
          dataSource={importPreview ?? []}
          renderItem={(k) => (
            <List.Item>
              <CheckSquareOutlined style={{ color: '#52c41a', marginRight: 8 }} />
              <span style={{ flex: 1 }}>{k.title}</span>
              <Tag>{k.category}</Tag>
            </List.Item>
          )}
        />
      </Modal>
    </Card>
  );
};

export default Knowledge;
