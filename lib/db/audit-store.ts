export interface AuditLogRecord {
  id: string;
  adminId: string;
  action: string;
  entity: string;
  entityId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}

const initialLogs: AuditLogRecord[] = [
  {
    id: 'audit-001',
    adminId: 'admin-system-001',
    action: 'SYSTEM_INITIALIZED',
    entity: 'System',
    entityId: 'nr-fleet-engine',
    details: { note: 'Fleet & inventory engine initialized with 6 premium Australian vehicles' },
    createdAt: new Date('2026-08-10T00:00:00Z'),
  },
  {
    id: 'audit-002',
    adminId: 'admin-system-001',
    action: 'DISCOUNT_CREATED',
    entity: 'Discount',
    entityId: 'disc-save10',
    details: { code: 'SAVE10', discountType: 'PERCENTAGE', value: 10 },
    createdAt: new Date('2026-08-12T10:00:00Z'),
  },
];

class AuditStore {
  private logs: AuditLogRecord[] = [];

  constructor() {
    this.reset();
  }

  public reset() {
    this.logs = initialLogs.map((l) => ({ ...l }));
  }

  public async create(data: Omit<AuditLogRecord, 'id' | 'createdAt'>): Promise<AuditLogRecord> {
    const id = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newLog: AuditLogRecord = {
      ...data,
      id,
      createdAt: new Date(),
    };
    this.logs.unshift(newLog);
    return { ...newLog };
  }

  public async list(limit = 50): Promise<AuditLogRecord[]> {
    return this.logs.slice(0, limit);
  }
}

const globalForAudit = globalThis as unknown as {
  __nr_auditStore: AuditStore | undefined;
};

export const auditStore =
  globalForAudit.__nr_auditStore ?? (globalForAudit.__nr_auditStore = new AuditStore());
