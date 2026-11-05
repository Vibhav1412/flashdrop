-- =====================================================================
-- PROJECT FLASHDROP: 08_ROLES.SQL
-- Engine: MySQL 8.0 (InnoDB)
-- Component 12: Authentication & Role-Based Access Control in Database
-- Max Marks: 4
-- =====================================================================

USE flashdrop;

-- =====================================================================
-- 1. DEFINE NATIVE MYSQL 8 DATABASE ROLES
-- =====================================================================

CREATE ROLE IF NOT EXISTS 'flashdrop_admin';
CREATE ROLE IF NOT EXISTS 'flashdrop_customer';

-- =====================================================================
-- 2. LEAST-PRIVILEGE GRANTS: flashdrop_customer
-- =====================================================================

-- Catalog & Storefront View Grants (Read-Only)
GRANT SELECT ON flashdrop.products TO 'flashdrop_customer';
GRANT SELECT ON flashdrop.categories TO 'flashdrop_customer';
GRANT SELECT ON flashdrop.drops TO 'flashdrop_customer';
GRANT SELECT ON flashdrop.vw_live_drop_catalog TO 'flashdrop_customer';
GRANT SELECT ON flashdrop.vw_customer_order_history TO 'flashdrop_customer';

-- Customer manages their own shipping address book
GRANT SELECT, INSERT, UPDATE, DELETE ON flashdrop.addresses TO 'flashdrop_customer';

-- Customer can read own wallet balance & ledger
GRANT SELECT ON flashdrop.wallets TO 'flashdrop_customer';
GRANT SELECT ON flashdrop.wallet_ledger TO 'flashdrop_customer';

-- EXECUTE grants on vetted stored procedures & functions
-- Customers CANNOT directly issue UPDATE/DELETE on inventory or orders!
-- All mutations MUST pass through transactional procedures:
GRANT EXECUTE ON PROCEDURE flashdrop.sp_place_order TO 'flashdrop_customer';
GRANT EXECUTE ON PROCEDURE flashdrop.sp_deposit_wallet TO 'flashdrop_customer';
GRANT EXECUTE ON FUNCTION flashdrop.fn_calculate_loyalty_discount TO 'flashdrop_customer';
GRANT EXECUTE ON FUNCTION flashdrop.fn_is_user_suspended TO 'flashdrop_customer';
GRANT EXECUTE ON FUNCTION flashdrop.fn_get_category_breadcrumb TO 'flashdrop_customer';

-- Explicit Revocation / Deny:
-- Customer cannot directly touch inventory, orders, payments, audit_log, or fraud_flags
REVOKE INSERT, UPDATE, DELETE ON flashdrop.inventory FROM 'flashdrop_customer';
REVOKE INSERT, UPDATE, DELETE ON flashdrop.orders FROM 'flashdrop_customer';
REVOKE INSERT, UPDATE, DELETE ON flashdrop.payments FROM 'flashdrop_customer';
REVOKE INSERT, UPDATE, DELETE ON flashdrop.audit_log FROM 'flashdrop_customer';
REVOKE INSERT, UPDATE, DELETE ON flashdrop.fraud_flags FROM 'flashdrop_customer';

-- =====================================================================
-- 3. ADMINISTRATIVE GRANTS: flashdrop_admin
-- =====================================================================

-- Full Administrative Privileges
GRANT ALL PRIVILEGES ON flashdrop.* TO 'flashdrop_admin';

-- =====================================================================
-- 4. CREATE APPLICATION DATABASE USERS & ASSIGN ROLES
-- =====================================================================

-- Create Customer Database Users (localhost & wildcard for pooling/Docker)
CREATE USER IF NOT EXISTS 'flashdrop_customer_user'@'localhost' IDENTIFIED BY 'customer_secure_pass_123';
CREATE USER IF NOT EXISTS 'flashdrop_customer_user'@'%' IDENTIFIED BY 'customer_secure_pass_123';

-- Create Admin Database Users
CREATE USER IF NOT EXISTS 'flashdrop_admin_user'@'localhost' IDENTIFIED BY 'admin_secure_pass_123';
CREATE USER IF NOT EXISTS 'flashdrop_admin_user'@'%' IDENTIFIED BY 'admin_secure_pass_123';

-- Assign Roles to Users
GRANT 'flashdrop_customer' TO 'flashdrop_customer_user'@'localhost';
GRANT 'flashdrop_customer' TO 'flashdrop_customer_user'@'%';

GRANT 'flashdrop_admin' TO 'flashdrop_admin_user'@'localhost';
GRANT 'flashdrop_admin' TO 'flashdrop_admin_user'@'%';

-- Activate Default Roles upon connection handshake
SET DEFAULT ROLE 'flashdrop_customer' TO 'flashdrop_customer_user'@'localhost';
SET DEFAULT ROLE 'flashdrop_customer' TO 'flashdrop_customer_user'@'%';

SET DEFAULT ROLE 'flashdrop_admin' TO 'flashdrop_admin_user'@'localhost';
SET DEFAULT ROLE 'flashdrop_admin' TO 'flashdrop_admin_user'@'%';

FLUSH PRIVILEGES;

-- =====================================================================
-- 5. VERIFICATION QUERY: Audit Assigned Roles
-- =====================================================================
SELECT 
    user, host, default_role_user, default_role_host 
FROM 
    mysql.default_roles 
WHERE 
    user IN ('flashdrop_customer_user', 'flashdrop_admin_user');
