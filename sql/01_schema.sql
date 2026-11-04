-- =====================================================================
-- PROJECT FLASHDROP: 01_SCHEMA.SQL
-- Engine: MySQL 8.0 (InnoDB)
-- Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci
-- Total Tables: 20 Relational Entities in 3NF / BCNF
-- Component 3: SQL Database Implementation (DDL with strict constraints)
-- =====================================================================

USE flashdrop;

-- Disable foreign key checks for clean recreation
SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables in reverse dependency order
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS fraud_flags;
DROP TABLE IF EXISTS purchase_attempts;
DROP TABLE IF EXISTS lottery_entries;
DROP TABLE IF EXISTS user_tiers;
DROP TABLE IF EXISTS loyalty_tiers;
DROP TABLE IF EXISTS referrals;
DROP TABLE IF EXISTS wallet_ledger;
DROP TABLE IF EXISTS wallets;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS drops;
DROP TABLE IF EXISTS price_history;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- 1. AUTHENTICATION & ACCESS CONTROL
-- =====================================================================

-- Table 1: roles (System Roles: admin, customer, auditor)
CREATE TABLE roles (
    role_id TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(32) NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 2: users (Customer and Admin Accounts)
CREATE TABLE users (
    user_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_id TINYINT UNSIGNED NOT NULL DEFAULT 2, -- Default: customer
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(64) NOT NULL,
    last_name VARCHAR(64) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    status ENUM('active', 'suspended', 'pending') NOT NULL DEFAULT 'active',
    failed_login_count TINYINT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE RESTRICT,
    CONSTRAINT chk_users_failed_logins CHECK (failed_login_count <= 10)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 3: addresses (Shipping Locations for Users)
CREATE TABLE addresses (
    address_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    address_line1 VARCHAR(128) NOT NULL,
    address_line2 VARCHAR(128) NULL,
    city VARCHAR(64) NOT NULL,
    state VARCHAR(64) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(64) NOT NULL DEFAULT 'United States',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 2. PRODUCT CATALOG & TAXONOMY
-- =====================================================================

-- Table 4: categories (Self-Referencing Product Hierarchy)
CREATE TABLE categories (
    category_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    parent_id INT UNSIGNED NULL, -- Recursive self-reference (NULL = root)
    name VARCHAR(64) NOT NULL UNIQUE,
    slug VARCHAR(64) NOT NULL UNIQUE,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories(category_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 5: products (Merchandise, Sneakers, and Apparel)
CREATE TABLE products (
    product_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id INT UNSIGNED NOT NULL,
    sku VARCHAR(64) NOT NULL UNIQUE,
    title VARCHAR(128) NOT NULL,
    description TEXT NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    attributes_json JSON NOT NULL, -- Size, Color, Edition, Material
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE RESTRICT,
    CONSTRAINT chk_products_base_price CHECK (base_price >= 0.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 6: price_history (Temporal Audit of Product Price Adjustments)
CREATE TABLE price_history (
    history_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT UNSIGNED NOT NULL,
    old_price DECIMAL(10,2) NOT NULL,
    new_price DECIMAL(10,2) NOT NULL,
    changed_by_user_id BIGINT UNSIGNED NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ph_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    CONSTRAINT fk_ph_user FOREIGN KEY (changed_by_user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    CONSTRAINT chk_ph_old_price CHECK (old_price >= 0.00),
    CONSTRAINT chk_ph_new_price CHECK (new_price >= 0.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 3. FLASH DROPS & INVENTORY ALLOCATION
-- =====================================================================

-- Table 7: drops (Time-Boxed High-Demand Release Events)
CREATE TABLE drops (
    drop_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(128) NOT NULL,
    slug VARCHAR(128) NOT NULL UNIQUE,
    drop_price DECIMAL(10,2) NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status ENUM('draft', 'scheduled', 'live', 'paused', 'concluded') NOT NULL DEFAULT 'draft',
    max_per_user TINYINT UNSIGNED NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_drops_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT,
    CONSTRAINT chk_drops_price CHECK (drop_price >= 0.00),
    CONSTRAINT chk_drops_time_window CHECK (end_time > start_time),
    CONSTRAINT chk_drops_max_per_user CHECK (max_per_user >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 8: inventory (Durable Inventory Core with Conservation Constraint)
CREATE TABLE inventory (
    inventory_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    drop_id BIGINT UNSIGNED NOT NULL UNIQUE,
    total_allocated INT UNSIGNED NOT NULL,
    reserved_holds INT UNSIGNED NOT NULL DEFAULT 0,
    sold_quantity INT UNSIGNED NOT NULL DEFAULT 0,
    available_quantity INT NOT NULL, -- Can be evaluated by CHECK
    version INT UNSIGNED NOT NULL DEFAULT 0, -- Optimistic locking counter
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_inventory_drop FOREIGN KEY (drop_id) REFERENCES drops(drop_id) ON DELETE RESTRICT,
    CONSTRAINT chk_inventory_avail_nonneg CHECK (available_quantity >= 0),
    CONSTRAINT chk_inventory_reserved_nonneg CHECK (reserved_holds >= 0),
    CONSTRAINT chk_inventory_sold_nonneg CHECK (sold_quantity >= 0),
    CONSTRAINT chk_inventory_conservation CHECK (available_quantity + reserved_holds + sold_quantity = total_allocated)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 4. CHECKOUT, ORDERS & PAYMENT RECEIPTS
-- =====================================================================

-- Table 9: orders (Customer Drop Orders)
CREATE TABLE orders (
    order_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(32) NOT NULL UNIQUE,
    user_id BIGINT UNSIGNED NOT NULL,
    drop_id BIGINT UNSIGNED NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    final_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending_payment', 'paid', 'failed', 'cancelled', 'refunded') NOT NULL DEFAULT 'pending_payment',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_orders_drop FOREIGN KEY (drop_id) REFERENCES drops(drop_id) ON DELETE RESTRICT,
    CONSTRAINT chk_orders_total_nonneg CHECK (total_amount >= 0.00),
    CONSTRAINT chk_orders_discount_nonneg CHECK (discount_amount >= 0.00),
    CONSTRAINT chk_orders_final_nonneg CHECK (final_amount >= 0.00),
    CONSTRAINT chk_orders_math_balance CHECK (final_amount = total_amount - discount_amount)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 10: order_items (Itemized Order Lines - Identifying Weak Entity)
CREATE TABLE order_items (
    item_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    quantity INT UNSIGNED NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_oi_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    CONSTRAINT fk_oi_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT,
    CONSTRAINT chk_oi_quantity CHECK (quantity >= 1),
    CONSTRAINT chk_oi_unit_price CHECK (unit_price >= 0.00),
    CONSTRAINT chk_oi_subtotal CHECK (subtotal = quantity * unit_price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 11: payments (Financial Transaction Receipts)
CREATE TABLE payments (
    payment_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    payment_method ENUM('wallet', 'stripe_card', 'upi') NOT NULL,
    transaction_reference VARCHAR(64) NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('initiated', 'success', 'failed', 'refunded') NOT NULL DEFAULT 'initiated',
    gateway_response_json JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE RESTRICT,
    CONSTRAINT chk_payments_amount CHECK (amount >= 0.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 5. FINANCIAL WALLET & DOUBLE-ENTRY LEDGER
-- =====================================================================

-- Table 12: wallets (Prepaid User Balances)
CREATE TABLE wallets (
    wallet_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL UNIQUE,
    balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_wallets_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    CONSTRAINT chk_wallets_balance_nonneg CHECK (balance >= 0.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 13: wallet_ledger (Immutable Double-Entry Ledger)
CREATE TABLE wallet_ledger (
    ledger_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    wallet_id BIGINT UNSIGNED NOT NULL,
    entry_type ENUM('CREDIT', 'DEBIT') NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    balance_after DECIMAL(12,2) NOT NULL,
    reference_type ENUM('deposit', 'order_payment', 'refund', 'referral_bonus') NOT NULL,
    reference_id VARCHAR(64) NOT NULL,
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ledger_wallet FOREIGN KEY (wallet_id) REFERENCES wallets(wallet_id) ON DELETE RESTRICT,
    CONSTRAINT chk_ledger_amount_positive CHECK (amount > 0.00),
    CONSTRAINT chk_ledger_balance_after_nonneg CHECK (balance_after >= 0.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 6. SOCIAL REFERRALS & LOYALTY TIERS
-- =====================================================================

-- Table 14: referrals (Self-Referencing Viral Tree)
CREATE TABLE referrals (
    referral_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    referrer_id BIGINT UNSIGNED NOT NULL,
    referee_id BIGINT UNSIGNED NOT NULL UNIQUE, -- User can only be referred once
    referral_code VARCHAR(32) NOT NULL,
    status ENUM('registered', 'qualified', 'rewarded') NOT NULL DEFAULT 'registered',
    reward_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ref_referrer FOREIGN KEY (referrer_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_ref_referee FOREIGN KEY (referee_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    CONSTRAINT chk_ref_no_self_referral CHECK (referrer_id <> referee_id),
    CONSTRAINT chk_ref_reward_nonneg CHECK (reward_amount >= 0.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 15: loyalty_tiers (Reward Classification)
CREATE TABLE loyalty_tiers (
    tier_id TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tier_name VARCHAR(32) NOT NULL UNIQUE,
    min_spend DECIMAL(10,2) NOT NULL,
    discount_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    early_access_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_lt_min_spend CHECK (min_spend >= 0.00),
    CONSTRAINT chk_lt_discount CHECK (discount_percentage >= 0.00 AND discount_percentage <= 100.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 16: user_tiers (User-Tier Historical and Active Association)
CREATE TABLE user_tiers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    tier_id TINYINT UNSIGNED NOT NULL,
    achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    CONSTRAINT fk_ut_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_ut_tier FOREIGN KEY (tier_id) REFERENCES loyalty_tiers(tier_id) ON DELETE RESTRICT,
    UNIQUE KEY uk_user_tier_achieved (user_id, tier_id, achieved_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 7. FAIR LOTTERY, TELEMETRY & FRAUD SHIELD
-- =====================================================================

-- Table 17: lottery_entries (Fair Waiting Room Ballot Entries)
CREATE TABLE lottery_entries (
    entry_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    drop_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    ticket_number VARCHAR(64) NOT NULL UNIQUE,
    entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_winner BOOLEAN NOT NULL DEFAULT FALSE,
    notified_at TIMESTAMP NULL,
    CONSTRAINT fk_le_drop FOREIGN KEY (drop_id) REFERENCES drops(drop_id) ON DELETE CASCADE,
    CONSTRAINT fk_le_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    UNIQUE KEY uk_lottery_user_drop (drop_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 18: purchase_attempts (High-Volume Concurrency Telemetry)
CREATE TABLE purchase_attempts (
    attempt_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    drop_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    ip_address VARCHAR(45) NOT NULL, -- IPv4 or IPv6
    user_agent VARCHAR(255) NOT NULL,
    status ENUM('held', 'rejected_out_of_stock', 'rate_limited', 'converted') NOT NULL,
    latency_ms INT UNSIGNED NOT NULL,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pa_drop FOREIGN KEY (drop_id) REFERENCES drops(drop_id) ON DELETE CASCADE,
    CONSTRAINT fk_pa_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 19: fraud_flags (Anti-Bot Detection Signals)
CREATE TABLE fraud_flags (
    flag_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    risk_score DECIMAL(5,2) NOT NULL,
    flag_reason VARCHAR(255) NOT NULL,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    flagged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    CONSTRAINT fk_ff_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT chk_ff_risk_score CHECK (risk_score >= 0.00 AND risk_score <= 100.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 20: audit_log (System-Wide Immutable DML Change Journal)
CREATE TABLE audit_log (
    log_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(64) NOT NULL,
    action ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    record_id BIGINT UNSIGNED NOT NULL,
    changed_by_user_id BIGINT UNSIGNED NULL,
    old_values_json JSON NULL,
    new_values_json JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

