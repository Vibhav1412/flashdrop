-- =====================================================================
-- PROJECT FLASHDROP: 05_PROCEDURES.SQL
-- Engine: MySQL 8.0 (InnoDB)
-- Component 8: Advanced Database Concepts (Stored Procedures & ACID Transactions)
-- =====================================================================

USE flashdrop;

DROP PROCEDURE IF EXISTS sp_place_order;
DROP PROCEDURE IF EXISTS sp_deposit_wallet;
DROP PROCEDURE IF EXISTS sp_reconcile_drop_inventory;

DELIMITER $$

-- ---------------------------------------------------------------------
-- Procedure 1: sp_place_order
-- Core transactional engine for FlashDrop checkout.
-- Executes within an atomic transaction with rollback handlers.
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_place_order(
    IN  p_user_id        BIGINT UNSIGNED,
    IN  p_drop_id        BIGINT UNSIGNED,
    IN  p_payment_method VARCHAR(16),
    OUT p_order_id       BIGINT UNSIGNED,
    OUT p_status_code    VARCHAR(32),
    OUT p_status_message VARCHAR(255)
)
proc_block: BEGIN
    DECLARE v_product_id BIGINT UNSIGNED;
    DECLARE v_drop_price DECIMAL(10,2);
    DECLARE v_drop_status VARCHAR(32);
    DECLARE v_available_qty INT;
    DECLARE v_discount_pct DECIMAL(5,2);
    DECLARE v_discount_amt DECIMAL(10,2);
    DECLARE v_final_amount DECIMAL(10,2);
    DECLARE v_wallet_balance DECIMAL(12,2);
    DECLARE v_order_num VARCHAR(32);
    DECLARE v_txn_ref VARCHAR(64);

    -- Declare Exception Handler for SQLEXCEPTION: Automatically Rollback on any failure
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_order_id = NULL;
        SET p_status_code = 'TRANSACTION_FAILED';
        SET p_status_message = 'Internal transaction aborted due to database error or constraint violation.';
    END;

    -- 1. Pre-Flight Security Guard: Check if user is suspended
    IF fn_is_user_suspended(p_user_id) THEN
        SET p_order_id = NULL;
        SET p_status_code = 'USER_SUSPENDED';
        SET p_status_message = 'Order rejected: User account is suspended due to bot or fraud flags.';
        LEAVE proc_block;
    END IF;

    -- 2. Verify Drop Status and Extract Price & Product
    SELECT product_id, drop_price, status
    INTO v_product_id, v_drop_price, v_drop_status
    FROM drops
    WHERE drop_id = p_drop_id;

    IF v_drop_status <> 'live' THEN
        SET p_order_id = NULL;
        SET p_status_code = 'DROP_NOT_LIVE';
        SET p_status_message = 'Order rejected: Drop is not currently live.';
        LEAVE proc_block;
    END IF;

    -- BEGIN ATOMIC TRANSACTION
    START TRANSACTION;

    -- 3. Lock & Verify Inventory (Pessimistic row lock to prevent race conditions in pure SQL path)
    SELECT available_quantity
    INTO v_available_qty
    FROM inventory
    WHERE drop_id = p_drop_id
    FOR UPDATE;

    IF v_available_qty <= 0 THEN
        ROLLBACK;
        SET p_order_id = NULL;
        SET p_status_code = 'OUT_OF_STOCK';
        SET p_status_message = 'Order rejected: Inventory has completely sold out.';
        LEAVE proc_block;
    END IF;

    -- 4. Calculate Loyalty Discount
    SET v_discount_pct = fn_calculate_loyalty_discount(p_user_id);
    SET v_discount_amt = ROUND(v_drop_price * (v_discount_pct / 100.00), 2);
    SET v_final_amount = v_drop_price - v_discount_amt;

    -- 5. If Payment Method is Wallet: Verify Sufficient Funds & Deduct
    IF p_payment_method = 'wallet' THEN
        SELECT balance INTO v_wallet_balance
        FROM wallets
        WHERE user_id = p_user_id
        FOR UPDATE;

        IF v_wallet_balance < v_final_amount THEN
            ROLLBACK;
            SET p_order_id = NULL;
            SET p_status_code = 'INSUFFICIENT_FUNDS';
            SET p_status_message = 'Order rejected: Insufficient wallet balance for checkout.';
            LEAVE proc_block;
        END IF;

        -- Deduct from Wallet
        UPDATE wallets 
        SET balance = balance - v_final_amount, updated_at = NOW()
        WHERE user_id = p_user_id;

        -- Record Immutable Double-Entry Debit in Ledger
        INSERT INTO wallet_ledger (
            wallet_id, entry_type, amount, balance_after, reference_type, reference_id, description
        )
        SELECT 
            wallet_id, 'DEBIT', v_final_amount, v_wallet_balance - v_final_amount, 'order_payment', 
            CONCAT('ORD-LIVE-', UNIX_TIMESTAMP()), 'FlashDrop direct wallet payment'
        FROM wallets
        WHERE user_id = p_user_id;
    END IF;

    -- 6. Update Inventory: Decrement available, increment sold, update version
    UPDATE inventory
    SET available_quantity = available_quantity - 1,
        sold_quantity = sold_quantity + 1,
        version = version + 1,
        updated_at = NOW()
    WHERE drop_id = p_drop_id;

    -- 7. Insert Order Record
    SET v_order_num = CONCAT('ORD-', p_drop_id, '-', UNIX_TIMESTAMP(), '-', FLOOR(RAND() * 1000));
    
    INSERT INTO orders (
        order_number, user_id, drop_id, total_amount, discount_amount, final_amount, status, created_at
    )
    VALUES (
        v_order_num, p_user_id, p_drop_id, v_drop_price, v_discount_amt, v_final_amount, 'paid', NOW()
    );

    SET p_order_id = LAST_INSERT_ID();

    -- 8. Insert Order Line Item (Parent-Child identifying weak entity)
    INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
    VALUES (p_order_id, v_product_id, 1, v_drop_price, v_drop_price);

    -- 9. Insert Payment Receipt
    SET v_txn_ref = CONCAT('TXN-', UPPER(SUBSTRING(p_payment_method, 1, 3)), '-', UNIX_TIMESTAMP());
    INSERT INTO payments (order_id, payment_method, transaction_reference, amount, status, created_at)
    VALUES (p_order_id, p_payment_method, v_txn_ref, v_final_amount, 'success', NOW());

    -- COMMIT ALL MUTATIONS AS ONE DURABLE UNIT
    COMMIT;

    SET p_status_code = 'SUCCESS';
    SET p_status_message = 'Order successfully placed and verified.';
END proc_block$$

-- ---------------------------------------------------------------------
-- Procedure 2: sp_deposit_wallet
-- Securely adds funds to user wallet with matching double-entry ledger credit
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_deposit_wallet(
    IN  p_user_id  BIGINT UNSIGNED,
    IN  p_amount   DECIMAL(12,2),
    IN  p_ref_id   VARCHAR(64)
)
BEGIN
    DECLARE v_wallet_id BIGINT UNSIGNED;
    DECLARE v_current_balance DECIMAL(12,2);

    IF p_amount <= 0.00 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Deposit amount must be strictly positive.';
    END IF;

    START TRANSACTION;

    SELECT wallet_id, balance INTO v_wallet_id, v_current_balance
    FROM wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    -- Update Wallet
    UPDATE wallets
    SET balance = balance + p_amount, updated_at = NOW()
    WHERE wallet_id = v_wallet_id;

    -- Record Credit in Ledger
    INSERT INTO wallet_ledger (
        wallet_id, entry_type, amount, balance_after, reference_type, reference_id, description
    )
    VALUES (
        v_wallet_id, 'CREDIT', p_amount, v_current_balance + p_amount, 'deposit', p_ref_id, 'User account deposit'
    );

    COMMIT;
END$$

-- ---------------------------------------------------------------------
-- Procedure 3: sp_reconcile_drop_inventory
-- Audits physical orders against inventory counts to detect discrepancies
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_reconcile_drop_inventory(IN p_drop_id BIGINT UNSIGNED)
BEGIN
    SELECT 
        d.drop_id,
        d.title,
        inv.total_allocated,
        inv.sold_quantity AS reported_sold_in_inventory,
        COUNT(o.order_id) AS actual_confirmed_orders,
        (inv.sold_quantity - COUNT(o.order_id)) AS discrepancy_variance,
        CASE 
            WHEN inv.sold_quantity = COUNT(o.order_id) THEN 'RECONCILED_PERFECT'
            ELSE 'DISCREPANCY_DETECTED'
        END AS audit_status
    FROM drops d
    INNER JOIN inventory inv ON d.drop_id = inv.drop_id
    LEFT JOIN orders o ON d.drop_id = o.drop_id AND o.status = 'paid'
    WHERE d.drop_id = p_drop_id
    GROUP BY d.drop_id, d.title, inv.total_allocated, inv.sold_quantity;
END$$

DELIMITER ;

