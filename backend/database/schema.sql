-- Core Schema for Retention Brain SaaS (PostgreSQL 16)

CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    company_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS datasets (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL,
    filename VARCHAR(255),
    row_count INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'processing',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL,
    dataset_id INT,
    external_customer_id VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255),
    revenue DECIMAL(10, 2),
    usage_score FLOAT,
    transactions_count INT,
    communication_channel VARCHAR(50),
    churn_risk FLOAT DEFAULT 0.0,
    uplift_score FLOAT DEFAULT 0.0,
    persuadability_score FLOAT DEFAULT 0.0,
    geography_risk_score FLOAT DEFAULT 0.0,
    retention_probability FLOAT DEFAULT 0.0,
    expected_recovery FLOAT DEFAULT 0.0,
    last_notified TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE SET NULL
);

CREATE INDEX idx_customers_company_id ON customers(company_id);
CREATE INDEX idx_customers_external_id ON customers(external_customer_id);

CREATE TABLE IF NOT EXISTS churn_scores (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    probability FLOAT NOT NULL,
    factors JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Optimization: GIN index for JSONB factors
CREATE INDEX idx_churn_factors ON churn_scores USING GIN (factors);

CREATE TABLE IF NOT EXISTS uplift_scores (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    score FLOAT NOT NULL,
    strategy VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS revenue_data (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    total_revenue DECIMAL(10, 2),
    risk_amount DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS admin_logs (
    id SERIAL PRIMARY KEY,
    user_id INT,
    company_id INT,
    action VARCHAR(255),
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL,
    type VARCHAR(50),
    details TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Analytics View for high-speed dashboard calculations
CREATE OR REPLACE VIEW v_retention_metrics AS
SELECT 
    company_id,
    COUNT(id) as total_customers,
    SUM(revenue) as total_revenue,
    AVG(churn_risk) as avg_churn_risk,
    AVG(geography_risk_score) as avg_geography_risk,
    SUM(revenue * (churn_risk / 100)) as revenue_at_risk,
    AVG(uplift_score) as avg_uplift_score,
    SUM(expected_recovery) as potential_recovery
FROM customers
GROUP BY company_id;

-- Seed Default Admin
-- Using PostgreSQL specific 'ON CONFLICT'
INSERT INTO users (username, email, password_hash, role) 
VALUES ('admin', 'admin@retentionbrain.ai', '$2b$12$LQv3c1yqBWVHxkd0LpX8Z.bXq6WJ9m5H0F5v9.5v5v5v5v5v5v5v', 'admin')
ON CONFLICT (username) DO NOTHING;
