# Component 12: Authentication & Role-Based Access Control in Database
**PES University DBMS Level 3 Evaluation Component 12 | Max Marks: 4**

---

## 1. Overview & Source Code Mapping
- **Database Script**: `sql/08_roles.sql`
- **Application Auth**: NextAuth.js / JWT session validation with `bcrypt` (cost factor 12).
- **Core Requirement**: Minimum of **two distinct roles** (`flashdrop_admin`, `flashdrop_customer`) enforced **directly within the MySQL database engine**, not solely in application code.

---

## 2. Multi-Layer Security Architecture

```text
Layer 1: Frontend UI Guard      -> Hides Admin navigation links from customers
Layer 2: API Route Middleware    -> Inspects signed JWT session claims
Layer 3: DATABASE ROLES (Core)  -> MySQL Engine checks SQL privileges on every query!
```

---

## 3. Database Role Definition & Least-Privilege Grants (`sql/08_roles.sql`)

```sql
-- 1. Create native MySQL 8 roles
CREATE ROLE IF NOT EXISTS 'flashdrop_admin';
CREATE ROLE IF NOT EXISTS 'flashdrop_customer';

-- 2. Grant permissions to flashdrop_customer
-- Customer can read catalog, views, and own addresses
GRANT SELECT ON flashdrop.products TO 'flashdrop_customer';
GRANT SELECT ON flashdrop.categories TO 'flashdrop_customer';
GRANT SELECT ON flashdrop.drops TO 'flashdrop_customer';
GRANT SELECT ON flashdrop.vw_live_drop_catalog TO 'flashdrop_customer';
GRANT SELECT, INSERT, UPDATE ON flashdrop.addresses TO 'flashdrop_customer';

-- Customer CANNOT directly modify orders, inventory, or ledger!
-- Direct DML is revoked/denied:
-- REVOKE INSERT, UPDATE, DELETE ON flashdrop.inventory FROM 'flashdrop_customer';
-- REVOKE INSERT, UPDATE, DELETE ON flashdrop.orders FROM 'flashdrop_customer';

-- Customer can ONLY interact with inventory and orders through vetted stored procedures:
GRANT EXECUTE ON PROCEDURE flashdrop.sp_place_order TO 'flashdrop_customer';
GRANT EXECUTE ON PROCEDURE flashdrop.sp_deposit_wallet TO 'flashdrop_customer';
GRANT EXECUTE ON FUNCTION flashdrop.fn_calculate_loyalty_discount TO 'flashdrop_customer';

-- 3. Grant permissions to flashdrop_admin
-- Admin has complete operational control
GRANT ALL PRIVILEGES ON flashdrop.* TO 'flashdrop_admin';

-- 4. Create concrete database users and assign roles
CREATE USER IF NOT EXISTS 'flashdrop_customer_user'@'%' IDENTIFIED BY 'customer_secure_pass_123';
CREATE USER IF NOT EXISTS 'flashdrop_admin_user'@'%' IDENTIFIED BY 'admin_secure_pass_123';

GRANT 'flashdrop_customer' TO 'flashdrop_customer_user'@'%';
GRANT 'flashdrop_admin' TO 'flashdrop_admin_user'@'%';

-- Activate default roles upon login
SET DEFAULT ROLE 'flashdrop_customer' TO 'flashdrop_customer_user'@'%';
SET DEFAULT ROLE 'flashdrop_admin' TO 'flashdrop_admin_user'@'%';

FLUSH PRIVILEGES;
```

---

## 4. Live Demonstration of Database-Enforced Security (Viva Defense)

To demonstrate to the examiner that security is truly enforced in the database:

### Test Step 1: Execute legitimate procedure as customer (Succeeds)
```sql
-- Connect as customer user
-- mysql -u flashdrop_customer_user -pcustomer_secure_pass_123 flashdrop
CALL sp_deposit_wallet(42, 100.00, 'deposit_txn_001');
-- Result: Query OK, 1 row affected (Succeeds!)
```

### Test Step 2: Customer attempts direct unauthorized write to inventory (Fails!)
```sql
-- Attempt to directly modify stock as customer
UPDATE inventory SET available_quantity = 999 WHERE drop_id = 1;
-- Result: ERROR 1142 (42000): UPDATE command denied to user 'flashdrop_customer_user'@'localhost' for table 'inventory'
```

---

## 5. Examiner Viva Q&A (Component 12)

**Q1: Why is application-level role checking (e.g. in Next.js middleware) insufficient on its own?**
> *Defense*: Application-level checks protect against naive browser requests, but if an attacker exploits a SQL injection vulnerability, a server-side request forgery (SSRF) flaw, or an API logic bug, they execute SQL queries with whatever privileges the database connection has. If the database connection is running as `root` or a superuser, the attacker can wipe tables or forge balances. Enforcing roles at the MySQL engine level ensures that even in the event of an application compromise, the customer connection cannot execute `UPDATE` or `DELETE` on critical tables.

**Q2: What is the purpose of `SET DEFAULT ROLE` in MySQL 8?**
> *Defense*: In MySQL 8, roles granted to a user are not automatically active upon login unless specified as default roles. `SET DEFAULT ROLE 'flashdrop_customer' TO 'flashdrop_customer_user'@'%'` ensures that whenever the application pool connects with that user, the granted privileges are automatically active without requiring an explicit `SET ROLE` query.

