-- =====================================================================
-- PROJECT FLASHDROP: 10_ISOLATION_DEMOS.SQL
-- Engine: MySQL 8.0 (InnoDB)
-- Transactions Lab: ACID, Isolation Levels, Concurrency Anomalies & Deadlocks
-- =====================================================================

USE flashdrop;

-- =====================================================================
-- LAB 1: DIRTY READ ANOMALY (Allowed only in READ UNCOMMITTED)
-- Definition: T2 reads uncommitted modifications made by T1. If T1 rolls
--             back, T2 has acted on corrupted, non-existent state.
-- =====================================================================

-- [Session 1 (T1)]
SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
START TRANSACTION;
-- T1 maliciously inflates inventory stock from 70 to 500, but DOES NOT commit!
UPDATE inventory SET available_quantity = 500 WHERE drop_id = 1;

-- [Session 2 (T2) - Run concurrently while T1 is uncommitted]
SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
START TRANSACTION;
-- T2 reads the uncommitted dirty row and sees available = 500!
SELECT drop_id, available_quantity FROM inventory WHERE drop_id = 1;
COMMIT;

-- [Session 1 (T1) - Now aborts / rolls back]
ROLLBACK;

-- [Evaluation]:
-- In READ COMMITTED or REPEATABLE READ, T2 would read 70 (consistent snapshot).
-- In READ UNCOMMITTED, T2 committed a purchase believing there were 500 units available.


-- =====================================================================
-- LAB 2: NON-REPEATABLE READ ANOMALY (Prevented in REPEATABLE READ)
-- Definition: T1 reads a row twice within the same transaction. Between
--             the two reads, T2 updates the row and commits. T1 observes
--             different values for the same row.
-- =====================================================================

-- [Session 1 (T1)]
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;
START TRANSACTION;
-- First read: T1 observes drop_price = 220.00
SELECT drop_id, title, drop_price FROM drops WHERE drop_id = 1;

-- [Session 2 (T2) - Modifies and commits price]
START TRANSACTION;
UPDATE drops SET drop_price = 250.00 WHERE drop_id = 1;
COMMIT;

-- [Session 1 (T1) - Re-reads the exact same row]
-- Under READ COMMITTED: T1 now sees drop_price = 250.00 (Fuzzy / Non-Repeatable Read!)
SELECT drop_id, title, drop_price FROM drops WHERE drop_id = 1;
COMMIT;

-- [The Solution in InnoDB]:
-- Under REPEATABLE READ (MySQL Default), InnoDB uses MVCC (Multi-Version
-- Concurrency Control) Read Views. T1's second read will continue to read
-- 220.00 from the Undo Log snapshot taken at the start of T1!


-- =====================================================================
-- LAB 3: LOST UPDATE ANOMALY (The Classic Flash-Sale Concurrency Bug)
-- Definition: Two concurrent transactions read the same stock value. Both
--             calculate (stock - 1) in application memory and write back.
--             The second write silently overwrites the first.
-- =====================================================================

-- Naive Unprotected Application Path (Exposes Oversell):
-- Both T1 and T2 execute:
-- 1. SELECT available_quantity FROM inventory WHERE drop_id = 1; (Both read 70)
-- 2. Application computes 70 - 1 = 69
-- 3. T1 executes: UPDATE inventory SET available_quantity = 69 WHERE drop_id = 1;
-- 4. T2 executes: UPDATE inventory SET available_quantity = 69 WHERE drop_id = 1;
-- Result: 2 items were sold, but stock decremented by only 1! 1 update was LOST.

-- Solution A: Atomic In-Database Decrement (Single-statement write lock)
UPDATE inventory 
SET available_quantity = available_quantity - 1, sold_quantity = sold_quantity + 1
WHERE drop_id = 1 AND available_quantity > 0;

-- Solution B: Pessimistic Row Locking (FOR UPDATE)
START TRANSACTION;
SELECT available_quantity FROM inventory WHERE drop_id = 1 FOR UPDATE;
-- Exclusive lock acquired; concurrent transactions are queued until COMMIT
UPDATE inventory SET available_quantity = available_quantity - 1 WHERE drop_id = 1;
COMMIT;

-- Solution C: Optimistic Concurrency Control (OCC via version column)
-- T1 reads stock = 70 and version = 5
UPDATE inventory 
SET available_quantity = available_quantity - 1, version = version + 1
WHERE drop_id = 1 AND version = 5;
-- If another transaction modified the row, version is now 6. 
-- 0 rows affected -> Application detects collision and retries!


-- =====================================================================
-- LAB 4: DEADLOCK REPRODUCTION & DETECTION
-- Definition: T1 holds Lock on Row A and requests Row B.
--             T2 holds Lock on Row B and requests Row A.
--             InnoDB background deadlock engine detects cycle and kills one.
-- =====================================================================

-- Reset target rows
UPDATE inventory SET available_quantity = 70 WHERE drop_id = 1;
UPDATE wallets SET balance = 750.00 WHERE user_id = 2;

-- Step 1 [Session 1 (T1)]: Lock Inventory Row (Drop 1)
START TRANSACTION;
SELECT * FROM inventory WHERE drop_id = 1 FOR UPDATE;

-- Step 2 [Session 2 (T2)]: Lock Wallet Row (User 2)
START TRANSACTION;
SELECT * FROM wallets WHERE user_id = 2 FOR UPDATE;

-- Step 3 [Session 1 (T1)]: Now attempt to acquire lock on Wallet Row (User 2)
-- (T1 BLOCKS and waits for Session 2 to release the lock...)
SELECT * FROM wallets WHERE user_id = 2 FOR UPDATE;

-- Step 4 [Session 2 (T2)]: Now attempt to acquire lock on Inventory Row (Drop 1)
-- (T2 attempts lock on Row held by T1. DEADLOCK CYCLE CREATED!)
SELECT * FROM inventory WHERE drop_id = 1 FOR UPDATE;

-- [Observed Engine Output in Session 2]:
-- ERROR 1213 (40001): Deadlock found when trying to get lock; try restarting transaction
-- InnoDB automatically rolls back T2 (the transaction with least undo log activity)
-- and releases its locks, allowing T1 to succeed!

-- Inspect the Deadlock in InnoDB Status Monitor:
SHOW ENGINE INNODB STATUS\G

