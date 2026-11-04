-- =====================================================================
-- PROJECT FLASHDROP: 06_TRIGGERS.SQL
-- Engine: MySQL 8.0 (InnoDB)
-- Component 8: Advanced Database Concepts (Database Triggers)
-- =====================================================================

USE flashdrop;

DROP TRIGGER IF EXISTS trg_prevent_negative_inventory;
DROP TRIGGER IF EXISTS trg_auto_suspend_fraud;
DROP TRIGGER IF EXISTS trg_audit_orders;
DROP TRIGGER IF EXISTS trg_price_change_audit;

DELIMITER $$

-- ---------------------------------------------------------------------
-- Trigger 1: trg_prevent_negative_inventory (BEFORE UPDATE on inventory)
-- Purpose: Physical invariant guard. Aborts any DML statement that would
--          cause available inventory to drop below zero.
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_prevent_negative_inventory
BEFORE UPDATE ON inventory
FOR EACH ROW
BEGIN
    IF NEW.available_quantity < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'CRITICAL ENGINE OVERSELL REJECTION: Available inventory cannot drop below zero.';
    END IF;
END$$

-- ---------------------------------------------------------------------
-- Trigger 2: trg_auto_suspend_fraud (AFTER INSERT on fraud_flags)
-- Purpose: Automated bot defence. When telemetry generates a risk score >= 85,
--          the trigger immediately suspends the user account and logs to audit_log.
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_auto_suspend_fraud
AFTER INSERT ON fraud_flags
FOR EACH ROW
BEGIN
    IF NEW.risk_score >= 85.00 THEN
        -- Auto-suspend user
        UPDATE users 
        SET status = 'suspended', updated_at = NOW()
        WHERE user_id = NEW.user_id;

        -- Record automated action in audit_log
        INSERT INTO audit_log (table_name, action, record_id, changed_by_user_id, new_values_json, created_at)
        VALUES (
            'users', 
            'UPDATE', 
            NEW.user_id, 
            NULL, -- Automated trigger action
            JSON_OBJECT(
                'status', 'suspended', 
                'reason', NEW.flag_reason, 
                'risk_score', NEW.risk_score,
                'source', 'trg_auto_suspend_fraud'
            ), 
            NOW()
        );
    END IF;
END$$

-- ---------------------------------------------------------------------
-- Trigger 3: trg_audit_orders (AFTER UPDATE on orders)
-- Purpose: Captures full JSON before/after snapshots into immutable audit_log
--          whenever an order changes status (e.g. pending_payment -> paid).
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_audit_orders
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
    IF OLD.status <> NEW.status THEN
        INSERT INTO audit_log (table_name, action, record_id, old_values_json, new_values_json, created_at)
        VALUES (
            'orders',
            'UPDATE',
            NEW.order_id,
            JSON_OBJECT('order_id', OLD.order_id, 'status', OLD.status, 'final_amount', OLD.final_amount),
            JSON_OBJECT('order_id', NEW.order_id, 'status', NEW.status, 'final_amount', NEW.final_amount),
            NOW()
        );
    END IF;
END$$

-- ---------------------------------------------------------------------
-- Trigger 4: trg_price_change_audit (AFTER UPDATE on products)
-- Purpose: Automatically records product price modifications in price_history.
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_price_change_audit
AFTER UPDATE ON products
FOR EACH ROW
BEGIN
    IF OLD.base_price <> NEW.base_price THEN
        INSERT INTO price_history (product_id, old_price, new_price, changed_by_user_id, changed_at)
        VALUES (NEW.product_id, OLD.base_price, NEW.base_price, 1, NOW());
    END IF;
END$$

DELIMITER ;
