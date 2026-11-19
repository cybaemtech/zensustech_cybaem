import psycopg
from psycopg.rows import dict_row

DB_URL = 'postgresql://postgres:root@localhost:5432/zensustech'

def run():
    with psycopg.connect(DB_URL, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            # 1. Update vendors table schema & populate
            cur.execute("""
                CREATE TABLE IF NOT EXISTS vendors (
                    vendor_id VARCHAR(100) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    code VARCHAR(50),
                    contact_email VARCHAR(255),
                    phone VARCHAR(50),
                    organization VARCHAR(255),
                    plan_tier VARCHAR(100) DEFAULT 'Cloud - Azure (Gold)',
                    license_exp_date TIMESTAMP WITH TIME ZONE,
                    status VARCHAR(50) DEFAULT 'Active',
                    categories_json JSONB,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
                ALTER TABLE vendors ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
                ALTER TABLE vendors ADD COLUMN IF NOT EXISTS organization VARCHAR(255);
                ALTER TABLE vendors ADD COLUMN IF NOT EXISTS plan_tier VARCHAR(100) DEFAULT 'Cloud - Azure (Gold)';
                ALTER TABLE vendors ADD COLUMN IF NOT EXISTS license_exp_date TIMESTAMP WITH TIME ZONE;
                ALTER TABLE vendors ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active';
                ALTER TABLE vendors ADD COLUMN IF NOT EXISTS categories_json JSONB;
                ALTER TABLE vendors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

                INSERT INTO vendors (vendor_id, name, code, contact_email, phone, organization, plan_tier, license_exp_date, status, updated_at)
                VALUES 
                    ('vendor-lt', 'Larsen & Toubro (L&T)', 'LT', 'admin@lt.com', '+91 22 6752 5656', 'L&T Infotech', 'Cloud - Azure (Gold)', '2027-11-11 00:00:00+00', 'Active', CURRENT_TIMESTAMP),
                    ('vendor-tata', 'Tata Consultancy Services (TATA)', 'TATA', 'admin@tata.com', '+91 22 6778 9999', 'Tata Group', 'Cloud - AWS (Silver)', '2027-11-11 00:00:00+00', 'Active', CURRENT_TIMESTAMP)
                ON CONFLICT (vendor_id) DO UPDATE SET
                    name = EXCLUDED.name,
                    code = EXCLUDED.code,
                    contact_email = EXCLUDED.contact_email,
                    phone = EXCLUDED.phone,
                    organization = EXCLUDED.organization,
                    plan_tier = EXCLUDED.plan_tier,
                    license_exp_date = EXCLUDED.license_exp_date,
                    status = EXCLUDED.status,
                    updated_at = CURRENT_TIMESTAMP;
            """)

            # 2. Update customers table with renewed date and plan
            cur.execute("""
                ALTER TABLE customers ALTER COLUMN plan_tier TYPE VARCHAR(100);
                UPDATE customers SET 
                    plan_tier = 'Cloud - Azure (Gold)',
                    license_exp_date = '2027-11-11 00:00:00+00',
                    updated_at = CURRENT_TIMESTAMP
                WHERE customer_id = 'cust-1';
            """)

            # 3. Update organizations table
            cur.execute("""
                UPDATE organizations SET 
                    license_exp_date = '2027-11-11 00:00:00+00',
                    updated_at = CURRENT_TIMESTAMP
                WHERE tenant_id = '9414ece9-9039-40b7-a6a7-7ecbe7409245';
            """)

            # 4. Update m365_licenses table
            cur.execute("""
                UPDATE m365_licenses SET 
                    expiration_date = '2027-11-11 00:00:00+00',
                    updated_at = CURRENT_TIMESTAMP
                WHERE sku_id = '3b555118-da6a-4418-894f-7df1e2096870';
            """)

            conn.commit()
            print('PostgreSQL updated successfully!')

            # Verify
            cur.execute('SELECT vendor_id, name, contact_email, phone, organization, plan_tier, license_exp_date, status FROM vendors')
            print('VENDORS:', cur.fetchall())
            cur.execute('SELECT customer_id, name, email, phone, plan_tier, license_exp_date FROM customers')
            print('CUSTOMERS:', cur.fetchall())
            cur.execute('SELECT sku_name, expiration_date FROM m365_licenses')
            print('M365 LICENSES:', cur.fetchall())

if __name__ == '__main__':
    run()
