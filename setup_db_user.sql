-- Run this as MySQL root user to set up the Retention Brain service user
CREATE USER IF NOT EXISTS 'rb_admin'@'localhost' IDENTIFIED BY 'rb_secure_pass_2026';
CREATE DATABASE IF NOT EXISTS retention_brain;
GRANT ALL PRIVILEGES ON retention_brain.* TO 'rb_admin'@'localhost';
FLUSH PRIVILEGES;

USE retention_brain;
-- The application will automatically create tables on next start if DATABASE_URL is correct.
