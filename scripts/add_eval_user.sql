-- =====================================================================
-- FLASHDROP: scripts/add_eval_user.sql
-- Live Database Insertion for PES University Teacher Presentation
-- Inserts a full user with all relational attributes (Address, Wallet,
-- Double-Entry Ledger, Platinum Tier, and Referral Network).
-- =====================================================================

USE flashdrop;

START TRANSACTION;

-- 1. Insert New Customer User
INSERT INTO users (role_id, email, password_hash, first_name, last_name, phone, status)
VALUES (
    2, -- Role: customer
    'eval_professor@pes.edu',
    'customer123',
    'Professor',
    'Examiner',
    '+919876543210',
    'active'
);

SET @new_user_id = LAST_INSERT_ID();

-- 2. Insert Default Shipping Address
INSERT INTO addresses (user_id, address_line1, address_line2, city, state, postal_code, country, is_default)
VALUES (
    @new_user_id,
    'PES University Campus, 100 Feet Ring Road',
    'Department of Computer Science & Engineering',
    'Bengaluru',
    'Karnataka',
    '560085',
    'India',
    TRUE
);

-- 3. Provision Prepaid Wallet
INSERT INTO wallets (user_id, balance, currency, is_locked)
VALUES (
    @new_user_id,
    1500.00,
    'USD',
    FALSE
);

SET @new_wallet_id = LAST_INSERT_ID();

-- 4. Record Double-Entry Financial Ledger Credit
INSERT INTO wallet_ledger (wallet_id, entry_type, amount, balance_after, reference_type, reference_id, description)
VALUES (
    @new_wallet_id,
    'CREDIT',
    1500.00,
    1500.00,
    'deposit',
    'EVAL-INIT-DEP-001',
    'Initial evaluation wallet deposit for PES Examiner'
);

-- 5. Assign Platinum Loyalty Tier (15% Automatic Discount)
INSERT INTO user_tiers (user_id, tier_id, achieved_at, expires_at)
VALUES (
    @new_user_id,
    4, -- Platinum tier (15% discount)
    NOW(),
    DATE_ADD(NOW(), INTERVAL 1 YEAR)
);

-- 6. Insert Viral Referral Network Record (Referred by Admin)
INSERT INTO referrals (referrer_id, referee_id, referral_code, status, reward_amount)
VALUES (
    1, -- Referrer: Admin (user_id 1)
    @new_user_id,
    'PES_EVAL_VIP',
    'rewarded',
    50.00
);

COMMIT;

-- 7. Verification Query: Inspect the newly created user across all relational tables
SELECT 
    u.user_id,
    CONCAT(u.first_name, ' ', u.last_name) AS full_name,
    u.email,
    u.phone,
    u.status,
    w.balance AS wallet_balance_usd,
    lt.tier_name AS loyalty_tier,
    fn_calculate_loyalty_discount(u.user_id) AS computed_discount_pct,
    a.city AS shipping_city
FROM users u
INNER JOIN wallets w ON u.user_id = w.user_id
INNER JOIN user_tiers ut ON u.user_id = ut.user_id
INNER JOIN loyalty_tiers lt ON ut.tier_id = lt.tier_id
INNER JOIN addresses a ON u.user_id = a.user_id
WHERE u.user_id = @new_user_id;
