import { useEffect, useState } from 'react';
import { FileCode2 } from 'lucide-react';
import { HashText, StatusPill, Tag } from '@/components/ui/core';
import { PageHeader, SectionCard } from '@/components/ui/page';
import { Drawer } from '@/components/ui/overlay';
import { mockApi } from '@/mock/api';
import { fmtDate } from '@/utils/format';

interface Ctr {
  name: string;
  address: string;
  version: string;
  calls: number;
  deployAt: string;
  status: string;
}

const METHODS: Record<string, { name: string; desc: string; calls: number }[]> = {
  EvidenceRegistry: [
    { name: 'attest(bytes32 hash, string bizId)', desc: '写入存证哈希与业务编号', calls: 486213 },
    { name: 'revoke(string bizId)', desc: '撤销存证（仅权利人可调用）', calls: 1284 },
    { name: 'getAttestation(string bizId)', desc: '查询存证记录', calls: 128466 },
  ],
  RightsRegistry: [
    { name: 'registerRights(bytes32 root, address owner)', desc: '登记权属并绑定权利人', calls: 86412 },
    { name: 'transferRights(string rightsId, address to)', desc: '转让权属', calls: 12084 },
    { name: 'grantLicense(string rightsId, address licensee, uint256 scope)', desc: '授予许可', calls: 29950 },
  ],
  ContractAnchor: [
    { name: 'anchorContract(bytes32 hash, string contractId)', desc: '合同全文哈希锚定', calls: 66420 },
    { name: 'verifyContract(bytes32 hash)', desc: '验签比对', calls: 10000 },
  ],
  AssetRegistry: [
    { name: 'registerAsset(bytes32 metaHash, string assetId)', desc: '数据资产登记', calls: 16426 },
    { name: 'authorize(string assetId, address user, uint256 until)', desc: '授权使用', calls: 2000 },
  ],
  AccessControl: [
    { name: 'grantRole(bytes32 role, address account)', desc: '授予角色', calls: 48120 },
    { name: 'hasRole(bytes32 role, address account)', desc: '校验权限', calls: 914198 },
  ],
  NodeGovernance: [
    { name: 'proposeNode(address node, string region)', desc: '新增节点提案', calls: 82 },
    { name: 'vote(uint256 proposalId, bool approve)', desc: '治理投票', calls: 2759 },
  ],
};

export default function ChainContracts() {
  const [list, setList] = useState<Ctr[]>([]);
  const [active, setActive] = useState<Ctr | null>(null);

  useEffect(() => {
    mockApi.chain.contracts().then(setList);
  }, []);

  return (
    <div className="page">
      <PageHeader title="智能合约" desc="链上部署的业务合约与治理合约，所有存证、确权与授权逻辑均由合约执行" />

      <div className="grid grid-cols-3 gap-4">
        {list.map((c) => (
          <div key={c.name} className="card p-5 transition-all hover:border-[var(--stroke-strong)]">
            <div className="flex items-start justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-[rgba(139,92,246,.12)] text-[#C4B5FD] ring-1 ring-[rgba(139,92,246,.25)]">
                <FileCode2 size={16} />
              </span>
              <StatusPill label={c.status === 'running' ? '运行中' : '已暂停'} tone={c.status === 'running' ? 'green' : 'gray'} />
            </div>
            <div className="mt-3 font-mono text-[13px] text-[var(--text-1)]">{c.name}</div>
            <div className="mt-1"><HashText value={c.address} head={12} tail={8} /></div>
            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[var(--stroke)] pt-3 text-[10.5px]">
              <div>
                <div className="text-[var(--text-3)]">版本</div>
                <div className="mt-0.5 font-mono text-[var(--text-2)]">{c.version}</div>
              </div>
              <div>
                <div className="text-[var(--text-3)]">调用次数</div>
                <div className="num mt-0.5 text-[var(--text-2)]">{c.calls.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[var(--text-3)]">部署时间</div>
                <div className="mt-0.5 font-mono text-[var(--text-2)]">{c.deployAt}</div>
              </div>
            </div>
            <button className="mt-3 w-full rounded-md border border-[var(--stroke)] py-1.5 text-[11.5px] text-[var(--brand-2)] transition-colors hover:bg-white/5" onClick={() => setActive(c)}>
              查看合约方法
            </button>
          </div>
        ))}
      </div>

      <SectionCard className="mt-4" title="合约说明">
        <div className="grid grid-cols-3 gap-6 text-[11.5px] leading-relaxed text-[var(--text-3)]">
          <div>
            <div className="mb-1 text-[12px] text-[var(--text-1)]">不可升级性</div>
            核心存证与权属合约采用不可升级设计，逻辑一旦部署无法修改，保证证据规则的稳定性。
          </div>
          <div>
            <div className="mb-1 text-[12px] text-[var(--text-1)]">权限控制</div>
            所有写操作均通过 AccessControl 合约校验角色，撤销存证等敏感操作需权利人签名。
          </div>
          <div>
            <div className="mb-1 text-[12px] text-[var(--text-1)]">事件索引</div>
            每次调用都会产生事件日志，链下服务基于事件构建业务索引，支持毫秒级查询。
          </div>
        </div>
      </SectionCard>

      <Drawer
        open={!!active}
        onClose={() => setActive(null)}
        title={active?.name ?? ''}
        desc={active ? `合约地址 ${active.address.slice(0, 22)}… · 部署于 ${fmtDate(active.deployAt)}` : ''}
        width={520}
      >
        {active && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['合约版本', active.version],
                ['累计调用', active.calls.toLocaleString()],
                ['部署时间', active.deployAt],
                ['运行状态', active.status === 'running' ? '运行中' : '已暂停'],
              ].map(([k, v]) => (
                <div key={k} className="rounded-[8px] border border-[var(--stroke)] bg-[var(--bg-card-2)] px-3.5 py-2.5">
                  <div className="text-[10.5px] text-[var(--text-3)]">{k}</div>
                  <div className="mt-0.5 text-[12px] text-[var(--text-1)]">{v}</div>
                </div>
              ))}
            </div>

            <div>
              <div className="mb-2 text-[11.5px] text-[var(--text-3)]">方法列表</div>
              <div className="space-y-2">
                {(METHODS[active.name] ?? []).map((m) => (
                  <div key={m.name} className="rounded-[8px] border border-[var(--stroke)] bg-[var(--bg-card-2)] px-3 py-2.5">
                    <div className="break-all font-mono text-[11px] text-[var(--brand-2)]">{m.name}</div>
                    <div className="mt-1 flex items-center justify-between text-[10.5px]">
                      <span className="text-[var(--text-3)]">{m.desc}</span>
                      <span className="num text-[var(--text-2)]">{m.calls.toLocaleString()} 次</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-[11.5px] text-[var(--text-3)]">最近调用</div>
              <div className="space-y-1.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10.5px]">
                    <Tag tone={i % 2 ? 'green' : 'cyan'}>{i % 2 ? '成功' : '成功'}</Tag>
                    <HashText value={`0x${active.address.slice(2)}${i}`.padEnd(66, 'a')} head={10} tail={6} />
                    <span className="ml-auto text-[var(--text-3)]">{i + 1} 分钟前</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
