-- =====================================================================
-- PROJECT FLASHDROP: 04_FUNCTIONS.SQL
-- Engine: MySQL 8.0 (InnoDB)
-- Component 8: Advanced Database Concepts (Stored Functions)
-- =====================================================================

USE flashdrop;

DROP FUNCTION IF EXISTS fn_calculate_loyalty_discount;
DROP FUNCTION IF EXISTS fn_is_user_suspended;
DROP FUNCTION IF EXISTS fn_get_category_breadcrumb;

DELIMITER $$

-- ---------------------------------------------------------------------
-- Function 1: fn_calculate_loyalty_discount
-- Purpose: Determines the active percentage discount for a user based on
--          their assigned loyalty tier. Returns DECIMAL(5,2).
-- ---------------------------------------------------------------------
CREATE FUNCTION fn_calculate_loyalty_discount(p_user_id BIGINT UNSIGNED)
RETURNS DECIMAL(5,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_discount DECIMAL(5,2) DEFAULT 0.00;

    SELECT COALESCE(lt.discount_percentage, 0.00)
    INTO v_discount
    FROM user_tiers ut
    INNER JOIN loyalty_tiers lt ON ut.tier_id = lt.tier_id
    WHERE ut.user_id = p_user_id
      AND (ut.expires_at IS NULL OR ut.expires_at > NOW())
    ORDER BY lt.discount_percentage DESC
    LIMIT 1;

    RETURN v_discount;
END$$

-- ---------------------------------------------------------------------
-- Function 2: fn_is_user_suspended
-- Purpose: High-speed boolean check for checkout and authentication guards.
-- ---------------------------------------------------------------------
CREATE FUNCTION fn_is_user_suspended(p_user_id BIGINT UNSIGNED)
RETURNS BOOLEAN
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_status VARCHAR(16);

    SELECT status INTO v_status
    FROM users
    WHERE user_id = p_user_id;

    IF v_status = 'suspended' THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END$$

-- ---------------------------------------------------------------------
-- Function 3: fn_get_category_breadcrumb
-- Purpose: Returns a single concatenated hierarchical string for any category.
-- ---------------------------------------------------------------------
CREATE FUNCTION fn_get_category_breadcrumb(p_category_id INT UNSIGNED)
RETURNS VARCHAR(1000)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_curr_id INT UNSIGNED DEFAULT p_category_id;
    DECLARE v_parent_id INT UNSIGNED;
    DECLARE v_curr_name VARCHAR(64);
    DECLARE v_breadcrumb VARCHAR(1000) DEFAULT '';

    breadcrumb_loop: LOOP
        IF v_curr_id IS NULL THEN
            LEAVE breadcrumb_loop;
        END IF;

        SELECT name, parent_id INTO v_curr_name, v_parent_id
        FROM categories
        WHERE category_id = v_curr_id;

        IF v_breadcrumb = '' THEN
            SET v_breadcrumb = v_curr_name;
        ELSE
            SET v_breadcrumb = CONCAT(v_curr_name, ' > ', v_breadcrumb);
        END IF;

        SET v_curr_id = v_parent_id;
    END LOOP breadcrumb_loop;

    RETURN v_breadcrumb;
END$$

DELIMITER ;

