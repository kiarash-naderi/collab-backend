import { logAudit } from './audit.repository.js';


export class AuditService {
  static documentCreated(userId: string, documentId: string, title: string) {
    return logAudit({
      userId,
      documentId,
      action: 'DOCUMENT_CREATE',
      metadata: { title },
    });
  }

  static documentUpdated(userId: string, documentId: string) {
    return logAudit({
      userId,
      documentId,
      action: 'DOCUMENT_UPDATE',
    });
  }

  static versionReverted(userId: string, documentId: string, versionId: string) {
    return logAudit({
      userId,
      documentId,
      action: 'VERSION_REVERT',
      metadata: { versionId },
    });
  }

  static permissionChanged(userId: string, documentId: string, targetUserId: string, role: string) {
    return logAudit({
      userId,
      documentId,
      action: 'PERMISSION_GRANT',
      metadata: { targetUserId, role },
    });
  }
}