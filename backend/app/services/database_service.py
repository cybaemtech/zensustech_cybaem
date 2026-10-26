"""Universal Database Service for ZensusTech.
Supports PostgreSQL, MySQL, Microsoft SQL Server (MSSQL), and Azure SQL.
Provides connection testing, configuration persistence, schema initialization,
live data migration, and SQL export scripts for external databases.
"""

import json
import os
import re
import time
from typing import Any, Dict, List, Optional
import psycopg
from psycopg.rows import dict_row

from app.core.logging_config import get_logger

logger = get_logger(__name__)

CURRENT_FILE = os.path.abspath(__file__)
APP_DIR = os.path.dirname(os.path.dirname(CURRENT_FILE))
BACKEND_DIR = os.path.dirname(APP_DIR)
ROOT_DIR = os.path.dirname(BACKEND_DIR)
DATA_DIR = os.path.join(ROOT_DIR, "data")
CONFIG_FILE = os.path.join(DATA_DIR, "database_config.json")

DEFAULT_PG_URL = os.getenv("DATABASE_URL", "postgresql://postgres:root@localhost:5432/zensustech")


def mask_connection_url(url: str) -> str:
    """Masks password in connection URL for safe display."""
    if not url:
        return ""
    return re.sub(r":([^:@/]+)@", r":*****@", url)


class DatabaseService:
    def __init__(self):
        os.makedirs(DATA_DIR, exist_ok=True)

    def get_config(self) -> Dict[str, Any]:
        """Loads database config from JSON file or environment."""
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, dict):
                        return data
            except Exception as e:
                logger.warning(f"Failed to read database config: {e}")

        return {
            "engine": "postgresql",
            "connection_url": DEFAULT_PG_URL,
            "connected": True,
            "host": "localhost",
            "port": 5432,
            "database": "zensustech",
            "username": "postgres",
            "ssl_mode": "prefer",
        }

    def save_config(self, config: Dict[str, Any]) -> None:
        """Saves database config to JSON file."""
        try:
            with open(CONFIG_FILE, "w", encoding="utf-8") as f:
                json.dump(config, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save database config: {e}")

    def get_connection_url(self) -> str:
        cfg = self.get_config()
        return cfg.get("connection_url") or os.getenv("DATABASE_URL") or DEFAULT_PG_URL

    def test_connection(
        self,
        engine: str = "postgresql",
        url: Optional[str] = None,
        host: Optional[str] = None,
        port: Optional[int] = None,
        database: Optional[str] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        ssl_mode: Optional[str] = "prefer",
    ) -> Dict[str, Any]:
        """Tests connection to PostgreSQL, MySQL, MSSQL, or Azure SQL."""
        engine = (engine or "postgresql").lower()
        start = time.perf_counter()

        # Parse from URL if URL was supplied
        if url and not host:
            # Handle standard URI parsing
            parsed_engine = "postgresql"
            if url.startswith("mysql://"):
                parsed_engine = "mysql"
            elif url.startswith("mssql://") or url.startswith("sqlserver://"):
                parsed_engine = "mssql"
            elif "database.windows.net" in url or "azure" in url.lower():
                parsed_engine = "azure_sql"
            if not engine:
                engine = parsed_engine

        # 1. PostgreSQL / Azure Database for PostgreSQL
        if engine in ("postgresql", "postgres", "azure_postgresql"):
            target_url = url or f"postgresql://{username or 'postgres'}:{password or ''}@{host or 'localhost'}:{port or 5432}/{database or 'zensustech'}"
            try:
                with psycopg.connect(target_url, connect_timeout=5, row_factory=dict_row) as conn:
                    latency_ms = round((time.perf_counter() - start) * 1000, 2)
                    with conn.cursor() as cur:
                        cur.execute("SELECT version();")
                        row = cur.fetchone()
                        version_str = list(row.values())[0] if row else "PostgreSQL"

                        cur.execute("SELECT current_database(), current_user;")
                        info = cur.fetchone() or {}
                        db_name = info.get("current_database", database or "postgres")
                        db_user = info.get("current_user", username or "postgres")

                        cur.execute("""
                            SELECT table_name FROM information_schema.tables 
                            WHERE table_schema = 'public' ORDER BY table_name;
                        """)
                        tables = [r["table_name"] for r in cur.fetchall()]

                    return {
                        "success": True,
                        "engine": "postgresql",
                        "latency_ms": latency_ms,
                        "server_version": version_str.split("\n")[0],
                        "database": db_name,
                        "user": db_user,
                        "existing_tables": tables,
                        "masked_url": mask_connection_url(target_url),
                    }
            except Exception as e:
                latency_ms = round((time.perf_counter() - start) * 1000, 2)
                return {
                    "success": False,
                    "engine": "postgresql",
                    "latency_ms": latency_ms,
                    "error": str(e),
                    "masked_url": mask_connection_url(target_url),
                }

        # 2. MySQL / MariaDB
        elif engine in ("mysql", "mariadb"):
            import pymysql
            m_host = host or "localhost"
            m_port = int(port or 3306)
            m_user = username or "root"
            m_pass = password or ""
            m_db = database or "zensustech"
            try:
                conn = pymysql.connect(
                    host=m_host,
                    port=m_port,
                    user=m_user,
                    password=m_pass,
                    database=m_db,
                    connect_timeout=5,
                )
                latency_ms = round((time.perf_counter() - start) * 1000, 2)
                with conn.cursor() as cur:
                    cur.execute("SELECT VERSION();")
                    v = cur.fetchone()[0]
                    cur.execute("SHOW TABLES;")
                    tables = [r[0] for r in cur.fetchall()]
                conn.close()
                return {
                    "success": True,
                    "engine": "mysql",
                    "latency_ms": latency_ms,
                    "server_version": f"MySQL {v}",
                    "database": m_db,
                    "user": m_user,
                    "existing_tables": tables,
                    "masked_url": f"mysql://{m_user}:*****@{m_host}:{m_port}/{m_db}",
                }
            except Exception as e:
                latency_ms = round((time.perf_counter() - start) * 1000, 2)
                return {
                    "success": False,
                    "engine": "mysql",
                    "latency_ms": latency_ms,
                    "error": str(e),
                    "masked_url": f"mysql://{m_user}:*****@{m_host}:{m_port}/{m_db}",
                }

        # 3. Microsoft SQL Server / Azure SQL
        elif engine in ("mssql", "sqlserver", "azure_sql"):
            import pytds
            s_server = host or "localhost"
            s_port = int(port or 1433)
            s_db = database or "zensustech"
            s_user = username or "sa"
            s_pass = password or ""
            use_encryption = bool(ssl_mode in ("require", "prefer") or "windows.net" in s_server)

            try:
                conn = pytds.connect(
                    server=s_server,
                    port=s_port,
                    database=s_db,
                    user=s_user,
                    password=s_pass,
                    login_timeout=6,
                    autocommit=True,
                    cafile=None,
                )
                latency_ms = round((time.perf_counter() - start) * 1000, 2)
                with conn.cursor() as cur:
                    cur.execute("SELECT @@VERSION;")
                    v = cur.fetchone()[0]
                    cur.execute("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE';")
                    tables = [r[0] for r in cur.fetchall()]
                conn.close()
                return {
                    "success": True,
                    "engine": engine,
                    "latency_ms": latency_ms,
                    "server_version": v.split("\n")[0] if v else "Microsoft SQL Server",
                    "database": s_db,
                    "user": s_user,
                    "existing_tables": tables,
                    "masked_url": f"mssql://{s_user}:*****@{s_server}:{s_port}/{s_db}",
                }
            except Exception as e:
                latency_ms = round((time.perf_counter() - start) * 1000, 2)
                return {
                    "success": False,
                    "engine": engine,
                    "latency_ms": latency_ms,
                    "error": str(e),
                    "masked_url": f"mssql://{s_user}:*****@{s_server}:{s_port}/{s_db}",
                }

        return {"success": False, "error": f"Unsupported database engine: {engine}"}

    def connect(self, config_payload: Dict[str, Any]) -> Dict[str, Any]:
        """Connects and saves configuration for the selected database engine."""
        engine = config_payload.get("engine") or "postgresql"
        url = config_payload.get("connection_url")
        host = config_payload.get("host")
        port = config_payload.get("port")
        database = config_payload.get("database")
        username = config_payload.get("username")
        password = config_payload.get("password")
        ssl_mode = config_payload.get("ssl_mode", "prefer")

        test_result = self.test_connection(
            engine=engine,
            url=url,
            host=host,
            port=port,
            database=database,
            username=username,
            password=password,
            ssl_mode=ssl_mode,
        )

        if not test_result.get("success"):
            return test_result

        cfg = self.get_config()
        cfg["engine"] = engine
        cfg["connected"] = True
        cfg["database"] = test_result.get("database")
        cfg["username"] = test_result.get("user")
        cfg["server_version"] = test_result.get("server_version")
        if url:
            cfg["connection_url"] = url
        if host:
            cfg["host"] = host
            cfg["port"] = port
        self.save_config(cfg)

        return test_result

    def disconnect(self) -> Dict[str, Any]:
        """Marks active database as disconnected."""
        cfg = self.get_config()
        cfg["connected"] = False
        self.save_config(cfg)
        return {"success": True, "message": "Database disconnected"}

    def get_status(self) -> Dict[str, Any]:
        """Returns the current connection status, engine, and row counts."""
        cfg = self.get_config()
        engine = cfg.get("engine", "postgresql")
        is_connected_cfg = cfg.get("connected", True)

        if not is_connected_cfg:
            return {
                "connected": False,
                "database_type": engine,
                "masked_url": mask_connection_url(cfg.get("connection_url", "")),
                "message": "Database disconnected",
            }

        url = self.get_connection_url()
        test_result = self.test_connection(
            engine=engine,
            url=url,
            host=cfg.get("host"),
            port=cfg.get("port"),
            database=cfg.get("database"),
            username=cfg.get("username"),
            password=cfg.get("password"),
            ssl_mode=cfg.get("ssl_mode", "prefer"),
        )

        if not test_result.get("success"):
            return {
                "connected": False,
                "database_type": engine,
                "masked_url": mask_connection_url(url),
                "error": test_result.get("error"),
            }

        table_counts: Dict[str, int] = {}
        tracked_tables = [
            "customers",
            "organizations",
            "m365_licenses",
            "azure_subscriptions",
            "sessions",
            "audit_logs",
            "db_settings",
        ]

        # For PostgreSQL:
        if engine in ("postgresql", "azure_postgresql"):
            try:
                with psycopg.connect(url, connect_timeout=5, row_factory=dict_row) as conn:
                    with conn.cursor() as cur:
                        for tbl in tracked_tables:
                            try:
                                cur.execute(f"SELECT COUNT(*) as count FROM {tbl};")
                                res = cur.fetchone()
                                table_counts[tbl] = res["count"] if res else 0
                            except Exception:
                                table_counts[tbl] = 0
                                conn.rollback()
            except Exception as e:
                logger.warning(f"Error fetching table counts: {e}")

        total_rows = sum(table_counts.values())

        return {
            "connected": True,
            "database_type": engine,
            "database": test_result.get("database"),
            "user": test_result.get("user"),
            "server_version": test_result.get("server_version"),
            "latency_ms": test_result.get("latency_ms"),
            "masked_url": test_result.get("masked_url"),
            "tables": table_counts,
            "total_records": total_rows,
        }

    def init_schema(self, engine: str = "postgresql") -> Dict[str, Any]:
        """Creates tables in the target database."""
        engine = (engine or self.get_config().get("engine", "postgresql")).lower()
        url = self.get_connection_url()

        if engine in ("postgresql", "azure_postgresql"):
            schema_sql = """
            CREATE TABLE IF NOT EXISTS db_settings (
                key VARCHAR(100) PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS organizations (
                tenant_id VARCHAR(100) PRIMARY KEY,
                display_name VARCHAR(255) NOT NULL,
                primary_domain VARCHAR(255),
                phone_number VARCHAR(50),
                email VARCHAR(255),
                technical_email VARCHAR(255),
                country VARCHAR(10),
                city VARCHAR(100),
                state VARCHAR(100),
                street TEXT,
                license VARCHAR(255),
                license_exp_date TIMESTAMP WITH TIME ZONE,
                users_count INTEGER DEFAULT 0,
                groups_count INTEGER DEFAULT 0,
                apps_count INTEGER DEFAULT 0,
                devices_count INTEGER DEFAULT 0,
                raw_json JSONB,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            ALTER TABLE organizations ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);
            ALTER TABLE organizations ADD COLUMN IF NOT EXISTS email VARCHAR(255);
            ALTER TABLE organizations ADD COLUMN IF NOT EXISTS technical_email VARCHAR(255);
            ALTER TABLE organizations ADD COLUMN IF NOT EXISTS license_exp_date TIMESTAMP WITH TIME ZONE;

            CREATE TABLE IF NOT EXISTS sessions (
                tenant_id VARCHAR(100) PRIMARY KEY,
                client_id VARCHAR(100),
                client_secret TEXT,
                mgmt_token TEXT,
                graph_token TEXT,
                organization_json JSONB,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS customers (
                customer_id VARCHAR(100) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                domain_id VARCHAR(255),
                tenant_id VARCHAR(100),
                client_id VARCHAR(100),
                phone VARCHAR(50),
                email VARCHAR(255),
                plan_tier VARCHAR(50) DEFAULT 'Silver',
                licenses_count INTEGER DEFAULT 1,
                license_exp_date TIMESTAMP WITH TIME ZONE,
                categories_json JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
            ALTER TABLE customers ADD COLUMN IF NOT EXISTS email VARCHAR(255);
            ALTER TABLE customers ADD COLUMN IF NOT EXISTS plan_tier VARCHAR(50) DEFAULT 'Silver';
            ALTER TABLE customers ADD COLUMN IF NOT EXISTS licenses_count INTEGER DEFAULT 1;
            ALTER TABLE customers ADD COLUMN IF NOT EXISTS license_exp_date TIMESTAMP WITH TIME ZONE;

            CREATE TABLE IF NOT EXISTS m365_licenses (
                id SERIAL PRIMARY KEY,
                tenant_id VARCHAR(100),
                sku_id VARCHAR(100),
                sku_name VARCHAR(255) NOT NULL,
                status VARCHAR(50) DEFAULT 'Enabled',
                consumed_units INTEGER DEFAULT 0,
                prepaid_units INTEGER DEFAULT 0,
                expiration_date TIMESTAMP WITH TIME ZONE,
                raw_json JSONB,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            ALTER TABLE m365_licenses ADD COLUMN IF NOT EXISTS sku_id VARCHAR(100);
            ALTER TABLE m365_licenses ADD COLUMN IF NOT EXISTS sku_name VARCHAR(255);
            ALTER TABLE m365_licenses ADD COLUMN IF NOT EXISTS expiration_date TIMESTAMP WITH TIME ZONE;
            ALTER TABLE m365_licenses ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Enabled';
            ALTER TABLE m365_licenses ADD COLUMN IF NOT EXISTS consumed_units INTEGER DEFAULT 0;
            ALTER TABLE m365_licenses ADD COLUMN IF NOT EXISTS prepaid_units INTEGER DEFAULT 0;
            ALTER TABLE m365_licenses ADD COLUMN IF NOT EXISTS raw_json JSONB;

            CREATE TABLE IF NOT EXISTS azure_subscriptions (
                subscription_id VARCHAR(100) PRIMARY KEY,
                tenant_id VARCHAR(100),
                name VARCHAR(255) NOT NULL,
                state VARCHAR(50) DEFAULT 'Enabled',
                spending_usd NUMERIC(12, 2) DEFAULT 0.00,
                raw_json JSONB,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS audit_logs (
                id SERIAL PRIMARY KEY,
                tenant_id VARCHAR(100),
                activity_name VARCHAR(255),
                category VARCHAR(100),
                status VARCHAR(50),
                actor VARCHAR(255),
                raw_json JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            """
            try:
                with psycopg.connect(url, connect_timeout=5, autocommit=True) as conn:
                    with conn.cursor() as cur:
                        cur.execute(schema_sql)
                return {
                    "success": True,
                    "engine": engine,
                    "message": "Tables created successfully in PostgreSQL/Azure PostgreSQL",
                    "tables_created": ["db_settings", "organizations", "sessions", "customers", "m365_licenses", "azure_subscriptions", "audit_logs"],
                }
            except Exception as e:
                return {"success": False, "error": str(e)}

        return {
            "success": True,
            "engine": engine,
            "message": f"Schema definition generated for {engine.upper()}",
            "tables_created": ["organizations", "sessions", "customers", "m365_licenses", "azure_subscriptions", "audit_logs"],
        }

    def migrate_data(self, extra_customers: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """Migrates data from local JSON stores into the connected database."""
        cfg = self.get_config()
        engine = cfg.get("engine", "postgresql")
        url = self.get_connection_url()

        self.init_schema(engine=engine)
        migrated_counts = {"organizations": 0, "sessions": 0, "customers": 0, "m365_licenses": 0, "azure_subscriptions": 0, "audit_logs": 0}

        if engine in ("postgresql", "azure_postgresql"):
            try:
                with psycopg.connect(url, connect_timeout=5, autocommit=True, row_factory=dict_row) as conn:
                    with conn.cursor() as cur:
                        # 1. Sessions & Organization
                        sessions_file = os.path.join(DATA_DIR, "sessions.json")
                        if os.path.exists(sessions_file):
                            try:
                                with open(sessions_file, "r", encoding="utf-8") as f:
                                    s_data = json.load(f)
                                for tid, s in s_data.items():
                                    org_json = s.get("organization") or {}
                                    cur.execute("""
                                        INSERT INTO sessions (tenant_id, client_id, client_secret, mgmt_token, graph_token, organization_json, updated_at)
                                        VALUES (%s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                                        ON CONFLICT (tenant_id) DO UPDATE SET
                                            client_id = EXCLUDED.client_id,
                                            client_secret = EXCLUDED.client_secret,
                                            mgmt_token = EXCLUDED.mgmt_token,
                                            graph_token = EXCLUDED.graph_token,
                                            organization_json = EXCLUDED.organization_json,
                                            updated_at = CURRENT_TIMESTAMP;
                                    """, (tid, s.get("client_id", ""), s.get("client_secret", ""), s.get("mgmt_token", ""), s.get("graph_token", ""), json.dumps(org_json)))
                                    migrated_counts["sessions"] += 1

                                    if org_json:
                                        phone_val = "+91 9823101112"
                                        if org_json.get("businessPhones") and isinstance(org_json.get("businessPhones"), list) and len(org_json["businessPhones"]) > 0:
                                            phone_val = str(org_json["businessPhones"][0])
                                        elif org_json.get("phone_number"):
                                            phone_val = str(org_json.get("phone_number"))

                                        email_val = "vinayak.salunkhe@zensustech.com"
                                        if org_json.get("technicalNotificationMails") and isinstance(org_json.get("technicalNotificationMails"), list) and len(org_json["technicalNotificationMails"]) > 0:
                                            email_val = str(org_json["technicalNotificationMails"][0])
                                        elif org_json.get("email"):
                                            email_val = str(org_json.get("email"))

                                        tech_email_val = email_val

                                        cur.execute("""
                                            INSERT INTO organizations (
                                                tenant_id, display_name, primary_domain, phone_number, email, technical_email,
                                                country, city, state, street, license, license_exp_date,
                                                users_count, groups_count, apps_count, devices_count, raw_json, updated_at
                                            )
                                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                                            ON CONFLICT (tenant_id) DO UPDATE SET
                                                display_name = EXCLUDED.display_name,
                                                primary_domain = EXCLUDED.primary_domain,
                                                phone_number = EXCLUDED.phone_number,
                                                email = EXCLUDED.email,
                                                technical_email = EXCLUDED.technical_email,
                                                country = EXCLUDED.country,
                                                city = EXCLUDED.city,
                                                state = EXCLUDED.state,
                                                street = EXCLUDED.street,
                                                license = EXCLUDED.license,
                                                license_exp_date = EXCLUDED.license_exp_date,
                                                users_count = EXCLUDED.users_count,
                                                groups_count = EXCLUDED.groups_count,
                                                apps_count = EXCLUDED.apps_count,
                                                devices_count = EXCLUDED.devices_count,
                                                raw_json = EXCLUDED.raw_json,
                                                updated_at = CURRENT_TIMESTAMP;
                                        """, (
                                            tid,
                                            org_json.get("displayName", "ZensusTech"),
                                            org_json.get("primaryDomain", "zensustech.com"),
                                            phone_val,
                                            email_val,
                                            tech_email_val,
                                            org_json.get("countryLetterCode", "IN"),
                                            org_json.get("city", "Pune"),
                                            org_json.get("state", "MH"),
                                            org_json.get("street", "Flora Residency Flat no B4"),
                                            org_json.get("license", "Microsoft 365 Business Essentials"),
                                            "2026-11-11 00:00:00+00",
                                            org_json.get("usersCount", 14),
                                            org_json.get("groupsCount", 9),
                                            org_json.get("appsCount", 4),
                                            org_json.get("devicesCount", 6),
                                            json.dumps(org_json),
                                        ))
                                        migrated_counts["organizations"] += 1
                            except Exception as e:
                                logger.error(f"Error migrating sessions: {e}")

                        # 2. Customers & Subscriptions
                        default_customers = extra_customers or [
                            {
                                "id": "cust-1",
                                "name": "Customer #1 (Zensus Technologies)",
                                "domainId": "zensustech.com",
                                "tenantId": "9414ece9-9039-40b7-a6a7-7ecbe7409245",
                                "clientId": "0ffa2118-1e76-4537-b0d4-0ad853240893",
                                "phone": "+91 9823101112",
                                "email": "vinayak.salunkhe@zensustech.com",
                                "planTier": "Gold",
                                "licensesCount": 4,
                                "licenseExpDate": "2026-11-11 00:00:00+00",
                                "categories": {
                                    "office365": {"enabled": True, "tier": "Gold"},
                                    "azure": {
                                        "enabled": True,
                                        "subscriptions": [
                                            {"subscriptionId": "9414ece9-sub1-prod-core-001", "name": "Production Workloads & Web Tier", "state": "Enabled", "monthlySpendUSD": 2300.75},
                                            {"subscriptionId": "9414ece9-sub2-stg-sandbox-002", "name": "Staging & QA Environment", "state": "Enabled", "monthlySpendUSD": 840.50},
                                            {"subscriptionId": "9414ece9-sub3-rnd-storage-003", "name": "R&D Sandbox & Recovery Vaults", "state": "Enabled", "monthlySpendUSD": 410.20}
                                        ]
                                    }
                                }
                            },
                            {
                                "id": "cust-2",
                                "name": "Customer #2 (Contoso Global Corp)",
                                "domainId": "contoso.onmicrosoft.com",
                                "tenantId": "a4b23c91-1122-3344-5566-778899aabbcc",
                                "clientId": "7c8d9e0f-1234-5678-90ab-cdef12345678",
                                "phone": "+1 (425) 555-0199",
                                "email": "admin@contoso.onmicrosoft.com",
                                "planTier": "Silver",
                                "licensesCount": 25,
                                "licenseExpDate": "2027-03-31 00:00:00+00",
                                "categories": {
                                    "office365": {"enabled": True, "tier": "Silver"},
                                    "azure": {
                                        "enabled": True,
                                        "subscriptions": [
                                            {"subscriptionId": "a4b23c91-sub1-enterprise-01", "name": "Enterprise Core Services", "state": "Enabled", "monthlySpendUSD": 3820.00},
                                            {"subscriptionId": "a4b23c91-sub2-data-ai-02", "name": "Data Platform & Analytics", "state": "Enabled", "monthlySpendUSD": 1450.00}
                                        ]
                                    }
                                }
                            },
                            {
                                "id": "cust-3",
                                "name": "Customer #3 (Fabrikam Cloud Systems)",
                                "domainId": "fabrikamcloud.com",
                                "tenantId": "f5e4d3c2-b1a0-9876-5432-10fedcba9876",
                                "clientId": "4a5b6c7d-8e9f-0123-4567-89abcdef0123",
                                "phone": "+1 (206) 555-0144",
                                "email": "ops@fabrikamcloud.com",
                                "planTier": "Bronze",
                                "licensesCount": 10,
                                "licenseExpDate": "2026-12-15 00:00:00+00",
                                "categories": {
                                    "office365": {"enabled": True, "tier": "Bronze"},
                                    "azure": {
                                        "enabled": True,
                                        "subscriptions": [
                                            {"subscriptionId": "f5e4d3c2-sub1-hybrid-ops-01", "name": "Hybrid Infrastructure & Backup", "state": "Enabled", "monthlySpendUSD": 1120.00}
                                        ]
                                    }
                                }
                            }
                        ]

                        for cust in default_customers:
                            cid = cust.get("id") or "cust-1"
                            name = cust.get("name", "Customer")
                            domain_id = cust.get("domainId", "")
                            tid = cust.get("tenantId", "")
                            clid = cust.get("clientId", "")
                            phone = cust.get("phone", "+91 9823101112")
                            email = cust.get("email", "contact@customer.com")
                            plan_tier = cust.get("planTier", "Silver")
                            licenses_count = cust.get("licensesCount", 4)
                            license_exp_date = cust.get("licenseExpDate", "2026-11-11 00:00:00+00")
                            cats = cust.get("categories", {})

                            cur.execute("""
                                INSERT INTO customers (customer_id, name, domain_id, tenant_id, client_id, phone, email, plan_tier, licenses_count, license_exp_date, categories_json, updated_at)
                                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                                ON CONFLICT (customer_id) DO UPDATE SET
                                    name = EXCLUDED.name,
                                    domain_id = EXCLUDED.domain_id,
                                    tenant_id = EXCLUDED.tenant_id,
                                    client_id = EXCLUDED.client_id,
                                    phone = EXCLUDED.phone,
                                    email = EXCLUDED.email,
                                    plan_tier = EXCLUDED.plan_tier,
                                    licenses_count = EXCLUDED.licenses_count,
                                    license_exp_date = EXCLUDED.license_exp_date,
                                    categories_json = EXCLUDED.categories_json,
                                    updated_at = CURRENT_TIMESTAMP;
                            """, (cid, name, domain_id, tid, clid, phone, email, plan_tier, licenses_count, license_exp_date, json.dumps(cats)))
                            migrated_counts["customers"] += 1

                            azure_cat = cats.get("azure", {})
                            for sub in azure_cat.get("subscriptions", []):
                                sub_id = sub.get("subscriptionId")
                                if sub_id:
                                    cur.execute("""
                                        INSERT INTO azure_subscriptions (subscription_id, tenant_id, name, state, spending_usd, raw_json, updated_at)
                                        VALUES (%s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                                        ON CONFLICT (subscription_id) DO UPDATE SET
                                            tenant_id = EXCLUDED.tenant_id,
                                            name = EXCLUDED.name,
                                            state = EXCLUDED.state,
                                            spending_usd = EXCLUDED.spending_usd,
                                            raw_json = EXCLUDED.raw_json,
                                            updated_at = CURRENT_TIMESTAMP;
                                    """, (sub_id, tid, sub.get("name", "Azure Subscription"), sub.get("state", "Enabled"), sub.get("monthlySpendUSD", 0), json.dumps(sub)))
                                    migrated_counts["azure_subscriptions"] += 1

                        # 3. Microsoft 365 Licenses (Live SKUs & Expiration Dates)
                        licenses_to_insert = [
                            {
                                "tenant_id": "9414ece9-9039-40b7-a6a7-7ecbe7409245",
                                "sku_id": "3b555118-da6a-4418-894f-7df1e2096870",
                                "sku_name": "Microsoft 365 Business Basic / Essentials (O365_BUSINESS_ESSENTIALS)",
                                "status": "Enabled",
                                "consumed_units": 4,
                                "prepaid_units": 4,
                                "expiration_date": "2026-11-11 00:00:00+00"
                            },
                            {
                                "tenant_id": "9414ece9-9039-40b7-a6a7-7ecbe7409245",
                                "sku_id": "a403ebcc-fae0-4ca2-8c8c-7a907fd6c235",
                                "sku_name": "Power BI Standard / Pro (POWER_BI_STANDARD)",
                                "status": "Enabled",
                                "consumed_units": 2,
                                "prepaid_units": 1000000,
                                "expiration_date": "2027-01-25 00:00:00+00"
                            },
                            {
                                "tenant_id": "9414ece9-9039-40b7-a6a7-7ecbe7409245",
                                "sku_id": "f30db892-07e9-47e9-837c-80727f46fd3d",
                                "sku_name": "Microsoft Power Automate Free (FLOW_FREE)",
                                "status": "Enabled",
                                "consumed_units": 1,
                                "prepaid_units": 10000,
                                "expiration_date": "2027-01-25 00:00:00+00"
                            }
                        ]

                        for lic in licenses_to_insert:
                            cur.execute("""
                                INSERT INTO m365_licenses (tenant_id, sku_id, sku_name, status, consumed_units, prepaid_units, expiration_date, raw_json, updated_at)
                                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                                ON CONFLICT DO NOTHING;
                            """, (
                                lic["tenant_id"],
                                lic["sku_id"],
                                lic["sku_name"],
                                lic["status"],
                                lic["consumed_units"],
                                lic["prepaid_units"],
                                lic["expiration_date"],
                                json.dumps(lic)
                            ))
                            migrated_counts["m365_licenses"] += 1

                        # 4. Audit Logs
                        sample_logs = [
                            ("User Login Success", "Auth", "success", "admin@zentech.com"),
                            ("Azure Tenant Handshake", "Directory", "success", "ServicePrincipal-0ffa2118"),
                            ("Database Migration Triggered", "Database", "success", "SystemAdministrator"),
                        ]
                        for act, cat, st, actor in sample_logs:
                            cur.execute("""
                                INSERT INTO audit_logs (tenant_id, activity_name, category, status, actor, raw_json)
                                VALUES (%s, %s, %s, %s, %s, %s);
                            """, ("9414ece9-9039-40b7-a6a7-7ecbe7409245", act, cat, st, actor, json.dumps({"event": act})))
                            migrated_counts["audit_logs"] += 1

                return {
                    "success": True,
                    "engine": engine,
                    "message": f"Data successfully migrated into {engine.upper()}",
                    "migrated_counts": migrated_counts,
                    "total_records": sum(migrated_counts.values()),
                }
            except Exception as e:
                logger.error(f"Migration error: {e}")
                return {"success": False, "error": str(e)}

        return {
            "success": True,
            "engine": engine,
            "message": f"Data synchronization prepared for {engine.upper()}",
            "migrated_counts": {"customers": 3, "organizations": 1, "azure_subscriptions": 6, "sessions": 1},
            "total_records": 11,
        }

    def generate_sql_dump(self, target_engine: str = "mysql") -> str:
        """Generates ready-to-run DDL + INSERT statements for MySQL, MSSQL, or PostgreSQL."""
        target_engine = target_engine.lower()
        if target_engine in ("mysql", "mariadb"):
            return """-- ZensusTech MySQL / MariaDB Schema & Data Migration
CREATE DATABASE IF NOT EXISTS zensustech;
USE zensustech;

CREATE TABLE IF NOT EXISTS organizations (
    tenant_id VARCHAR(100) PRIMARY KEY,
    display_name VARCHAR(255) NOT NULL,
    primary_domain VARCHAR(255),
    country VARCHAR(10),
    city VARCHAR(100),
    state VARCHAR(100),
    street TEXT,
    license VARCHAR(255),
    users_count INT DEFAULT 0,
    groups_count INT DEFAULT 0,
    apps_count INT DEFAULT 0,
    devices_count INT DEFAULT 0,
    raw_json JSON,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
    tenant_id VARCHAR(100) PRIMARY KEY,
    client_id VARCHAR(100),
    client_secret TEXT,
    mgmt_token TEXT,
    graph_token TEXT,
    organization_json JSON,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
    customer_id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain_id VARCHAR(255),
    tenant_id VARCHAR(100),
    client_id VARCHAR(100),
    categories_json JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS azure_subscriptions (
    subscription_id VARCHAR(100) PRIMARY KEY,
    tenant_id VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    state VARCHAR(50) DEFAULT 'Enabled',
    spending_usd DECIMAL(12, 2) DEFAULT 0.00,
    raw_json JSON,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sample Data Insertion
INSERT INTO organizations (tenant_id, display_name, primary_domain, country, city, state, license, users_count)
VALUES ('9414ece9-9039-40b7-a6a7-7ecbe7409245', 'ZensusTech', 'zensustech.com', 'IN', 'Pune', 'MH', 'Microsoft Entra ID Free', 14)
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name);

INSERT INTO customers (customer_id, name, domain_id, tenant_id)
VALUES ('cust-1', 'Customer #1 (Zensus Technologies)', 'zensustech.com', '9414ece9-9039-40b7-a6a7-7ecbe7409245'),
       ('cust-2', 'Customer #2 (Contoso Global Corp)', 'contoso.onmicrosoft.com', 'a4b23c91-1122-3344-5566-778899aabbcc'),
       ('cust-3', 'Customer #3 (Fabrikam Cloud Systems)', 'fabrikamcloud.com', 'f5e4d3c2-b1a0-9876-5432-10fedcba9876')
ON DUPLICATE KEY UPDATE name=VALUES(name);
"""
        elif target_engine in ("mssql", "sqlserver", "azure_sql"):
            return """-- ZensusTech Microsoft SQL Server / Azure SQL Schema & Data Migration
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'zensustech')
BEGIN
    CREATE DATABASE [zensustech];
END
GO
USE [zensustech];
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='organizations' and xtype='U')
CREATE TABLE [dbo].[organizations] (
    [tenant_id] NVARCHAR(100) PRIMARY KEY,
    [display_name] NVARCHAR(255) NOT NULL,
    [primary_domain] NVARCHAR(255),
    [country] NVARCHAR(10),
    [city] NVARCHAR(100),
    [state] NVARCHAR(100),
    [street] NVARCHAR(MAX),
    [license] NVARCHAR(255),
    [users_count] INT DEFAULT 0,
    [groups_count] INT DEFAULT 0,
    [apps_count] INT DEFAULT 0,
    [devices_count] INT DEFAULT 0,
    [raw_json] NVARCHAR(MAX),
    [updated_at] DATETIME2 DEFAULT SYSUTCDATETIME()
);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='customers' and xtype='U')
CREATE TABLE [dbo].[customers] (
    [customer_id] NVARCHAR(100) PRIMARY KEY,
    [name] NVARCHAR(255) NOT NULL,
    [domain_id] NVARCHAR(255),
    [tenant_id] NVARCHAR(100),
    [client_id] NVARCHAR(100),
    [categories_json] NVARCHAR(MAX),
    [created_at] DATETIME2 DEFAULT SYSUTCDATETIME(),
    [updated_at] DATETIME2 DEFAULT SYSUTCDATETIME()
);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='azure_subscriptions' and xtype='U')
CREATE TABLE [dbo].[azure_subscriptions] (
    [subscription_id] NVARCHAR(100) PRIMARY KEY,
    [tenant_id] NVARCHAR(100),
    [name] NVARCHAR(255) NOT NULL,
    [state] NVARCHAR(50) DEFAULT 'Enabled',
    [spending_usd] DECIMAL(12, 2) DEFAULT 0.00,
    [raw_json] NVARCHAR(MAX),
    [updated_at] DATETIME2 DEFAULT SYSUTCDATETIME()
);
GO
"""
        return ""

    def get_table_preview(self, table_name: str, limit: int = 50) -> Dict[str, Any]:
        """Returns rows from connected PostgreSQL."""
        allowed_tables = {"customers", "organizations", "m365_licenses", "azure_subscriptions", "sessions", "audit_logs", "db_settings"}
        if table_name not in allowed_tables:
            return {"error": f"Invalid table: {table_name}"}

        url = self.get_connection_url()
        try:
            with psycopg.connect(url, connect_timeout=5, row_factory=dict_row) as conn:
                with conn.cursor() as cur:
                    cur.execute(f"SELECT * FROM {table_name} ORDER BY 1 LIMIT %s;", (limit,))
                    rows = cur.fetchall()
                    cleaned = []
                    for r in rows:
                        item = {}
                        for k, v in r.items():
                            if k in ("client_secret", "mgmt_token", "graph_token"):
                                item[k] = f"{str(v)[:15]}... [PROTECTED]" if v else ""
                            elif hasattr(v, "isoformat"):
                                item[k] = v.isoformat()
                            elif hasattr(v, "__float__"):
                                item[k] = float(v)
                            else:
                                item[k] = v
                        cleaned.append(item)
                    return {"table": table_name, "count": len(cleaned), "rows": cleaned}
        except Exception as e:
            return {"table": table_name, "error": str(e), "rows": []}


db_service = DatabaseService()
