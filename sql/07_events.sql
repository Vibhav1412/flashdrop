-- =====================================================================
-- PROJECT FLASHDROP: 07_EVENTS.SQL
-- Engine: MySQL 8.0 (InnoDB)
-- Component 8: Advanced Database Concepts (Scheduled Events & Materialized Summary)
-- =====================================================================

USE flashdrop;

-- Enable MySQL Event Scheduler
SET GLOBAL event_scheduler = ON;

-- Create Summary / Materialized-Style Table for Pre-Aggregated Analytics
CREATE TABLE IF NOT EXISTS daily_drop_summary (
    summary_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    summary_date DATE NOT NULL,
    drop_id BIGINT UNSIGNED NOT NULL,
    total_orders INT UNSIGNED NOT NULL DEFAULT 0,
    gross_revenue DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    avg_latency_ms DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    last_refreshed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_date_drop (summary_date, drop_id),
    CONSTRAINT fk_dds_drop FOREIGN KEY (drop_id) REFERENCES drops(drop_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP EVENT IF EXISTS ev_refresh_daily_drop_summary;

DELIMITER $$

-- ---------------------------------------------------------------------
-- Event: ev_refresh_daily_drop_summary
-- Schedule: Executes hourly to refresh pre-computed sales analytics
-- ---------------------------------------------------------------------
CREATE EVENT ev_refresh_daily_drop_summary
ON SCHEDULE EVERY 1 HOUR
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    INSERT INTO daily_drop_summary (summary_date, drop_id, total_orders, gross_revenue, avg_latency_ms, last_refreshed_at)
    SELECT 
        CURRENT_DATE() AS summary_date,
        d.drop_id,
        COUNT(DISTINCT o.order_id) AS total_orders,
        COALESCE(SUM(o.final_amount), 0.00) AS gross_revenue,
        COALESCE(ROUND(AVG(pa.latency_ms), 2), 0.00) AS avg_latency_ms,
        NOW() AS last_refreshed_at
    FROM drops d
    LEFT JOIN orders o ON d.drop_id = o.drop_id AND DATE(o.created_at) = CURRENT_DATE() AND o.status = 'paid'
    LEFT JOIN purchase_attempts pa ON d.drop_id = pa.drop_id AND DATE(pa.attempted_at) = CURRENT_DATE()
    GROUP BY d.drop_id
    ON DUPLICATE KEY UPDATE
        total_orders = VALUES(total_orders),
        gross_revenue = VALUES(gross_revenue),
        avg_latency_ms = VALUES(avg_latency_ms),
        last_refreshed_at = NOW();
END$$

DELIMITER ;
