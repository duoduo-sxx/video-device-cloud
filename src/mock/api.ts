import type {
  Block,
  Contract,
  DataAsset,
  DisputeCase,
  Evidence,
  EvidencePackage,
  EvidenceStatus,
  EvidenceType,
  ForensicsTask,
  JudicialOrder,
  Member,
  RightsCategory,
  RightsRecord,
  RightsStatus,
  Transaction,
} from '@/types';
import {
  BASE_HEIGHT,
  blockHashOf,
  buildDB,
  heightForDate,
  type MockDB,
} from './generators';
import { addressOf, hexHash } from '@/utils/hash';

export const db: MockDB = buildDB();

export function injectEvidence(e: Evidence) {
  db.evidences.unshift(e);
}

export function injectRights(r: RightsRecord) {
  db.rights.unshift(r);
}

export function injectContract(c: Contract) {
  db.contracts.unshift(c);
}

export function injectForensics(t: ForensicsTask) {
  db.forensics.unshift(t);
}

export function injectJudicial(j: JudicialOrder) {
  db.judicial.unshift(j);
}

export function injectMember(m: Member) {
  db.members.unshift(m);
}

export function nextEvidenceSeq(): number {
  return 1000 + db.evidences.length + 1;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const jitter = (base: number, spread = 120) => base + Math.random() * spread;

export function pageOf<T>(list: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return { list: list.slice(start, start + pageSize), total: list.length };
}

export interface EvidenceQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  types?: EvidenceType[];
  status?: EvidenceStatus[];
  source?: string;
  range?: '7d' | '30d' | '90d' | 'all';
}

export const mockApi = {
  evidence: {
    async list(q: EvidenceQuery = {}) {
      await sleep(jitter(240));
      const { page = 1, pageSize = 10, keyword = '', types = [], status = [], source = '', range = 'all' } = q;
      let list = db.evidences.slice();
      if (keyword.trim()) {
        const k = keyword.trim().toLowerCase();
        list = list.filter(
          (e) =>
            e.title.toLowerCase().includes(k) ||
            e.id.toLowerCase().includes(k) ||
            e.hash.toLowerCase().includes(k) ||
            e.fileName.toLowerCase().includes(k),
        );
      }
      if (types.length) list = list.filter((e) => types.includes(e.type));
      if (status.length) list = list.filter((e) => status.includes(e.status));
      if (source) list = list.filter((e) => e.source === source);
      if (range !== 'all') {
        const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
        const since = Date.now() - days * 86400000;
        list = list.filter((e) => new Date(e.createdAt).getTime() >= since);
      }
      list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      return pageOf(list, page, pageSize);
    },
    async detail(id: string) {
      await sleep(160);
      return db.evidences.find((e) => e.id === id);
    },
    async create(payload: Partial<Evidence> & { title: string; type: EvidenceType }) {
      await sleep(jitter(600, 300));
      const now = new Date().toISOString();
      const height = heightForDate(now);
      const datePart = now.slice(0, 10).replace(/-/g, '');
      const seq = String(1000 + db.evidences.length + 1).slice(-4);
      const id = `EV-${datePart}-${seq}`;
      const e: Evidence = {
        id,
        title: payload.title,
        type: payload.type,
        fileName: payload.fileName ?? `${payload.title}.pdf`,
        fileSize: payload.fileSize ?? 1024 * 1024,
        mimeType: payload.mimeType ?? 'application/octet-stream',
        hash: payload.hash ?? hexHash(`new-${id}`),
        algorithm: 'SHA-256',
        status: 'confirmed',
        blockHeight: height,
        blockHash: blockHashOf(height),
        txHash: hexHash(`ev-tx-${id}`),
        confirmations: 1,
        chainName: '星火联盟链',
        chainId: 'xh-mainnet',
        ownerId: 'u-2',
        ownerName: '陈默',
        orgId: 'org-1',
        orgName: '杭州拾光文创有限公司',
        tags: payload.tags ?? [],
        remark: payload.remark,
        privacy: payload.privacy ?? 'private',
        source: payload.source ?? 'web',
        certificateNo: `XH-EV-${now.slice(0, 7)}-${String(312 + db.evidences.length + 1).padStart(6, '0')}`,
        relatedRightsId: payload.relatedRightsId,
        createdAt: now,
        confirmedAt: now,
        verifyCount: 0,
      };
      db.evidences.unshift(e);
      return e;
    },
    async revoke(id: string) {
      await sleep(360);
      const e = db.evidences.find((x) => x.id === id);
      if (e) e.status = 'revoked';
      return e;
    },
  },

  rights: {
    async list(q: { page?: number; pageSize?: number; keyword?: string; category?: RightsCategory | 'all'; status?: RightsStatus | 'all' } = {}) {
      await sleep(jitter(240));
      const { page = 1, pageSize = 10, keyword = '', category = 'all', status = 'all' } = q;
      let list = db.rights.slice();
      if (category !== 'all') list = list.filter((r) => r.category === category);
      if (status !== 'all') list = list.filter((r) => r.status === status);
      if (keyword.trim()) {
        const k = keyword.trim().toLowerCase();
        list = list.filter(
          (r) => r.title.toLowerCase().includes(k) || r.id.toLowerCase().includes(k) || r.owner.name.toLowerCase().includes(k),
        );
      }
      return pageOf(list, page, pageSize);
    },
    async detail(id: string) {
      await sleep(160);
      return db.rights.find((r) => r.id === id);
    },
    async create(payload: Partial<RightsRecord> & { title: string; category: RightsCategory }) {
      await sleep(jitter(700, 300));
      const now = new Date().toISOString();
      const seq = db.rights.length + 1;
      const r: RightsRecord = {
        id: `RR-2026-${String(seq).padStart(6, '0')}`,
        title: payload.title,
        category: payload.category,
        subCategory: payload.subCategory ?? '美术作品',
        owner: payload.owner ?? {
          type: 'person',
          name: '陈默',
          idNo: '330106199203124518',
          did: 'did:xh:0x3Fa2c81b7E4d09aC5f61',
          shareRatio: 100,
        },
        coOwners: payload.coOwners ?? [],
        rightScope: payload.rightScope ?? ['复制权', '信息网络传播权'],
        evidenceIds: payload.evidenceIds ?? [],
        status: 'reviewing',
        validFrom: payload.validFrom ?? now.slice(0, 10),
        validTo: payload.validTo ?? '2036-12-31',
        region: payload.region ?? '中国大陆',
        firstPublishAt: payload.firstPublishAt,
        blockHeight: heightForDate(now),
        txHash: hexHash(`rights-tx-new-${seq}`),
        events: [
          { id: 'e1', type: 'register', title: '提交权属登记申请', operator: payload.owner?.name ?? '陈默', time: now },
        ],
        orgName: '杭州拾光文创有限公司',
      };
      db.rights.unshift(r);
      return r;
    },
    async approve(id: string) {
      await sleep(500);
      const r = db.rights.find((x) => x.id === id);
      if (r) {
        r.status = 'registered';
        r.registeredAt = new Date().toISOString();
        r.certificateNo = `XH-RR-2026-${String(3120 + db.rights.indexOf(r)).padStart(6, '0')}`;
        r.events.push({
          id: `e-${r.events.length + 1}`,
          type: 'confirm',
          title: '链上确权完成，证书已签发',
          operator: '审核员 · 周砚',
          time: new Date().toISOString(),
          txHash: r.txHash,
        });
      }
      return r;
    },
  },

  chain: {
    async overview() {
      await sleep(180);
      const latest = db.blocks[0];
      return {
        height: latest.height,
        totalTx: 9_600_000 + db.txs.length,
        totalEvidence: 12486,
        activeNodes: db.nodes.filter((n) => n.status === 'online').length,
        totalNodes: db.nodes.length,
        avgBlockTime: 2.1,
        tps: 186.4,
        latestBlock: latest,
      };
    },
    async blocks(page = 1, pageSize = 10) {
      await sleep(jitter(200));
      return pageOf(db.blocks, page, pageSize);
    },
    async blockDetail(height: number): Promise<Block> {
      await sleep(150);
      const found = db.blocks.find((b) => b.height === height);
      if (found) return found;
      const offset = BASE_HEIGHT - height;
      return {
        height,
        hash: blockHashOf(height),
        parentHash: blockHashOf(height - 1),
        txCount: 3 + (height % 3),
        node: ['北京主节点', '杭州共识节点', '深圳共识节点', '成都共识节点'][height % 4],
        consensus: 'PBFT',
        duration: 1600 + (height % 900),
        timestamp: new Date(Date.now() - offset * 2100).toISOString(),
        size: 1600 + (height % 800),
      };
    },
    async txs(page = 1, pageSize = 10, type?: string) {
      await sleep(jitter(200));
      let list = db.txs;
      if (type) list = list.filter((t) => t.type === type);
      return pageOf(list, page, pageSize);
    },
    async txDetail(hash: string): Promise<Transaction | undefined> {
      await sleep(150);
      const found = db.txs.find((t) => t.hash === hash);
      if (found) return found;
      const ev = db.evidences.find((e) => e.txHash === hash);
      if (ev) {
        return {
          hash,
          type: 'evidence',
          blockHeight: ev.blockHeight,
          from: addressOf(`owner-${ev.ownerId}`),
          to: addressOf('contract-xh-registry'),
          bizId: ev.id,
          bizTitle: ev.title,
          status: 'success',
          timestamp: ev.confirmedAt ?? ev.createdAt,
          confirmations: ev.confirmations,
          payload: {
            chainId: 'xh-mainnet',
            contract: 'EvidenceRegistry',
            method: 'attest',
            bizId: ev.id,
            bizType: 'evidence',
            fileHash: ev.hash,
            operator: ev.ownerName,
          },
        };
      }
      const r = db.rights.find((x) => x.txHash === hash);
      if (r) {
        return {
          hash,
          type: 'rights',
          blockHeight: r.blockHeight,
          from: addressOf(`owner-${r.owner.name}`),
          to: addressOf('contract-xh-registry'),
          bizId: r.id,
          bizTitle: r.title,
          status: 'success',
          timestamp: r.registeredAt ?? r.events[0].time,
          confirmations: BASE_HEIGHT - r.blockHeight,
          payload: {
            chainId: 'xh-mainnet',
            contract: 'RightsRegistry',
            method: 'confirmRights',
            bizId: r.id,
            bizType: 'rights',
            ownerDid: r.owner.did,
          },
        };
      }
      return undefined;
    },
    async nodes() {
      await sleep(180);
      return db.nodes;
    },
    async contracts() {
      await sleep(160);
      return [
        { name: 'EvidenceRegistry', address: addressOf('c-evidence'), version: 'v2.4.1', calls: 486213, deployAt: '2025-06-18', status: 'running' },
        { name: 'RightsRegistry', address: addressOf('c-rights'), version: 'v2.3.0', calls: 128446, deployAt: '2025-06-18', status: 'running' },
        { name: 'ContractAnchor', address: addressOf('c-contract'), version: 'v1.8.2', calls: 76420, deployAt: '2025-09-02', status: 'running' },
        { name: 'AssetRegistry', address: addressOf('c-asset'), version: 'v1.2.0', calls: 18426, deployAt: '2026-02-11', status: 'running' },
        { name: 'AccessControl', address: addressOf('c-acl'), version: 'v2.0.4', calls: 962318, deployAt: '2025-06-18', status: 'running' },
        { name: 'NodeGovernance', address: addressOf('c-gov'), version: 'v1.1.0', calls: 2841, deployAt: '2025-11-30', status: 'paused' },
      ];
    },
    async tpsSeries() {
      await sleep(120);
      const now = Date.now();
      return Array.from({ length: 60 }).map((_, i) => ({
        time: new Date(now - (59 - i) * 60000).toISOString().slice(11, 16),
        tps: Math.round(140 + Math.sin(i / 6) * 42 + Math.random() * 26),
      }));
    },
  },

  contract: {
    async list(page = 1, pageSize = 10, status?: string) {
      await sleep(jitter(220));
      let list = db.contracts;
      if (status && status !== 'all') list = list.filter((c) => c.status === status);
      return pageOf(list, page, pageSize);
    },
    async detail(id: string) {
      await sleep(160);
      return db.contracts.find((c) => c.id === id);
    },
    async sign(id: string, signerId: string) {
      await sleep(700);
      const c = db.contracts.find((x) => x.id === id);
      if (!c) return undefined;
      const s = c.signers.find((x) => x.id === signerId);
      if (s) {
        s.status = 'signed';
        s.signedAt = new Date().toISOString();
        if (c.signers.every((x) => x.status === 'signed')) {
          c.status = 'completed';
          c.evidenceId = c.evidenceId ?? db.evidences[0].id;
          c.txHash = c.txHash ?? hexHash(`ct-tx-${c.id}`);
        } else {
          c.status = 'signing';
        }
      }
      return c;
    },
  },

  forensics: {
    async tasks(page = 1, pageSize = 10) {
      await sleep(jitter(200));
      return pageOf(db.forensics, page, pageSize);
    },
    async packageList(page = 1, pageSize = 8) {
      await sleep(jitter(200));
      return pageOf(db.packages, page, pageSize);
    },
    async packageDetail(id: string) {
      await sleep(150);
      return db.packages.find((p) => p.id === id);
    },
    async judicialList(page = 1, pageSize = 10) {
      await sleep(jitter(200));
      return pageOf(db.judicial, page, pageSize);
    },
    async judicialDetail(id: string) {
      await sleep(150);
      return db.judicial.find((j) => j.id === id);
    },
    async monitorHits() {
      await sleep(200);
      return db.monitorHits;
    },
    async createWeb(payload: { url: string; name: string; region: string; device: 'pc' | 'mobile' }): Promise<ForensicsTask> {
      await sleep(2400);
      const now = new Date().toISOString();
      const t: ForensicsTask = {
        id: `FZ-${now.slice(0, 10).replace(/-/g, '')}-${String(1000 + db.forensics.length + 1).slice(-4)}`,
        name: payload.name,
        type: 'webpage',
        target: payload.url,
        status: 'success',
        region: payload.region,
        device: payload.device,
        duration: 42,
        fileSize: 186 * 1024 * 1024,
        evidenceHash: hexHash(`fz-new-${now}`),
        createdBy: '陈默',
        createdAt: now,
      };
      db.forensics.unshift(t);
      return t;
    },
  },

  assets: {
    async list(page = 1, pageSize = 10) {
      await sleep(jitter(220));
      return pageOf(db.assets, page, pageSize);
    },
    async detail(id: string) {
      await sleep(150);
      return db.assets.find((a) => a.id === id);
    },
  },

  org: {
    async members() {
      await sleep(180);
      return db.members;
    },
    async audits(page = 1, pageSize = 12, keyword = '') {
      await sleep(jitter(200));
      let list = db.audits;
      if (keyword) list = list.filter((a) => a.operator.includes(keyword) || a.action.includes(keyword) || a.target.includes(keyword));
      return pageOf(list, page, pageSize);
    },
    async keys() {
      await sleep(160);
      return db.apiKeys;
    },
    async notifications() {
      await sleep(150);
      return db.notifications;
    },
    async disputes(): Promise<DisputeCase[]> {
      await sleep(180);
      return db.disputes;
    },
  },

  service: {
    async usage() {
      await sleep(200);
      const days = Array.from({ length: 30 }).map((_, i) => {
        const d = new Date(Date.now() - (29 - i) * 86400000);
        return {
          date: d.toISOString().slice(5, 10),
          calls: Math.round(1200 + Math.sin(i / 4) * 380 + Math.random() * 420),
          errors: Math.round(2 + Math.random() * 18),
        };
      });
      return {
        days,
        total: days.reduce((s, d) => s + d.calls, 0),
        successRate: 99.87,
        errorCodes: [
          { code: '401', count: 128, label: '签名校验失败' },
          { code: '429', count: 86, label: '超出 QPS 限制' },
          { code: '500', count: 42, label: '内部处理异常' },
          { code: '404', count: 18, label: '资源不存在' },
        ],
        topEndpoints: [
          { path: '/v1/evidence', name: '创建存证', calls: 18426 },
          { path: '/v1/verify/hash', name: '哈希核验', calls: 12084 },
          { path: '/v1/evidence/{id}', name: '查询存证', calls: 9642 },
          { path: '/v1/rights', name: '权属登记', calls: 4218 },
          { path: '/v1/contract', name: '发起合同', calls: 2864 },
        ],
      };
    },
  },
};

export type MockApi = typeof mockApi;
export type { DataAsset, EvidencePackage, JudicialOrder };
