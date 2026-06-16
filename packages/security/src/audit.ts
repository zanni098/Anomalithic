export interface AuditEntry {
  /** ISO-8601 timestamp. */
  at: string;
  actor: string;
  action: string;
  detail?: string;
}

/** In-memory append-only audit trail of agent actions. */
export class AuditLog {
  private readonly log: AuditEntry[] = [];

  append(entry: Omit<AuditEntry, "at">): AuditEntry {
    const full: AuditEntry = { at: new Date().toISOString(), ...entry };
    this.log.push(full);
    return full;
  }

  entries(): AuditEntry[] {
    return [...this.log];
  }
}
