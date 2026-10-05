import { logger } from "../lib/logger";

export class AuditLogger {
  static logAction(userId: string, action: string, resource: string, details?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId,
      action,
      resource,
      details,
    };
    
    // Using Pino logger for now.
    // In production, this should be written to a secure append-only DB or log service.
    logger.info({ audit: true, ...logEntry }, `AUDIT: User ${userId} performed ${action} on ${resource}`);
  }
}
