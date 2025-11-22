export interface AuditMetadata {
  updateSize?: number;
  opCount?: number;
  title?: string;
  targetUserId?: string;
  role?: string;
  versionId?: string;
  filename?: string;
  size?: number;
  mimeType?: string;
  [key: string]: any;
}