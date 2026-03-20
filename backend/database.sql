CREATE DATABASE IF NOT EXISTS retention_db;
USE retention_db;

CREATE TABLE dim_customers (
    customer_id VARCHAR(50) PRIMARY KEY,
    tenure INT,
    monthly_charges DECIMAL(10,2),
    contract_type VARCHAR(50),
    ltv DECIMAL(10,2)
);

CREATE TABLE fact_predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id VARCHAR(50),
    uplift_score DECIMAL(5,4),
    is_persuadable BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES dim_customers(customer_id)
);

CREATE TABLE fact_campaigns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id VARCHAR(50),
    ai_selected_offer VARCHAR(255),
    budget_cost DECIMAL(10,2),
    email_subject TEXT,
    email_body TEXT,
    FOREIGN KEY (customer_id) REFERENCES dim_customers(customer_id)
);