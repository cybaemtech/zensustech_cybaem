-- ZensusTech PostgreSQL Complete Database Export & Seed
-- Generated: 2026-11-23T14:32:10.369849
-- Compatible with Render PostgreSQL, Docker, and Local PostgreSQL

BEGIN;

-- Table: audit_logs (63 rows)
-- ----------------------------------------
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (10, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'User Login Success', 'Auth', 'success', 'admin@zentech.com', '{"actor": "admin@zentech.com", "event": "User Login Success"}'::jsonb, '2026-10-21T10:56:08.035010+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (11, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Azure Tenant Handshake', 'Directory', 'success', 'ServicePrincipal-0ffa2118', '{"actor": "ServicePrincipal-0ffa2118", "event": "Azure Tenant Handshake"}'::jsonb, '2026-10-21T10:56:08.036627+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (12, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'MFA Enforcement Audit', 'Security', 'warning', 'SecurityOfficer', '{"actor": "SecurityOfficer", "event": "MFA Enforcement Audit"}'::jsonb, '2026-10-21T10:56:08.037481+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (13, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'User Login Success', 'Auth', 'success', 'admin@zentech.com', '{"actor": "admin@zentech.com", "event": "User Login Success"}'::jsonb, '2026-10-21T11:04:13.792430+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (14, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Azure Tenant Handshake', 'Directory', 'success', 'ServicePrincipal-0ffa2118', '{"actor": "ServicePrincipal-0ffa2118", "event": "Azure Tenant Handshake"}'::jsonb, '2026-10-21T11:04:13.796810+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (15, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'MFA Enforcement Audit', 'Security', 'warning', 'SecurityOfficer', '{"actor": "SecurityOfficer", "event": "MFA Enforcement Audit"}'::jsonb, '2026-10-21T11:04:13.797683+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (16, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'User Login Success', 'Auth', 'success', 'admin@zentech.com', '{"event": "User Login Success"}'::jsonb, '2026-10-22T16:40:57.356699+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (17, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Azure Tenant Handshake', 'Directory', 'success', 'ServicePrincipal-0ffa2118', '{"event": "Azure Tenant Handshake"}'::jsonb, '2026-10-22T16:40:57.359983+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (18, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Database Migration Triggered', 'Database', 'success', 'SystemAdministrator', '{"event": "Database Migration Triggered"}'::jsonb, '2026-10-22T16:40:57.360631+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (22, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'User Login Success', 'Auth', 'success', 'admin@zentech.com', '{"event": "User Login Success"}'::jsonb, '2026-10-22T17:25:03.309198+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (23, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Azure Tenant Handshake', 'Directory', 'success', 'ServicePrincipal-0ffa2118', '{"event": "Azure Tenant Handshake"}'::jsonb, '2026-10-22T17:25:03.316065+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (24, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Database Migration Triggered', 'Database', 'success', 'SystemAdministrator', '{"event": "Database Migration Triggered"}'::jsonb, '2026-10-22T17:25:03.317039+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (28, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'User Login Success', 'Auth', 'success', 'admin@zentech.com', '{"event": "User Login Success"}'::jsonb, '2026-10-23T09:26:54.731939+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (29, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Azure Tenant Handshake', 'Directory', 'success', 'ServicePrincipal-0ffa2118', '{"event": "Azure Tenant Handshake"}'::jsonb, '2026-10-23T09:26:54.737352+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (30, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Database Migration Triggered', 'Database', 'success', 'SystemAdministrator', '{"event": "Database Migration Triggered"}'::jsonb, '2026-10-23T09:26:54.738270+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (34, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'User Login Success', 'Auth', 'success', 'admin@zentech.com', '{"event": "User Login Success"}'::jsonb, '2026-10-26T10:25:05.472208+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (35, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Azure Tenant Handshake', 'Directory', 'success', 'ServicePrincipal-0ffa2118', '{"event": "Azure Tenant Handshake"}'::jsonb, '2026-10-26T10:25:05.478849+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (36, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Database Migration Triggered', 'Database', 'success', 'SystemAdministrator', '{"event": "Database Migration Triggered"}'::jsonb, '2026-10-26T10:25:05.479722+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (37, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'User Login Success', 'Auth', 'success', 'admin@zentech.com', '{"event": "User Login Success"}'::jsonb, '2026-10-26T11:58:09.927079+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (38, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Azure Tenant Handshake', 'Directory', 'success', 'ServicePrincipal-0ffa2118', '{"event": "Azure Tenant Handshake"}'::jsonb, '2026-10-26T11:58:09.931561+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (39, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Database Migration Triggered', 'Database', 'success', 'SystemAdministrator', '{"event": "Database Migration Triggered"}'::jsonb, '2026-10-26T11:58:09.932387+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (52, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'User Login Success', 'Auth', 'success', 'admin@zentech.com', '{"event": "User Login Success"}'::jsonb, '2026-10-26T12:34:47.666675+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (53, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Azure Tenant Handshake', 'Directory', 'success', 'ServicePrincipal-0ffa2118', '{"event": "Azure Tenant Handshake"}'::jsonb, '2026-10-26T12:34:47.669772+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (54, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Database Migration Triggered', 'Database', 'success', 'SystemAdministrator', '{"event": "Database Migration Triggered"}'::jsonb, '2026-10-26T12:34:47.670316+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (55, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'User Login Success', 'Auth', 'success', 'admin@zentech.com', '{"event": "User Login Success"}'::jsonb, '2026-10-27T10:00:36.295660+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (56, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Azure Tenant Handshake', 'Directory', 'success', 'ServicePrincipal-0ffa2118', '{"event": "Azure Tenant Handshake"}'::jsonb, '2026-10-27T10:00:36.302249+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (57, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Database Migration Triggered', 'Database', 'success', 'SystemAdministrator', '{"event": "Database Migration Triggered"}'::jsonb, '2026-10-27T10:00:36.302957+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (61, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'User Login Success', 'Auth', 'success', 'admin@zentech.com', '{"event": "User Login Success"}'::jsonb, '2026-10-27T17:50:40.380279+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (62, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Azure Tenant Handshake', 'Directory', 'success', 'ServicePrincipal-0ffa2118', '{"event": "Azure Tenant Handshake"}'::jsonb, '2026-10-27T17:50:40.383245+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (63, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Database Migration Triggered', 'Database', 'success', 'SystemAdministrator', '{"event": "Database Migration Triggered"}'::jsonb, '2026-10-27T17:50:40.384132+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (67, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'User Login Success', 'Auth', 'success', 'admin@zentech.com', '{"event": "User Login Success"}'::jsonb, '2026-10-28T09:23:13.561970+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (68, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Azure Tenant Handshake', 'Directory', 'success', 'ServicePrincipal-0ffa2118', '{"event": "Azure Tenant Handshake"}'::jsonb, '2026-10-28T09:23:13.563176+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (69, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Database Migration Triggered', 'Database', 'success', 'SystemAdministrator', '{"event": "Database Migration Triggered"}'::jsonb, '2026-10-28T09:23:13.563839+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (73, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'User Login Success', 'Auth', 'success', 'admin@zentech.com', '{"event": "User Login Success"}'::jsonb, '2026-10-29T11:29:29.902867+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (74, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Azure Tenant Handshake', 'Directory', 'success', 'ServicePrincipal-0ffa2118', '{"event": "Azure Tenant Handshake"}'::jsonb, '2026-10-29T11:29:29.906888+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (75, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Database Migration Triggered', 'Database', 'success', 'SystemAdministrator', '{"event": "Database Migration Triggered"}'::jsonb, '2026-10-29T11:29:29.907845+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (79, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'User Login Success', 'Auth', 'success', 'admin@zentech.com', '{"event": "User Login Success"}'::jsonb, '2026-11-02T12:28:43.324128+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (80, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Azure Tenant Handshake', 'Directory', 'success', 'ServicePrincipal-0ffa2118', '{"event": "Azure Tenant Handshake"}'::jsonb, '2026-11-02T12:28:43.328270+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (81, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Database Migration Triggered', 'Database', 'success', 'SystemAdministrator', '{"event": "Database Migration Triggered"}'::jsonb, '2026-11-02T12:28:43.329143+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (85, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'User Login Success', 'Auth', 'success', 'admin@zentech.com', '{"event": "User Login Success"}'::jsonb, '2026-11-03T10:44:08.687272+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (86, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Azure Tenant Handshake', 'Directory', 'success', 'ServicePrincipal-0ffa2118', '{"event": "Azure Tenant Handshake"}'::jsonb, '2026-11-03T10:44:08.698586+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (87, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Database Migration Triggered', 'Database', 'success', 'SystemAdministrator', '{"event": "Database Migration Triggered"}'::jsonb, '2026-11-03T10:44:08.699449+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (91, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'User Login Success', 'Auth', 'success', 'admin@zentech.com', '{"event": "User Login Success"}'::jsonb, '2026-11-04T10:06:11.403311+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (92, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Azure Tenant Handshake', 'Directory', 'success', 'ServicePrincipal-0ffa2118', '{"event": "Azure Tenant Handshake"}'::jsonb, '2026-11-04T10:06:11.404747+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (93, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Database Migration Triggered', 'Database', 'success', 'SystemAdministrator', '{"event": "Database Migration Triggered"}'::jsonb, '2026-11-04T10:06:11.405528+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (97, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'User Login Success', 'Auth', 'success', 'admin@zentech.com', '{"event": "User Login Success"}'::jsonb, '2026-11-04T11:31:48.805747+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (98, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Azure Tenant Handshake', 'Directory', 'success', 'ServicePrincipal-0ffa2118', '{"event": "Azure Tenant Handshake"}'::jsonb, '2026-11-04T11:31:48.807052+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (99, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Database Migration Triggered', 'Database', 'success', 'SystemAdministrator', '{"event": "Database Migration Triggered"}'::jsonb, '2026-11-04T11:31:48.807789+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (103, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'User Login Success', 'Auth', 'success', 'admin@zentech.com', '{"event": "User Login Success"}'::jsonb, '2026-11-04T12:12:57.515831+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (104, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Azure Tenant Handshake', 'Directory', 'success', 'ServicePrincipal-0ffa2118', '{"event": "Azure Tenant Handshake"}'::jsonb, '2026-11-04T12:12:57.516949+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (105, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Database Migration Triggered', 'Database', 'success', 'SystemAdministrator', '{"event": "Database Migration Triggered"}'::jsonb, '2026-11-04T12:12:57.517662+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (106, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'User Login Success', 'Auth', 'success', 'admin@zentech.com', '{"event": "User Login Success"}'::jsonb, '2026-11-05T17:53:24.802262+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (107, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Azure Tenant Handshake', 'Directory', 'success', 'ServicePrincipal-0ffa2118', '{"event": "Azure Tenant Handshake"}'::jsonb, '2026-11-05T17:53:24.814435+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (108, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Database Migration Triggered', 'Database', 'success', 'SystemAdministrator', '{"event": "Database Migration Triggered"}'::jsonb, '2026-11-05T17:53:24.815134+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (109, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'User Login Success', 'Auth', 'success', 'admin@zentech.com', '{"event": "User Login Success"}'::jsonb, '2026-11-05T17:53:31.543697+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (110, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Azure Tenant Handshake', 'Directory', 'success', 'ServicePrincipal-0ffa2118', '{"event": "Azure Tenant Handshake"}'::jsonb, '2026-11-05T17:53:31.546724+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (111, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Database Migration Triggered', 'Database', 'success', 'SystemAdministrator', '{"event": "Database Migration Triggered"}'::jsonb, '2026-11-05T17:53:31.547278+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (112, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'User Login Success', 'Auth', 'success', 'admin@zentech.com', '{"event": "User Login Success"}'::jsonb, '2026-11-12T16:04:14.243430+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (113, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Azure Tenant Handshake', 'Directory', 'success', 'ServicePrincipal-0ffa2118', '{"event": "Azure Tenant Handshake"}'::jsonb, '2026-11-12T16:04:14.253084+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (114, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Database Migration Triggered', 'Database', 'success', 'SystemAdministrator', '{"event": "Database Migration Triggered"}'::jsonb, '2026-11-12T16:04:14.253703+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (115, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'User Login Success', 'Auth', 'success', 'admin@zentech.com', '{"event": "User Login Success"}'::jsonb, '2026-11-12T16:04:23.963781+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (116, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Azure Tenant Handshake', 'Directory', 'success', 'ServicePrincipal-0ffa2118', '{"event": "Azure Tenant Handshake"}'::jsonb, '2026-11-12T16:04:23.966401+05:30') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs ("id", "tenant_id", "activity_name", "category", "status", "actor", "raw_json", "created_at") VALUES (117, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Database Migration Triggered', 'Database', 'success', 'SystemAdministrator', '{"event": "Database Migration Triggered"}'::jsonb, '2026-11-12T16:04:23.967063+05:30') ON CONFLICT DO NOTHING;

-- Table: auth_emails (14 rows)
-- ----------------------------------------
INSERT INTO auth_emails ("id", "user_id", "recipient_email", "sender_email", "subject", "otp_code", "html_body", "plain_body", "delivery_method", "delivery_status", "created_at") VALUES (2, 22, 'priyanka.k@cybaemtech.com', 'noreply@cybaemtech.com', 'Zensus - Email Verification Code', '643265', '
    <html><body style="font-family:Inter,Segoe UI,-apple-system,sans-serif;background:#f8fafc;margin:0;padding:24px;">
      <div style="max-width:520px;margin:20px auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;padding:36px 32px;box-shadow:0 4px 12px rgba(15,23,42,0.05);">
        <div style="text-align:center;margin-bottom:24px;">
          <h2 style="color:#0f172a;margin:0 0 6px;font-size:22px;font-weight:700;">Zensus Verification Code</h2>
          <p style="color:#64748b;margin:0;font-size:13px;">Enterprise Cloud Operations & Identity Management</p>
        </div>
        <p style="color:#334155;margin:0 0 16px;font-size:15px;line-height:1.5;">
          Hello <strong>priyanka karanjewar</strong>,
        </p>
        <p style="color:#475569;margin:0 0 24px;font-size:14px;line-height:1.6;">
          Thank you for registering with Zensus. Your email verification code is:
        </p>
        <div style="text-align:center;margin:28px 0;">
          <div style="display:inline-block;font-size:38px;font-weight:800;letter-spacing:10px;color:#008cff;background:#eff6ff;padding:16px 28px;border-radius:10px;border:2px dashed #93c5fd;font-family:Consolas,monospace;">
            643265
          </div>
        </div>
        <p style="color:#64748b;font-size:13px;margin:0 0 10px;text-align:center;">
          ⏰ This code is valid for <strong>5 minutes</strong>. Please do not share this code with anyone.
        </p>
        <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">
          If you did not request this verification, please ignore this email.
        </p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0 20px;">
        <p style="color:#94a3b8;font-size:11px;margin:0;text-align:center;">
          ZensusTech Security Team · Sent from noreply@cybaemtech.com
        </p>
      </div>
    </body></html>
    ', 'Hello priyanka karanjewar,

Thank you for registering with Zensus.
Your email verification code is: 643265

This code is valid for 5 minutes. Please do not share this code with anyone.
If you did not request this verification, please ignore this email.

Regards,
Zensus Team
Sent from noreply@cybaemtech.com
', 'smtp', 'sent_via_smtp', '2026-11-12T14:01:29.804243+05:30') ON CONFLICT DO NOTHING;
INSERT INTO auth_emails ("id", "user_id", "recipient_email", "sender_email", "subject", "otp_code", "html_body", "plain_body", "delivery_method", "delivery_status", "created_at") VALUES (3, 23, 'test_pg_flow@example.com', 'noreply@cybaemtech.com', 'Zensus - Email Verification Code', '216851', '
    <html><body style="font-family:Inter,Segoe UI,-apple-system,sans-serif;background:#f8fafc;margin:0;padding:24px;">
      <div style="max-width:520px;margin:20px auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;padding:36px 32px;box-shadow:0 4px 12px rgba(15,23,42,0.05);">
        <div style="text-align:center;margin-bottom:24px;">
          <h2 style="color:#0f172a;margin:0 0 6px;font-size:22px;font-weight:700;">Zensus Verification Code</h2>
          <p style="color:#64748b;margin:0;font-size:13px;">Enterprise Cloud Operations & Identity Management</p>
        </div>
        <p style="color:#334155;margin:0 0 16px;font-size:15px;line-height:1.5;">
          Hello <strong>PG Test User</strong>,
        </p>
        <p style="color:#475569;margin:0 0 24px;font-size:14px;line-height:1.6;">
          Thank you for registering with Zensus. Your email verification code is:
        </p>
        <div style="text-align:center;margin:28px 0;">
          <div style="display:inline-block;font-size:38px;font-weight:800;letter-spacing:10px;color:#008cff;background:#eff6ff;padding:16px 28px;border-radius:10px;border:2px dashed #93c5fd;font-family:Consolas,monospace;">
            216851
          </div>
        </div>
        <p style="color:#64748b;font-size:13px;margin:0 0 10px;text-align:center;">
          ⏰ This code is valid for <strong>5 minutes</strong>. Please do not share this code with anyone.
        </p>
        <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">
          If you did not request this verification, please ignore this email.
        </p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0 20px;">
        <p style="color:#94a3b8;font-size:11px;margin:0;text-align:center;">
          ZensusTech Security Team · Sent from noreply@cybaemtech.com
        </p>
      </div>
    </body></html>
    ', 'Hello PG Test User,

Thank you for registering with Zensus.
Your email verification code is: 216851

This code is valid for 5 minutes. Please do not share this code with anyone.
If you did not request this verification, please ignore this email.

Regards,
Zensus Team
Sent from noreply@cybaemtech.com
', 'database', 'stored_in_db', '2026-11-12T15:07:17.417630+05:30') ON CONFLICT DO NOTHING;
INSERT INTO auth_emails ("id", "user_id", "recipient_email", "sender_email", "subject", "otp_code", "html_body", "plain_body", "delivery_method", "delivery_status", "created_at") VALUES (4, 24, 'returning_user_test@example.com', 'noreply@cybaemtech.com', 'Zensus - Email Verification Code', '453291', '
    <html><body style="font-family:Inter,Segoe UI,-apple-system,sans-serif;background:#f8fafc;margin:0;padding:24px;">
      <div style="max-width:520px;margin:20px auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;padding:36px 32px;box-shadow:0 4px 12px rgba(15,23,42,0.05);">
        <div style="text-align:center;margin-bottom:24px;">
          <h2 style="color:#0f172a;margin:0 0 6px;font-size:22px;font-weight:700;">Zensus Verification Code</h2>
          <p style="color:#64748b;margin:0;font-size:13px;">Enterprise Cloud Operations & Identity Management</p>
        </div>
        <p style="color:#334155;margin:0 0 16px;font-size:15px;line-height:1.5;">
          Hello <strong>Jane Doe</strong>,
        </p>
        <p style="color:#475569;margin:0 0 24px;font-size:14px;line-height:1.6;">
          Thank you for registering with Zensus. Your email verification code is:
        </p>
        <div style="text-align:center;margin:28px 0;">
          <div style="display:inline-block;font-size:38px;font-weight:800;letter-spacing:10px;color:#008cff;background:#eff6ff;padding:16px 28px;border-radius:10px;border:2px dashed #93c5fd;font-family:Consolas,monospace;">
            453291
          </div>
        </div>
        <p style="color:#64748b;font-size:13px;margin:0 0 10px;text-align:center;">
          ⏰ This code is valid for <strong>5 minutes</strong>. Please do not share this code with anyone.
        </p>
        <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">
          If you did not request this verification, please ignore this email.
        </p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0 20px;">
        <p style="color:#94a3b8;font-size:11px;margin:0;text-align:center;">
          ZensusTech Security Team · Sent from noreply@cybaemtech.com
        </p>
      </div>
    </body></html>
    ', 'Hello Jane Doe,

Thank you for registering with Zensus.
Your email verification code is: 453291

This code is valid for 5 minutes. Please do not share this code with anyone.
If you did not request this verification, please ignore this email.

Regards,
Zensus Team
Sent from noreply@cybaemtech.com
', 'database', 'stored_in_db', '2026-11-12T17:09:25.252425+05:30') ON CONFLICT DO NOTHING;
INSERT INTO auth_emails ("id", "user_id", "recipient_email", "sender_email", "subject", "otp_code", "html_body", "plain_body", "delivery_method", "delivery_status", "created_at") VALUES (5, 25, 'priyankakaranjewar567@gmail.com', 'noreply@cybaemtech.com', 'Zensus - Email Verification Code', '798074', '
    <html><body style="font-family:Inter,Segoe UI,-apple-system,sans-serif;background:#f8fafc;margin:0;padding:24px;">
      <div style="max-width:520px;margin:20px auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;padding:36px 32px;box-shadow:0 4px 12px rgba(15,23,42,0.05);">
        <div style="text-align:center;margin-bottom:24px;">
          <h2 style="color:#0f172a;margin:0 0 6px;font-size:22px;font-weight:700;">Zensus Verification Code</h2>
          <p style="color:#64748b;margin:0;font-size:13px;">Enterprise Cloud Operations & Identity Management</p>
        </div>
        <p style="color:#334155;margin:0 0 16px;font-size:15px;line-height:1.5;">
          Hello <strong>priya K</strong>,
        </p>
        <p style="color:#475569;margin:0 0 24px;font-size:14px;line-height:1.6;">
          Thank you for registering with Zensus. Your email verification code is:
        </p>
        <div style="text-align:center;margin:28px 0;">
          <div style="display:inline-block;font-size:38px;font-weight:800;letter-spacing:10px;color:#008cff;background:#eff6ff;padding:16px 28px;border-radius:10px;border:2px dashed #93c5fd;font-family:Consolas,monospace;">
            798074
          </div>
        </div>
        <p style="color:#64748b;font-size:13px;margin:0 0 10px;text-align:center;">
          ⏰ This code is valid for <strong>5 minutes</strong>. Please do not share this code with anyone.
        </p>
        <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">
          If you did not request this verification, please ignore this email.
        </p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0 20px;">
        <p style="color:#94a3b8;font-size:11px;margin:0;text-align:center;">
          ZensusTech Security Team · Sent from noreply@cybaemtech.com
        </p>
      </div>
    </body></html>
    ', 'Hello priya K,

Thank you for registering with Zensus.
Your email verification code is: 798074

This code is valid for 5 minutes. Please do not share this code with anyone.
If you did not request this verification, please ignore this email.

Regards,
Zensus Team
Sent from noreply@cybaemtech.com
', 'smtp', 'sent_via_smtp', '2026-11-16T10:44:40.689619+05:30') ON CONFLICT DO NOTHING;
INSERT INTO auth_emails ("id", "user_id", "recipient_email", "sender_email", "subject", "otp_code", "html_body", "plain_body", "delivery_method", "delivery_status", "created_at") VALUES (6, 25, 'priyankakaranjewar567@gmail.com', 'noreply@cybaemtech.com', 'Zensus - Email Verification Code', '667296', '
    <html><body style="font-family:Inter,Segoe UI,-apple-system,sans-serif;background:#f8fafc;margin:0;padding:24px;">
      <div style="max-width:520px;margin:20px auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;padding:36px 32px;box-shadow:0 4px 12px rgba(15,23,42,0.05);">
        <div style="text-align:center;margin-bottom:24px;">
          <h2 style="color:#0f172a;margin:0 0 6px;font-size:22px;font-weight:700;">Zensus Verification Code</h2>
          <p style="color:#64748b;margin:0;font-size:13px;">Enterprise Cloud Operations & Identity Management</p>
        </div>
        <p style="color:#334155;margin:0 0 16px;font-size:15px;line-height:1.5;">
          Hello <strong>priya K</strong>,
        </p>
        <p style="color:#475569;margin:0 0 24px;font-size:14px;line-height:1.6;">
          Thank you for registering with Zensus. Your email verification code is:
        </p>
        <div style="text-align:center;margin:28px 0;">
          <div style="display:inline-block;font-size:38px;font-weight:800;letter-spacing:10px;color:#008cff;background:#eff6ff;padding:16px 28px;border-radius:10px;border:2px dashed #93c5fd;font-family:Consolas,monospace;">
            667296
          </div>
        </div>
        <p style="color:#64748b;font-size:13px;margin:0 0 10px;text-align:center;">
          ⏰ This code is valid for <strong>5 minutes</strong>. Please do not share this code with anyone.
        </p>
        <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">
          If you did not request this verification, please ignore this email.
        </p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0 20px;">
        <p style="color:#94a3b8;font-size:11px;margin:0;text-align:center;">
          ZensusTech Security Team · Sent from noreply@cybaemtech.com
        </p>
      </div>
    </body></html>
    ', 'Hello priya K,

Thank you for registering with Zensus.
Your email verification code is: 667296

This code is valid for 5 minutes. Please do not share this code with anyone.
If you did not request this verification, please ignore this email.

Regards,
Zensus Team
Sent from noreply@cybaemtech.com
', 'smtp', 'sent_via_smtp', '2026-11-16T10:45:47.591748+05:30') ON CONFLICT DO NOTHING;
INSERT INTO auth_emails ("id", "user_id", "recipient_email", "sender_email", "subject", "otp_code", "html_body", "plain_body", "delivery_method", "delivery_status", "created_at") VALUES (7, 25, 'priyankakaranjewar567@gmail.com', 'noreply@cybaemtech.com', 'Zensus - Email Verification Code', '803739', '
    <html><body style="font-family:Inter,Segoe UI,-apple-system,sans-serif;background:#f8fafc;margin:0;padding:24px;">
      <div style="max-width:520px;margin:20px auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;padding:36px 32px;box-shadow:0 4px 12px rgba(15,23,42,0.05);">
        <div style="text-align:center;margin-bottom:24px;">
          <h2 style="color:#0f172a;margin:0 0 6px;font-size:22px;font-weight:700;">Zensus Verification Code</h2>
          <p style="color:#64748b;margin:0;font-size:13px;">Enterprise Cloud Operations & Identity Management</p>
        </div>
        <p style="color:#334155;margin:0 0 16px;font-size:15px;line-height:1.5;">
          Hello <strong>priya K</strong>,
        </p>
        <p style="color:#475569;margin:0 0 24px;font-size:14px;line-height:1.6;">
          Thank you for registering with Zensus. Your email verification code is:
        </p>
        <div style="text-align:center;margin:28px 0;">
          <div style="display:inline-block;font-size:38px;font-weight:800;letter-spacing:10px;color:#008cff;background:#eff6ff;padding:16px 28px;border-radius:10px;border:2px dashed #93c5fd;font-family:Consolas,monospace;">
            803739
          </div>
        </div>
        <p style="color:#64748b;font-size:13px;margin:0 0 10px;text-align:center;">
          ⏰ This code is valid for <strong>5 minutes</strong>. Please do not share this code with anyone.
        </p>
        <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">
          If you did not request this verification, please ignore this email.
        </p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0 20px;">
        <p style="color:#94a3b8;font-size:11px;margin:0;text-align:center;">
          ZensusTech Security Team · Sent from noreply@cybaemtech.com
        </p>
      </div>
    </body></html>
    ', 'Hello priya K,

Thank you for registering with Zensus.
Your email verification code is: 803739

This code is valid for 5 minutes. Please do not share this code with anyone.
If you did not request this verification, please ignore this email.

Regards,
Zensus Team
Sent from noreply@cybaemtech.com
', 'smtp', 'sent_via_smtp', '2026-11-16T11:12:36.447612+05:30') ON CONFLICT DO NOTHING;
INSERT INTO auth_emails ("id", "user_id", "recipient_email", "sender_email", "subject", "otp_code", "html_body", "plain_body", "delivery_method", "delivery_status", "created_at") VALUES (8, 26, 'priyankakaranjewar448@gmail.com', 'noreply@cybaemtech.com', 'Zensus - One-Time Email Verification Code', '409967', '
    <html><body style="font-family:Inter,Segoe UI,-apple-system,sans-serif;background:#f8fafc;margin:0;padding:24px;">
      <div style="max-width:520px;margin:20px auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;padding:36px 32px;box-shadow:0 4px 12px rgba(15,23,42,0.05);">
        <div style="text-align:center;margin-bottom:24px;">
          <h2 style="color:#0f172a;margin:0 0 6px;font-size:22px;font-weight:700;">Zensus One-Time Email Verification</h2>
          <p style="color:#64748b;margin:0;font-size:13px;">Enterprise Cloud Operations & Identity Management</p>
        </div>
        <p style="color:#334155;margin:0 0 16px;font-size:15px;line-height:1.5;">
          Hello <strong>priyanka k</strong>,
        </p>
        <p style="color:#475569;margin:0 0 24px;font-size:14px;line-height:1.6;">
          Thank you for registering with Zensus. Your one-time email verification code is:
        </p>
        <div style="text-align:center;margin:28px 0;">
          <div style="display:inline-block;font-size:38px;font-weight:800;letter-spacing:10px;color:#008cff;background:#eff6ff;padding:16px 28px;border-radius:10px;border:2px dashed #93c5fd;font-family:Consolas,monospace;">
            409967
          </div>
        </div>
        <p style="color:#64748b;font-size:13px;margin:0 0 10px;text-align:center;">
          ⏰ This code is valid for <strong>5 minutes</strong>. Enter this code to verify your account once.
        </p>
        <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">
          If you did not request this verification, please ignore this email.
        </p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0 20px;">
        <p style="color:#94a3b8;font-size:11px;margin:0;text-align:center;">
          ZensusTech Security Team · Sent from noreply@cybaemtech.com
        </p>
      </div>
    </body></html>
    ', 'Hello priyanka k,

Thank you for registering with Zensus.
Your one-time email verification code is: 409967

This code is valid for 5 minutes. Enter this code to verify your account.
If you did not request this verification, please ignore this email.

Regards,
Zensus Team
Sent from noreply@cybaemtech.com
', 'smtp', 'sent_via_smtp', '2026-11-17T16:49:06.923985+05:30') ON CONFLICT DO NOTHING;
INSERT INTO auth_emails ("id", "user_id", "recipient_email", "sender_email", "subject", "otp_code", "html_body", "plain_body", "delivery_method", "delivery_status", "created_at") VALUES (9, 27, 'priyankakaranjewar1323@gmail.com', 'noreply@cybaemtech.com', 'Zensus - One-Time Email Verification Code', '275200', '
    <html><body style="font-family:Inter,Segoe UI,-apple-system,sans-serif;background:#f8fafc;margin:0;padding:24px;">
      <div style="max-width:520px;margin:20px auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;padding:36px 32px;box-shadow:0 4px 12px rgba(15,23,42,0.05);">
        <div style="text-align:center;margin-bottom:24px;">
          <h2 style="color:#0f172a;margin:0 0 6px;font-size:22px;font-weight:700;">Zensus One-Time Email Verification</h2>
          <p style="color:#64748b;margin:0;font-size:13px;">Enterprise Cloud Operations & Identity Management</p>
        </div>
        <p style="color:#334155;margin:0 0 16px;font-size:15px;line-height:1.5;">
          Hello <strong>priya patil</strong>,
        </p>
        <p style="color:#475569;margin:0 0 24px;font-size:14px;line-height:1.6;">
          Thank you for registering with Zensus. Your one-time email verification code is:
        </p>
        <div style="text-align:center;margin:28px 0;">
          <div style="display:inline-block;font-size:38px;font-weight:800;letter-spacing:10px;color:#008cff;background:#eff6ff;padding:16px 28px;border-radius:10px;border:2px dashed #93c5fd;font-family:Consolas,monospace;">
            275200
          </div>
        </div>
        <p style="color:#64748b;font-size:13px;margin:0 0 10px;text-align:center;">
          ⏰ This code is valid for <strong>5 minutes</strong>. Enter this code to verify your account once.
        </p>
        <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">
          If you did not request this verification, please ignore this email.
        </p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0 20px;">
        <p style="color:#94a3b8;font-size:11px;margin:0;text-align:center;">
          ZensusTech Security Team · Sent from noreply@cybaemtech.com
        </p>
      </div>
    </body></html>
    ', 'Hello priya patil,

Thank you for registering with Zensus.
Your one-time email verification code is: 275200

This code is valid for 5 minutes. Enter this code to verify your account.
If you did not request this verification, please ignore this email.

Regards,
Zensus Team
Sent from noreply@cybaemtech.com
', 'smtp', 'sent_via_smtp', '2026-11-17T16:50:57.771254+05:30') ON CONFLICT DO NOTHING;
INSERT INTO auth_emails ("id", "user_id", "recipient_email", "sender_email", "subject", "otp_code", "html_body", "plain_body", "delivery_method", "delivery_status", "created_at") VALUES (10, 28, 'priyankakaranjewar448@gmail.cpm', 'noreply@cybaemtech.com', 'Zensus - One-Time Email Verification Code', '683564', '
    <html><body style="font-family:Inter,Segoe UI,-apple-system,sans-serif;background:#f8fafc;margin:0;padding:24px;">
      <div style="max-width:520px;margin:20px auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;padding:36px 32px;box-shadow:0 4px 12px rgba(15,23,42,0.05);">
        <div style="text-align:center;margin-bottom:24px;">
          <h2 style="color:#0f172a;margin:0 0 6px;font-size:22px;font-weight:700;">Zensus One-Time Email Verification</h2>
          <p style="color:#64748b;margin:0;font-size:13px;">Enterprise Cloud Operations & Identity Management</p>
        </div>
        <p style="color:#334155;margin:0 0 16px;font-size:15px;line-height:1.5;">
          Hello <strong>anmol patil</strong>,
        </p>
        <p style="color:#475569;margin:0 0 24px;font-size:14px;line-height:1.6;">
          Thank you for registering with Zensus. Your one-time email verification code is:
        </p>
        <div style="text-align:center;margin:28px 0;">
          <div style="display:inline-block;font-size:38px;font-weight:800;letter-spacing:10px;color:#008cff;background:#eff6ff;padding:16px 28px;border-radius:10px;border:2px dashed #93c5fd;font-family:Consolas,monospace;">
            683564
          </div>
        </div>
        <p style="color:#64748b;font-size:13px;margin:0 0 10px;text-align:center;">
          ⏰ This code is valid for <strong>5 minutes</strong>. Enter this code to verify your account once.
        </p>
        <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">
          If you did not request this verification, please ignore this email.
        </p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0 20px;">
        <p style="color:#94a3b8;font-size:11px;margin:0;text-align:center;">
          ZensusTech Security Team · Sent from noreply@cybaemtech.com
        </p>
      </div>
    </body></html>
    ', 'Hello anmol patil,

Thank you for registering with Zensus.
Your one-time email verification code is: 683564

This code is valid for 5 minutes. Enter this code to verify your account.
If you did not request this verification, please ignore this email.

Regards,
Zensus Team
Sent from noreply@cybaemtech.com
', 'database', 'stored_in_db', '2026-11-19T14:47:47.010686+05:30') ON CONFLICT DO NOTHING;
INSERT INTO auth_emails ("id", "user_id", "recipient_email", "sender_email", "subject", "otp_code", "html_body", "plain_body", "delivery_method", "delivery_status", "created_at") VALUES (11, 27, 'priyankakaranjewar1323@gmail.com', 'noreply@cybaemtech.com', 'Zensus - Your New Temporary Password', 'ZxP!0!2dUJ', '
    <html><body style="font-family:Inter,Segoe UI,-apple-system,sans-serif;background:#f8fafc;margin:0;padding:24px;">
      <div style="max-width:520px;margin:20px auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;padding:36px 32px;box-shadow:0 4px 12px rgba(15,23,42,0.05);">
        <div style="text-align:center;margin-bottom:24px;">
          <h2 style="color:#0f172a;margin:0 0 6px;font-size:22px;font-weight:700;">Zensus Password Reset</h2>
          <p style="color:#64748b;margin:0;font-size:13px;">Enterprise Cloud Operations & Identity Management</p>
        </div>
        <p style="color:#334155;margin:0 0 16px;font-size:15px;line-height:1.5;">
          Hello <strong>priya patil</strong>,
        </p>
        <p style="color:#475569;margin:0 0 20px;font-size:14px;line-height:1.6;">
          You requested a password reset for your ZensusTech account. A new random password has been generated for you:
        </p>
        <div style="text-align:center;margin:24px 0;">
          <div style="display:inline-block;font-size:28px;font-weight:800;letter-spacing:3px;color:#008cff;background:#eff6ff;padding:14px 24px;border-radius:10px;border:2px dashed #93c5fd;font-family:Consolas,monospace;">
            ZxP!0!2dUJ
          </div>
        </div>
        <p style="color:#475569;font-size:13px;margin:0 0 12px;text-align:center;">
          🔑 Use this new temporary password to sign in at <a href="http://localhost:3000" style="color:#008cff;font-weight:600;text-decoration:none;">ZensusTech Cloud</a>.
        </p>
        <p style="color:#64748b;font-size:12px;margin:0 0 10px;text-align:center;">
          For your account security, you can change your password at any time once logged in.
        </p>
        <p style="color:#94a3b8;font-size:11px;margin:0;text-align:center;">
          If you did not request this password reset, please contact your administrator immediately.
        </p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0 18px;">
        <p style="color:#94a3b8;font-size:11px;margin:0;text-align:center;">
          ZensusTech Security Team · Sent from noreply@cybaemtech.com
        </p>
      </div>
    </body></html>
    ', 'Hello priya patil,

You requested a password reset for your ZensusTech account.
Your new temporary password is: ZxP!0!2dUJ

Use this password to sign in to ZensusTech.
For your security, you can change your password once you are logged in.

If you did not request this password reset, please contact your administrator immediately.

Regards,
Zensus Team
Sent from noreply@cybaemtech.com
', 'smtp', 'sent_via_smtp', '2026-11-19T17:39:28.414133+05:30') ON CONFLICT DO NOTHING;
INSERT INTO auth_emails ("id", "user_id", "recipient_email", "sender_email", "subject", "otp_code", "html_body", "plain_body", "delivery_method", "delivery_status", "created_at") VALUES (12, 29, 'salunkhe.vinayak@gmail.com', 'noreply@cybaemtech.com', 'Zensus - One-Time Email Verification Code', '777976', '
    <html><body style="font-family:Inter,Segoe UI,-apple-system,sans-serif;background:#f8fafc;margin:0;padding:24px;">
      <div style="max-width:520px;margin:20px auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;padding:36px 32px;box-shadow:0 4px 12px rgba(15,23,42,0.05);">
        <div style="text-align:center;margin-bottom:24px;">
          <h2 style="color:#0f172a;margin:0 0 6px;font-size:22px;font-weight:700;">Zensus One-Time Email Verification</h2>
          <p style="color:#64748b;margin:0;font-size:13px;">Enterprise Cloud Operations & Identity Management</p>
        </div>
        <p style="color:#334155;margin:0 0 16px;font-size:15px;line-height:1.5;">
          Hello <strong>vinayak s</strong>,
        </p>
        <p style="color:#475569;margin:0 0 24px;font-size:14px;line-height:1.6;">
          Thank you for registering with Zensus. Your one-time email verification code is:
        </p>
        <div style="text-align:center;margin:28px 0;">
          <div style="display:inline-block;font-size:38px;font-weight:800;letter-spacing:10px;color:#008cff;background:#eff6ff;padding:16px 28px;border-radius:10px;border:2px dashed #93c5fd;font-family:Consolas,monospace;">
            777976
          </div>
        </div>
        <p style="color:#64748b;font-size:13px;margin:0 0 10px;text-align:center;">
          ⏰ This code is valid for <strong>5 minutes</strong>. Enter this code to verify your account once.
        </p>
        <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">
          If you did not request this verification, please ignore this email.
        </p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0 20px;">
        <p style="color:#94a3b8;font-size:11px;margin:0;text-align:center;">
          ZensusTech Security Team · Sent from noreply@cybaemtech.com
        </p>
      </div>
    </body></html>
    ', 'Hello vinayak s,

Thank you for registering with Zensus.
Your one-time email verification code is: 777976

This code is valid for 5 minutes. Enter this code to verify your account.
If you did not request this verification, please ignore this email.

Regards,
Zensus Team
Sent from noreply@cybaemtech.com
', 'smtp', 'sent_via_smtp', '2026-11-23T10:40:27.572516+05:30') ON CONFLICT DO NOTHING;
INSERT INTO auth_emails ("id", "user_id", "recipient_email", "sender_email", "subject", "otp_code", "html_body", "plain_body", "delivery_method", "delivery_status", "created_at") VALUES (13, 30, 'render_test_5311@example.com', 'noreply@cybaemtech.com', 'Zensus - One-Time Email Verification Code', '584616', '
    <html><body style="font-family:Inter,Segoe UI,-apple-system,sans-serif;background:#f8fafc;margin:0;padding:24px;">
      <div style="max-width:520px;margin:20px auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;padding:36px 32px;box-shadow:0 4px 12px rgba(15,23,42,0.05);">
        <div style="text-align:center;margin-bottom:24px;">
          <h2 style="color:#0f172a;margin:0 0 6px;font-size:22px;font-weight:700;">Zensus One-Time Email Verification</h2>
          <p style="color:#64748b;margin:0;font-size:13px;">Enterprise Cloud Operations & Identity Management</p>
        </div>
        <p style="color:#334155;margin:0 0 16px;font-size:15px;line-height:1.5;">
          Hello <strong>Render Tester</strong>,
        </p>
        <p style="color:#475569;margin:0 0 24px;font-size:14px;line-height:1.6;">
          Thank you for registering with Zensus. Your one-time email verification code is:
        </p>
        <div style="text-align:center;margin:28px 0;">
          <div style="display:inline-block;font-size:38px;font-weight:800;letter-spacing:10px;color:#008cff;background:#eff6ff;padding:16px 28px;border-radius:10px;border:2px dashed #93c5fd;font-family:Consolas,monospace;">
            584616
          </div>
        </div>
        <p style="color:#64748b;font-size:13px;margin:0 0 10px;text-align:center;">
          ⏰ This code is valid for <strong>5 minutes</strong>. Enter this code to verify your account once.
        </p>
        <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">
          If you did not request this verification, please ignore this email.
        </p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0 20px;">
        <p style="color:#94a3b8;font-size:11px;margin:0;text-align:center;">
          ZensusTech Security Team · Sent from noreply@cybaemtech.com
        </p>
      </div>
    </body></html>
    ', 'Hello Render Tester,

Thank you for registering with Zensus.
Your one-time email verification code is: 584616

This code is valid for 5 minutes. Enter this code to verify your account.
If you did not request this verification, please ignore this email.

Regards,
Zensus Team
Sent from noreply@cybaemtech.com
', 'database', 'stored_in_db', '2026-11-23T13:13:22.283615+05:30') ON CONFLICT DO NOTHING;
INSERT INTO auth_emails ("id", "user_id", "recipient_email", "sender_email", "subject", "otp_code", "html_body", "plain_body", "delivery_method", "delivery_status", "created_at") VALUES (14, 31, 'render_test_direct@example.com', 'noreply@cybaemtech.com', 'Zensus - One-Time Email Verification Code', '592309', '
    <html><body style="font-family:Inter,Segoe UI,-apple-system,sans-serif;background:#f8fafc;margin:0;padding:24px;">
      <div style="max-width:520px;margin:20px auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;padding:36px 32px;box-shadow:0 4px 12px rgba(15,23,42,0.05);">
        <div style="text-align:center;margin-bottom:24px;">
          <h2 style="color:#0f172a;margin:0 0 6px;font-size:22px;font-weight:700;">Zensus One-Time Email Verification</h2>
          <p style="color:#64748b;margin:0;font-size:13px;">Enterprise Cloud Operations & Identity Management</p>
        </div>
        <p style="color:#334155;margin:0 0 16px;font-size:15px;line-height:1.5;">
          Hello <strong>Render Tester</strong>,
        </p>
        <p style="color:#475569;margin:0 0 24px;font-size:14px;line-height:1.6;">
          Thank you for registering with Zensus. Your one-time email verification code is:
        </p>
        <div style="text-align:center;margin:28px 0;">
          <div style="display:inline-block;font-size:38px;font-weight:800;letter-spacing:10px;color:#008cff;background:#eff6ff;padding:16px 28px;border-radius:10px;border:2px dashed #93c5fd;font-family:Consolas,monospace;">
            592309
          </div>
        </div>
        <p style="color:#64748b;font-size:13px;margin:0 0 10px;text-align:center;">
          ⏰ This code is valid for <strong>5 minutes</strong>. Enter this code to verify your account once.
        </p>
        <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">
          If you did not request this verification, please ignore this email.
        </p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0 20px;">
        <p style="color:#94a3b8;font-size:11px;margin:0;text-align:center;">
          ZensusTech Security Team · Sent from noreply@cybaemtech.com
        </p>
      </div>
    </body></html>
    ', 'Hello Render Tester,

Thank you for registering with Zensus.
Your one-time email verification code is: 592309

This code is valid for 5 minutes. Enter this code to verify your account.
If you did not request this verification, please ignore this email.

Regards,
Zensus Team
Sent from noreply@cybaemtech.com
', 'database', 'stored_in_db', '2026-11-23T13:15:58.137026+05:30') ON CONFLICT DO NOTHING;
INSERT INTO auth_emails ("id", "user_id", "recipient_email", "sender_email", "subject", "otp_code", "html_body", "plain_body", "delivery_method", "delivery_status", "created_at") VALUES (15, 32, 'render_test_3293@example.com', 'noreply@cybaemtech.com', 'Zensus - One-Time Email Verification Code', '320813', '
    <html><body style="font-family:Inter,Segoe UI,-apple-system,sans-serif;background:#f8fafc;margin:0;padding:24px;">
      <div style="max-width:520px;margin:20px auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;padding:36px 32px;box-shadow:0 4px 12px rgba(15,23,42,0.05);">
        <div style="text-align:center;margin-bottom:24px;">
          <h2 style="color:#0f172a;margin:0 0 6px;font-size:22px;font-weight:700;">Zensus One-Time Email Verification</h2>
          <p style="color:#64748b;margin:0;font-size:13px;">Enterprise Cloud Operations & Identity Management</p>
        </div>
        <p style="color:#334155;margin:0 0 16px;font-size:15px;line-height:1.5;">
          Hello <strong>Render Tester</strong>,
        </p>
        <p style="color:#475569;margin:0 0 24px;font-size:14px;line-height:1.6;">
          Thank you for registering with Zensus. Your one-time email verification code is:
        </p>
        <div style="text-align:center;margin:28px 0;">
          <div style="display:inline-block;font-size:38px;font-weight:800;letter-spacing:10px;color:#008cff;background:#eff6ff;padding:16px 28px;border-radius:10px;border:2px dashed #93c5fd;font-family:Consolas,monospace;">
            320813
          </div>
        </div>
        <p style="color:#64748b;font-size:13px;margin:0 0 10px;text-align:center;">
          ⏰ This code is valid for <strong>5 minutes</strong>. Enter this code to verify your account once.
        </p>
        <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">
          If you did not request this verification, please ignore this email.
        </p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0 20px;">
        <p style="color:#94a3b8;font-size:11px;margin:0;text-align:center;">
          ZensusTech Security Team · Sent from noreply@cybaemtech.com
        </p>
      </div>
    </body></html>
    ', 'Hello Render Tester,

Thank you for registering with Zensus.
Your one-time email verification code is: 320813

This code is valid for 5 minutes. Enter this code to verify your account.
If you did not request this verification, please ignore this email.

Regards,
Zensus Team
Sent from noreply@cybaemtech.com
', 'database', 'stored_in_db', '2026-11-23T13:35:27.720072+05:30') ON CONFLICT DO NOTHING;

-- Table: azure_subscriptions (3 rows)
-- ----------------------------------------
INSERT INTO azure_subscriptions ("subscription_id", "tenant_id", "name", "state", "spending_usd", "raw_json", "updated_at") VALUES ('9414ece9-sub1-prod-core-001', '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Production Workloads & Web Tier', 'Enabled', '2300.75', '{"name": "Production Workloads & Web Tier", "state": "Enabled", "subscriptionId": "9414ece9-sub1-prod-core-001", "monthlySpendUSD": 2300.75}'::jsonb, '2026-11-12T16:04:23.958713+05:30') ON CONFLICT DO NOTHING;
INSERT INTO azure_subscriptions ("subscription_id", "tenant_id", "name", "state", "spending_usd", "raw_json", "updated_at") VALUES ('9414ece9-sub2-stg-sandbox-002', '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Staging & QA Environment', 'Enabled', '840.50', '{"name": "Staging & QA Environment", "state": "Enabled", "subscriptionId": "9414ece9-sub2-stg-sandbox-002", "monthlySpendUSD": 840.5}'::jsonb, '2026-11-12T16:04:23.959948+05:30') ON CONFLICT DO NOTHING;
INSERT INTO azure_subscriptions ("subscription_id", "tenant_id", "name", "state", "spending_usd", "raw_json", "updated_at") VALUES ('9414ece9-sub3-rnd-storage-003', '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'R&D Sandbox & Recovery Vaults', 'Enabled', '410.20', '{"name": "R&D Sandbox & Recovery Vaults", "state": "Enabled", "subscriptionId": "9414ece9-sub3-rnd-storage-003", "monthlySpendUSD": 410.2}'::jsonb, '2026-11-12T16:04:23.960718+05:30') ON CONFLICT DO NOTHING;

-- Table: customer_subscriptions (5 rows)
-- ----------------------------------------
INSERT INTO customer_subscriptions ("id", "customer_id", "provider", "tier", "status", "quota_limit", "valid_until", "created_at") VALUES (61, 'cust-1', 'azure', 'Gold', 'Active', 100, NULL, '2026-11-04T11:31:48.754059+05:30') ON CONFLICT DO NOTHING;
INSERT INTO customer_subscriptions ("id", "customer_id", "provider", "tier", "status", "quota_limit", "valid_until", "created_at") VALUES (62, 'cust-1', 'gcp', 'Silver', 'Active', 100, NULL, '2026-11-04T11:31:48.756205+05:30') ON CONFLICT DO NOTHING;
INSERT INTO customer_subscriptions ("id", "customer_id", "provider", "tier", "status", "quota_limit", "valid_until", "created_at") VALUES (63, 'cust-1', 'aws', 'Bronze', 'Active', 100, NULL, '2026-11-04T11:31:48.756922+05:30') ON CONFLICT DO NOTHING;
INSERT INTO customer_subscriptions ("id", "customer_id", "provider", "tier", "status", "quota_limit", "valid_until", "created_at") VALUES (64, 'cust-1', 'native_cloud', 'Trial', 'Active', 100, NULL, '2026-11-04T11:31:48.757631+05:30') ON CONFLICT DO NOTHING;
INSERT INTO customer_subscriptions ("id", "customer_id", "provider", "tier", "status", "quota_limit", "valid_until", "created_at") VALUES (65, 'cust-1', 'office365', 'Gold', 'Active', 100, NULL, '2026-11-04T11:31:48.758349+05:30') ON CONFLICT DO NOTHING;

-- Table: customers (1 rows)
-- ----------------------------------------
INSERT INTO customers ("customer_id", "name", "domain_id", "tenant_id", "client_id", "categories_json", "created_at", "updated_at", "phone", "email", "plan_tier", "licenses_count", "license_exp_date", "vendor_id") VALUES ('cust-1', 'Customer #1 (Zensus Technologies)', 'zensustech.com', '9414ece9-9039-40b7-a6a7-7ecbe7409245', '0ffa2118-1e76-4537-b0d4-0ad853240893', '{"azure": {"enabled": true, "subscriptions": [{"name": "Production Workloads & Web Tier", "state": "Enabled", "subscriptionId": "9414ece9-sub1-prod-core-001", "monthlySpendUSD": 2300.75}, {"name": "Staging & QA Environment", "state": "Enabled", "subscriptionId": "9414ece9-sub2-stg-sandbox-002", "monthlySpendUSD": 840.5}, {"name": "R&D Sandbox & Recovery Vaults", "state": "Enabled", "subscriptionId": "9414ece9-sub3-rnd-storage-003", "monthlySpendUSD": 410.2}]}, "office365": {"tier": "Gold", "enabled": true}}'::jsonb, '2026-10-21T10:45:21.050198+05:30', '2026-11-19T13:19:41.601500+05:30', '+91 9823101112', 'vinayak.salunkhe@zensustech.com', 'Cloud - Azure (Gold)', 4, '2027-11-11T05:30:00+05:30', NULL) ON CONFLICT DO NOTHING;

-- Table: db_settings (1 rows)
-- ----------------------------------------
INSERT INTO db_settings ("key", "value", "updated_at") VALUES ('schema_initialized', '2026-10-21 11:04:13.686637+05:30', '2026-10-21T11:04:13.686637+05:30') ON CONFLICT DO NOTHING;

-- Table: email_verifications (9 rows)
-- ----------------------------------------
INSERT INTO email_verifications ("id", "user_id", "otp_hash", "expires_at", "attempts", "verified_at", "created_at") VALUES (17, 22, '9a06efc7b658414aaa3c01057b00d82c2b0320c6d09a1a0d253cc6aa96911682', '2026-11-12T14:06:28.394345+05:30', 1, '2026-11-12T14:01:42.694941+05:30', '2026-11-12T14:01:28.389429+05:30') ON CONFLICT DO NOTHING;
INSERT INTO email_verifications ("id", "user_id", "otp_hash", "expires_at", "attempts", "verified_at", "created_at") VALUES (22, 25, '69a11902681278916dca7a6245a53e51a241ac713f7a9b778b3341bac8212ca4', '2026-11-16T11:17:35.336257+05:30', 2, '2026-11-16T11:14:26.047121+05:30', '2026-11-16T11:12:34.988443+05:30') ON CONFLICT DO NOTHING;
INSERT INTO email_verifications ("id", "user_id", "otp_hash", "expires_at", "attempts", "verified_at", "created_at") VALUES (23, 26, 'da26aa98832c054500fe414ee34a2ccad44b8e863fd92c6729dc90009d4b536a', '2026-11-17T16:54:03.069536+05:30', 0, NULL, '2026-11-17T16:49:03.055146+05:30') ON CONFLICT DO NOTHING;
INSERT INTO email_verifications ("id", "user_id", "otp_hash", "expires_at", "attempts", "verified_at", "created_at") VALUES (24, 27, '77fbff537cfd52cbae5a68153f236928f45075fb93534d80ffd820672d281493', '2026-11-17T16:55:53.935431+05:30', 1, '2026-11-17T16:51:12.817812+05:30', '2026-11-17T16:50:53.930479+05:30') ON CONFLICT DO NOTHING;
INSERT INTO email_verifications ("id", "user_id", "otp_hash", "expires_at", "attempts", "verified_at", "created_at") VALUES (25, 28, '764d2bc5664c0bacd0898a17a5dfbd534be60461c50e2646d10089b4259e90ec', '2026-11-19T14:52:42.575683+05:30', 0, NULL, '2026-11-19T14:47:42.571290+05:30') ON CONFLICT DO NOTHING;
INSERT INTO email_verifications ("id", "user_id", "otp_hash", "expires_at", "attempts", "verified_at", "created_at") VALUES (26, 29, 'ecb4183e8be789454bc9b5e0a40aee2e56a4a7a81d437daff558d10ed69e1451', '2026-11-23T10:45:25.940966+05:30', 1, '2026-11-23T10:40:47.056598+05:30', '2026-11-23T10:40:25.927097+05:30') ON CONFLICT DO NOTHING;
INSERT INTO email_verifications ("id", "user_id", "otp_hash", "expires_at", "attempts", "verified_at", "created_at") VALUES (27, 30, 'ecd45f2e844fd508f5e4295e512e0c607236b1a5c08f2dda58365108906fb93c', '2026-11-23T13:18:21.121090+05:30', 0, NULL, '2026-11-23T13:13:21.115502+05:30') ON CONFLICT DO NOTHING;
INSERT INTO email_verifications ("id", "user_id", "otp_hash", "expires_at", "attempts", "verified_at", "created_at") VALUES (28, 31, 'fc39c32cd6311d92053af0c9dd5f78ce0967a5f52601a0d6f3ccc72af68621ec', '2026-11-23T13:20:58.130067+05:30', 0, NULL, '2026-11-23T13:15:58.123154+05:30') ON CONFLICT DO NOTHING;
INSERT INTO email_verifications ("id", "user_id", "otp_hash", "expires_at", "attempts", "verified_at", "created_at") VALUES (29, 32, 'b60e8268ced0a87182e0085016e0bd8dbc751f93fd25d05c4848a047c4d7d095', '2026-11-23T13:40:26.700193+05:30', 1, '2026-11-23T13:35:29.886632+05:30', '2026-11-23T13:35:26.692530+05:30') ON CONFLICT DO NOTHING;

-- Table: login_sessions (34 rows)
-- ----------------------------------------
INSERT INTO login_sessions ("id", "user_id", "session_token_hash", "expires_at", "revoked_at", "created_at") VALUES (4, 22, '38a1818888f730fb0e5df371ba40784ba276c3495ae82a524307d6539db5fd69', '2026-11-13T14:01:42.698542+05:30', NULL, '2026-11-12T14:01:42.699012+05:30') ON CONFLICT DO NOTHING;
INSERT INTO login_sessions ("id", "user_id", "session_token_hash", "expires_at", "revoked_at", "created_at") VALUES (5, 22, 'bf9ac756669a0cf428000160cbde2c4f587305aede33a994fb1acf8852f8c017', '2026-11-13T14:12:26.937941+05:30', NULL, '2026-11-12T14:12:26.233946+05:30') ON CONFLICT DO NOTHING;
INSERT INTO login_sessions ("id", "user_id", "session_token_hash", "expires_at", "revoked_at", "created_at") VALUES (6, 22, 'b0b0afd04f07635760e15747735c5e160609804c0404a88bbb8c294218e9bfd6', '2026-11-13T14:13:24.737936+05:30', NULL, '2026-11-12T14:13:24.046379+05:30') ON CONFLICT DO NOTHING;
INSERT INTO login_sessions ("id", "user_id", "session_token_hash", "expires_at", "revoked_at", "created_at") VALUES (7, 22, '5dcfb6960b8bec078ba69fa7cbd1eef57a93b43809f8f34ad85c2dd329866c98', '2026-11-13T14:16:13.038439+05:30', NULL, '2026-11-12T14:16:12.615691+05:30') ON CONFLICT DO NOTHING;
INSERT INTO login_sessions ("id", "user_id", "session_token_hash", "expires_at", "revoked_at", "created_at") VALUES (8, 22, 'cd52143672d0fb5a50d0bdea358c09f6b4ca9b7f2a7d9196a4d309c969812152', '2026-11-13T14:31:12.254241+05:30', NULL, '2026-11-12T14:31:11.575768+05:30') ON CONFLICT DO NOTHING;
INSERT INTO login_sessions ("id", "user_id", "session_token_hash", "expires_at", "revoked_at", "created_at") VALUES (9, 22, 'a45874a06df9c4806145e8fbb491dbb5d2dc2476af58ea24f1c35b9324f4591e', '2026-11-13T16:03:40.031537+05:30', NULL, '2026-11-12T16:03:39.577071+05:30') ON CONFLICT DO NOTHING;
INSERT INTO login_sessions ("id", "user_id", "session_token_hash", "expires_at", "revoked_at", "created_at") VALUES (10, 22, '89dc1747be0e8b27a2931b94f39c56efed092e0c3ac1c15500e861b276fdec83', '2026-11-13T16:07:18.421248+05:30', NULL, '2026-11-12T16:07:18.075970+05:30') ON CONFLICT DO NOTHING;
INSERT INTO login_sessions ("id", "user_id", "session_token_hash", "expires_at", "revoked_at", "created_at") VALUES (11, 22, '3d89bcdb218b29a6d89a8a8d9ef4e34bf489a45fa7c4eb963210c1b64a053666', '2026-11-13T16:33:30.110019+05:30', NULL, '2026-11-12T16:33:29.742439+05:30') ON CONFLICT DO NOTHING;
INSERT INTO login_sessions ("id", "user_id", "session_token_hash", "expires_at", "revoked_at", "created_at") VALUES (12, 22, 'ec9a43096c2060e02ddea24aa978c6bad5115ed9108a614b378444c260f585d9', '2026-11-13T17:00:00.228651+05:30', NULL, '2026-11-12T16:59:59.857793+05:30') ON CONFLICT DO NOTHING;
INSERT INTO login_sessions ("id", "user_id", "session_token_hash", "expires_at", "revoked_at", "created_at") VALUES (15, 22, 'b7b0635f66ec9f1dac9265779ac7d21cf11382601d60620e8d72cbaade3c9051', '2026-11-13T17:20:08.521350+05:30', NULL, '2026-11-12T17:20:08.175929+05:30') ON CONFLICT DO NOTHING;
INSERT INTO login_sessions ("id", "user_id", "session_token_hash", "expires_at", "revoked_at", "created_at") VALUES (16, 22, '5b0dac1dec7bff5a40285127f271a1b929724d5927ce1cb3ab5fd8c18a312c35', '2026-11-13T17:28:51.194244+05:30', NULL, '2026-11-12T17:28:50.860703+05:30') ON CONFLICT DO NOTHING;
INSERT INTO login_sessions ("id", "user_id", "session_token_hash", "expires_at", "revoked_at", "created_at") VALUES (17, 22, '0e27d03b8b5ecb1f7a08a904706386bc38290a85e1d48bc2323c66f2351971a7', '2026-11-13T17:29:21.114603+05:30', NULL, '2026-11-12T17:29:20.778242+05:30') ON CONFLICT DO NOTHING;
INSERT INTO login_sessions ("id", "user_id", "session_token_hash", "expires_at", "revoked_at", "created_at") VALUES (18, 22, '4c3bffc030eed22f231e2c45269c25b501bd9fdf21490b6cf1b37f27e33f1927', '2026-11-13T17:48:17.727748+05:30', NULL, '2026-11-12T17:48:16.187477+05:30') ON CONFLICT DO NOTHING;
INSERT INTO login_sessions ("id", "user_id", "session_token_hash", "expires_at", "revoked_at", "created_at") VALUES (19, 22, 'b82bb7aa8b33a9a18f44dacc40f94cde04625a7554f277980bd45daf63618366', '2026-11-14T10:01:17.345121+05:30', NULL, '2026-11-13T10:01:15.559480+05:30') ON CONFLICT DO NOTHING;
INSERT INTO login_sessions ("id", "user_id", "session_token_hash", "expires_at", "revoked_at", "created_at") VALUES (20, 22, 'fe78d6c17f1bbb0b6009f58e3feb7fa1b36076787a5b10047411cd3cb16e5688', '2026-11-17T10:43:24.688594+05:30', NULL, '2026-11-16T10:43:22.817227+05:30') ON CONFLICT DO NOTHING;
INSERT INTO login_sessions ("id", "user_id", "session_token_hash", "expires_at", "revoked_at", "created_at") VALUES (21, 25, '448d5620f56422e1076bdfea6350b373ff8efc620048876644ffbd04ebbf96f8', '2026-11-17T11:14:26.058974+05:30', NULL, '2026-11-16T11:14:26.059276+05:30') ON CONFLICT DO NOTHING;
INSERT INTO login_sessions ("id", "user_id", "session_token_hash", "expires_at", "revoked_at", "created_at") VALUES (22, 25, 'aca7da39ff76ff8a22e1b89eb1ea8e90043fbc19e36215ebcd1b0885310c8ad7', '2026-11-17T11:36:52.677499+05:30', NULL, '2026-11-16T11:36:52.326080+05:30') ON CONFLICT DO NOTHING;
INSERT INTO login_sessions ("id", "user_id", "session_token_hash", "expires_at", "revoked_at", "created_at") VALUES (23, 27, 'dbfd80a588435545c8e90ab1a56412968786f4fceeeb1b80ddc06fe9bbc43937', '2026-11-18T16:51:12.955930+05:30', NULL, '2026-11-17T16:51:12.956414+05:30') ON CONFLICT DO NOTHING;
INSERT INTO login_sessions ("id", "user_id", "session_token_hash", "expires_at", "revoked_at", "created_at") VALUES (24, 22, '4256f861dcce84d742133ce990ab71c4396e97aa73ba5eafe8a08bb3e9d2c010', '2026-11-18T16:52:51.519298+05:30', NULL, '2026-11-17T16:52:48.175589+05:30') ON CONFLICT DO NOTHING;
INSERT INTO login_sessions ("id", "user_id", "session_token_hash", "expires_at", "revoked_at", "created_at") VALUES (25, 22, 'a86a535a1e9197620c492b4494018fec29ebab23be9eae9536193c5b603bf33f', '2026-11-18T18:29:14.430893+05:30', NULL, '2026-11-17T18:29:12.752229+05:30') ON CONFLICT DO NOTHING;
INSERT INTO login_sessions ("id", "user_id", "session_token_hash", "expires_at", "revoked_at", "created_at") VALUES (26, 25, '0fc8c4a34850125c0d0410f3e31a2d4af7181fd093aee887752da63623589296', '2026-11-18T18:29:38.819730+05:30', NULL, '2026-11-17T18:29:38.450375+05:30') ON CONFLICT DO NOTHING;
INSERT INTO login_sessions ("id", "user_id", "session_token_hash", "expires_at", "revoked_at", "created_at") VALUES (27, 22, '57f2df56919473f2fa2a9b3b88e6b8cf30608c38c77c3ae09776b79dc2a02cc5', '2026-11-20T11:57:01.223297+05:30', NULL, '2026-11-19T11:56:55.268945+05:30') ON CONFLICT DO NOTHING;
INSERT INTO login_sessions ("id", "user_id", "session_token_hash", "expires_at", "revoked_at", "created_at") VALUES (28, 22, 'c821275b904c5dc337939a6023ae76c87a374ea514061032b0468148e72462e0', '2026-11-20T12:03:24.972445+05:30', NULL, '2026-11-19T12:03:22.576423+05:30') ON CONFLICT DO NOTHING;
INSERT INTO login_sessions ("id", "user_id", "session_token_hash", "expires_at", "revoked_at", "created_at") VALUES (29, 22, '3b764e7d4b917500f2018d214eff6d4d0632312b98c5d56207bc6114f36a00cd', '2026-11-20T15:00:46.626068+05:30', NULL, '2026-11-19T15:00:45.009367+05:30') ON CONFLICT DO NOTHING;
INSERT INTO login_sessions ("id", "user_id", "session_token_hash", "expires_at", "revoked_at", "created_at") VALUES (30, 27, '5bba8588c37f7be197e4f69856b4273c048bb106deb9ac572decd1960dba35b7', '2026-11-20T17:40:16.759547+05:30', NULL, '2026-11-19T17:40:16.005348+05:30') ON CONFLICT DO NOTHING;
INSERT INTO login_sessions ("id", "user_id", "session_token_hash", "expires_at", "revoked_at", "created_at") VALUES (31, 22, '566c971796e780302200b37381057bdb2db7d0230a4015a35b1e60261d203b40', '2026-11-20T17:40:56.716946+05:30', NULL, '2026-11-19T17:40:53.861581+05:30') ON CONFLICT DO NOTHING;
INSERT INTO login_sessions ("id", "user_id", "session_token_hash", "expires_at", "revoked_at", "created_at") VALUES (32, 22, 'caa0e38d241e4286e8ee7ff5decf5d6880cfbf636b789eb4c6ffe7f112314223', '2026-11-21T10:39:52.911903+05:30', NULL, '2026-11-20T10:39:50.892299+05:30') ON CONFLICT DO NOTHING;
INSERT INTO login_sessions ("id", "user_id", "session_token_hash", "expires_at", "revoked_at", "created_at") VALUES (33, 29, '52e7ba6a7f9f8a823c10579a751cd18ada1a4e29ca6ff418dfebf8cdc10ad78b', '2026-11-24T10:40:47.059795+05:30', NULL, '2026-11-23T10:40:47.059981+05:30') ON CONFLICT DO NOTHING;
INSERT INTO login_sessions ("id", "user_id", "session_token_hash", "expires_at", "revoked_at", "created_at") VALUES (34, 22, '2102e228e528beb78816be233f1bc61a7dd4f7589771a3e33318f7cdfbb99ff9', '2026-11-24T10:41:28.173382+05:30', NULL, '2026-11-23T10:41:26.434697+05:30') ON CONFLICT DO NOTHING;
INSERT INTO login_sessions ("id", "user_id", "session_token_hash", "expires_at", "revoked_at", "created_at") VALUES (35, 32, '03297a8469fb2f8b5d1793d27b2b469be6943ec98f6f67e3e6c6c11245d3d033', '2026-11-24T13:35:29.890339+05:30', NULL, '2026-11-23T13:35:29.890600+05:30') ON CONFLICT DO NOTHING;
INSERT INTO login_sessions ("id", "user_id", "session_token_hash", "expires_at", "revoked_at", "created_at") VALUES (36, 32, '64b59e36d4637444cdfe125463848f8b6d32530aa5fb0f8ef28f2ddcd2be6e88', '2026-11-24T13:35:32.408794+05:30', NULL, '2026-11-23T13:35:32.073010+05:30') ON CONFLICT DO NOTHING;
INSERT INTO login_sessions ("id", "user_id", "session_token_hash", "expires_at", "revoked_at", "created_at") VALUES (37, 22, 'testhash123', '2026-11-24T12:00:00+05:30', NULL, '2026-11-23T14:21:28.169087+05:30') ON CONFLICT DO NOTHING;
INSERT INTO login_sessions ("id", "user_id", "session_token_hash", "expires_at", "revoked_at", "created_at") VALUES (38, 22, 'e0cd131c2c812b2266fcc80eb26a79f3236bbd2c4112cc38f1c32264a93151dc', '2026-11-24T14:24:34.545782+05:30', NULL, '2026-11-23T14:24:34.553362+05:30') ON CONFLICT DO NOTHING;
INSERT INTO login_sessions ("id", "user_id", "session_token_hash", "expires_at", "revoked_at", "created_at") VALUES (39, 22, '24842a94cd9f462bbf266a87fc05c6c0934bbe0df2539a52516aaabc6639e479', '2026-11-24T14:25:11.144491+05:30', NULL, '2026-11-23T14:25:09.548313+05:30') ON CONFLICT DO NOTHING;

-- Table: m365_licenses (3 rows)
-- ----------------------------------------
INSERT INTO m365_licenses ("id", "tenant_id", "sku_name", "consumed_units", "prepaid_units", "updated_at", "expiration_date", "status", "sku_id", "raw_json") VALUES (88, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Microsoft 365 Business Basic / Essentials (O365_BUSINESS_ESSENTIALS)', 4, 4, '2026-11-19T13:19:41.601500+05:30', '2027-11-11T05:30:00+05:30', 'Enabled', '3b555118-da6a-4418-894f-7df1e2096870', '{"sku_id": "3b555118-da6a-4418-894f-7df1e2096870", "status": "Enabled", "sku_name": "Microsoft 365 Business Basic / Essentials (O365_BUSINESS_ESSENTIALS)", "tenant_id": "9414ece9-9039-40b7-a6a7-7ecbe7409245", "prepaid_units": 4, "consumed_units": 4, "expiration_date": "2026-11-11 00:00:00+00"}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO m365_licenses ("id", "tenant_id", "sku_name", "consumed_units", "prepaid_units", "updated_at", "expiration_date", "status", "sku_id", "raw_json") VALUES (89, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Power BI Standard / Pro (POWER_BI_STANDARD)', 2, 1000000, '2026-11-12T16:04:23.962423+05:30', '2027-01-25T05:30:00+05:30', 'Enabled', 'a403ebcc-fae0-4ca2-8c8c-7a907fd6c235', '{"sku_id": "a403ebcc-fae0-4ca2-8c8c-7a907fd6c235", "status": "Enabled", "sku_name": "Power BI Standard / Pro (POWER_BI_STANDARD)", "tenant_id": "9414ece9-9039-40b7-a6a7-7ecbe7409245", "prepaid_units": 1000000, "consumed_units": 2, "expiration_date": "2027-01-25 00:00:00+00"}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO m365_licenses ("id", "tenant_id", "sku_name", "consumed_units", "prepaid_units", "updated_at", "expiration_date", "status", "sku_id", "raw_json") VALUES (90, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'Microsoft Power Automate Free (FLOW_FREE)', 1, 10000, '2026-11-12T16:04:23.963112+05:30', '2027-01-25T05:30:00+05:30', 'Enabled', 'f30db892-07e9-47e9-837c-80727f46fd3d', '{"sku_id": "f30db892-07e9-47e9-837c-80727f46fd3d", "status": "Enabled", "sku_name": "Microsoft Power Automate Free (FLOW_FREE)", "tenant_id": "9414ece9-9039-40b7-a6a7-7ecbe7409245", "prepaid_units": 10000, "consumed_units": 1, "expiration_date": "2027-01-25 00:00:00+00"}'::jsonb) ON CONFLICT DO NOTHING;

-- Table: organizations (1 rows)
-- ----------------------------------------
INSERT INTO organizations ("tenant_id", "display_name", "primary_domain", "country", "city", "state", "street", "license", "users_count", "groups_count", "apps_count", "devices_count", "raw_json", "updated_at", "phone_number", "email", "technical_email", "license_exp_date") VALUES ('9414ece9-9039-40b7-a6a7-7ecbe7409245', 'ZensusTech', 'zensustech.com', 'IN', 'Pune', 'MH', 'Flora Residency Flat no B4', 'Microsoft 365 Business Essentials', 19, 9, 5, 6, '{"id": "9414ece9-9039-40b7-a6a7-7ecbe7409245", "city": "Pune", "email": "vinayak.salunkhe@zensustech.com", "state": "MH", "street": "Flora Residency Flat no B4", "license": "Microsoft 365 Business Essentials", "appsCount": 5, "postalCode": "411032", "usersCount": 19, "displayName": "ZensusTech", "groupsCount": 9, "devicesCount": 6, "phone_number": "9823101112", "primaryDomain": "zensustech.com", "businessPhones": ["9823101112"], "license_exp_date": "2026-12-11T00:00:00Z", "countryLetterCode": "IN", "technicalNotificationMails": ["vinayak.salunkhe@zensustech.com"]}'::jsonb, '2026-11-19T18:30:32.849959+05:30', '9823101112', 'vinayak.salunkhe@zensustech.com', 'vinayak.salunkhe@zensustech.com', '2027-11-11T05:30:00+05:30') ON CONFLICT DO NOTHING;

-- Table: sessions (1 rows)
-- ----------------------------------------
INSERT INTO sessions ("tenant_id", "client_id", "client_secret", "mgmt_token", "graph_token", "organization_json", "updated_at") VALUES ('9414ece9-9039-40b7-a6a7-7ecbe7409245', '0ffa2118-1e76-4537-b0d4-0ad853240893', '***** [PROTECTED]', NULL, NULL, '{"id": "9414ece9-9039-40b7-a6a7-7ecbe7409245", "city": "Pune", "email": "vinayak.salunkhe@zensustech.com", "state": "MH", "street": "Flora Residency Flat no B4", "license": "Microsoft 365 Business Essentials", "appsCount": 4, "postalCode": "411032", "usersCount": 14, "displayName": "ZensusTech", "groupsCount": 9, "devicesCount": 6, "phone_number": "9823101112", "primaryDomain": "zensustech.com", "businessPhones": ["9823101112"], "license_exp_date": "2026-12-11T00:00:00Z", "countryLetterCode": "IN", "technicalNotificationMails": ["vinayak.salunkhe@zensustech.com"]}'::jsonb, '2026-11-19T18:23:09.674011+05:30') ON CONFLICT DO NOTHING;

-- Table: subscriptions (2 rows)
-- ----------------------------------------
INSERT INTO subscriptions ("id", "tenant_id", "plan_name", "provider_type", "subscription_status", "start_date", "expiry_date", "created_at") VALUES (1, 1, 'Gold', 'cloud', 'active', '2026-11-05T12:54:13.819481+05:30', NULL, '2026-11-05T12:54:13.819481+05:30') ON CONFLICT DO NOTHING;
INSERT INTO subscriptions ("id", "tenant_id", "plan_name", "provider_type", "subscription_status", "start_date", "expiry_date", "created_at") VALUES (2, 3, 'Trial', 'cloud', 'active', '2026-11-12T16:04:24.336066+05:30', NULL, '2026-11-12T16:04:24.336066+05:30') ON CONFLICT DO NOTHING;

-- Table: tenant_credentials (6 rows)
-- ----------------------------------------
INSERT INTO tenant_credentials ("customer_id", "tenant_id", "client_id", "client_secret", "is_configured", "verified_at", "updated_at") VALUES ('cust-1', '9414ece9-9039-40b7-a6a7-7ecbe7409245', '0ffa2118-1e76-4537-b0d4-0ad853240893', '***** [PROTECTED]', 1, NULL, '2026-11-04T11:30:24.262856+05:30') ON CONFLICT DO NOTHING;
INSERT INTO tenant_credentials ("customer_id", "tenant_id", "client_id", "client_secret", "is_configured", "verified_at", "updated_at") VALUES ('cust-2', 'a4b23c91-1122-3344-5566-778899aabbcc', '7c8d9e0f-1234-5678-90ab-cdef12345678', '***** [PROTECTED]', 1, NULL, '2026-11-04T11:30:24.264294+05:30') ON CONFLICT DO NOTHING;
INSERT INTO tenant_credentials ("customer_id", "tenant_id", "client_id", "client_secret", "is_configured", "verified_at", "updated_at") VALUES ('cust-3', 'f5e4d3c2-b1a0-9876-5432-10fedcba9876', '4a5b6c7d-8e9f-0123-4567-89abcdef0123', '***** [PROTECTED]', 1, NULL, '2026-11-04T11:30:24.265048+05:30') ON CONFLICT DO NOTHING;
INSERT INTO tenant_credentials ("customer_id", "tenant_id", "client_id", "client_secret", "is_configured", "verified_at", "updated_at") VALUES ('lt-cust-1', '11111111-2222-3333-4444-555555555551', 'lt-client-id-001', '***** [PROTECTED]', 1, NULL, '2026-11-04T11:30:24.267226+05:30') ON CONFLICT DO NOTHING;
INSERT INTO tenant_credentials ("customer_id", "tenant_id", "client_id", "client_secret", "is_configured", "verified_at", "updated_at") VALUES ('tata-cust-1', '22222222-3333-4444-5555-666666666661', 'tata-client-id-001', '***** [PROTECTED]', 1, NULL, '2026-11-04T11:30:24.268400+05:30') ON CONFLICT DO NOTHING;
INSERT INTO tenant_credentials ("customer_id", "tenant_id", "client_id", "client_secret", "is_configured", "verified_at", "updated_at") VALUES ('cust-new', '', '', '', 0, '2026-11-04T11:31:20.551802+05:30', '2026-11-04T11:31:20.551802+05:30') ON CONFLICT DO NOTHING;

-- Table: tenants (2 rows)
-- ----------------------------------------
INSERT INTO tenants ("id", "tenant_id", "tenant_name", "provider_type", "provider_name", "subscription_plan", "connection_status", "created_at", "updated_at", "client_id", "client_secret") VALUES (1, 'render-tenant-uuid-1234', 'Render Production Tenant', 'cloud', 'azure', 'Gold', 'active', '2026-11-05T12:54:13.637842+05:30', '2026-11-05T12:54:13.637842+05:30', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO tenants ("id", "tenant_id", "tenant_name", "provider_type", "provider_name", "subscription_plan", "connection_status", "created_at", "updated_at", "client_id", "client_secret") VALUES (3, '9414ece9-9039-40b7-a6a7-7ecbe7409245', 'ZensusTech', 'cloud', 'azure', 'Trial', 'active', '2026-11-12T16:04:24.314176+05:30', '2026-11-12T16:04:24.314176+05:30', '0ffa2118-1e76-4537-b0d4-0ad853240893', '***** [PROTECTED]') ON CONFLICT DO NOTHING;

-- Table: user_tenants (1 rows)
-- ----------------------------------------
INSERT INTO user_tenants ("id", "user_id", "tenant_id", "association_role", "is_primary", "created_at") VALUES (3, 22, 3, NULL, TRUE, '2026-11-12T16:04:24.328577+05:30') ON CONFLICT DO NOTHING;

-- Table: users (11 rows)
-- ----------------------------------------
INSERT INTO users ("user_id", "email", "password_hash", "full_name", "role", "vendor_id", "customer_id", "is_first_time", "created_at", "id", "email_verified", "account_status", "updated_at", "phone", "organization", "customer", "vendor_code") VALUES ('usr-a194b6475b1b', 'priyankakaranjewar448@gmail.com', '$2b$12$Inh/kXs3xtyQn.xotR1rEeuqz7Hq1tN62nT7B3VxViHXj2w88Vrve', 'priyanka k', 'END_CUSTOMER', NULL, NULL, 0, '2026-11-17T16:49:02.537587+05:30', 26, FALSE, 'active', '2026-11-17T16:49:02.537587+05:30', NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO users ("user_id", "email", "password_hash", "full_name", "role", "vendor_id", "customer_id", "is_first_time", "created_at", "id", "email_verified", "account_status", "updated_at", "phone", "organization", "customer", "vendor_code") VALUES ('usr-9c51416633a8', 'priyankakaranjewar448@gmail.cpm', '$2b$12$X69goZ5pqBlRAZfuiU4alO40sB3yft0EY29f4S4sRcyDZRZnj7ywG', 'anmol patil', 'VENDOR', NULL, NULL, 0, '2026-11-19T14:47:42.212269+05:30', 28, FALSE, 'active', '2026-11-19T14:47:42.212269+05:30', NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO users ("user_id", "email", "password_hash", "full_name", "role", "vendor_id", "customer_id", "is_first_time", "created_at", "id", "email_verified", "account_status", "updated_at", "phone", "organization", "customer", "vendor_code") VALUES ('usr-736ff1dfac2e', 'priyankakaranjewar1323@gmail.com', '$2b$12$grGkj99DlFHzzsXrrUNwa.FztPtzyIKY2onCny8sNBU4CHZ.Zzqaq', 'priya patil', 'END_CUSTOMER', NULL, NULL, 0, '2026-11-17T16:50:53.526864+05:30', 27, TRUE, 'active', '2026-11-17T16:51:12.817812+05:30', NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO users ("user_id", "email", "password_hash", "full_name", "role", "vendor_id", "customer_id", "is_first_time", "created_at", "id", "email_verified", "account_status", "updated_at", "phone", "organization", "customer", "vendor_code") VALUES ('usr-super', 'admin@zensustech.com', '$2b$12$lc8Gme//RHHr6LRHpjwDoulRd0nMj75zQ5C/8JIupugNiUt3jI4VS', 'Super Admin (ZensusTech)', 'SUPER_ADMIN', NULL, 'cust-1', 0, '2026-11-04T11:30:24.258003+05:30', 1, TRUE, 'active', '2026-11-05T12:35:47.476332+05:30', NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO users ("user_id", "email", "password_hash", "full_name", "role", "vendor_id", "customer_id", "is_first_time", "created_at", "id", "email_verified", "account_status", "updated_at", "phone", "organization", "customer", "vendor_code") VALUES ('usr-cust-config', 'vinayak.salunkhe@zensustech.com', '$2b$12$PslYNO5qwWfrLKZM0YMbauBOvhgDn7OBt07x/8Ha/G2AATnW/Sp9W', 'Vinayak Salunkhe', 'END_CUSTOMER', NULL, 'cust-1', 0, '2026-11-04T11:30:24.261329+05:30', 4, TRUE, 'active', '2026-11-05T12:35:47.476332+05:30', NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO users ("user_id", "email", "password_hash", "full_name", "role", "vendor_id", "customer_id", "is_first_time", "created_at", "id", "email_verified", "account_status", "updated_at", "phone", "organization", "customer", "vendor_code") VALUES ('usr-81f276e8d4cb', 'priyanka.k@cybaemtech.com', '$2b$12$il4AgGL3chA6DbdbSx5BxeDlVMb6MN7wsQ7ud1MWFznpkL9sVskeO', 'priyanka karanjewar', 'END_CUSTOMER', NULL, NULL, 0, '2026-11-12T14:01:27.765497+05:30', 22, TRUE, 'active', '2026-11-12T14:01:42.694941+05:30', NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO users ("user_id", "email", "password_hash", "full_name", "role", "vendor_id", "customer_id", "is_first_time", "created_at", "id", "email_verified", "account_status", "updated_at", "phone", "organization", "customer", "vendor_code") VALUES ('usr-30717340a413', 'priyankakaranjewar567@gmail.com', '$2b$12$o0urT4nDLOrvHTdveUHGxuY3XZU48Hjl5.tAgQbJUORJEqW72G0ti', 'priya K', 'END_CUSTOMER', NULL, NULL, 0, '2026-11-16T10:44:38.179461+05:30', 25, TRUE, 'active', '2026-11-16T11:14:26.047121+05:30', NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO users ("user_id", "email", "password_hash", "full_name", "role", "vendor_id", "customer_id", "is_first_time", "created_at", "id", "email_verified", "account_status", "updated_at", "phone", "organization", "customer", "vendor_code") VALUES ('usr-2d0f91f9573c', 'salunkhe.vinayak@gmail.com', '$2b$12$Aow7bMl1QItCxGpjuiZvt.axe/hyvhYkGHnrvnfpjOVXptHHHrRh6', 'vinayak s', 'VENDOR', NULL, NULL, 0, '2026-11-23T10:40:25.551908+05:30', 29, TRUE, 'active', '2026-11-23T10:40:47.056598+05:30', NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO users ("user_id", "email", "password_hash", "full_name", "role", "vendor_id", "customer_id", "is_first_time", "created_at", "id", "email_verified", "account_status", "updated_at", "phone", "organization", "customer", "vendor_code") VALUES ('usr-a80962ef2851', 'render_test_5311@example.com', '$2b$12$iBsE8Qpd.M5.ULxAPJPob.Gv1LtTtUxgg093eidr0HmaH7ejFF1c2', 'Render Tester', 'END_CUSTOMER', NULL, NULL, 0, '2026-11-23T13:13:20.709223+05:30', 30, FALSE, 'active', '2026-11-23T13:13:20.709223+05:30', '+91 9999888877', 'Render Cloud Testing', 'Render Org', NULL) ON CONFLICT DO NOTHING;
INSERT INTO users ("user_id", "email", "password_hash", "full_name", "role", "vendor_id", "customer_id", "is_first_time", "created_at", "id", "email_verified", "account_status", "updated_at", "phone", "organization", "customer", "vendor_code") VALUES ('usr-728b28fb6e37', 'render_test_direct@example.com', '$2b$12$8rhetq7POF1tAFMToUVV0eoynNMRNhkf4KWTha2/BujVRjBz6EIAu', 'Render Tester', 'END_CUSTOMER', NULL, NULL, 0, '2026-11-23T13:15:57.601330+05:30', 31, FALSE, 'active', '2026-11-23T13:15:57.601330+05:30', NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO users ("user_id", "email", "password_hash", "full_name", "role", "vendor_id", "customer_id", "is_first_time", "created_at", "id", "email_verified", "account_status", "updated_at", "phone", "organization", "customer", "vendor_code") VALUES ('usr-d2ae1d62af47', 'render_test_3293@example.com', '$2b$12$IEWMM0gW9cbf1MktvJFUNeYvYiNLr7ELJmtUTNbGplgNbkLAoGCWS', 'Render Tester', 'END_CUSTOMER', NULL, NULL, 0, '2026-11-23T13:35:26.137116+05:30', 32, TRUE, 'active', '2026-11-23T13:35:29.886632+05:30', '+91 9999888877', 'Render Cloud Testing', 'Render Org', NULL) ON CONFLICT DO NOTHING;

-- Table: vendors (0 rows)
-- ----------------------------------------
-- Synchronize sequences for all tables
DO $$ BEGIN PERFORM setval(pg_get_serial_sequence('audit_logs', 'id'), COALESCE((SELECT MAX(id) FROM audit_logs), 0) + 1, false); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM setval(pg_get_serial_sequence('auth_emails', 'id'), COALESCE((SELECT MAX(id) FROM auth_emails), 0) + 1, false); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM setval(pg_get_serial_sequence('azure_subscriptions', 'id'), COALESCE((SELECT MAX(id) FROM azure_subscriptions), 0) + 1, false); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM setval(pg_get_serial_sequence('customer_subscriptions', 'id'), COALESCE((SELECT MAX(id) FROM customer_subscriptions), 0) + 1, false); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM setval(pg_get_serial_sequence('customers', 'id'), COALESCE((SELECT MAX(id) FROM customers), 0) + 1, false); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM setval(pg_get_serial_sequence('db_settings', 'id'), COALESCE((SELECT MAX(id) FROM db_settings), 0) + 1, false); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM setval(pg_get_serial_sequence('email_verifications', 'id'), COALESCE((SELECT MAX(id) FROM email_verifications), 0) + 1, false); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM setval(pg_get_serial_sequence('login_sessions', 'id'), COALESCE((SELECT MAX(id) FROM login_sessions), 0) + 1, false); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM setval(pg_get_serial_sequence('m365_licenses', 'id'), COALESCE((SELECT MAX(id) FROM m365_licenses), 0) + 1, false); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM setval(pg_get_serial_sequence('organizations', 'id'), COALESCE((SELECT MAX(id) FROM organizations), 0) + 1, false); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM setval(pg_get_serial_sequence('sessions', 'id'), COALESCE((SELECT MAX(id) FROM sessions), 0) + 1, false); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM setval(pg_get_serial_sequence('subscriptions', 'id'), COALESCE((SELECT MAX(id) FROM subscriptions), 0) + 1, false); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM setval(pg_get_serial_sequence('tenant_credentials', 'id'), COALESCE((SELECT MAX(id) FROM tenant_credentials), 0) + 1, false); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM setval(pg_get_serial_sequence('tenants', 'id'), COALESCE((SELECT MAX(id) FROM tenants), 0) + 1, false); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM setval(pg_get_serial_sequence('user_tenants', 'id'), COALESCE((SELECT MAX(id) FROM user_tenants), 0) + 1, false); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 0) + 1, false); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM setval(pg_get_serial_sequence('vendors', 'id'), COALESCE((SELECT MAX(id) FROM vendors), 0) + 1, false); EXCEPTION WHEN OTHERS THEN NULL; END $$;

COMMIT;
