import { pgTable, text, serial, integer, numeric, jsonb, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// 1. Database Settings
export const dbSettingsTable = pgTable("db_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
export const insertDbSettingsSchema = createInsertSchema(dbSettingsTable);
export type DbSetting = typeof dbSettingsTable.$inferSelect;

// 2. Organizations
export const organizationsTable = pgTable("organizations", {
  tenantId: varchar("tenant_id", { length: 100 }).primaryKey(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  primaryDomain: varchar("primary_domain", { length: 255 }),
  country: varchar("country", { length: 10 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  street: text("street"),
  license: varchar("license", { length: 255 }),
  usersCount: integer("users_count").default(0),
  groupsCount: integer("groups_count").default(0),
  appsCount: integer("apps_count").default(0),
  devicesCount: integer("devices_count").default(0),
  rawJson: jsonb("raw_json"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
export const insertOrganizationSchema = createInsertSchema(organizationsTable);
export type Organization = typeof organizationsTable.$inferSelect;

// 3. Sessions
export const sessionsTable = pgTable("sessions", {
  tenantId: varchar("tenant_id", { length: 100 }).primaryKey(),
  clientId: varchar("client_id", { length: 100 }),
  clientSecret: text("client_secret"),
  mgmtToken: text("mgmt_token"),
  graphToken: text("graph_token"),
  organizationJson: jsonb("organization_json"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
export const insertSessionSchema = createInsertSchema(sessionsTable);
export type Session = typeof sessionsTable.$inferSelect;

// 4. Customers
export const customersTable = pgTable("customers", {
  customerId: varchar("customer_id", { length: 100 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  domainId: varchar("domain_id", { length: 255 }),
  tenantId: varchar("tenant_id", { length: 100 }),
  clientId: varchar("client_id", { length: 100 }),
  categoriesJson: jsonb("categories_json"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
export const insertCustomerSchema = createInsertSchema(customersTable);
export type Customer = typeof customersTable.$inferSelect;

// 5. Azure Subscriptions
export const azureSubscriptionsTable = pgTable("azure_subscriptions", {
  subscriptionId: varchar("subscription_id", { length: 100 }).primaryKey(),
  tenantId: varchar("tenant_id", { length: 100 }),
  name: varchar("name", { length: 255 }).notNull(),
  state: varchar("state", { length: 50 }).default("Enabled"),
  spendingUsd: numeric("spending_usd", { precision: 12, scale: 2 }).default("0.00"),
  rawJson: jsonb("raw_json"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
export const insertAzureSubscriptionSchema = createInsertSchema(azureSubscriptionsTable);
export type AzureSubscription = typeof azureSubscriptionsTable.$inferSelect;

// 6. Audit Logs
export const auditLogsTable = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  tenantId: varchar("tenant_id", { length: 100 }),
  activityName: varchar("activity_name", { length: 255 }),
  category: varchar("category", { length: 100 }),
  status: varchar("status", { length: 50 }),
  actor: varchar("actor", { length: 255 }),
  rawJson: jsonb("raw_json"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
export const insertAuditLogSchema = createInsertSchema(auditLogsTable);
export type AuditLog = typeof auditLogsTable.$inferSelect;

// 7. M365 Licenses
export const m365LicensesTable = pgTable("m365_licenses", {
  id: serial("id").primaryKey(),
  tenantId: varchar("tenant_id", { length: 100 }),
  skuName: varchar("sku_name", { length: 255 }),
  consumedUnits: integer("consumed_units").default(0),
  prepaidUnits: integer("prepaid_units").default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
export const insertM365LicenseSchema = createInsertSchema(m365LicensesTable);
export type M365License = typeof m365LicensesTable.$inferSelect;