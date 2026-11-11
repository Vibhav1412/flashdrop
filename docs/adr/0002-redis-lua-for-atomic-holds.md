# ADR 0002: Atomic Checkout Reservation Holds via Redis Lua

## Status
Accepted

## Context
During high contention, multiple users check out the same stock simultaneously. Using two discrete Redis commands (e.g., `GET stock` followed by `DECR stock`) creates a race condition between the read and the write.

## Decision
We execute checkout reservation holds using an atomic Lua script (`acquire_hold.lua`) executed via Redis `EVAL`:
1. Checks if `drop:{id}:stock > 0`.
2. Checks if `hold:{id}:{user}` already exists (blocking double-clicks).
3. Executes `DECR` and sets a 300-second TTL hold key in a single atomic step.

## Consequences
- **Positive**: Guaranteed zero race conditions; executed entirely on Redis's single-threaded event loop without distributed lock overhead.
- **Negative**: Redis commands in Lua must adhere to strict type constraints (arguments passed as strings/integers).
