# ADR 0003: Native Database-Enforced Role-Based Access Control (RBAC)

## Status
Accepted

## Context
Standard e-commerce web applications delegate authorization exclusively to application code. In the event of an SQL injection or compromised application credentials, the attacker possesses full database privileges.

## Decision
We enforce least-privilege security directly at the MySQL 8 engine level:
1. Created two database roles: `flashdrop_customer` and `flashdrop_admin`.
2. Created dedicated users: `flashdrop_customer_user` and `flashdrop_admin_user`.
3. Granted `flashdrop_customer` read access (`SELECT`) on public catalog views and tables, plus `EXECUTE` on `sp_place_order`, but zero direct write (`INSERT`, `UPDATE`, `DELETE`) grants on sensitive tables.
4. Next.js enforces this separation via dual connection pools (`customerPool` vs `adminPool`).

## Consequences
- **Positive**: Direct unauthorized table manipulation is aborted at the database kernel level with `ERROR 1142`.
- **Negative**: Requires provisioning and maintaining separate database accounts and connection pool lifecycles.
