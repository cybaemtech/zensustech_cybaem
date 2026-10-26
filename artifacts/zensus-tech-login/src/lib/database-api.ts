/**
 * Multi-Database API client for ZensusTech.
 * Supports PostgreSQL, MySQL, Microsoft SQL Server, and Azure SQL.
 */

import { LIVE_API_BASE } from './live-api';

export type DatabaseEngine = 'postgresql' | 'mysql' | 'mssql' | 'azure_sql';

export interface DatabaseStatusResponse {
  connected: boolean;
  database_type?: string;
  database?: string;
  user?: string;
  server_version?: string;
  latency_ms?: number;
  masked_url?: string;
  tables?: Record<string, number>;
  total_records?: number;
  error?: string;
  message?: string;
}

export interface ConnectionPayload {
  engine?: DatabaseEngine;
  connection_url?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl_mode?: string;
}

export interface TestConnectionResponse {
  success: boolean;
  engine?: string;
  latency_ms?: number;
  server_version?: string;
  database?: string;
  user?: string;
  existing_tables?: string[];
  masked_url?: string;
  error?: string;
}

export interface MigrationResponse {
  success: boolean;
  engine?: string;
  message?: string;
  migrated_counts?: Record<string, number>;
  total_records?: number;
  error?: string;
}

export interface TablePreviewResponse {
  table?: string;
  count?: number;
  rows?: any[];
  error?: string;
}

export async function fetchDatabaseStatus(): Promise<DatabaseStatusResponse> {
  try {
    const res = await fetch(`${LIVE_API_BASE}/database/status`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { connected: false, error: err.detail || err.error || `HTTP ${res.status}` };
    }
    return await res.json();
  } catch (err: any) {
    return { connected: false, error: err.message || 'Could not reach database endpoint' };
  }
}

export async function testDatabaseConnection(payload: ConnectionPayload): Promise<TestConnectionResponse> {
  try {
    const res = await fetch(`${LIVE_API_BASE}/database/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Connection test failed' };
  }
}

export async function connectDatabase(payload: ConnectionPayload): Promise<TestConnectionResponse> {
  const res = await fetch(`${LIVE_API_BASE}/database/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || data.error || 'Failed to connect to database');
  }
  return data;
}

export async function disconnectDatabase(): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${LIVE_API_BASE}/database/disconnect`, {
    method: 'POST',
  });
  return await res.json();
}

export async function initDatabaseSchema(engine: DatabaseEngine = 'postgresql'): Promise<{ success: boolean; message?: string; tables_created?: string[]; error?: string }> {
  const res = await fetch(`${LIVE_API_BASE}/database/init-schema`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ engine }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || data.error || 'Schema initialization failed');
  }
  return data;
}

export async function migrateDataToDatabase(customers?: any[]): Promise<MigrationResponse> {
  const res = await fetch(`${LIVE_API_BASE}/database/migrate-data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customers }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || data.error || 'Data migration failed');
  }
  return data;
}

export async function fetchSqlScript(engine: DatabaseEngine = 'mysql'): Promise<string> {
  const res = await fetch(`${LIVE_API_BASE}/database/export-sql?engine=${engine}`);
  return await res.text();
}

export async function fetchTablePreview(tableName: string, limit: number = 25): Promise<TablePreviewResponse> {
  const res = await fetch(`${LIVE_API_BASE}/database/tables/${tableName}?limit=${limit}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || data.error || `Failed to fetch table ${tableName}`);
  }
  return data;
}
