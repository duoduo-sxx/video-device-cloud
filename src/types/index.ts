export type RoleCode =
  | 'platform_admin'
  | 'org_admin'
  | 'creator'
  | 'legal'
  | 'auditor'
  | 'viewer';

export type EvidenceType =
  | 'document'
  | 'image'
  | 'video'
  | 'audio'
  | 'code'
  | 'webpage'
  | 'design'
  | 'dataset'
  | 'text';

export type EvidenceStatus = 'pending' | 'confirming' | 'confirmed' | 'failed' | 'revoked';

export interface Evidence {
  id: string;
  title: string;
  type: EvidenceType;
  fileName: string;
  fileSize: number;
  mimeType: string;
  hash: string;
  algorithm: 'SHA-256';
  status: EvidenceStatus;
  blockHeight: number;
  blockHash: string;
  txHash: string;
  confirmations: number;
  chainName: string;
  chainId: string;
  ownerId: string;
  ownerName: string;
  orgId: string;
  orgName: string;
  tags: string[];
  remark?: string;
  privacy: 'public' | 'org' | 'private';
  source: 'web' | 'api' | 'batch' | 'cli';
  certificateNo?: string;
  relatedRightsId?: string;
  createdAt: string;
  confirmedAt?: string;
  verifyCount: number;
  errorMsg?: string;
}

export type RightsCategory =
  | 'copyright'
  | 'patent'
  | 'trademark'
  | 'software'
  | 'data_asset'
  | 'trade_secret';

export type RightsStatus =
  | 'draft'
  | 'reviewing'
  | 'registered'
  | 'disputed'
  | 'transferred'
  | 'revoked';

export interface RightsOwner {
  type: 'person' | 'org';
  name: string;
  idNo: string;
  did: string;
  shareRatio?: number;
}

export type RightsEventType =
  | 'register'
  | 'review'
  | 'confirm'
  | 'transfer'
  | 'license'
  | 'dispute'
  | 'renew'
  | 'revoke';

export interface RightsEvent {
  id: string;
  type: RightsEventType;
  title: string;
  operator: string;
  time: string;
  txHash?: string;
  remark?: string;
}

export interface RightsRecord {
  id: string;
  title: string;
  category: RightsCategory;
  subCategory: string;
  owner: RightsOwner;
  coOwners: RightsOwner[];
  rightScope: string[];
  evidenceIds: string[];
  status: RightsStatus;
  registeredAt?: string;
  validFrom: string;
  validTo: string;
  region: string;
  firstPublishAt?: string;
  certificateNo?: string;
  blockHeight: number;
  txHash: string;
  events: RightsEvent[];
  disputeId?: string;
  orgName: string;
}

export interface Block {
  height: number;
  hash: string;
  parentHash: string;
  txCount: number;
  node: string;
  consensus: 'PBFT';
  duration: number;
  timestamp: string;
  size: number;
}

export type TxType = 'evidence' | 'rights' | 'contract' | 'license' | 'asset' | 'other';

export interface Transaction {
  hash: string;
  type: TxType;
  blockHeight: number;
  from: string;
  to: string;
  bizId: string;
  bizTitle: string;
  status: 'success' | 'failed';
  timestamp: string;
  confirmations: number;
  payload: Record<string, unknown>;
}

export interface ChainNode {
  id: string;
  name: string;
  region: string;
  role: 'consensus' | 'sync' | 'backup' | 'observer';
  status: 'online' | 'syncing' | 'offline';
  blocks: number;
  cpu: number;
  memory: number;
  disk: number;
  latency: number;
  version: string;
  address: string;
}

export type ContractStatus =
  | 'draft'
  | 'pending'
  | 'signing'
  | 'completed'
  | 'cancelled'
  | 'expired';

export interface ContractSigner {
  id: string;
  name: string;
  org: string;
  phone: string;
  status: 'pending' | 'signed' | 'rejected';
  signedAt?: string;
  sealText?: string;
}

export interface Contract {
  id: string;
  title: string;
  templateId: string;
  category: string;
  status: ContractStatus;
  signers: ContractSigner[];
  content: string;
  hash: string;
  evidenceId?: string;
  txHash?: string;
  createdAt: string;
  expireAt: string;
  createdBy: string;
  amount?: number;
}

export type ForensicsStatus = 'queued' | 'running' | 'success' | 'failed';

export interface ForensicsTask {
  id: string;
  name: string;
  type: 'webpage' | 'screen' | 'mobile' | 'app';
  target: string;
  status: ForensicsStatus;
  region: string;
  device: 'pc' | 'mobile';
  duration: number;
  fileSize: number;
  evidenceHash: string;
  createdBy: string;
  createdAt: string;
}

export interface PackageItem {
  type: string;
  refId: string;
  name: string;
  hash: string;
}

export interface EvidencePackage {
  id: string;
  name: string;
  itemCount: number;
  totalSize: number;
  integrityOk: boolean;
  items: PackageItem[];
  createdAt: string;
  createdBy: string;
  status: 'draft' | 'sealed' | 'submitted';
}

export type JudicialType = 'notary' | 'appraisal' | 'report';
export type JudicialStatus = 'submitted' | 'reviewing' | 'accepted' | 'issued' | 'delivered';

export interface JudicialOrder {
  id: string;
  type: JudicialType;
  packageId: string;
  packageName: string;
  institution: string;
  status: JudicialStatus;
  applicant: string;
  amount: number;
  submittedAt: string;
  expectedAt: string;
  timeline: { title: string; time?: string; done: boolean; remark?: string }[];
}

export interface DataAssetField {
  name: string;
  type: string;
  desc: string;
  masked: boolean;
}

export interface AssetLicense {
  licensee: string;
  scope: string;
  startAt: string;
  endAt: string;
  status: 'active' | 'expired' | 'revoked';
}

export interface AssetUsage {
  caller: string;
  purpose: string;
  time: string;
  hash: string;
  status: 'success' | 'rejected';
}

export interface DataAsset {
  id: string;
  name: string;
  category: 'text' | 'image' | 'audio' | 'video' | 'structured';
  scale: string;
  volume: string;
  updateFreq: string;
  rightStatus: 'registered' | 'reviewing' | 'unregistered';
  certNo?: string;
  source: string;
  desc: string;
  fields: DataAssetField[];
  licenses: AssetLicense[];
  usages: AssetUsage[];
  createdAt: string;
  orgName: string;
}

export interface Member {
  id: string;
  name: string;
  avatarColor: string;
  phone: string;
  email: string;
  role: RoleCode;
  department: string;
  status: 'active' | 'disabled';
  lastLoginAt: string;
  joinedAt: string;
}

export interface AuditLog {
  id: string;
  operator: string;
  action: string;
  target: string;
  ip: string;
  result: 'success' | 'fail';
  time: string;
}

export interface ApiKey {
  id: string;
  name: string;
  accessKey: string;
  secretKey: string;
  status: 'active' | 'disabled';
  createdAt: string;
  lastUsedAt?: string;
  callCount: number;
}

export interface NotificationItem {
  id: string;
  type: 'system' | 'biz' | 'audit';
  title: string;
  content: string;
  read: boolean;
  time: string;
}

export interface DisputeCase {
  id: string;
  rightsId: string;
  rightsTitle: string;
  claimant: string;
  reason: string;
  status: 'pending' | 'hearing' | 'mediated' | 'rejected' | 'judged';
  createdAt: string;
  proofs: { name: string; hash: string; size: number }[];
  timeline: { title: string; time?: string; done: boolean; remark?: string }[];
}

export interface MonitorHit {
  id: string;
  platform: string;
  url: string;
  similarity: number;
  foundAt: string;
  status: 'new' | 'confirmed' | 'ignored';
  originalTitle: string;
}

export interface UploadItem {
  uid: string;
  file: File;
  name: string;
  size: number;
  hash: string;
  progress: number;
  stage: 'waiting' | 'hashing' | 'broadcasting' | 'confirming' | 'success' | 'failed';
  error?: string;
  evidenceId?: string;
}
