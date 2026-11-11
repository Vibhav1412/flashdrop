# FlashDrop: Comprehensive Data Dictionary
**Document Version**: 1.0.0  
**Storage Engine**: MySQL 8.0 InnoDB  
**Charset & Collation**: `utf8mb4`, `utf8mb4_unicode_ci`  

---

## 1. Table: `roles`
Stores access control roles for system users.

| Column | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `role_id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | `PRIMARY KEY` | Unique role identifier |
| `role_name` | `VARCHAR(32)` | NO | None | `UNIQUE` | Human-readable role (`admin`, `customer`, `auditor`) |
| `description` | `VARCHAR(255)` | YES | NULL | None | Functional privilege scope |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | None | Record creation timestamp |

---

## 2. Table: `users`
Core customer, administrator, and bot accounts.

| Column | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `user_id` | `BIGINT UNSIGNED` | NO | AUTO_INCREMENT | `PRIMARY KEY` | Unique user identifier |
| `email` | `VARCHAR(255)` | NO | None | `UNIQUE` | Normalized email address |
| `password_hash`| `VARCHAR(255)` | NO | None | None | Argon2id / bcrypt salted hash |
| `full_name` | `VARCHAR(128)` | NO | None | None | Legal name |
| `role_id` | `INT UNSIGNED` | NO | 2 | `FK -> roles(role_id)` | Active authorization role |
| `status` | `ENUM` | NO | 'active' | None | `active`, `suspended`, `banned` |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | None | Registration timestamp |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP ON UPDATE` | None | Last profile update |

---

## 3. Table: `user_tiers`
Loyalty status tiers granting dynamic checkout discounts.

| Column | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `tier_id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | `PRIMARY KEY` | Unique tier ID |
| `tier_name` | `VARCHAR(32)` | NO | None | `UNIQUE` | `Bronze`, `Silver`, `Gold`, `Platinum` |
| `min_spend` | `DECIMAL(10,2)` | NO | 0.00 | `CHECK (>= 0)` | Threshold cumulative GMV |
| `discount_pct`| `DECIMAL(5,2)` | NO | 0.00 | `CHECK (0 - 100)` | Percentage discount on drops |

---

## 4. Table: `loyalty_tiers`
Bridge mapping users to current calculated loyalty tiers.

| Column | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `user_id` | `BIGINT UNSIGNED` | NO | None | `PRIMARY KEY, FK -> users` | User reference |
| `tier_id` | `INT UNSIGNED` | NO | None | `FK -> user_tiers` | Assigned tier |
| `current_points`| `INT UNSIGNED` | NO | 0 | None | Reward points balance |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP ON UPDATE` | None | Tier recalculation timestamp |

---

## 5. Table: `addresses`
Delivery addresses for physical sneaker drop fulfillment.

| Column | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `address_id` | `BIGINT UNSIGNED` | NO | AUTO_INCREMENT | `PRIMARY KEY` | Address identifier |
| `user_id` | `BIGINT UNSIGNED` | NO | None | `FK -> users` | Owner reference |
| `street_line` | `VARCHAR(255)` | NO | None | None | Street number and name |
| `city` | `VARCHAR(64)` | NO | None | None | Shipping destination city |
| `state` | `VARCHAR(64)` | NO | None | None | State / Province |
| `postal_code`| `VARCHAR(20)` | NO | None | None | Postal / Zip code |
| `country` | `CHAR(2)` | NO | 'US' | None | ISO 3166-1 alpha-2 code |
| `is_default` | `BOOLEAN` | NO | FALSE | None | Primary shipping selector |

---

## 6. Table: `categories`
Hierarchical product categories with self-referencing adjacency list.

| Column | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `category_id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | `PRIMARY KEY` | Category identifier |
| `parent_id` | `INT UNSIGNED` | YES | NULL | `FK -> categories` | Self-reference for breadcrumbs |
| `name` | `VARCHAR(64)` | NO | None | None | Category title |
| `slug` | `VARCHAR(64)` | NO | None | `UNIQUE` | URL slug |

---

## 7. Table: `products`
Catalog items featuring unstructured JSON sizing attributes.

| Column | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `product_id` | `BIGINT UNSIGNED` | NO | AUTO_INCREMENT | `PRIMARY KEY` | Product ID |
| `sku` | `VARCHAR(32)` | NO | None | `UNIQUE` | Global Stock Keeping Unit |
| `title` | `VARCHAR(128)` | NO | None | None | Marketing title |
| `category_id`| `INT UNSIGNED` | NO | None | `FK -> categories`| Parent category |
| `base_price` | `DECIMAL(10,2)` | NO | None | `CHECK (> 0)` | MSRP drop retail price |
| `attributes_json`| `JSON` | YES | NULL | Functional Index | Sneaker size, colorway, weight |

---

## 8. Table: `price_history`
Audit ledger tracking MSRP changes over time.

| Column | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `history_id` | `BIGINT UNSIGNED` | NO | AUTO_INCREMENT | `PRIMARY KEY` | Record ID |
| `product_id` | `BIGINT UNSIGNED` | NO | None | `FK -> products` | Product altered |
| `old_price` | `DECIMAL(10,2)` | NO | None | None | Previous price |
| `new_price` | `DECIMAL(10,2)` | NO | None | None | New price |
| `changed_by_user_id`| `BIGINT UNSIGNED` | NO | None | `FK -> users` | Admin author |
| `changed_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | None | Audit timestamp |

---

## 9. Table: `drops`
Scheduled limited-edition launch events.

| Column | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `drop_id` | `BIGINT UNSIGNED` | NO | AUTO_INCREMENT | `PRIMARY KEY` | Drop event identifier |
| `product_id` | `BIGINT UNSIGNED` | NO | None | `FK -> products` | Item dropped |
| `title` | `VARCHAR(128)` | NO | None | None | Event marketing banner |
| `start_time` | `DATETIME` | NO | None | None | Drop start datetime |
| `end_time` | `DATETIME` | NO | None | `CHECK (end > start)`| Drop conclusion |
| `status` | `ENUM` | NO | 'scheduled'| None | `scheduled`, `live`, `concluded` |

---

## 10. Table: `inventory`
Physical stock allocation enforcing conservation of mass.

| Column | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `inventory_id`| `BIGINT UNSIGNED`| NO | AUTO_INCREMENT | `PRIMARY KEY` | Inventory ID |
| `drop_id` | `BIGINT UNSIGNED`| NO | None | `UNIQUE, FK -> drops`| Bound drop |
| `total_allocated`| `INT UNSIGNED`| NO | None | `CHECK (> 0)` | Total stock batch |
| `reserved_holds`| `INT UNSIGNED`| NO | 0 | `CHECK (>= 0)` | Active Redis checkouts |
| `sold_quantity`| `INT UNSIGNED` | NO | 0 | `CHECK (>= 0)` | Confirmed purchases |
| `available_quantity`| `INT` | NO | None | `CHECK (>= 0)` | Unclaimed stock |
| `version` | `INT UNSIGNED` | NO | 0 | None | Optimistic lock counter |

---

## 11. Table: `wallets`
Customer prepaid account balance.

| Column | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `wallet_id` | `BIGINT UNSIGNED` | NO | AUTO_INCREMENT | `PRIMARY KEY` | Wallet identifier |
| `user_id` | `BIGINT UNSIGNED` | NO | None | `UNIQUE, FK -> users`| Account holder |
| `balance` | `DECIMAL(12,2)` | NO | 0.00 | `CHECK (>= 0)` | Current spendable funds |
| `currency` | `CHAR(3)` | NO | 'USD' | None | ISO 4217 currency |

---

## 12. Table: `wallet_ledger`
Double-entry immutable audit ledger of all financial debits and credits.

| Column | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `entry_id` | `BIGINT UNSIGNED` | NO | AUTO_INCREMENT | `PRIMARY KEY` | Ledger entry ID |
| `wallet_id` | `BIGINT UNSIGNED` | NO | None | `FK -> wallets` | Target wallet |
| `amount` | `DECIMAL(12,2)` | NO | None | `CHECK (> 0)` | Monetary sum |
| `transaction_type`| `ENUM` | NO | None | None | `CREDIT` (deposit) or `DEBIT` (checkout) |
| `balance_after`| `DECIMAL(12,2)` | NO | None | `CHECK (>= 0)` | Resulting wallet balance |
| `reference_type`| `VARCHAR(32)` | YES | NULL | None | `ORDER`, `DEPOSIT`, `REFUND` |
| `reference_id`| `BIGINT UNSIGNED` | YES | NULL | None | Linked order/transaction ID |

---

## 13. Table: `orders`
Durable completed purchase contracts.

| Column | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `order_id` | `BIGINT UNSIGNED` | NO | AUTO_INCREMENT | `PRIMARY KEY` | Order ID |
| `user_id` | `BIGINT UNSIGNED` | NO | None | `FK -> users` | Buyer reference |
| `drop_id` | `BIGINT UNSIGNED` | NO | None | `FK -> drops` | Drop reference |
| `total_amount`| `DECIMAL(10,2)` | NO | None | `CHECK (>= 0)` | Final paid amount |
| `status` | `ENUM` | NO | 'confirmed' | None | `confirmed`, `shipped`, `delivered` |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | None | Purchase timestamp |

---

## 14. Table: `order_items`
Line items detailing individual units within an order.

| Column | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `item_id` | `BIGINT UNSIGNED` | NO | AUTO_INCREMENT | `PRIMARY KEY` | Line item identifier |
| `order_id` | `BIGINT UNSIGNED` | NO | None | `FK -> orders` | Parent order |
| `product_id` | `BIGINT UNSIGNED` | NO | None | `FK -> products` | Purchased item |
| `quantity` | `INT UNSIGNED` | NO | 1 | `CHECK (> 0)` | Units count |
| `unit_price` | `DECIMAL(10,2)` | NO | None | `CHECK (> 0)` | Price at sale time |

---

## 15. Table: `payments`
Gateway settlement records.

| Column | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `payment_id` | `BIGINT UNSIGNED` | NO | AUTO_INCREMENT | `PRIMARY KEY` | Payment identifier |
| `order_id` | `BIGINT UNSIGNED` | NO | None | `UNIQUE, FK -> orders`| Paid order |
| `payment_method`| `VARCHAR(32)`| NO | 'wallet'| None | `wallet`, `card`, `crypto` |
| `amount` | `DECIMAL(10,2)` | NO | None | `CHECK (> 0)` | Settled sum |
| `status` | `ENUM` | NO | 'captured' | None | `pending`, `captured`, `failed` |

---

## 16. Table: `lottery_entries`
Fair lottery ballot entries for oversubscribed exclusive drops.

| Column | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `ballot_id` | `BIGINT UNSIGNED` | NO | AUTO_INCREMENT | `PRIMARY KEY` | Ballot ID |
| `drop_id` | `BIGINT UNSIGNED` | NO | None | `FK -> drops` | Drop entered |
| `user_id` | `BIGINT UNSIGNED` | NO | None | `FK -> users` | Participant |
| `is_winner` | `BOOLEAN` | NO | FALSE | None | Selected in draw |

---

## 17. Table: `purchase_attempts`
High-velocity telemetry tracking bot spikes and failed checkouts.

| Column | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `attempt_id` | `BIGINT UNSIGNED` | NO | AUTO_INCREMENT | `PRIMARY KEY` | Telemetry ID |
| `user_id` | `BIGINT UNSIGNED` | NO | None | `FK -> users` | Attempting user |
| `drop_id` | `BIGINT UNSIGNED` | NO | None | `FK -> drops` | Targeted drop |
| `ip_address` | `VARCHAR(45)` | NO | None | None | Client IPv4/IPv6 |
| `user_agent` | `VARCHAR(255)` | YES | NULL | None | Browser/bot header |
| `outcome` | `VARCHAR(32)` | NO | None | None | `SUCCESS`, `OUT_OF_STOCK`, `RATE_LIMITED` |

---

## 18. Table: `fraud_flags`
Automated security triggers flagging malicious or bot behaviors.

| Column | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `flag_id` | `BIGINT UNSIGNED` | NO | AUTO_INCREMENT | `PRIMARY KEY` | Flag ID |
| `user_id` | `BIGINT UNSIGNED` | NO | None | `FK -> users` | Suspicious user |
| `reason` | `VARCHAR(128)` | NO | None | None | Detection rule |
| `severity` | `ENUM` | NO | 'medium' | None | `low`, `medium`, `high`, `critical` |
| `flagged_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | None | Detection timestamp |

---

## 19. Table: `referrals`
Viral referral network tree enabling recursive depth analytics.

| Column | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `referral_id`| `BIGINT UNSIGNED` | NO | AUTO_INCREMENT | `PRIMARY KEY` | Referral ID |
| `referrer_id`| `BIGINT UNSIGNED` | NO | None | `FK -> users` | Inviter |
| `referee_id` | `BIGINT UNSIGNED` | NO | None | `UNIQUE, FK -> users`| Invitee |
| `reward_points`| `INT UNSIGNED`| NO | 50 | None | Points credited |

---

## 20. Table: `audit_log`
Database-level immutable security ledger populated by triggers.

| Column | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `log_id` | `BIGINT UNSIGNED` | NO | AUTO_INCREMENT | `PRIMARY KEY` | Log identifier |
| `table_name` | `VARCHAR(64)` | NO | None | None | Altered relation |
| `action_type`| `VARCHAR(16)` | NO | None | None | `INSERT`, `UPDATE`, `DELETE` |
| `record_id` | `BIGINT UNSIGNED` | NO | None | None | Primary key of modified row |
| `old_data_json`| `JSON` | YES | NULL | None | Snapshot before modification |
| `new_data_json`| `JSON` | YES | NULL | None | Snapshot after modification |
| `performed_by`| `VARCHAR(64)` | YES | NULL | None | DB user session string |
| `logged_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | None | Audit timestamp |
