# ADR 0001: Selection of Polyglot Persistence Architecture

## Status
Accepted

## Context
High-velocity commerce flash drops subject database systems to burst loads of thousands of requests per second within sub-second timeframes. Relying exclusively on a relational database causes row-level lock serialization (`SELECT ... FOR UPDATE`), transaction deadlocks, and connection starvation. Conversely, relying exclusively on a NoSQL database compromises ACID financial integrity, double-entry ledgers, and relational constraint enforcement.

## Decision
We adopt **Polyglot Persistence**:
- **MySQL 8.0**: Durable transactional source of truth for accounts, orders, ledger entries, and audit logs.
- **Redis 7.2**: Ephemeral, high-throughput in-memory concurrency shock absorber for stock counters, 5-minute checkout holds, and waiting room queue positioning.

## Consequences
- **Positive**: Zero oversell under 50,000+ req/sec burst traffic; sub-millisecond checkout response times; full financial auditability.
- **Negative**: Requires state synchronization between in-memory counters and relational tables via startup hydration scripts.
