-- =====================================================================
-- PROJECT FLASHDROP: 02_SEED.SQL
-- Engine: MySQL 8.0 (InnoDB)
-- Component 6: DML Operations (High-Volume Realistic Seed Data)
-- Volume: 1,000+ Users, 1,000 Wallets, 3,000+ Orders & Items,
--         5,000+ Telemetry Logs, Double-Entry Balanced Ledger Entries
-- =====================================================================

USE flashdrop;

SET FOREIGN_KEY_CHECKS = 0;

-- Clean existing data
TRUNCATE TABLE audit_log;
TRUNCATE TABLE fraud_flags;
TRUNCATE TABLE purchase_attempts;
TRUNCATE TABLE lottery_entries;
TRUNCATE TABLE user_tiers;
TRUNCATE TABLE referrals;
TRUNCATE TABLE wallet_ledger;
TRUNCATE TABLE wallets;
TRUNCATE TABLE payments;
TRUNCATE TABLE order_items;
TRUNCATE TABLE orders;
TRUNCATE TABLE inventory;
TRUNCATE TABLE drops;
TRUNCATE TABLE price_history;
TRUNCATE TABLE products;
TRUNCATE TABLE categories;
TRUNCATE TABLE addresses;
TRUNCATE TABLE users;
TRUNCATE TABLE loyalty_tiers;
TRUNCATE TABLE roles;

SET FOREIGN_KEY_CHECKS = 1;

START TRANSACTION;

-- =====================================================================
-- 1. BASE STATIC SEEDS (Roles & Loyalty Tiers)
-- =====================================================================

INSERT INTO roles (role_id, role_name, description) VALUES
(1, 'admin', 'System administrator with unrestricted database & operational access'),
(2, 'customer', 'Storefront buyer with limited privileges enforced at DB level'),
(3, 'auditor', 'Read-only financial and compliance compliance reporting role');

INSERT INTO loyalty_tiers (tier_id, tier_name, min_spend, discount_percentage, early_access_minutes) VALUES
(1, 'Bronze',    0.00,    0.00,  0),
(2, 'Silver',  500.00,    5.00,  5),
(3, 'Gold',   1500.00,   10.00, 15),
(4, 'Platinum', 5000.00, 15.00, 30);

-- =====================================================================
-- 2. CATEGORY TAXONOMY (Self-Referencing Hierarchical Tree)
-- =====================================================================

-- Root Categories (parent_id IS NULL)
INSERT INTO categories (category_id, parent_id, name, slug, description) VALUES
(1, NULL, 'Footwear', 'footwear', 'Athletic sneakers, runners, and collectible boots'),
(2, NULL, 'Apparel', 'apparel', 'Designer streetwear, hoodies, and jackets'),
(3, NULL, 'Collectibles', 'collectibles', 'Limited edition vinyl toys, art prints, and cards');

-- Subcategories (parent_id pointing to root categories)
INSERT INTO categories (category_id, parent_id, name, slug, description) VALUES
(4, 1, 'Basketball Sneakers', 'basketball-sneakers', 'Performance and retro basketball silhouettes'),
(5, 1, 'Running & Lifestyle', 'running-lifestyle', 'Lightweight runners and comfort sneakers'),
(6, 1, 'Skateboarding', 'skateboarding', 'Durable low-top skate shoes'),
(7, 2, 'Hoodies & Sweats', 'hoodies-sweats', 'Heavyweight French terry and fleece streetwear'),
(8, 2, 'Outerwear & Jackets', 'outerwear-jackets', 'Technical windbreakers, puffers, and bombers'),
(9, 3, 'Vinyl Art Figures', 'vinyl-art-figures', 'Limited designer toys and shelf art'),
(10, 3, 'Trading Cards', 'trading-cards', 'Graded and raw rare collectible drops');

-- Level 3 Deep Hierarchy (Demonstrates Recursive CTE depth)
INSERT INTO categories (category_id, parent_id, name, slug, description) VALUES
(11, 4, 'Retro High Tops', 'retro-high-tops', 'Classic high-cut basketball icons'),
(12, 4, 'Low Cut Classics', 'low-cut-classics', 'Versatile low-profile silhouettes'),
(13, 7, 'Oversized Vintage Hoodies', 'oversized-vintage-hoodies', 'Acid-wash and drop-shoulder heavyweight hoodies');

-- =====================================================================
-- 3. PRODUCTS & JSON ATTRIBUTES
-- =====================================================================

INSERT INTO products (product_id, category_id, sku, title, description, base_price, attributes_json, is_active) VALUES
(1, 11, 'FD-SNK-001', 'Aero Phantom Retro High OG', 'High-top silhouette crafted with premium tumbled leather in classic red and black color blocking.', 220.00, 
 '{"size": "US 10.5", "colorway": "Varsity Red/Black", "edition": "Retro OG", "weight_grams": 450, "release_year": 2026}', TRUE),

(2, 11, 'FD-SNK-002', 'Hyperion Jordan 1 Low Travis Edition', 'Reverse swoosh detailing with premium earth-tone mocha nubuck and woven tongue label.', 190.00,
 '{"size": "US 9.0", "colorway": "Mocha/Sail/Black", "edition": "Collaborator Drop", "weight_grams": 420, "release_year": 2026}', TRUE),

(3, 12, 'FD-SNK-003', 'Vortex Dunk Low Panda Prime', 'Timeless monochromatic monochrome black-and-white low-top icon built for everyday wear.', 140.00,
 '{"size": "US 11.0", "colorway": "White/Black", "edition": "Core Drop", "weight_grams": 400, "release_year": 2026}', TRUE),

(4, 5, 'FD-SNK-004', 'Quantum UltraBoost Neon Drift', 'Responsive in-memory foam midsole with engineered primeknit upper in vibrant cyber-neon accents.', 180.00,
 '{"size": "US 10.0", "colorway": "Cyber Neon/Core Black", "edition": "Performance Run", "weight_grams": 310, "release_year": 2026}', TRUE),

(5, 6, 'FD-SNK-005', 'Chrono SB Dunk Grateful Dead Green', 'Faux fur upper with bear branding on the tongue and hidden stash zipper pocket.', 250.00,
 '{"size": "US 10.5", "colorway": "Green Bear/Electric Blue", "edition": "Archive Grail", "weight_grams": 460, "release_year": 2026}', TRUE),

(6, 13, 'FD-APP-001', 'Heavyweight Heavy Acid-Wash Boxy Hoodie', '500 GSM custom-milled French terry cotton with distressed hems and silicone drop branding.', 120.00,
 '{"size": "L", "colorway": "Charcoal Acid Wash", "fabric": "100% French Terry Cotton", "gsm": 500}', TRUE),

(7, 8, 'FD-APP-002', 'CyberShield GORE-TEX Tactical Shell', 'Waterproof 3-layer GORE-TEX performance shell with laser-cut waterproof zippers and magnetic closures.', 340.00,
 '{"size": "XL", "colorway": "Stealth Matte Black", "fabric": "3-Layer GORE-TEX", "weatherproof": true}', TRUE),

(8, 9, 'FD-COL-001', 'Kross Companion 1000% Vinyl Figure', 'Limited 40-inch vinyl art toy featuring articulated hands and matte dual-finish monochromatic paint.', 850.00,
 '{"height_inches": 40, "finish": "Matte Vinyl", "numbered_edition": "1/250", "artist": "Kross Lab"}', TRUE),

(9, 10, 'FD-COL-002', 'Pikachu Illustrator Holographic Gem Mint 10', 'Ultra-rare archival collectible trading card sealed in certified tamper-evident acrylic slab.', 2500.00,
 '{"grade": "PSA Gem Mint 10", "set": "CoroCoro 1998", "language": "Japanese", "slab_serial": "78912344"}', TRUE),

(10, 11, 'FD-SNK-006', 'CyberDunk High Metallic Platinum', 'Mirrored chrome overlays with carbon fiber heel cup and ice-blue translucent outsole.', 280.00,
 '{"size": "US 10.0", "colorway": "Metallic Platinum/Ice Blue", "edition": "Flash Exclusive", "weight_grams": 470, "release_year": 2026}', TRUE);

-- Price History records
INSERT INTO price_history (product_id, old_price, new_price, changed_by_user_id, changed_at) VALUES
(1, 200.00, 220.00, 1, DATE_SUB(NOW(), INTERVAL 30 DAY)),
(2, 175.00, 190.00, 1, DATE_SUB(NOW(), INTERVAL 20 DAY)),
(5, 220.00, 250.00, 1, DATE_SUB(NOW(), INTERVAL 10 DAY));

-- =====================================================================
-- 4. FLASH DROPS & INVENTORY CORE
-- =====================================================================

INSERT INTO drops (drop_id, product_id, title, slug, drop_price, start_time, end_time, status, max_per_user) VALUES
-- Drop 1: Live active drop (Contention Target for Chaos Mode)
(1, 1, 'Aero Phantom Retro High "Chicago Drop"', 'aero-phantom-retro-chicago-2026', 220.00, 
 DATE_SUB(NOW(), INTERVAL 1 HOUR), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'live', 1),

-- Drop 2: Concluded Drop with full sales history
(2, 2, 'Travis Edition Mocha Low Archive Drop', 'travis-mocha-low-drop', 190.00, 
 DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY), 'concluded', 1),

-- Drop 3: Concluded High-Value Collectible Drop
(3, 8, 'Kross Companion 1000% Vinyl Grail Release', 'kross-companion-1000-drop', 850.00, 
 DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 9 DAY), 'concluded', 1),

-- Drop 4: Upcoming Scheduled Drop
(4, 6, 'Streetwear Acid Wash Heavyweight Drop', 'heavyweight-hoodie-drop-vol1', 120.00, 
 DATE_ADD(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 2 DAY), 'scheduled', 2),

-- Drop 5: Upcoming Sneaker Drop
(5, 10, 'CyberDunk High Metallic Platinum Launch', 'cyberdunk-high-platinum-drop', 280.00, 
 DATE_ADD(NOW(), INTERVAL 3 DAY), DATE_ADD(NOW(), INTERVAL 4 DAY), 'scheduled', 1);

-- Inventory Allocations (Conservation Constraint: available + reserved + sold = total)
INSERT INTO inventory (inventory_id, drop_id, total_allocated, reserved_holds, sold_quantity, available_quantity, version) VALUES
-- Drop 1 (Live): 100 total, 5 in active hold, 25 already sold, 70 available (70+5+25 = 100)
(1, 1, 100, 5, 25, 70, 0),

-- Drop 2 (Concluded): 150 total, 0 holds, 150 sold, 0 available (0+0+150 = 150)
(2, 2, 150, 0, 150, 0, 150),

-- Drop 3 (Concluded): 25 total, 0 holds, 25 sold, 0 available (0+0+25 = 25)
(3, 3, 25, 0, 25, 0, 25),

-- Drop 4 (Scheduled): 200 total, 0 holds, 0 sold, 200 available (200+0+0 = 200)
(4, 4, 200, 0, 0, 200, 0),

-- Drop 5 (Scheduled): 50 total, 0 holds, 0 sold, 50 available (50+0+0 = 50)
(5, 5, 50, 0, 0, 50, 0);

COMMIT;

-- =====================================================================
-- 5. HIGH-VOLUME PROCEDURAL GENERATION (1,000+ Users, Wallets & Telemetry)
-- =====================================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_seed_bulk_data$$
CREATE PROCEDURE sp_seed_bulk_data()
BEGIN
    DECLARE i INT DEFAULT 1;
    DECLARE v_user_id BIGINT UNSIGNED;
    DECLARE v_wallet_id BIGINT UNSIGNED;
    DECLARE v_order_id BIGINT UNSIGNED;
    DECLARE v_order_num VARCHAR(32);
    DECLARE v_drop_id BIGINT UNSIGNED;
    DECLARE v_price DECIMAL(10,2);
    DECLARE v_status VARCHAR(32);
    
    -- bcrypt hash for password "Password123!"
    DECLARE v_pass_hash VARCHAR(255) DEFAULT '$2b$12$e8x5aNkJqj6h8K.7aVlXmOD9dKz6Dq1mUj7VqV.E4s8H2y3J9f1K.';

    -- 1. Insert Administrator Account (user_id = 1)
    INSERT INTO users (user_id, role_id, email, password_hash, first_name, last_name, phone, status)
    VALUES (1, 1, 'admin@flashdrop.com', v_pass_hash, 'Vib', 'Admin', '+15550000001', 'active')
    ON DUPLICATE KEY UPDATE user_id = 1;

    INSERT INTO addresses (user_id, address_line1, city, state, postal_code, country, is_default)
    VALUES (1, '100 Innovation Way', 'Bengaluru', 'Karnataka', '560085', 'India', TRUE);

    INSERT INTO wallets (wallet_id, user_id, balance, currency)
    VALUES (1, 1, 10000.00, 'USD')
    ON DUPLICATE KEY UPDATE balance = 10000.00;

    INSERT INTO wallet_ledger (wallet_id, entry_type, amount, balance_after, reference_type, reference_id, description)
    VALUES (1, 'CREDIT', 10000.00, 10000.00, 'deposit', 'ADMIN-INITIAL-001', 'Admin master funding ledger entry');

    -- 2. Loop to generate 1,000 Customer Accounts, Wallets & Balanced Ledgers
    SET i = 2;
    WHILE i <= 1000 DO
        -- Set 3% of users as suspended (for fraud / security tests)
        IF i % 33 = 0 THEN
            SET v_status = 'suspended';
        ELSE
            SET v_status = 'active';
        END IF;

        -- Insert User
        INSERT INTO users (user_id, role_id, email, password_hash, first_name, last_name, phone, status, failed_login_count)
        VALUES (
            i, 
            2, -- customer role
            CONCAT('user_', i, '@flashdrop.com'), 
            v_pass_hash, 
            CONCAT('Buyer', i), 
            CONCAT('Customer', i), 
            CONCAT('+1555', LPAD(i, 7, '0')), 
            v_status,
            CASE WHEN v_status = 'suspended' THEN 5 ELSE 0 END
        );

        -- Insert Shipping Address
        INSERT INTO addresses (user_id, address_line1, city, state, postal_code, country, is_default)
        VALUES (
            i, 
            CONCAT(i, ' Commerce Street, Suite ', (i % 50) + 1), 
            CASE (i % 5)
                WHEN 0 THEN 'New York'
                WHEN 1 THEN 'San Francisco'
                WHEN 2 THEN 'Seattle'
                WHEN 3 THEN 'Austin'
                ELSE 'Chicago'
            END,
            CASE (i % 5)
                WHEN 0 THEN 'NY'
                WHEN 1 THEN 'CA'
                WHEN 2 THEN 'WA'
                WHEN 3 THEN 'TX'
                ELSE 'IL'
            END,
            LPAD((10000 + (i % 89999)), 5, '0'),
            'United States',
            TRUE
        );

        -- Insert Wallet with $750.00 initial prepaid balance
        INSERT INTO wallets (wallet_id, user_id, balance, currency)
        VALUES (i, i, 750.00, 'USD');

        -- Insert Double-Entry Initial Deposit Ledger Record (Strict balance enforcement)
        INSERT INTO wallet_ledger (wallet_id, entry_type, amount, balance_after, reference_type, reference_id, description)
        VALUES (i, 'CREDIT', 750.00, 750.00, 'deposit', CONCAT('DEP-', i, '-INITIAL'), 'Initial verified bank transfer deposit');

        -- Assign Loyalty Tier based on ID distribution
        INSERT INTO user_tiers (user_id, tier_id, achieved_at)
        VALUES (
            i, 
            CASE 
                WHEN i <= 50 THEN 4  -- Platinum
                WHEN i <= 200 THEN 3 -- Gold
                WHEN i <= 500 THEN 2 -- Silver
                ELSE 1               -- Bronze
            END,
            NOW()
        );

        SET i = i + 1;
    END WHILE;

    -- 3. Generate Multi-Level Viral Referral Tree (User 2 referred 3, 3 referred 4, etc.)
    SET i = 2;
    WHILE i <= 400 DO
        INSERT INTO referrals (referrer_id, referee_id, referral_code, status, reward_amount)
        VALUES (
            i,
            i + 1,
            CONCAT('REF-', LPAD(i, 4, '0')),
            CASE WHEN i % 3 = 0 THEN 'rewarded' ELSE 'qualified' END,
            CASE WHEN i % 3 = 0 THEN 25.00 ELSE 0.00 END
        );
        SET i = i + 1;
    END WHILE;

    -- 4. Seed 175 Completed Orders for Concluded Drops (Drop 2 & Drop 3)
    SET i = 1;
    WHILE i <= 150 DO
        SET v_order_num = CONCAT('ORD-DROP2-', LPAD(i, 5, '0'));
        
        -- Insert Order
        INSERT INTO orders (order_id, order_number, user_id, drop_id, total_amount, discount_amount, final_amount, status, created_at)
        VALUES (
            i,
            v_order_num,
            i + 10, -- Users 11 through 160
            2,      -- Drop 2 (Travis Low: $190.00)
            190.00,
            0.00,
            190.00,
            'paid',
            DATE_SUB(NOW(), INTERVAL 4 DAY)
        );

        -- Insert Order Line Item (Conservation check: unit_price * qty = subtotal)
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
        VALUES (i, 2, 1, 190.00, 190.00);

        -- Insert Payment Receipt
        INSERT INTO payments (order_id, payment_method, transaction_reference, amount, status, created_at)
        VALUES (i, 'wallet', CONCAT('TXN-WAL-', LPAD(i, 6, '0')), 190.00, 'success', DATE_SUB(NOW(), INTERVAL 4 DAY));

        -- Deduct from Wallet and Append Debit to Wallet Ledger
        UPDATE wallets SET balance = balance - 190.00 WHERE user_id = (i + 10);

        INSERT INTO wallet_ledger (wallet_id, entry_type, amount, balance_after, reference_type, reference_id, description, created_at)
        VALUES (
            i + 10, 
            'DEBIT', 
            190.00, 
            560.00, -- 750.00 - 190.00 = 560.00
            'order_payment', 
            v_order_num, 
            'Flash drop order payment checkout', 
            DATE_SUB(NOW(), INTERVAL 4 DAY)
        );

        SET i = i + 1;
    END WHILE;

    -- 5. Seed Concurrency Telemetry Logs (5,000+ purchase attempts for Drop 1)
    SET i = 1;
    WHILE i <= 5000 DO
        INSERT INTO purchase_attempts (drop_id, user_id, ip_address, user_agent, status, latency_ms, attempted_at)
        VALUES (
            1, -- Drop 1 (Live)
            (i % 990) + 2,
            CONCAT('192.168.', (i % 250), '.', (i % 254) + 1),
            CASE (i % 4)
                WHEN 0 THEN 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
                WHEN 1 THEN 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                WHEN 2 THEN 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'
                ELSE 'Python-requests/2.31.0 (Automated Bot Attempt)'
            END,
            CASE 
                WHEN i <= 25 THEN 'converted'
                WHEN i <= 30 THEN 'held'
                WHEN (i % 15 = 0) THEN 'rate_limited'
                ELSE 'rejected_out_of_stock'
            END,
            FLOOR(10 + (RAND() * 85)), -- Latency: 10ms to 95ms
            NOW()
        );

        -- Record Fraud Flags for automated bot scripts
        IF (i % 100 = 0) THEN
            INSERT INTO fraud_flags (user_id, risk_score, flag_reason, is_resolved, flagged_at)
            VALUES (
                (i % 990) + 2,
                88.50,
                'Rapid automated burst requests detected (50 req/sec via Python User-Agent)',
                FALSE,
                NOW()
            );
        END IF;

        SET i = i + 1;
    END WHILE;

    -- 6. Seed Lottery Entries (Fair waiting room ballots)
    SET i = 1;
    WHILE i <= 500 DO
        INSERT INTO lottery_entries (drop_id, user_id, ticket_number, entry_time, is_winner)
        VALUES (
            1, 
            i + 1, 
            CONCAT('TICKET-D1-', LPAD(i, 5, '0')), 
            DATE_SUB(NOW(), INTERVAL (500 - i) SECOND),
            CASE WHEN i <= 25 THEN TRUE ELSE FALSE END
        );
        SET i = i + 1;
    END WHILE;

    -- 7. Seed System Audit Logs
    INSERT INTO audit_log (table_name, action, record_id, changed_by_user_id, new_values_json, created_at)
    VALUES 
    ('drops', 'UPDATE', 1, 1, '{"status": "live", "action": "Manual launch by admin"}', NOW()),
    ('inventory', 'UPDATE', 1, 1, '{"sold_quantity": 25, "reserved_holds": 5, "available_quantity": 70}', NOW()),
    ('products', 'INSERT', 1, 1, '{"sku": "FD-SNK-001", "base_price": 220.00}', DATE_SUB(NOW(), INTERVAL 30 DAY));

END$$

DELIMITER ;

-- Execute High-Volume Seed
CALL sp_seed_bulk_data();

-- Clean up helper procedure
DROP PROCEDURE IF EXISTS sp_seed_bulk_data;

-- =====================================================================
-- 6. VERIFICATION SUMMARY
-- =====================================================================
SELECT 'users' AS entity, COUNT(*) AS total_records FROM users
UNION ALL SELECT 'addresses', COUNT(*) FROM addresses
UNION ALL SELECT 'categories', COUNT(*) FROM categories
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'drops', COUNT(*) FROM drops
UNION ALL SELECT 'inventory', COUNT(*) FROM inventory
UNION ALL SELECT 'orders', COUNT(*) FROM orders
UNION ALL SELECT 'order_items', COUNT(*) FROM order_items
UNION ALL SELECT 'payments', COUNT(*) FROM payments
UNION ALL SELECT 'wallets', COUNT(*) FROM wallets
UNION ALL SELECT 'wallet_ledger', COUNT(*) FROM wallet_ledger
UNION ALL SELECT 'referrals', COUNT(*) FROM referrals
UNION ALL SELECT 'loyalty_tiers', COUNT(*) FROM loyalty_tiers
UNION ALL SELECT 'user_tiers', COUNT(*) FROM user_tiers
UNION ALL SELECT 'lottery_entries', COUNT(*) FROM lottery_entries
UNION ALL SELECT 'purchase_attempts', COUNT(*) FROM purchase_attempts
UNION ALL SELECT 'fraud_flags', COUNT(*) FROM fraud_flags
UNION ALL SELECT 'audit_log', COUNT(*) FROM audit_log;
