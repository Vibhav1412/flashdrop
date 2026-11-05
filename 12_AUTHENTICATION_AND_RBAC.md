# Component 12: Authentication & Role-Based Access Control in Database
**PES University DBMS Level 3 Evaluation Component 12 | Max Marks: 4**

---

## 1. Overview & Source Code Mapping
- **Database Script**: `sql/08_roles.sql`
- **Application Auth**: Dual-Connection Pool Architecture in Next.js + `bcrypt` (12 salt rounds)
- **Evaluation Requirement**: *"Authentication implementation (front end and Minimum two roles and role-based access control in database)"*

---

## 2. Multi-Tier Security Hierarchy

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. Client Browser (Next.js Frontend)                        │
│    - Role claim stored in signed JWT cookie                 │
│    - Hides administrative routes & panels from customers     │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP Request + Session Token
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. API Route Guard (Server Middleware)                      │
│    - Decodes JWT & verifies role                            │
│    - Routes request to the matching MySQL connection pool   │
└──────────────────────────────┬──────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               │                               │
        Customer Pool                     Admin Pool
   (flashdrop_customer_user)        (flashdrop_admin_user)
               │                               │
               ▼                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. DATABASE ENGINE ACCESS CONTROL (Core Viva Defense)       │
│    - Role 'flashdrop_customer':                              │
│        * SELECT on catalog views & products                 │
│        * EXECUTE on sp_place_order, sp_deposit_wallet       │
│        * DENIED: Direct UPDATE/DELETE on inventory/orders   │
│    - Role 'flashdrop_admin':                                 │
│        * ALL PRIVILEGES ON flashdrop.*                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Database Privilege Specification

| Object Name | `flashdrop_customer` Permission | `flashdrop_admin` Permission | Security Justification |
| :--- | :---: | :---: | :--- |
| `products` | `SELECT` | `ALL PRIVILEGES` | Customers browse catalog; admins manage products. |
| `categories` | `SELECT` | `ALL PRIVILEGES` | Read-only category taxonomy for buyers. |
| `vw_live_drop_catalog` | `SELECT` | `ALL PRIVILEGES` | Masked storefront view concealing internal reserve buffers. |
| `inventory` | **DENIED DIRECT WRITES** | `ALL PRIVILEGES` | Prevents customers from modifying stock counts via raw SQL injection. |
| `orders` | **DENIED DIRECT WRITES** | `ALL PRIVILEGES` | Prevents unauthorized insertion or status mutations of orders. |
| `wallets` | `SELECT` | `ALL PRIVILEGES` | Customers can view own balance, but cannot directly update balance. |
| `wallet_ledger` | `SELECT` | `ALL PRIVILEGES` | Append-only ledger managed strictly by transactional procedures. |
| `sp_place_order` | `EXECUTE` | `EXECUTE` | **Only approved path** for inventory & order state changes. |
| `sp_deposit_wallet` | `EXECUTE` | `EXECUTE` | Safe wallet funding via double-entry ledger. |
| `audit_log` | **NO ACCESS** | `ALL PRIVILEGES` | Immutable security log inaccessible to customers. |

---

## 4. Live Viva Demonstration Script (Proving Database-Enforced RBAC)

When the examiner asks: *"Show me that role-based access control is actually enforced inside MySQL, and not just in JavaScript"*, run this live terminal demonstration:

### Step 1: Connect as Customer User (Legitimate Action)
```bash
mysql -u flashdrop_customer_user -pcustomer_secure_pass_123 -e "USE flashdrop; SELECT product_id, sku, title, base_price FROM products LIMIT 3;"
```
*Result*: Returns the product table cleanly!

### Step 2: Customer executes approved stored procedure
```bash
mysql -u flashdrop_customer_user -pcustomer_secure_pass_123 -e "USE flashdrop; CALL sp_deposit_wallet(2, 50.00, 'TEST-DEP-001');"
```
*Result*: `Query OK, 1 row affected` (Succeeds via procedure grant!).

### Step 3: Customer attempts direct unauthorized modification (DENIED!)
```bash
mysql -u flashdrop_customer_user -pcustomer_secure_pass_123 -e "USE flashdrop; UPDATE inventory SET available_quantity = 9999 WHERE drop_id = 1;"
```
*Result*:
```text
ERROR 1142 (42000) at line 1: UPDATE command denied to user 'flashdrop_customer_user'@'localhost' for table 'inventory'
```
The MySQL storage engine physically halts the query with Error 1142. **Security is impenetrable even if the web application is compromised!**

---

## 5. Examiner Viva Q&A (Component 12)

**Q1: Why is application-level RBAC insufficient on its own for an enterprise database project?**
> *Defense*: If access control exists only in the application layer (e.g., `if (session.role === 'admin')`), any SQL injection vulnerability, compromised API endpoint, or leaked database credential gives the attacker unrestricted access to modify balances, wipe inventory, or steal user records. Enforcing RBAC at the MySQL engine layer via native roles (`flashdrop_customer` vs `flashdrop_admin`) guarantees least-privilege isolation at the hardware and storage layer.

**Q2: What is the purpose of `SET DEFAULT ROLE` in MySQL 8?**
> *Defense*: In MySQL 8, roles granted to a user account are not automatically active upon connection handshake unless configured as default roles. `SET DEFAULT ROLE 'flashdrop_customer' TO 'flashdrop_customer_user'@'localhost'` ensures that whenever the Next.js connection pool opens a connection, the role privileges are immediately active without needing a separate `SET ROLE` query.
