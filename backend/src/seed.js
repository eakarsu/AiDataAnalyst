import pool from './config/database.js';
import { initializeDatabase } from './models/schema.js';
import bcrypt from 'bcryptjs';

async function seedDatabase() {
  const client = await pool.connect();

  try {
    console.log('Initializing database schema...');
    await initializeDatabase();

    // Check if data already exists — skip seeding to preserve user-created data
    const existing = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(existing.rows[0].count) > 0) {
      console.log('Database already has data — skipping seed to preserve existing records.');
      console.log('To force re-seed, run: npm run seed -- --force');

      // Check if --force flag is passed
      if (!process.argv.includes('--force')) {
        return;
      }
      console.log('--force flag detected, re-seeding...');
    }

    console.log('Clearing existing data...');
    await client.query('TRUNCATE users, data_sources, dashboards, reports, ai_insights, queries, alerts, predictions, anomalies, data_exports, scheduled_jobs, collaborations, activity_log, templates, integrations, query_optimizations, log_entries, log_analysis, dashboard_configs, data_quality_scores, insight_narratives, password_resets RESTART IDENTITY CASCADE');

    console.log('Seeding users...');
    const hashedPassword = await bcrypt.hash('demo123456', 10);
    const userResult = await client.query(`
      INSERT INTO users (email, password, name, role, email_verified) VALUES
      ('demo@aianalyst.com', $1, 'Demo User', 'admin', true),
      ('admin@aianalyst.com', $1, 'Admin User', 'admin', true),
      ('analyst@aianalyst.com', $1, 'Data Analyst', 'editor', true),
      ('manager@aianalyst.com', $1, 'Project Manager', 'editor', true),
      ('developer@aianalyst.com', $1, 'Developer', 'viewer', true)
      RETURNING id
    `, [hashedPassword]);
    const userId = userResult.rows[0].id;

    console.log('Seeding data sources (15+ items)...');
    await client.query(`
      INSERT INTO data_sources (user_id, name, type, connection_string, status, record_count, description) VALUES
      ($1, 'Sales Database', 'PostgreSQL', 'postgresql://sales:***@db.company.com:5432/sales', 'active', 1250000, 'Main sales transaction database'),
      ($1, 'Marketing Analytics', 'MySQL', 'mysql://marketing:***@analytics.company.com:3306/marketing', 'active', 890000, 'Marketing campaign and lead data'),
      ($1, 'Customer CRM', 'Salesforce', 'https://company.salesforce.com/api', 'active', 45000, 'Customer relationship management data'),
      ($1, 'Website Analytics', 'Google Analytics', 'GA4-XXXXXXX', 'active', 5600000, 'Website traffic and user behavior'),
      ($1, 'Financial System', 'Oracle', 'oracle://finance:***@erp.company.com:1521/FINPROD', 'active', 780000, 'Financial transactions and reporting'),
      ($1, 'Inventory Management', 'MongoDB', 'mongodb://inventory:***@mongo.company.com:27017/inventory', 'active', 125000, 'Product inventory and warehouse data'),
      ($1, 'HR System', 'SAP', 'https://hr.company.com/sap/api', 'active', 12000, 'Human resources and employee data'),
      ($1, 'Support Tickets', 'Zendesk', 'https://company.zendesk.com/api/v2', 'active', 340000, 'Customer support ticket database'),
      ($1, 'Social Media', 'API Integration', 'https://api.social.com/v1', 'active', 2100000, 'Social media engagement metrics'),
      ($1, 'Email Marketing', 'Mailchimp', 'https://us1.api.mailchimp.com/3.0', 'active', 560000, 'Email campaign performance data'),
      ($1, 'Product Analytics', 'Mixpanel', 'https://mixpanel.com/api/2.0', 'active', 8900000, 'Product usage and event tracking'),
      ($1, 'Payment Gateway', 'Stripe', 'https://api.stripe.com/v1', 'active', 450000, 'Payment transactions and subscriptions'),
      ($1, 'Advertising Data', 'Google Ads', 'https://googleads.googleapis.com/v14', 'active', 1200000, 'Advertising campaign performance'),
      ($1, 'E-commerce Platform', 'Shopify', 'https://company.myshopify.com/admin/api', 'active', 890000, 'Online store transactions'),
      ($1, 'Data Warehouse', 'Snowflake', 'snowflake://company.snowflakecomputing.com', 'active', 15000000, 'Centralized data warehouse'),
      ($1, 'IoT Sensors', 'TimescaleDB', 'postgresql://iot:***@timescale.company.com:5432/sensors', 'syncing', 45000000, 'IoT device sensor readings'),
      ($1, 'Log Analytics', 'Elasticsearch', 'https://elastic.company.com:9200', 'active', 120000000, 'Application and system logs')
    `, [userId]);

    console.log('Seeding dashboards (15+ items)...');
    await client.query(`
      INSERT INTO dashboards (user_id, name, description, is_public, views) VALUES
      ($1, 'Executive Summary', 'High-level KPIs and business metrics for leadership', true, 1250),
      ($1, 'Sales Performance', 'Real-time sales tracking and pipeline analysis', false, 890),
      ($1, 'Marketing ROI', 'Campaign performance and marketing attribution', false, 567),
      ($1, 'Customer Analytics', 'Customer behavior and segmentation analysis', true, 432),
      ($1, 'Financial Overview', 'Revenue, expenses, and profitability metrics', false, 789),
      ($1, 'Product Metrics', 'User engagement and product usage statistics', false, 654),
      ($1, 'Operations Dashboard', 'Operational efficiency and process metrics', false, 321),
      ($1, 'HR Analytics', 'Employee metrics and workforce analytics', false, 234),
      ($1, 'Support Performance', 'Customer support KPIs and ticket analytics', true, 456),
      ($1, 'Inventory Status', 'Stock levels and supply chain metrics', false, 345),
      ($1, 'Website Performance', 'Traffic, conversions, and user journeys', true, 876),
      ($1, 'Social Media Analytics', 'Social engagement and brand metrics', false, 543),
      ($1, 'Revenue Forecast', 'Predictive revenue and growth projections', false, 678),
      ($1, 'Cost Analysis', 'Detailed cost breakdown and optimization', false, 234),
      ($1, 'Customer Journey', 'End-to-end customer experience metrics', true, 567),
      ($1, 'Real-time Monitoring', 'Live system and business metrics', false, 1234)
    `, [userId]);

    console.log('Seeding reports (15+ items)...');
    await client.query(`
      INSERT INTO reports (user_id, dashboard_id, name, type, query, schedule, status, description) VALUES
      ($1, 1, 'Monthly Revenue Report', 'financial', 'SELECT * FROM sales WHERE date >= NOW() - INTERVAL ''30 days''', 'monthly', 'active', 'Comprehensive monthly revenue breakdown'),
      ($1, 1, 'Weekly KPI Summary', 'summary', 'SELECT metric, value FROM kpis ORDER BY date DESC', 'weekly', 'active', 'Weekly business KPI tracking'),
      ($1, 2, 'Sales Pipeline Analysis', 'sales', 'SELECT stage, COUNT(*), SUM(value) FROM pipeline GROUP BY stage', 'daily', 'active', 'Sales funnel and pipeline stages'),
      ($1, 2, 'Territory Performance', 'sales', 'SELECT territory, revenue FROM sales GROUP BY territory', 'weekly', 'active', 'Regional sales breakdown'),
      ($1, 3, 'Campaign Attribution', 'marketing', 'SELECT campaign, conversions, roi FROM campaigns', 'weekly', 'active', 'Marketing campaign performance'),
      ($1, 3, 'Lead Source Analysis', 'marketing', 'SELECT source, leads, conversion_rate FROM lead_sources', 'daily', 'active', 'Lead generation by channel'),
      ($1, 4, 'Customer Segmentation', 'analytics', 'SELECT segment, count, ltv FROM customer_segments', 'monthly', 'active', 'Customer segment analysis'),
      ($1, 4, 'Churn Prediction', 'predictive', 'SELECT customer_id, churn_probability FROM predictions', 'weekly', 'active', 'At-risk customer identification'),
      ($1, 5, 'P&L Statement', 'financial', 'SELECT category, amount FROM financials WHERE type = ''pnl''', 'monthly', 'active', 'Profit and loss statement'),
      ($1, 5, 'Cash Flow Analysis', 'financial', 'SELECT period, inflow, outflow FROM cash_flow', 'weekly', 'active', 'Cash flow tracking'),
      ($1, 6, 'Feature Usage', 'product', 'SELECT feature, usage_count, users FROM feature_usage', 'daily', 'active', 'Product feature adoption'),
      ($1, 6, 'User Retention', 'product', 'SELECT cohort, retention_rate FROM cohort_analysis', 'weekly', 'active', 'User retention by cohort'),
      ($1, 7, 'Process Efficiency', 'operations', 'SELECT process, cycle_time, throughput FROM processes', 'daily', 'active', 'Operational process metrics'),
      ($1, 8, 'Employee Satisfaction', 'hr', 'SELECT department, satisfaction_score FROM surveys', 'quarterly', 'active', 'Employee NPS and satisfaction'),
      ($1, 9, 'Ticket Resolution', 'support', 'SELECT priority, avg_resolution_time FROM tickets', 'daily', 'active', 'Support ticket metrics'),
      ($1, 10, 'Stock Turnover', 'inventory', 'SELECT product, turnover_rate FROM inventory', 'weekly', 'active', 'Inventory turnover analysis'),
      ($1, 11, 'Conversion Funnel', 'analytics', 'SELECT step, visitors, conversions FROM funnel', 'daily', 'active', 'Website conversion funnel')
    `, [userId]);

    console.log('Seeding AI insights (15+ items)...');
    await client.query(`
      INSERT INTO ai_insights (user_id, report_id, title, insight_type, content, confidence, impact, status) VALUES
      ($1, 1, 'Revenue Growth Opportunity', 'opportunity', 'Analysis indicates 23% potential revenue increase by expanding into the APAC market based on current customer data patterns.', 92.5, 'high', 'new'),
      ($1, 1, 'Seasonal Trend Detected', 'trend', 'Strong correlation found between Q4 sales and holiday marketing spend. Recommend increasing Q4 budget by 15%.', 88.3, 'medium', 'new'),
      ($1, 2, 'Pipeline Risk Alert', 'risk', 'Three enterprise deals worth $2.4M have stalled in negotiation for 45+ days. Immediate attention required.', 94.1, 'high', 'acknowledged'),
      ($1, 3, 'Marketing Channel Optimization', 'optimization', 'LinkedIn campaigns showing 3.2x higher ROI than Facebook. Consider reallocating 20% of Facebook budget.', 86.7, 'medium', 'new'),
      ($1, 4, 'Churn Risk Identification', 'risk', 'Identified 127 high-value customers with 85%+ churn probability. Common factors: reduced engagement, support tickets.', 91.2, 'high', 'new'),
      ($1, 4, 'Customer Segment Discovery', 'discovery', 'New high-value segment identified: SMB tech companies, 40% higher LTV than average. Currently underserved.', 89.5, 'high', 'new'),
      ($1, 5, 'Cost Anomaly Detected', 'anomaly', 'Cloud infrastructure costs increased 45% MoM without corresponding usage increase. Potential optimization needed.', 95.8, 'high', 'acknowledged'),
      ($1, 6, 'Feature Adoption Pattern', 'pattern', 'Users who engage with reporting features within first week show 67% higher retention. Recommend onboarding focus.', 87.4, 'medium', 'new'),
      ($1, 7, 'Process Bottleneck', 'optimization', 'Order fulfillment process shows 2.3 day delay at quality check stage. Automation could reduce by 80%.', 90.1, 'high', 'new'),
      ($1, 8, 'Attrition Risk', 'risk', 'Engineering department showing early attrition indicators: decreased engagement, increased PTO usage.', 78.9, 'medium', 'new'),
      ($1, 9, 'Support Pattern Analysis', 'pattern', 'API integration issues account for 34% of support tickets. Improved documentation could reduce by 60%.', 93.2, 'high', 'new'),
      ($1, 10, 'Inventory Optimization', 'optimization', 'SKU ABC-123 consistently overstocked. Reducing order quantity by 25% would save $45K annually.', 88.6, 'medium', 'new'),
      ($1, 11, 'Conversion Opportunity', 'opportunity', 'Cart abandonment rate 68% on mobile. A/B test suggests simplified checkout could improve by 23%.', 85.4, 'high', 'new'),
      ($1, 12, 'Cross-sell Recommendation', 'opportunity', 'Customers buying Product A have 78% probability of purchasing Product B within 30 days. Bundle opportunity.', 91.7, 'high', 'new'),
      ($1, 13, 'Forecast Accuracy', 'trend', 'Q1 forecast within 3.2% accuracy. Model confidence increasing. Recommend extending forecast horizon.', 94.5, 'low', 'acknowledged'),
      ($1, 14, 'Budget Reallocation', 'optimization', 'Marketing budget efficiency could improve 18% by shifting from display ads to content marketing.', 82.3, 'medium', 'new')
    `, [userId]);

    console.log('Seeding queries (15+ items)...');
    await client.query(`
      INSERT INTO queries (user_id, natural_language_query, generated_sql, result_summary, execution_time, row_count, status) VALUES
      ($1, 'Show me top 10 customers by revenue this quarter', 'SELECT customer_name, SUM(revenue) as total FROM orders WHERE date >= DATE_TRUNC(''quarter'', NOW()) GROUP BY customer_name ORDER BY total DESC LIMIT 10', 'Top customer: Acme Corp with $1.2M revenue', 234, 10, 'completed'),
      ($1, 'What is our customer churn rate by month?', 'SELECT DATE_TRUNC(''month'', churn_date) as month, COUNT(*) as churned, COUNT(*) * 100.0 / total_customers as rate FROM churns GROUP BY month ORDER BY month', 'Average churn rate: 4.2% monthly', 156, 12, 'completed'),
      ($1, 'Compare sales performance across regions', 'SELECT region, SUM(sales) as total_sales, AVG(deal_size) as avg_deal FROM opportunities GROUP BY region ORDER BY total_sales DESC', 'North America leads with $4.5M, EMEA second at $2.8M', 189, 5, 'completed'),
      ($1, 'Which products have the highest profit margin?', 'SELECT product_name, (price - cost) / price * 100 as margin FROM products ORDER BY margin DESC LIMIT 10', 'Enterprise Suite has highest margin at 78%', 123, 10, 'completed'),
      ($1, 'Show marketing campaign ROI for last 6 months', 'SELECT campaign_name, spend, revenue, (revenue - spend) / spend * 100 as roi FROM campaigns WHERE start_date >= NOW() - INTERVAL ''6 months'' ORDER BY roi DESC', 'Email campaigns showing best ROI at 340%', 267, 24, 'completed'),
      ($1, 'What are the most common support issues?', 'SELECT category, COUNT(*) as ticket_count, AVG(resolution_time) as avg_time FROM support_tickets GROUP BY category ORDER BY ticket_count DESC', 'Login issues most common (23%), API errors second (18%)', 145, 8, 'completed'),
      ($1, 'Calculate customer lifetime value by segment', 'SELECT segment, AVG(total_purchases) as avg_ltv, COUNT(*) as customers FROM customers GROUP BY segment ORDER BY avg_ltv DESC', 'Enterprise segment has highest LTV at $45,000', 312, 5, 'completed'),
      ($1, 'Show me daily active users trend', 'SELECT date, COUNT(DISTINCT user_id) as dau FROM user_sessions WHERE date >= NOW() - INTERVAL ''30 days'' GROUP BY date ORDER BY date', 'DAU trending up 12% over last month', 98, 30, 'completed'),
      ($1, 'What is our inventory turnover rate?', 'SELECT category, SUM(sold) / AVG(stock) as turnover FROM inventory GROUP BY category ORDER BY turnover DESC', 'Electronics category has highest turnover at 8.5x', 201, 12, 'completed'),
      ($1, 'Compare employee productivity by department', 'SELECT department, AVG(tasks_completed) as productivity, AVG(hours_worked) as hours FROM employees GROUP BY department', 'Engineering most productive with 45 tasks/week avg', 167, 8, 'completed'),
      ($1, 'Show revenue forecast for next quarter', 'SELECT month, predicted_revenue, confidence_lower, confidence_upper FROM forecasts WHERE month >= DATE_TRUNC(''month'', NOW()) ORDER BY month LIMIT 3', 'Forecasted Q2 revenue: $12.4M (+/- 8%)', 89, 3, 'completed'),
      ($1, 'Which features have lowest adoption?', 'SELECT feature_name, adoption_rate, last_updated FROM features WHERE adoption_rate < 20 ORDER BY adoption_rate', '5 features below 20% adoption, Advanced Reports lowest at 8%', 134, 5, 'completed'),
      ($1, 'Calculate cost per acquisition by channel', 'SELECT channel, SUM(spend) / COUNT(conversions) as cpa FROM marketing WHERE date >= NOW() - INTERVAL ''90 days'' GROUP BY channel ORDER BY cpa', 'Organic search has lowest CPA at $12, paid social highest at $89', 223, 7, 'completed'),
      ($1, 'Show payment failure rate trends', 'SELECT DATE_TRUNC(''week'', date) as week, COUNT(CASE WHEN status = ''failed'' THEN 1 END) * 100.0 / COUNT(*) as failure_rate FROM payments GROUP BY week ORDER BY week', 'Failure rate decreased from 3.2% to 2.1% over 8 weeks', 178, 8, 'completed'),
      ($1, 'What is average order value by customer type?', 'SELECT customer_type, AVG(order_total) as aov, COUNT(*) as orders FROM orders GROUP BY customer_type ORDER BY aov DESC', 'B2B customers have 3.2x higher AOV than B2C', 112, 3, 'completed'),
      ($1, 'Show me underperforming sales reps', 'SELECT rep_name, quota, actual, actual/quota*100 as attainment FROM sales_reps WHERE actual/quota < 0.8 ORDER BY attainment', '4 reps below 80% quota attainment, lowest at 52%', 156, 4, 'completed')
    `, [userId]);

    console.log('Seeding alerts (15+ items)...');
    await client.query(`
      INSERT INTO alerts (user_id, report_id, name, condition, threshold, frequency, is_active, trigger_count) VALUES
      ($1, 1, 'Revenue Drop Alert', 'daily_revenue < threshold', 50000, 'hourly', true, 3),
      ($1, 1, 'Monthly Target Alert', 'monthly_revenue < monthly_target * 0.9', 900000, 'daily', true, 1),
      ($1, 2, 'Deal Velocity Alert', 'avg_deal_cycle > threshold_days', 45, 'daily', true, 5),
      ($1, 2, 'Pipeline Coverage Alert', 'pipeline_value < target * 3', 3000000, 'weekly', true, 2),
      ($1, 3, 'Campaign Spend Alert', 'daily_spend > budget / 30', 5000, 'hourly', true, 8),
      ($1, 3, 'Lead Quality Alert', 'conversion_rate < threshold', 0.05, 'daily', true, 4),
      ($1, 4, 'Churn Spike Alert', 'daily_churn > average * 1.5', 10, 'daily', true, 2),
      ($1, 4, 'NPS Drop Alert', 'nps_score < threshold', 40, 'weekly', true, 1),
      ($1, 5, 'Budget Overrun Alert', 'spending > budget * 1.1', 100000, 'daily', true, 3),
      ($1, 5, 'Cash Flow Alert', 'available_cash < minimum', 500000, 'daily', true, 0),
      ($1, 6, 'Error Rate Alert', 'error_rate > threshold', 0.01, 'hourly', true, 12),
      ($1, 6, 'Performance Alert', 'response_time > threshold_ms', 500, 'hourly', true, 7),
      ($1, 9, 'Ticket Backlog Alert', 'open_tickets > threshold', 100, 'hourly', true, 4),
      ($1, 9, 'SLA Breach Alert', 'resolution_time > sla_hours', 24, 'hourly', true, 6),
      ($1, 10, 'Stock Level Alert', 'stock_level < reorder_point', 100, 'daily', true, 9),
      ($1, 11, 'Conversion Drop Alert', 'conversion_rate < baseline * 0.8', 0.02, 'hourly', true, 3)
    `, [userId]);

    console.log('Seeding predictions (15+ items)...');
    await client.query(`
      INSERT INTO predictions (user_id, model_type, target_metric, prediction_period, predicted_value, accuracy, status) VALUES
      ($1, 'time_series', 'Monthly Revenue', 'next_month', 1250000, 94.5, 'completed'),
      ($1, 'time_series', 'Monthly Revenue', 'next_quarter', 3850000, 89.2, 'completed'),
      ($1, 'regression', 'Customer LTV', 'next_year', 4500, 87.8, 'completed'),
      ($1, 'classification', 'Churn Probability', 'next_30_days', 0.12, 91.3, 'completed'),
      ($1, 'time_series', 'Website Traffic', 'next_week', 125000, 93.1, 'completed'),
      ($1, 'regression', 'Deal Close Probability', 'current_quarter', 0.65, 88.7, 'completed'),
      ($1, 'time_series', 'Support Tickets', 'next_month', 4500, 90.2, 'completed'),
      ($1, 'classification', 'Lead Score', 'immediate', 78, 85.4, 'completed'),
      ($1, 'time_series', 'Inventory Demand', 'next_month', 15000, 92.6, 'completed'),
      ($1, 'regression', 'Employee Attrition', 'next_quarter', 0.08, 82.1, 'completed'),
      ($1, 'time_series', 'Ad Spend ROI', 'next_month', 3.2, 86.9, 'completed'),
      ($1, 'classification', 'Fraud Risk', 'real_time', 0.02, 97.8, 'completed'),
      ($1, 'time_series', 'Server Load', 'next_hour', 75, 95.4, 'completed'),
      ($1, 'regression', 'Customer Satisfaction', 'next_survey', 4.2, 84.3, 'completed'),
      ($1, 'time_series', 'Cash Flow', 'next_month', 850000, 91.7, 'completed'),
      ($1, 'classification', 'Upsell Probability', 'next_30_days', 0.34, 89.5, 'completed')
    `, [userId]);

    console.log('Seeding anomalies (15+ items)...');
    await client.query(`
      INSERT INTO anomalies (user_id, data_source_id, metric_name, expected_value, actual_value, deviation_percentage, severity, description, is_resolved) VALUES
      ($1, 1, 'Daily Sales', 45000, 28000, -37.8, 'high', 'Sales dropped significantly below expected baseline', false),
      ($1, 1, 'Average Order Value', 125, 89, -28.8, 'medium', 'AOV decreased unexpectedly', false),
      ($1, 2, 'Email Open Rate', 0.22, 0.08, -63.6, 'high', 'Email campaign performance severely degraded', false),
      ($1, 3, 'API Response Time', 150, 890, 93.3, 'critical', 'API latency spike detected', true),
      ($1, 4, 'Bounce Rate', 0.35, 0.58, 65.7, 'medium', 'Website bounce rate increased significantly', false),
      ($1, 5, 'Transaction Failures', 50, 234, 68.0, 'high', 'Payment processing errors spiked', true),
      ($1, 6, 'User Signups', 500, 1200, 140.0, 'low', 'Unusual signup surge - verify for bot activity', false),
      ($1, 7, 'Server CPU Usage', 45, 92, 104.4, 'high', 'Server resource utilization critically high', false),
      ($1, 8, 'Support Response Time', 2, 8, 75.0, 'medium', 'Support team response time degraded', false),
      ($1, 9, 'Inventory Shrinkage', 0.02, 0.08, 75.0, 'high', 'Unusual inventory loss detected', false),
      ($1, 10, 'Login Failures', 100, 1500, 150.0, 'critical', 'Potential security incident - mass login failures', true),
      ($1, 11, 'Data Sync Delay', 5, 45, 80.0, 'medium', 'Data pipeline experiencing significant delays', false),
      ($1, 12, 'Cache Hit Rate', 0.95, 0.62, -34.7, 'medium', 'Cache efficiency dropped significantly', false),
      ($1, 13, 'Ad Click Rate', 0.03, 0.001, -96.7, 'high', 'Ad performance collapsed - check targeting', false),
      ($1, 14, 'Database Connections', 50, 180, 60.0, 'high', 'Connection pool near exhaustion', false),
      ($1, 15, 'Memory Usage', 60, 94, 56.7, 'critical', 'Application memory usage critical', false)
    `, [userId]);

    console.log('Seeding data exports (15+ items)...');
    await client.query(`
      INSERT INTO data_exports (user_id, report_id, format, file_path, file_size, row_count, status) VALUES
      ($1, 1, 'csv', '/exports/revenue_report_2024_01.csv', 2450000, 45000, 'completed'),
      ($1, 1, 'xlsx', '/exports/revenue_report_2024_01.xlsx', 3200000, 45000, 'completed'),
      ($1, 2, 'pdf', '/exports/sales_pipeline_q1.pdf', 1850000, 1200, 'completed'),
      ($1, 3, 'csv', '/exports/marketing_campaigns.csv', 890000, 12000, 'completed'),
      ($1, 4, 'json', '/exports/customer_segments.json', 4500000, 35000, 'completed'),
      ($1, 5, 'xlsx', '/exports/financial_summary.xlsx', 1200000, 5000, 'completed'),
      ($1, 6, 'csv', '/exports/product_analytics.csv', 8900000, 150000, 'completed'),
      ($1, 7, 'pdf', '/exports/operations_report.pdf', 2100000, 800, 'completed'),
      ($1, 8, 'csv', '/exports/hr_metrics.csv', 450000, 3500, 'completed'),
      ($1, 9, 'xlsx', '/exports/support_analysis.xlsx', 1800000, 25000, 'completed'),
      ($1, 10, 'csv', '/exports/inventory_status.csv', 3400000, 45000, 'completed'),
      ($1, 11, 'json', '/exports/web_analytics.json', 12000000, 500000, 'completed'),
      ($1, 12, 'pdf', '/exports/executive_summary.pdf', 5600000, 50, 'completed'),
      ($1, 13, 'csv', '/exports/forecast_data.csv', 780000, 8000, 'completed'),
      ($1, 14, 'xlsx', '/exports/cost_analysis.xlsx', 2300000, 15000, 'completed'),
      ($1, 15, 'parquet', '/exports/raw_data_archive.parquet', 45000000, 2000000, 'completed')
    `, [userId]);

    console.log('Seeding scheduled jobs (15+ items)...');
    await client.query(`
      INSERT INTO scheduled_jobs (user_id, job_type, job_name, cron_expression, status) VALUES
      ($1, 'data_sync', 'Sales Database Sync', '0 */6 * * *', 'active'),
      ($1, 'data_sync', 'Marketing Data Import', '0 2 * * *', 'active'),
      ($1, 'report', 'Daily Revenue Report', '0 8 * * *', 'active'),
      ($1, 'report', 'Weekly KPI Summary', '0 9 * * 1', 'active'),
      ($1, 'ai_analysis', 'Anomaly Detection Scan', '0 */4 * * *', 'active'),
      ($1, 'ai_analysis', 'Churn Prediction Update', '0 3 * * *', 'active'),
      ($1, 'export', 'Monthly Data Archive', '0 1 1 * *', 'active'),
      ($1, 'notification', 'Alert Digest Email', '0 8 * * *', 'active'),
      ($1, 'maintenance', 'Database Cleanup', '0 4 * * 0', 'active'),
      ($1, 'data_sync', 'CRM Contact Sync', '*/30 * * * *', 'active'),
      ($1, 'ai_analysis', 'Forecast Model Retrain', '0 2 * * 0', 'active'),
      ($1, 'report', 'Monthly Executive Report', '0 7 1 * *', 'active'),
      ($1, 'data_sync', 'Google Analytics Import', '0 */2 * * *', 'active'),
      ($1, 'maintenance', 'Cache Refresh', '0 */12 * * *', 'active'),
      ($1, 'notification', 'Weekly Performance Alert', '0 10 * * 5', 'active'),
      ($1, 'export', 'Compliance Data Export', '0 0 1 * *', 'active')
    `, [userId]);

    console.log('Seeding templates (15+ items)...');
    await client.query(`
      INSERT INTO templates (name, category, description, usage_count, is_premium) VALUES
      ('Sales Dashboard', 'dashboard', 'Complete sales metrics dashboard with pipeline and revenue tracking', 1250, false),
      ('Marketing Analytics', 'dashboard', 'Marketing campaign performance and ROI analysis', 890, false),
      ('Customer 360 View', 'dashboard', 'Comprehensive customer analytics and segmentation', 567, true),
      ('Financial Report', 'report', 'Standard P&L and cash flow report template', 1100, false),
      ('Executive Summary', 'report', 'High-level KPI summary for leadership', 890, false),
      ('Product Analytics', 'dashboard', 'User engagement and product usage metrics', 678, false),
      ('Support Metrics', 'dashboard', 'Customer support KPIs and ticket analysis', 456, false),
      ('HR Analytics', 'dashboard', 'Employee metrics and workforce analytics', 234, true),
      ('Inventory Management', 'dashboard', 'Stock levels and supply chain tracking', 345, false),
      ('Revenue Forecast', 'report', 'Predictive revenue modeling template', 567, true),
      ('Churn Analysis', 'report', 'Customer churn prediction and analysis', 432, true),
      ('A/B Test Results', 'report', 'Experiment results and statistical analysis', 321, false),
      ('SEO Performance', 'dashboard', 'Search engine optimization metrics', 445, false),
      ('Social Media', 'dashboard', 'Social engagement and brand metrics', 556, false),
      ('E-commerce', 'dashboard', 'Online store analytics and conversion tracking', 789, false),
      ('SaaS Metrics', 'dashboard', 'MRR, ARR, and SaaS-specific KPIs', 890, true)
    `);

    console.log('Seeding integrations (15+ items)...');
    await client.query(`
      INSERT INTO integrations (user_id, service_name, service_type, status, sync_frequency) VALUES
      ($1, 'Salesforce', 'crm', 'connected', 'hourly'),
      ($1, 'HubSpot', 'crm', 'connected', 'hourly'),
      ($1, 'Google Analytics', 'analytics', 'connected', 'daily'),
      ($1, 'Mixpanel', 'analytics', 'connected', 'hourly'),
      ($1, 'Stripe', 'payment', 'connected', 'real_time'),
      ($1, 'QuickBooks', 'accounting', 'connected', 'daily'),
      ($1, 'Slack', 'communication', 'connected', 'real_time'),
      ($1, 'Jira', 'project_management', 'connected', 'hourly'),
      ($1, 'Zendesk', 'support', 'connected', 'hourly'),
      ($1, 'Mailchimp', 'email', 'connected', 'daily'),
      ($1, 'Google Ads', 'advertising', 'connected', 'hourly'),
      ($1, 'Facebook Ads', 'advertising', 'connected', 'hourly'),
      ($1, 'Shopify', 'ecommerce', 'connected', 'real_time'),
      ($1, 'AWS S3', 'storage', 'connected', 'daily'),
      ($1, 'Snowflake', 'data_warehouse', 'connected', 'hourly'),
      ($1, 'Tableau', 'visualization', 'connected', 'daily')
    `, [userId]);

    console.log('Seeding activity log (15+ items)...');
    await client.query(`
      INSERT INTO activity_log (user_id, action, entity_type, entity_id, details) VALUES
      ($1, 'create', 'dashboard', 1, '{"name": "Executive Summary"}'),
      ($1, 'view', 'report', 1, '{"duration_seconds": 45}'),
      ($1, 'export', 'report', 2, '{"format": "pdf", "rows": 1200}'),
      ($1, 'run_query', 'query', 1, '{"execution_time_ms": 234}'),
      ($1, 'update', 'alert', 1, '{"field": "threshold", "old": 40000, "new": 50000}'),
      ($1, 'create', 'data_source', 5, '{"type": "postgresql"}'),
      ($1, 'view', 'insight', 3, '{"action_taken": "acknowledged"}'),
      ($1, 'share', 'dashboard', 2, '{"shared_with": "team"}'),
      ($1, 'delete', 'report', 8, '{"reason": "duplicate"}'),
      ($1, 'login', 'user', 1, '{"ip": "192.168.1.1", "device": "Chrome/Mac"}'),
      ($1, 'update', 'profile', 1, '{"field": "notification_settings"}'),
      ($1, 'create', 'integration', 5, '{"service": "Stripe"}'),
      ($1, 'run_prediction', 'prediction', 1, '{"model": "time_series", "accuracy": 94.5}'),
      ($1, 'resolve', 'anomaly', 3, '{"resolution": "false_positive"}'),
      ($1, 'schedule', 'job', 1, '{"cron": "0 8 * * *"}'),
      ($1, 'invite', 'collaboration', 1, '{"user": "analyst@company.com", "permission": "edit"}')
    `, [userId]);

    console.log('Seeding query optimizations (15+ items)...');
    await client.query(`
      INSERT INTO query_optimizations (user_id, original_query, optimized_query, optimization_type, improvement_percentage, suggestions, index_recommendations, ai_analysis, status) VALUES
      ($1, 'SELECT * FROM orders WHERE customer_id = 123', 'SELECT id, order_date, total FROM orders WHERE customer_id = 123', 'query_rewrite', 45.5, '["Select only needed columns", "Add index on customer_id"]', '[{"table": "orders", "columns": ["customer_id"], "type": "btree"}]', 'Query selects all columns when only specific ones are needed. Adding an index on customer_id will improve lookup performance.', 'completed'),
      ($1, 'SELECT * FROM users u JOIN orders o ON u.id = o.user_id WHERE u.status = ''active''', 'SELECT u.id, u.name, o.total FROM users u INNER JOIN orders o ON u.id = o.user_id WHERE u.status = ''active''', 'join_optimization', 38.2, '["Use INNER JOIN explicitly", "Select specific columns"]', '[{"table": "users", "columns": ["status"], "type": "btree"}]', 'Explicit INNER JOIN improves readability and can help query planner. Index on status column recommended.', 'completed'),
      ($1, 'SELECT COUNT(*) FROM logs WHERE created_at > NOW() - INTERVAL ''7 days''', 'SELECT COUNT(*) FROM logs WHERE created_at > CURRENT_DATE - 7', 'execution_plan_improvement', 22.8, '["Use date arithmetic for better index usage"]', '[{"table": "logs", "columns": ["created_at"], "type": "btree"}]', 'Simplified date calculation allows better index utilization.', 'completed'),
      ($1, 'SELECT * FROM products WHERE category IN (SELECT id FROM categories WHERE active = true)', 'SELECT p.* FROM products p INNER JOIN categories c ON p.category = c.id WHERE c.active = true', 'query_rewrite', 55.3, '["Replace subquery with JOIN", "More efficient execution plan"]', '[{"table": "categories", "columns": ["active", "id"], "type": "btree"}]', 'Subquery converted to JOIN for better performance with large datasets.', 'completed'),
      ($1, 'SELECT DISTINCT customer_id FROM orders ORDER BY customer_id', 'SELECT customer_id FROM orders GROUP BY customer_id ORDER BY customer_id', 'query_rewrite', 18.7, '["GROUP BY can be more efficient than DISTINCT"]', '[]', 'GROUP BY sometimes outperforms DISTINCT depending on data distribution.', 'completed'),
      ($1, 'SELECT * FROM events WHERE event_date BETWEEN ''2024-01-01'' AND ''2024-12-31''', 'SELECT id, event_name, event_date FROM events WHERE event_date >= ''2024-01-01'' AND event_date < ''2025-01-01''', 'index_optimization', 32.1, '["Use range operators for better index usage", "Select specific columns"]', '[{"table": "events", "columns": ["event_date"], "type": "btree"}]', 'Range operators allow better index scan optimization.', 'completed'),
      ($1, 'SELECT * FROM sales WHERE YEAR(sale_date) = 2024', 'SELECT * FROM sales WHERE sale_date >= ''2024-01-01'' AND sale_date < ''2025-01-01''', 'index_optimization', 67.4, '["Avoid functions on indexed columns"]', '[{"table": "sales", "columns": ["sale_date"], "type": "btree"}]', 'Function on column prevents index usage. Rewritten to use index effectively.', 'completed'),
      ($1, 'SELECT * FROM customers WHERE email LIKE ''%@gmail.com''', 'SELECT * FROM customers WHERE email_domain = ''gmail.com''', 'query_rewrite', 78.9, '["Leading wildcard prevents index usage", "Consider denormalization"]', '[{"table": "customers", "columns": ["email_domain"], "type": "btree"}]', 'Leading wildcard causes full table scan. Consider storing email domain separately.', 'completed'),
      ($1, 'SELECT * FROM inventory WHERE quantity > 0 AND warehouse_id = 5', 'SELECT * FROM inventory WHERE warehouse_id = 5 AND quantity > 0', 'execution_plan_improvement', 15.3, '["Reorder conditions for selectivity"]', '[{"table": "inventory", "columns": ["warehouse_id", "quantity"], "type": "btree"}]', 'More selective condition first improves filtering efficiency.', 'completed'),
      ($1, 'SELECT o.*, (SELECT SUM(amount) FROM payments WHERE order_id = o.id) FROM orders o', 'SELECT o.*, COALESCE(p.total, 0) as payment_total FROM orders o LEFT JOIN (SELECT order_id, SUM(amount) as total FROM payments GROUP BY order_id) p ON o.id = p.order_id', 'query_rewrite', 72.5, '["Replace correlated subquery with JOIN"]', '[]', 'Correlated subquery executed for each row. JOIN approach much more efficient.', 'completed'),
      ($1, 'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100', 'SELECT id, action, user_id, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 100', 'query_rewrite', 28.4, '["Select only needed columns for faster retrieval"]', '[{"table": "audit_logs", "columns": ["created_at"], "type": "btree"}]', 'Reducing columns improves I/O and memory usage.', 'completed'),
      ($1, 'SELECT * FROM transactions WHERE status != ''cancelled''', 'SELECT * FROM transactions WHERE status IN (''completed'', ''pending'', ''processing'')', 'index_optimization', 35.6, '["Positive conditions often perform better"]', '[{"table": "transactions", "columns": ["status"], "type": "btree"}]', 'Listing expected values can help query planner estimate cardinality better.', 'completed'),
      ($1, 'SELECT COALESCE(SUM(amount), 0) FROM orders WHERE customer_id = $1 GROUP BY customer_id', 'SELECT COALESCE(SUM(amount), 0) FROM orders WHERE customer_id = $1', 'query_rewrite', 12.1, '["GROUP BY unnecessary with single customer filter"]', '[]', 'GROUP BY adds overhead when filtering to single value.', 'completed'),
      ($1, 'SELECT * FROM products p, categories c WHERE p.category_id = c.id', 'SELECT * FROM products p INNER JOIN categories c ON p.category_id = c.id', 'query_rewrite', 8.5, '["Use explicit JOIN syntax"]', '[]', 'Explicit JOIN improves readability and maintainability.', 'completed'),
      ($1, 'SELECT * FROM users WHERE id IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 10)', 'SELECT * FROM users WHERE id = ANY(ARRAY[1,2,3,4,5,6,7,8,9,10])', 'query_rewrite', 5.2, '["Use ANY with array for PostgreSQL"]', '[]', 'ANY with array can be more efficient for PostgreSQL.', 'completed'),
      ($1, 'SELECT * FROM orders WHERE order_total > (SELECT AVG(order_total) FROM orders)', 'WITH avg_total AS (SELECT AVG(order_total) as avg FROM orders) SELECT o.* FROM orders o, avg_total WHERE o.order_total > avg_total.avg', 'query_rewrite', 42.8, '["Use CTE to avoid repeated subquery evaluation"]', '[]', 'CTE computes average once instead of potentially multiple times.', 'completed')
    `, [userId]);

    console.log('Seeding log entries (15+ items)...');
    await client.query(`
      INSERT INTO log_entries (user_id, source, level, message, timestamp, metadata, stack_trace, analyzed, ai_classification, ai_severity, ai_root_cause, ai_solution) VALUES
      ($1, 'api-gateway', 'ERROR', 'Connection timeout to database server after 30s', NOW() - INTERVAL '2 hours', '{"service": "user-service", "endpoint": "/api/users"}', 'Error: ETIMEDOUT\n    at TCPConnectWrap.afterConnect', true, 'infrastructure', 'high', 'Database connection pool exhausted or network issue', 'Check database connection pool settings, verify network connectivity'),
      ($1, 'payment-service', 'ERROR', 'Payment processing failed: Invalid card number', NOW() - INTERVAL '1 hour', '{"transaction_id": "txn_123", "error_code": "INVALID_CARD"}', NULL, true, 'business', 'medium', 'Customer entered invalid payment details', 'Improve client-side validation, add helpful error messages'),
      ($1, 'auth-service', 'WARN', 'Multiple failed login attempts detected for user@example.com', NOW() - INTERVAL '30 minutes', '{"ip": "192.168.1.100", "attempts": 5}', NULL, true, 'security', 'high', 'Potential brute force attack or forgotten password', 'Implement rate limiting, consider account lockout, notify user'),
      ($1, 'inventory-service', 'ERROR', 'Stock update failed: Negative inventory not allowed', NOW() - INTERVAL '45 minutes', '{"product_id": "SKU-789", "requested": -5}', 'Error: InventoryConstraintError\n    at updateStock', true, 'business', 'medium', 'Race condition in concurrent inventory updates', 'Implement optimistic locking or queue-based updates'),
      ($1, 'notification-service', 'WARN', 'Email delivery delayed: SMTP rate limit exceeded', NOW() - INTERVAL '15 minutes', '{"queue_size": 1500, "rate_limit": 100}', NULL, true, 'performance', 'medium', 'High volume of notifications exceeding SMTP limits', 'Implement email batching, consider multiple SMTP providers'),
      ($1, 'api-gateway', 'INFO', 'New API version v2.1.0 deployed successfully', NOW() - INTERVAL '3 hours', '{"version": "2.1.0", "deployment_id": "dep_456"}', NULL, true, 'info', 'low', 'Normal deployment activity', 'No action needed - successful deployment'),
      ($1, 'cache-service', 'ERROR', 'Redis connection lost, falling back to database', NOW() - INTERVAL '25 minutes', '{"redis_host": "cache.internal", "port": 6379}', 'Error: ECONNREFUSED\n    at RedisClient.connect', true, 'infrastructure', 'critical', 'Redis server unavailable', 'Check Redis server health, verify network, consider Redis Sentinel'),
      ($1, 'order-service', 'WARN', 'Order processing queue depth exceeds threshold', NOW() - INTERVAL '10 minutes', '{"queue_depth": 5000, "threshold": 1000}', NULL, true, 'performance', 'high', 'Order volume spike or slow processing', 'Scale order processors, investigate slow queries'),
      ($1, 'search-service', 'ERROR', 'Elasticsearch cluster health: RED', NOW() - INTERVAL '5 minutes', '{"cluster": "prod-search", "unassigned_shards": 3}', NULL, true, 'infrastructure', 'critical', 'Elasticsearch node failure or disk space issue', 'Check node health, disk space, consider adding nodes'),
      ($1, 'user-service', 'DEBUG', 'User profile cache miss, fetching from database', NOW() - INTERVAL '1 minute', '{"user_id": 12345, "cache_key": "user:12345"}', NULL, true, 'debug', 'low', 'Normal cache miss behavior', 'Monitor cache hit rate, adjust TTL if needed'),
      ($1, 'reporting-service', 'ERROR', 'Report generation failed: Out of memory', NOW() - INTERVAL '20 minutes', '{"report_id": "rpt_789", "memory_used": "7.8GB"}', 'Error: ENOMEM\n    at generatePDF', true, 'performance', 'high', 'Large report exceeds available memory', 'Implement streaming/pagination for large reports'),
      ($1, 'webhook-service', 'WARN', 'Webhook delivery failed, retry attempt 3/5', NOW() - INTERVAL '8 minutes', '{"webhook_id": "wh_123", "status_code": 503}', NULL, true, 'integration', 'medium', 'Target webhook endpoint unavailable', 'Implement exponential backoff, alert after max retries'),
      ($1, 'file-service', 'ERROR', 'File upload failed: Storage quota exceeded', NOW() - INTERVAL '35 minutes', '{"user_id": 789, "file_size": "150MB", "quota": "100MB"}', NULL, true, 'business', 'medium', 'User exceeded storage allocation', 'Notify user, offer upgrade option, implement soft limits'),
      ($1, 'analytics-service', 'INFO', 'Daily aggregation job completed successfully', NOW() - INTERVAL '4 hours', '{"records_processed": 1500000, "duration_ms": 45000}', NULL, true, 'info', 'low', 'Normal batch job completion', 'No action needed - successful job'),
      ($1, 'api-gateway', 'ERROR', 'Rate limit exceeded for API key: ak_xyz123', NOW() - INTERVAL '12 minutes', '{"requests_per_minute": 150, "limit": 100}', NULL, true, 'security', 'medium', 'API consumer exceeding rate limits', 'Contact customer, review their use case, consider limit increase'),
      ($1, 'database-service', 'WARN', 'Slow query detected: 5.2s execution time', NOW() - INTERVAL '18 minutes', '{"query_hash": "abc123", "table": "orders"}', NULL, true, 'performance', 'high', 'Missing index or unoptimized query', 'Analyze query plan, add appropriate indexes')
    `, [userId]);

    console.log('Seeding log analysis (15+ items)...');
    await client.query(`
      INSERT INTO log_analysis (user_id, analysis_name, log_count, error_count, warning_count, patterns_detected, root_causes, recommendations, summary, severity, status) VALUES
      ($1, 'Daily Error Analysis - Production', 1250, 45, 120, '[{"pattern": "Database timeout", "frequency": 15, "description": "Recurring database connection issues"}, {"pattern": "Memory pressure", "frequency": 8, "description": "Services approaching memory limits"}]', '[{"cause": "Connection pool exhaustion", "confidence": 0.85, "evidence": "Multiple timeout errors during peak hours"}]', '[{"priority": 1, "action": "Increase connection pool size", "expected_impact": "50% reduction in timeout errors"}]', 'Analysis identified database connectivity as primary issue affecting 15 services. Memory pressure detected in 3 services during peak load.', 'high', 'completed'),
      ($1, 'Security Audit Log Review', 890, 12, 45, '[{"pattern": "Failed login attempts", "frequency": 234, "description": "Concentrated from specific IP ranges"}, {"pattern": "API key abuse", "frequency": 5, "description": "Rate limit violations"}]', '[{"cause": "Potential credential stuffing attack", "confidence": 0.78, "evidence": "High volume of failed logins from rotating IPs"}]', '[{"priority": 1, "action": "Implement IP-based rate limiting", "expected_impact": "Block 90% of malicious attempts"}]', 'Security analysis revealed potential credential stuffing attack from 15 IP addresses. Recommend immediate implementation of enhanced rate limiting.', 'critical', 'completed'),
      ($1, 'Weekly Performance Analysis', 15000, 89, 456, '[{"pattern": "Slow API responses", "frequency": 234, "description": "P99 latency exceeding SLA"}, {"pattern": "Cache misses", "frequency": 1200, "description": "High cache miss rate"}]', '[{"cause": "Inefficient database queries", "confidence": 0.92, "evidence": "Correlated slow responses with specific query patterns"}]', '[{"priority": 1, "action": "Optimize identified slow queries", "expected_impact": "40% latency improvement"}]', 'Performance degradation observed in 5 key API endpoints. Root cause traced to unoptimized database queries affecting cache efficiency.', 'high', 'completed'),
      ($1, 'Infrastructure Health Check', 5600, 23, 178, '[{"pattern": "Disk space warnings", "frequency": 12, "description": "Multiple servers approaching capacity"}, {"pattern": "CPU spikes", "frequency": 45, "description": "Intermittent high CPU usage"}]', '[{"cause": "Log file accumulation", "confidence": 0.88, "evidence": "Disk warnings correlate with log rotation schedule"}]', '[{"priority": 2, "action": "Implement log rotation and archival", "expected_impact": "Prevent disk capacity issues"}]', 'Infrastructure analysis shows healthy overall state with preventive actions needed for disk management.', 'medium', 'completed'),
      ($1, 'Payment System Audit', 2300, 67, 89, '[{"pattern": "Payment failures", "frequency": 67, "description": "Various payment processing errors"}, {"pattern": "Timeout errors", "frequency": 23, "description": "Payment gateway timeouts"}]', '[{"cause": "Payment gateway instability", "confidence": 0.75, "evidence": "Failures clustered during specific time windows"}]', '[{"priority": 1, "action": "Implement payment gateway failover", "expected_impact": "99.9% payment availability"}]', 'Payment system showing intermittent failures primarily during peak hours. Gateway failover recommended for improved reliability.', 'high', 'completed'),
      ($1, 'API Error Analysis', 3400, 156, 234, '[{"pattern": "400 Bad Request", "frequency": 89, "description": "Client input validation errors"}, {"pattern": "500 Internal Server Error", "frequency": 67, "description": "Server-side processing failures"}]', '[{"cause": "Inadequate input validation", "confidence": 0.82, "evidence": "Most 400 errors from malformed JSON"}]', '[{"priority": 2, "action": "Improve API documentation and validation", "expected_impact": "60% reduction in client errors"}]', 'API error analysis shows need for improved client-side validation and documentation. Server errors require code review.', 'medium', 'completed'),
      ($1, 'Microservices Communication Analysis', 8900, 234, 567, '[{"pattern": "Service discovery failures", "frequency": 45, "description": "Intermittent service lookup issues"}, {"pattern": "Circuit breaker trips", "frequency": 23, "description": "Downstream service failures"}]', '[{"cause": "Network partitioning during deployments", "confidence": 0.71, "evidence": "Failures correlate with deployment windows"}]', '[{"priority": 1, "action": "Implement graceful deployment strategy", "expected_impact": "Zero-downtime deployments"}]', 'Microservices communication issues primarily during deployment windows. Recommend blue-green deployment strategy.', 'high', 'completed'),
      ($1, 'Database Operations Review', 4500, 78, 145, '[{"pattern": "Lock contention", "frequency": 34, "description": "Table-level locks causing delays"}, {"pattern": "Replication lag", "frequency": 12, "description": "Read replica falling behind"}]', '[{"cause": "Long-running transactions", "confidence": 0.89, "evidence": "Lock waits correlate with batch processing"}]', '[{"priority": 1, "action": "Optimize batch processing queries", "expected_impact": "80% reduction in lock contention"}]', 'Database experiencing lock contention during batch processing windows. Query optimization and scheduling changes recommended.', 'high', 'completed'),
      ($1, 'User Authentication Analysis', 6700, 34, 89, '[{"pattern": "Session expiration", "frequency": 567, "description": "Users being logged out unexpectedly"}, {"pattern": "Token refresh failures", "frequency": 23, "description": "OAuth token refresh issues"}]', '[{"cause": "Session TTL too short", "confidence": 0.91, "evidence": "Expirations cluster at 30-minute intervals"}]', '[{"priority": 2, "action": "Extend session TTL with sliding expiration", "expected_impact": "Improved user experience"}]', 'User authentication analysis shows session management improvements needed. Token refresh mechanism working correctly.', 'medium', 'completed'),
      ($1, 'CDN and Static Assets Analysis', 2100, 12, 45, '[{"pattern": "Cache invalidation delays", "frequency": 23, "description": "Stale content being served"}, {"pattern": "Origin fetches", "frequency": 456, "description": "High origin server load"}]', '[{"cause": "Suboptimal cache headers", "confidence": 0.86, "evidence": "Low cache hit ratio on versioned assets"}]', '[{"priority": 2, "action": "Implement proper cache-control headers", "expected_impact": "90% cache hit ratio"}]', 'CDN analysis reveals opportunities for improved caching. Static asset delivery can be optimized with better cache headers.', 'low', 'completed'),
      ($1, 'Background Job Processing Review', 7800, 145, 234, '[{"pattern": "Job timeouts", "frequency": 89, "description": "Long-running jobs exceeding limits"}, {"pattern": "Retry storms", "frequency": 34, "description": "Failed jobs creating queue pressure"}]', '[{"cause": "Unbounded job execution", "confidence": 0.84, "evidence": "No timeout configuration for batch jobs"}]', '[{"priority": 1, "action": "Implement job timeouts and circuit breakers", "expected_impact": "Stable job processing"}]', 'Background job system showing signs of instability. Recommend implementing timeouts and improved retry logic.', 'high', 'completed'),
      ($1, 'Email Delivery Analysis', 3200, 56, 123, '[{"pattern": "Bounce rate increase", "frequency": 45, "description": "Higher than normal email bounces"}, {"pattern": "Delivery delays", "frequency": 234, "description": "SMTP queue backlog"}]', '[{"cause": "Email list hygiene issues", "confidence": 0.77, "evidence": "Bounces concentrated on older email addresses"}]', '[{"priority": 2, "action": "Implement email verification flow", "expected_impact": "Improved deliverability"}]', 'Email delivery analysis shows need for list hygiene. SMTP configuration adequate but list quality affecting deliverability.', 'medium', 'completed'),
      ($1, 'Third-party Integration Review', 1800, 89, 67, '[{"pattern": "API rate limits", "frequency": 34, "description": "Hitting vendor rate limits"}, {"pattern": "Response format changes", "frequency": 5, "description": "Unexpected API response structures"}]', '[{"cause": "Inefficient API usage patterns", "confidence": 0.83, "evidence": "Redundant API calls for same data"}]', '[{"priority": 2, "action": "Implement request caching and batching", "expected_impact": "60% reduction in API calls"}]', 'Third-party integration analysis reveals optimization opportunities. Caching and batching can significantly reduce API usage.', 'medium', 'completed'),
      ($1, 'Mobile App Backend Analysis', 4200, 78, 156, '[{"pattern": "Version mismatch errors", "frequency": 45, "description": "Old app versions causing issues"}, {"pattern": "Network timeouts", "frequency": 89, "description": "Mobile network reliability issues"}]', '[{"cause": "Lack of API versioning", "confidence": 0.79, "evidence": "Errors correlate with old app version user agents"}]', '[{"priority": 1, "action": "Implement proper API versioning", "expected_impact": "Backward compatibility"}]', 'Mobile backend analysis shows need for API versioning strategy. Network timeout handling also needs improvement.', 'high', 'completed'),
      ($1, 'Compliance and Audit Log Review', 9500, 0, 34, '[{"pattern": "Access pattern anomalies", "frequency": 12, "description": "Unusual data access patterns"}, {"pattern": "Permission escalations", "frequency": 3, "description": "Role changes requiring review"}]', '[{"cause": "Normal administrative activity", "confidence": 0.95, "evidence": "All escalations properly authorized"}]', '[{"priority": 3, "action": "Continue monitoring, no immediate action", "expected_impact": "Maintained compliance"}]', 'Compliance audit shows healthy state. All flagged activities were properly authorized. Continuing standard monitoring.', 'low', 'completed'),
      ($1, 'Search Service Analysis', 2800, 34, 89, '[{"pattern": "Slow queries", "frequency": 123, "description": "Complex search queries timing out"}, {"pattern": "Index health", "frequency": 5, "description": "Elasticsearch index issues"}]', '[{"cause": "Unoptimized search queries", "confidence": 0.87, "evidence": "Slow queries use expensive wildcards"}]', '[{"priority": 1, "action": "Optimize search query patterns", "expected_impact": "70% faster search"}]', 'Search service analysis identifies query optimization as primary improvement area. Index health is good.', 'high', 'completed')
    `, [userId]);

    console.log('Seeding dashboard configs (15+ items)...');
    await client.query(`
      INSERT INTO dashboard_configs (user_id, dashboard_id, ai_generated, prompt, layout_config, widgets, color_scheme, data_sources, ai_suggestions) VALUES
      ($1, 1, true, 'Create executive dashboard with key business metrics', '{"columns": 12, "rows": 8}', '[{"id": "w1", "type": "kpi", "title": "Total Revenue", "position": {"x": 0, "y": 0, "width": 3, "height": 2}}, {"id": "w2", "type": "chart", "title": "Revenue Trend", "position": {"x": 3, "y": 0, "width": 6, "height": 4}}]', 'blue', '[1, 2, 3]', '["Add comparison to previous period", "Include drill-down capability"]'),
      ($1, 2, true, 'Sales performance tracking dashboard', '{"columns": 12, "rows": 10}', '[{"id": "w1", "type": "gauge", "title": "Quota Attainment", "position": {"x": 0, "y": 0, "width": 4, "height": 3}}, {"id": "w2", "type": "table", "title": "Top Deals", "position": {"x": 4, "y": 0, "width": 8, "height": 5}}]', 'green', '[1, 4]', '["Add territory filter", "Include forecast vs actual"]'),
      ($1, 3, true, 'Marketing campaign analytics', '{"columns": 12, "rows": 8}', '[{"id": "w1", "type": "chart", "title": "Campaign ROI", "position": {"x": 0, "y": 0, "width": 6, "height": 4}}, {"id": "w2", "type": "pie", "title": "Channel Mix", "position": {"x": 6, "y": 0, "width": 6, "height": 4}}]', 'purple', '[2, 5]', '["Add A/B test results", "Include attribution modeling"]'),
      ($1, 4, true, 'Customer analytics and segmentation', '{"columns": 12, "rows": 10}', '[{"id": "w1", "type": "chart", "title": "Customer Lifetime Value", "position": {"x": 0, "y": 0, "width": 8, "height": 4}}, {"id": "w2", "type": "kpi", "title": "Active Customers", "position": {"x": 8, "y": 0, "width": 4, "height": 2}}]', 'orange', '[3, 6]', '["Add cohort analysis", "Include churn prediction"]'),
      ($1, 5, true, 'Financial performance overview', '{"columns": 12, "rows": 8}', '[{"id": "w1", "type": "chart", "title": "P&L Summary", "position": {"x": 0, "y": 0, "width": 12, "height": 4}}, {"id": "w2", "type": "table", "title": "Cost Breakdown", "position": {"x": 0, "y": 4, "width": 6, "height": 4}}]', 'teal', '[5, 7]', '["Add budget variance", "Include cash flow forecast"]'),
      ($1, 6, true, 'Product usage analytics', '{"columns": 12, "rows": 10}', '[{"id": "w1", "type": "chart", "title": "Feature Adoption", "position": {"x": 0, "y": 0, "width": 8, "height": 5}}, {"id": "w2", "type": "heatmap", "title": "Usage Patterns", "position": {"x": 8, "y": 0, "width": 4, "height": 5}}]', 'indigo', '[6, 11]', '["Add user journey flow", "Include feature correlation"]'),
      ($1, 7, true, 'Operations efficiency dashboard', '{"columns": 12, "rows": 8}', '[{"id": "w1", "type": "gauge", "title": "Process Efficiency", "position": {"x": 0, "y": 0, "width": 4, "height": 3}}, {"id": "w2", "type": "chart", "title": "Throughput Trends", "position": {"x": 4, "y": 0, "width": 8, "height": 4}}]', 'cyan', '[7, 10]', '["Add bottleneck analysis", "Include SLA tracking"]'),
      ($1, 8, true, 'HR workforce analytics', '{"columns": 12, "rows": 10}', '[{"id": "w1", "type": "kpi", "title": "Headcount", "position": {"x": 0, "y": 0, "width": 3, "height": 2}}, {"id": "w2", "type": "chart", "title": "Attrition Trends", "position": {"x": 3, "y": 0, "width": 6, "height": 4}}]', 'pink', '[7]', '["Add diversity metrics", "Include engagement scores"]'),
      ($1, 9, true, 'Customer support metrics', '{"columns": 12, "rows": 8}', '[{"id": "w1", "type": "gauge", "title": "CSAT Score", "position": {"x": 0, "y": 0, "width": 4, "height": 3}}, {"id": "w2", "type": "chart", "title": "Ticket Volume", "position": {"x": 4, "y": 0, "width": 8, "height": 4}}]', 'red', '[8]', '["Add first response time", "Include agent leaderboard"]'),
      ($1, 10, true, 'Inventory management dashboard', '{"columns": 12, "rows": 8}', '[{"id": "w1", "type": "table", "title": "Low Stock Alerts", "position": {"x": 0, "y": 0, "width": 6, "height": 4}}, {"id": "w2", "type": "chart", "title": "Turnover Rate", "position": {"x": 6, "y": 0, "width": 6, "height": 4}}]', 'amber', '[6]', '["Add reorder predictions", "Include supplier performance"]'),
      ($1, 11, true, 'Website performance analytics', '{"columns": 12, "rows": 10}', '[{"id": "w1", "type": "chart", "title": "Traffic Trends", "position": {"x": 0, "y": 0, "width": 8, "height": 4}}, {"id": "w2", "type": "funnel", "title": "Conversion Funnel", "position": {"x": 8, "y": 0, "width": 4, "height": 6}}]', 'lime', '[4, 11]', '["Add page load times", "Include A/B test results"]'),
      ($1, 12, true, 'Social media engagement dashboard', '{"columns": 12, "rows": 8}', '[{"id": "w1", "type": "kpi", "title": "Followers", "position": {"x": 0, "y": 0, "width": 3, "height": 2}}, {"id": "w2", "type": "chart", "title": "Engagement Rate", "position": {"x": 3, "y": 0, "width": 9, "height": 4}}]', 'violet', '[9]', '["Add sentiment analysis", "Include competitor comparison"]'),
      ($1, 13, true, 'Revenue forecasting dashboard', '{"columns": 12, "rows": 10}', '[{"id": "w1", "type": "chart", "title": "Forecast vs Actual", "position": {"x": 0, "y": 0, "width": 12, "height": 5}}, {"id": "w2", "type": "table", "title": "Assumptions", "position": {"x": 0, "y": 5, "width": 6, "height": 4}}]', 'emerald', '[1, 5]', '["Add scenario modeling", "Include confidence intervals"]'),
      ($1, 14, true, 'Cost optimization dashboard', '{"columns": 12, "rows": 8}', '[{"id": "w1", "type": "chart", "title": "Cost Trends", "position": {"x": 0, "y": 0, "width": 8, "height": 4}}, {"id": "w2", "type": "pie", "title": "Cost Distribution", "position": {"x": 8, "y": 0, "width": 4, "height": 4}}]', 'rose', '[5, 7]', '["Add optimization recommendations", "Include benchmark comparison"]'),
      ($1, 15, true, 'Real-time monitoring dashboard', '{"columns": 12, "rows": 10}', '[{"id": "w1", "type": "chart", "title": "Live Metrics", "position": {"x": 0, "y": 0, "width": 12, "height": 4}}, {"id": "w2", "type": "alerts", "title": "Active Alerts", "position": {"x": 0, "y": 4, "width": 6, "height": 4}}]', 'sky', '[11, 16, 17]', '["Add system health indicators", "Include auto-refresh"]'),
      ($1, 16, true, 'E-commerce performance dashboard', '{"columns": 12, "rows": 10}', '[{"id": "w1", "type": "kpi", "title": "Orders Today", "position": {"x": 0, "y": 0, "width": 3, "height": 2}}, {"id": "w2", "type": "chart", "title": "Sales by Category", "position": {"x": 3, "y": 0, "width": 9, "height": 4}}]', 'fuchsia', '[14]', '["Add cart abandonment", "Include product recommendations"]')
    `, [userId]);

    console.log('Seeding data quality scores (15+ items)...');
    await client.query(`
      INSERT INTO data_quality_scores (user_id, data_source_id, overall_score, completeness_score, accuracy_score, consistency_score, timeliness_score, uniqueness_score, validity_score, issues_found, recommendations, ai_analysis, records_analyzed, columns_analyzed, status) VALUES
      ($1, 1, 87.5, 92.0, 85.0, 88.0, 90.0, 95.0, 82.0, '[{"column": "email", "issue_type": "format_invalid", "severity": "medium", "affected_rows_percentage": 2.3}]', '[{"priority": 1, "action": "Implement email validation", "expected_improvement": 5}]', 'Overall good data quality with minor email format issues. Recommend implementing stricter input validation.', 125000, 15, 'completed'),
      ($1, 2, 78.3, 85.0, 72.0, 80.0, 75.0, 88.0, 79.0, '[{"column": "phone", "issue_type": "missing_values", "severity": "high", "affected_rows_percentage": 15.2}, {"column": "address", "issue_type": "inconsistent_format", "severity": "medium", "affected_rows_percentage": 8.7}]', '[{"priority": 1, "action": "Data enrichment for phone numbers", "expected_improvement": 12}]', 'Marketing data shows completeness issues particularly in contact information. Consider data enrichment services.', 89000, 22, 'completed'),
      ($1, 3, 92.1, 95.0, 90.0, 94.0, 92.0, 98.0, 85.0, '[{"column": "industry", "issue_type": "inconsistent_values", "severity": "low", "affected_rows_percentage": 3.1}]', '[{"priority": 2, "action": "Standardize industry classification", "expected_improvement": 3}]', 'CRM data is well-maintained with excellent uniqueness. Minor standardization needed for industry field.', 45000, 28, 'completed'),
      ($1, 4, 94.8, 98.0, 93.0, 96.0, 95.0, 99.0, 90.0, '[{"column": "session_duration", "issue_type": "outliers", "severity": "low", "affected_rows_percentage": 0.5}]', '[{"priority": 3, "action": "Review session tracking for outliers", "expected_improvement": 1}]', 'Website analytics data is excellent quality. Minor outliers in session duration likely from bot traffic.', 5600000, 12, 'completed'),
      ($1, 5, 96.2, 99.0, 95.0, 97.0, 98.0, 100.0, 92.0, '[]', '[{"priority": 3, "action": "Continue current data governance practices", "expected_improvement": 0}]', 'Financial data meets highest quality standards. Current data governance practices are effective.', 780000, 35, 'completed'),
      ($1, 6, 82.4, 88.0, 78.0, 85.0, 80.0, 92.0, 76.0, '[{"column": "quantity", "issue_type": "negative_values", "severity": "high", "affected_rows_percentage": 1.2}, {"column": "last_updated", "issue_type": "stale_data", "severity": "medium", "affected_rows_percentage": 12.5}]', '[{"priority": 1, "action": "Fix inventory sync process", "expected_improvement": 10}]', 'Inventory data has timeliness issues. Sync process needs optimization to ensure real-time accuracy.', 125000, 18, 'completed'),
      ($1, 7, 89.7, 93.0, 88.0, 91.0, 87.0, 96.0, 86.0, '[{"column": "salary", "issue_type": "outliers", "severity": "medium", "affected_rows_percentage": 2.1}]', '[{"priority": 2, "action": "Review salary data entry process", "expected_improvement": 4}]', 'HR data quality is good overall. Some salary outliers may indicate data entry errors.', 12000, 42, 'completed'),
      ($1, 8, 85.6, 90.0, 82.0, 87.0, 85.0, 94.0, 80.0, '[{"column": "resolution_time", "issue_type": "null_values", "severity": "medium", "affected_rows_percentage": 5.8}, {"column": "category", "issue_type": "inconsistent_values", "severity": "low", "affected_rows_percentage": 4.2}]', '[{"priority": 1, "action": "Enforce category standardization", "expected_improvement": 6}]', 'Support ticket data has some categorization inconsistencies affecting reporting accuracy.', 340000, 15, 'completed'),
      ($1, 9, 76.9, 82.0, 70.0, 78.0, 75.0, 88.0, 75.0, '[{"column": "engagement_rate", "issue_type": "calculation_errors", "severity": "high", "affected_rows_percentage": 8.3}, {"column": "platform", "issue_type": "missing_values", "severity": "medium", "affected_rows_percentage": 6.1}]', '[{"priority": 1, "action": "Review engagement calculation logic", "expected_improvement": 12}]', 'Social media data has calculation inconsistencies. Engagement rate formula needs standardization across platforms.', 2100000, 20, 'completed'),
      ($1, 10, 91.3, 94.0, 89.0, 93.0, 90.0, 97.0, 88.0, '[{"column": "open_rate", "issue_type": "outliers", "severity": "low", "affected_rows_percentage": 1.5}]', '[{"priority": 3, "action": "Monitor for bot opens", "expected_improvement": 2}]', 'Email marketing data is high quality. Minor outliers in open rates likely from email preview bots.', 560000, 16, 'completed'),
      ($1, 11, 93.5, 96.0, 91.0, 95.0, 93.0, 98.0, 89.0, '[{"column": "event_properties", "issue_type": "schema_drift", "severity": "medium", "affected_rows_percentage": 3.2}]', '[{"priority": 2, "action": "Implement schema validation", "expected_improvement": 4}]', 'Product analytics data is excellent. Some event property schema drift needs attention.', 8900000, 25, 'completed'),
      ($1, 12, 97.8, 99.0, 97.0, 98.0, 98.0, 100.0, 95.0, '[]', '[{"priority": 3, "action": "Maintain current payment validation rules", "expected_improvement": 0}]', 'Payment data meets the highest quality standards with strong validation rules in place.', 450000, 30, 'completed'),
      ($1, 13, 88.2, 91.0, 85.0, 89.0, 88.0, 95.0, 84.0, '[{"column": "click_cost", "issue_type": "currency_mismatch", "severity": "medium", "affected_rows_percentage": 4.5}]', '[{"priority": 1, "action": "Standardize currency handling", "expected_improvement": 6}]', 'Advertising data shows currency handling issues across multi-region campaigns.', 1200000, 28, 'completed'),
      ($1, 14, 90.5, 93.0, 88.0, 92.0, 90.0, 96.0, 86.0, '[{"column": "shipping_address", "issue_type": "incomplete", "severity": "medium", "affected_rows_percentage": 3.8}]', '[{"priority": 2, "action": "Enhance address validation at checkout", "expected_improvement": 5}]', 'E-commerce data quality is good. Address completeness can be improved at checkout.', 890000, 32, 'completed'),
      ($1, 15, 95.4, 97.0, 94.0, 96.0, 95.0, 99.0, 92.0, '[{"column": "query_results", "issue_type": "large_objects", "severity": "low", "affected_rows_percentage": 0.8}]', '[{"priority": 3, "action": "Consider result size limits", "expected_improvement": 1}]', 'Data warehouse maintains excellent quality with comprehensive ETL validation.', 15000000, 50, 'completed'),
      ($1, 16, 79.1, 85.0, 74.0, 80.0, 78.0, 90.0, 72.0, '[{"column": "sensor_reading", "issue_type": "outliers", "severity": "high", "affected_rows_percentage": 5.2}, {"column": "device_id", "issue_type": "missing_values", "severity": "medium", "affected_rows_percentage": 2.8}]', '[{"priority": 1, "action": "Implement sensor data validation", "expected_improvement": 10}]', 'IoT sensor data has quality issues requiring improved edge validation before ingestion.', 45000000, 8, 'completed')
    `, [userId]);

    console.log('Seeding insight narratives (15+ items)...');
    await client.query(`
      INSERT INTO insight_narratives (user_id, insight_id, narrative_type, title, executive_summary, detailed_analysis, key_findings, action_items, visualizations, audience, tone, word_count) VALUES
      ($1, 1, 'executive_summary', 'APAC Market Expansion Opportunity', 'Analysis reveals a significant 23% revenue growth opportunity through APAC market expansion. Current customer data patterns strongly indicate untapped demand in key Asian markets.', 'Our comprehensive analysis of existing customer demographics, purchase patterns, and market research data points to substantial growth potential in the Asia-Pacific region. The data shows that our current APAC customers demonstrate 40% higher lifetime value compared to other regions, yet represent only 8% of our customer base. Key markets including Singapore, Japan, and Australia show strong product-market fit indicators with minimal localization requirements.', '["APAC customers show 40% higher LTV", "Only 8% market penetration vs 35% potential", "Singapore and Japan identified as priority markets", "Localization costs estimated at $150K"]', '[{"action": "Commission detailed APAC market study", "owner": "Strategy Team", "deadline": "Q2 2024", "priority": 1}, {"action": "Identify local partnership opportunities", "owner": "BD Team", "deadline": "Q3 2024", "priority": 2}]', '["geographic_heatmap", "ltv_comparison_chart", "market_size_bubble"]', 'executive', 'formal', 245),
      ($1, 2, 'detailed_report', 'Q4 Holiday Marketing Optimization', 'Strong correlation identified between Q4 sales performance and holiday marketing investment. Historical data supports a 15% budget increase recommendation for upcoming holiday season.', 'Five years of sales and marketing data analysis reveals consistent patterns in Q4 performance. Years with increased holiday marketing spend (15%+ above baseline) showed average revenue increases of 28% compared to baseline years. The correlation coefficient of 0.87 between holiday ad spend and revenue indicates a robust relationship. Customer acquisition costs during Q4 are 22% lower due to higher purchase intent, making this period optimal for customer acquisition investments.', '["0.87 correlation between Q4 spend and revenue", "28% average revenue lift with 15%+ spend increase", "22% lower CAC during holiday period", "Email and social channels show highest Q4 ROI"]', '[{"action": "Increase Q4 marketing budget by 15%", "owner": "Marketing Director", "deadline": "October 1", "priority": 1}, {"action": "Prepare holiday-specific creative assets", "owner": "Creative Team", "deadline": "September 15", "priority": 1}]', '["year_over_year_trend", "spend_vs_revenue_scatter", "channel_roi_comparison"]', 'general', 'analytical', 312),
      ($1, 3, 'presentation', 'Enterprise Pipeline Risk Alert', 'Three enterprise deals totaling $2.4M have stalled in negotiation stage for 45+ days. Immediate intervention required to prevent Q2 revenue shortfall.', 'Pipeline analysis has identified critical risk in our enterprise segment. Three significant opportunities representing $2.4M in potential revenue have shown no movement in 45+ days. Historical data shows that deals stalled beyond 30 days have only 23% close probability without intervention. The deals are with TechCorp ($1.2M), GlobalFinance ($800K), and MegaRetail ($400K). Common factors include pending legal review and procurement delays.', '["$2.4M at risk across 3 deals", "45+ days without stage progression", "23% historical close rate for stalled deals", "Legal and procurement identified as blockers"]', '[{"action": "Schedule executive sponsor calls", "owner": "VP Sales", "deadline": "This week", "priority": 1}, {"action": "Prepare custom ROI analysis for each account", "owner": "Sales Engineering", "deadline": "3 days", "priority": 1}]', '["pipeline_funnel", "deal_aging_chart", "risk_matrix"]', 'executive', 'urgent', 198),
      ($1, 4, 'email', 'LinkedIn vs Facebook Marketing ROI Analysis', 'LinkedIn campaigns are outperforming Facebook by 3.2x in ROI. Recommending 20% budget reallocation to maximize marketing efficiency.', 'Comparative analysis of our B2B marketing channels reveals significant performance disparity. LinkedIn campaigns generated $3.20 in revenue for every $1 spent, compared to $1.00 for Facebook. The lead quality metrics support this finding: LinkedIn leads convert at 12% versus 4% for Facebook leads. Given our B2B focus, this performance gap is expected but the magnitude suggests suboptimal budget allocation. A 20% reallocation from Facebook to LinkedIn could generate an additional $180K in annual revenue.', '["LinkedIn ROI: 3.2x vs Facebook: 1.0x", "12% LinkedIn conversion rate vs 4% Facebook", "B2B audience 4x more engaged on LinkedIn", "Potential $180K annual revenue gain"]', '[{"action": "Reallocate 20% of Facebook budget to LinkedIn", "owner": "Digital Marketing Manager", "deadline": "Next budget cycle", "priority": 1}, {"action": "Develop LinkedIn-specific content strategy", "owner": "Content Team", "deadline": "30 days", "priority": 2}]', '["channel_comparison_bar", "conversion_funnel_split", "roi_trend_line"]', 'general', 'conversational', 223),
      ($1, 5, 'executive_summary', 'High-Value Customer Churn Risk Alert', '127 high-value customers identified with 85%+ churn probability based on engagement and support patterns. Proactive retention campaign recommended.', 'Machine learning analysis of customer behavior patterns has identified 127 accounts representing $4.2M in annual revenue that exhibit high churn risk indicators. Key signals include: 60%+ decrease in product usage over 90 days, increased support ticket frequency, and declining NPS scores. These customers have an average tenure of 2.3 years and LTV of $33K. Historical data shows that targeted retention campaigns reduce churn probability by 45% for similar risk profiles.', '["127 customers at high churn risk", "$4.2M annual revenue at stake", "60%+ usage decline as primary indicator", "45% churn reduction possible with intervention"]', '[{"action": "Launch targeted retention campaign", "owner": "Customer Success", "deadline": "Immediate", "priority": 1}, {"action": "Assign dedicated CSM to top 20 accounts", "owner": "CS Director", "deadline": "This week", "priority": 1}]', '["churn_risk_distribution", "engagement_decline_trend", "revenue_at_risk_pie"]', 'executive', 'urgent', 267),
      ($1, 6, 'detailed_report', 'SMB Tech Segment Opportunity Discovery', 'New high-value customer segment discovered: SMB tech companies demonstrate 40% higher LTV than average while being significantly underserved in our current strategy.', 'Cluster analysis of our customer base has revealed an underserved segment with exceptional value potential. SMB technology companies (50-200 employees) show: 40% higher lifetime value ($52K vs $37K average), 25% lower support costs, and 65% higher referral rates. Despite these metrics, this segment represents only 12% of our customer base while comprising 28% of our addressable market. Competitors have not specifically targeted this segment, presenting first-mover advantage.', '["40% higher LTV than average customer", "25% lower support costs", "65% higher referral rates", "Only 12% current penetration vs 28% market opportunity"]', '[{"action": "Develop SMB tech-specific marketing campaign", "owner": "Marketing", "deadline": "Q2", "priority": 1}, {"action": "Create industry-specific case studies", "owner": "Content Team", "deadline": "45 days", "priority": 2}]', '["segment_comparison_radar", "ltv_distribution", "market_opportunity_waterfall"]', 'general', 'analytical', 289),
      ($1, 7, 'presentation', 'Cloud Infrastructure Cost Anomaly', 'Cloud infrastructure costs increased 45% month-over-month without corresponding usage increase. Investigation identifies optimization opportunities worth $120K annually.', 'Cost analysis detected a significant anomaly in our cloud infrastructure spending. February costs were $285K compared to January $197K - a 45% increase. Usage metrics (compute hours, storage, network) showed only 8% growth. Investigation revealed: unused reserved instances ($45K/year waste), oversized development environments ($35K/year), and inefficient data transfer patterns ($40K/year). Total optimization opportunity: $120K annually.', '["45% cost increase vs 8% usage growth", "$120K annual optimization opportunity", "Unused reserved instances primary waste source", "Development environment rightsizing needed"]', '[{"action": "Terminate unused reserved instances", "owner": "DevOps", "deadline": "Immediate", "priority": 1}, {"action": "Implement auto-scaling for dev environments", "owner": "Platform Team", "deadline": "30 days", "priority": 1}]', '["cost_vs_usage_trend", "waste_breakdown_pie", "optimization_impact_bar"]', 'technical', 'formal', 234),
      ($1, 8, 'email', 'Feature Adoption and Retention Correlation', 'Users engaging with reporting features in first week show 67% higher retention. Recommend onboarding flow optimization to drive early feature adoption.', 'Behavioral cohort analysis reveals strong correlation between early feature adoption and long-term retention. Users who engage with reporting features within their first 7 days retain at 78% (12-month) versus 47% for users who dont. The reporting feature serves as a key aha moment that demonstrates product value. Current onboarding only mentions reporting in step 8 of 12 - by which point 40% of users have dropped off. Moving reporting introduction to step 3 could significantly impact retention.', '["67% higher retention with early reporting use", "78% vs 47% 12-month retention rates", "40% onboarding dropout before reporting introduction", "Reporting feature is key aha moment"]', '[{"action": "Redesign onboarding to feature reporting earlier", "owner": "Product Team", "deadline": "Sprint 24", "priority": 1}, {"action": "Create reporting quick-start guide", "owner": "Documentation Team", "deadline": "2 weeks", "priority": 2}]', '["retention_by_feature_adoption", "onboarding_funnel", "cohort_comparison"]', 'general', 'conversational', 245),
      ($1, 9, 'executive_summary', 'Order Fulfillment Bottleneck Analysis', 'Quality check stage causing 2.3 day delay in order fulfillment. Automation opportunity could reduce delay by 80% and save $340K annually in labor costs.', 'Process mining analysis of our fulfillment workflow identified the quality check stage as a significant bottleneck. Average dwell time at this stage is 2.3 days - 4x longer than any other stage. Root causes include: manual inspection requirements, inspector availability constraints, and batch processing patterns. Similar operations have achieved 80% time reduction through automated quality inspection using computer vision, with ROI positive within 8 months.', '["2.3 day average delay at QC stage", "4x longer than any other fulfillment stage", "80% reduction achievable with automation", "$340K annual labor cost savings potential"]', '[{"action": "Evaluate computer vision QC solutions", "owner": "Operations Director", "deadline": "Q2", "priority": 1}, {"action": "Pilot automated inspection on high-volume SKUs", "owner": "Fulfillment Manager", "deadline": "Q3", "priority": 1}]', '["process_flow_bottleneck", "stage_duration_comparison", "automation_roi_projection"]', 'executive', 'formal', 256),
      ($1, 10, 'detailed_report', 'Engineering Department Attrition Risk', 'Engineering department showing early attrition indicators: decreased engagement scores, increased PTO usage, and reduced participation in optional activities.', 'HR analytics has identified concerning patterns in the Engineering department that historically precede attrition. Key indicators: Engagement survey scores dropped from 4.2 to 3.4 over two quarters, PTO usage increased 35% (often a pre-resignation pattern), participation in optional company events decreased 50%, and internal job posting views from engineering increased 3x. Of the 45 engineers, 12 (27%) show 3+ risk indicators. With average engineering replacement cost of $180K, potential exposure is $2.16M.', '["Engagement dropped from 4.2 to 3.4", "35% increase in PTO usage", "27% of engineers show high-risk indicators", "$2.16M potential replacement cost exposure"]', '[{"action": "Conduct confidential stay interviews", "owner": "Engineering Director", "deadline": "2 weeks", "priority": 1}, {"action": "Review compensation against market rates", "owner": "HR", "deadline": "30 days", "priority": 1}]', '["engagement_trend", "risk_indicator_heatmap", "attrition_probability_dist"]', 'executive', 'analytical', 278),
      ($1, 11, 'presentation', 'API Integration Support Analysis', 'API integration issues account for 34% of support tickets. Improved documentation and SDK updates could reduce ticket volume by 60% and save $180K in support costs.', 'Support ticket categorization analysis reveals API integration as the dominant support driver. Of 12,000 monthly tickets, 4,080 (34%) relate to API integration challenges. Further breakdown: authentication issues (35%), rate limiting confusion (28%), response parsing errors (22%), and webhook configuration (15%). Analysis of resolved tickets shows 70% could have been self-served with better documentation. Industry benchmark for API documentation shows we score 62/100 versus best-in-class 85/100.', '["34% of tickets are API-related", "70% could be self-served with better docs", "62/100 documentation score vs 85 benchmark", "$180K annual support cost savings potential"]', '[{"action": "Overhaul API documentation with examples", "owner": "Developer Relations", "deadline": "Q2", "priority": 1}, {"action": "Create interactive API explorer", "owner": "Platform Team", "deadline": "Q3", "priority": 2}]', '["ticket_category_breakdown", "documentation_score_comparison", "self_service_opportunity"]', 'technical', 'formal', 234),
      ($1, 12, 'email', 'Inventory Optimization Opportunity', 'SKU ABC-123 consistently overstocked by 25%. Reducing order quantity would save $45K annually while maintaining 99% availability.', 'Inventory analysis has identified significant optimization opportunity for SKU ABC-123. Current reorder point of 500 units results in average inventory of 750 units, while demand analysis shows 480 units average monthly sales with standard deviation of 45. This means we maintain 56% more inventory than needed for 99% service level. Recommended reorder point: 540 units (maintaining safety stock). Similar optimization across top 50 SKUs could yield $890K in working capital release.', '["56% excess inventory for SKU ABC-123", "$45K annual carrying cost savings", "99% service level maintained", "$890K total working capital opportunity across SKUs"]', '[{"action": "Adjust reorder point for ABC-123", "owner": "Inventory Manager", "deadline": "Immediate", "priority": 1}, {"action": "Run optimization analysis on top 50 SKUs", "owner": "Supply Chain Analytics", "deadline": "30 days", "priority": 2}]', '["inventory_vs_demand_chart", "service_level_curve", "working_capital_impact"]', 'general', 'conversational', 212),
      ($1, 13, 'executive_summary', 'Mobile Cart Abandonment Optimization', 'Mobile cart abandonment at 68% - A/B test results show simplified checkout could improve conversion by 23% representing $1.2M additional annual revenue.', 'E-commerce analysis reveals critical mobile conversion opportunity. Mobile traffic represents 62% of visitors but only 38% of transactions, with cart abandonment rate of 68% versus 42% on desktop. A/B testing of simplified mobile checkout (3 steps vs current 6) showed: 23% improvement in conversion rate, 15% reduction in checkout time, and 8% increase in average order value. At current traffic levels, full rollout projects to $1.2M additional annual revenue.', '["68% mobile cart abandonment vs 42% desktop", "23% conversion improvement in A/B test", "62% traffic but 38% revenue from mobile", "$1.2M annual revenue opportunity"]', '[{"action": "Roll out simplified mobile checkout", "owner": "E-commerce Team", "deadline": "Sprint 26", "priority": 1}, {"action": "Implement mobile payment options (Apple Pay, Google Pay)", "owner": "Payments Team", "deadline": "Q2", "priority": 1}]', '["device_conversion_comparison", "checkout_funnel_split", "ab_test_results"]', 'executive', 'formal', 234),
      ($1, 14, 'detailed_report', 'Cross-sell Opportunity Analysis', 'Customers purchasing Product A show 78% probability of buying Product B within 30 days. Bundle offering could increase AOV by 35% and revenue by $2.4M annually.', 'Market basket analysis using association rules has identified a powerful cross-sell opportunity. Customers who purchase Product A demonstrate 78% likelihood of purchasing Product B within 30 days, with average time to second purchase of 18 days. Current attach rate is only 23%, indicating significant unrealized potential. Testing a bundle discount of 15% on the combination showed willingness to purchase together increased to 67%. At current Product A volume, optimized cross-sell could generate $2.4M additional annual revenue.', '["78% purchase probability for A→B", "Current 23% attach rate vs 67% with bundle", "18-day average time to second purchase", "$2.4M annual revenue opportunity"]', '[{"action": "Launch Product A+B bundle offering", "owner": "Product Marketing", "deadline": "Next month", "priority": 1}, {"action": "Implement post-purchase recommendation email", "owner": "Email Marketing", "deadline": "2 weeks", "priority": 1}]', '["association_rules_network", "purchase_timing_histogram", "bundle_test_results"]', 'general', 'analytical', 267),
      ($1, 15, 'presentation', 'Forecast Model Performance Review', 'Q1 forecast achieved 3.2% accuracy - highest in company history. Model confidence increasing, recommend extending forecast horizon from 3 to 6 months.', 'Quarterly forecast accuracy review shows exceptional model performance. Q1 actual revenue of $12.4M versus forecast of $12.0M represents 3.2% variance - our most accurate quarter to date. Model improvements contributing to accuracy: incorporation of leading indicators (web traffic, pipeline stage progression), ensemble approach combining multiple models, and weekly recalibration. Given sustained accuracy improvement over 4 quarters (from 12% to 3.2% variance), extending forecast horizon to 6 months is now viable with expected accuracy of 8% or better.', '["3.2% forecast variance - best ever", "Improved from 12% to 3.2% over 4 quarters", "Ensemble model approach driving accuracy", "6-month horizon now viable at 8% accuracy"]', '[{"action": "Extend forecast horizon to 6 months", "owner": "FP&A", "deadline": "Next planning cycle", "priority": 2}, {"action": "Document model improvements for audit", "owner": "Data Science", "deadline": "30 days", "priority": 3}]', '["forecast_vs_actual_trend", "accuracy_improvement_timeline", "confidence_interval_narrowing"]', 'executive', 'analytical', 245),
      ($1, 16, 'email', 'Marketing Budget Efficiency Analysis', 'Budget efficiency could improve 18% by shifting from display ads to content marketing. Recommended reallocation would generate 2,400 additional qualified leads annually.', 'Marketing channel efficiency analysis reveals significant optimization opportunity. Display advertising currently receives 25% of budget but generates only 8% of qualified leads at $145 cost per lead. Content marketing receives 15% of budget but generates 32% of qualified leads at $42 CPL. Shifting 10% of display budget to content marketing would: reduce overall CPL by 18%, generate 2,400 additional qualified leads annually, and improve lead quality scores by 15%. Content leads also show 2.1x higher conversion to opportunity.', '["Display: 25% budget, 8% leads, $145 CPL", "Content: 15% budget, 32% leads, $42 CPL", "18% overall efficiency improvement possible", "2,400 additional qualified leads annually"]', '[{"action": "Reallocate 10% from display to content", "owner": "Marketing Director", "deadline": "Q2 budget review", "priority": 1}, {"action": "Scale content production capacity", "owner": "Content Team", "deadline": "60 days", "priority": 2}]', '["channel_efficiency_comparison", "cpl_by_channel", "lead_quality_distribution"]', 'general', 'conversational', 234)
    `, [userId]);

    // ==================== UPLOADED DATA TABLES FOR DATA EXPLORER ====================
    console.log('Creating uploaded data tables for Data Explorer...');

    // Table 1: Sales Transactions (30 rows)
    await client.query(`
      CREATE TABLE IF NOT EXISTS upload_sales_transactions (
        id SERIAL PRIMARY KEY,
        date TEXT, customer TEXT, product TEXT, category TEXT,
        quantity INTEGER, unit_price NUMERIC(10,2), total NUMERIC(10,2),
        region TEXT, sales_rep TEXT, payment_method TEXT
      )
    `);
    await client.query(`TRUNCATE upload_sales_transactions RESTART IDENTITY`);
    await client.query(`
      INSERT INTO upload_sales_transactions (date, customer, product, category, quantity, unit_price, total, region, sales_rep, payment_method) VALUES
      ('2024-01-05', 'Acme Corp', 'Enterprise License', 'Software', 5, 2500.00, 12500.00, 'North America', 'Sarah Chen', 'Wire Transfer'),
      ('2024-01-08', 'TechStart Inc', 'Pro Plan Annual', 'Subscription', 10, 499.00, 4990.00, 'North America', 'Mike Johnson', 'Credit Card'),
      ('2024-01-12', 'Global Finance Ltd', 'Data Analytics Suite', 'Software', 3, 8500.00, 25500.00, 'Europe', 'Emma Wilson', 'Wire Transfer'),
      ('2024-01-15', 'RetailMax', 'Basic Plan Monthly', 'Subscription', 25, 49.00, 1225.00, 'North America', 'Sarah Chen', 'Credit Card'),
      ('2024-01-18', 'MediHealth', 'Enterprise License', 'Software', 2, 2500.00, 5000.00, 'North America', 'David Park', 'Wire Transfer'),
      ('2024-01-22', 'AutoDrive Systems', 'Custom Integration', 'Services', 1, 15000.00, 15000.00, 'Europe', 'Emma Wilson', 'Wire Transfer'),
      ('2024-01-25', 'EduLearn Platform', 'Pro Plan Annual', 'Subscription', 8, 499.00, 3992.00, 'Asia Pacific', 'Yuki Tanaka', 'Credit Card'),
      ('2024-02-01', 'CloudNine Solutions', 'Data Analytics Suite', 'Software', 1, 8500.00, 8500.00, 'North America', 'Mike Johnson', 'Wire Transfer'),
      ('2024-02-05', 'FreshFood Co', 'Basic Plan Monthly', 'Subscription', 15, 49.00, 735.00, 'North America', 'Sarah Chen', 'Credit Card'),
      ('2024-02-08', 'BuildRight Construction', 'Enterprise License', 'Software', 4, 2500.00, 10000.00, 'North America', 'David Park', 'Wire Transfer'),
      ('2024-02-12', 'Nordic Shipping', 'Custom Integration', 'Services', 1, 22000.00, 22000.00, 'Europe', 'Emma Wilson', 'Wire Transfer'),
      ('2024-02-15', 'Sunrise Hotels', 'Pro Plan Annual', 'Subscription', 12, 499.00, 5988.00, 'Asia Pacific', 'Yuki Tanaka', 'Credit Card'),
      ('2024-02-18', 'Peak Athletics', 'Basic Plan Monthly', 'Subscription', 30, 49.00, 1470.00, 'North America', 'Mike Johnson', 'Credit Card'),
      ('2024-02-22', 'DataFlow Analytics', 'Data Analytics Suite', 'Software', 2, 8500.00, 17000.00, 'North America', 'Sarah Chen', 'Wire Transfer'),
      ('2024-02-25', 'GreenEnergy Corp', 'Enterprise License', 'Software', 6, 2500.00, 15000.00, 'Europe', 'Emma Wilson', 'Wire Transfer'),
      ('2024-03-01', 'SmartHome Tech', 'Pro Plan Annual', 'Subscription', 20, 499.00, 9980.00, 'North America', 'David Park', 'Credit Card'),
      ('2024-03-05', 'FastLogistics', 'Custom Integration', 'Services', 1, 18500.00, 18500.00, 'Asia Pacific', 'Yuki Tanaka', 'Wire Transfer'),
      ('2024-03-08', 'CyberShield Security', 'Enterprise License', 'Software', 3, 2500.00, 7500.00, 'North America', 'Mike Johnson', 'Wire Transfer'),
      ('2024-03-12', 'BioResearch Labs', 'Data Analytics Suite', 'Software', 4, 8500.00, 34000.00, 'Europe', 'Emma Wilson', 'Wire Transfer'),
      ('2024-03-15', 'StyleHouse Fashion', 'Basic Plan Monthly', 'Subscription', 18, 49.00, 882.00, 'North America', 'Sarah Chen', 'Credit Card'),
      ('2024-03-18', 'AeroSpace Dynamics', 'Enterprise License', 'Software', 8, 2500.00, 20000.00, 'North America', 'David Park', 'Wire Transfer'),
      ('2024-03-22', 'QuickServe Restaurants', 'Pro Plan Annual', 'Subscription', 35, 499.00, 17465.00, 'North America', 'Mike Johnson', 'Credit Card'),
      ('2024-03-25', 'Oceanic Trading', 'Custom Integration', 'Services', 1, 28000.00, 28000.00, 'Asia Pacific', 'Yuki Tanaka', 'Wire Transfer'),
      ('2024-03-28', 'Alpine Insurance', 'Data Analytics Suite', 'Software', 2, 8500.00, 17000.00, 'Europe', 'Emma Wilson', 'Wire Transfer'),
      ('2024-04-01', 'Pixel Studios', 'Pro Plan Annual', 'Subscription', 6, 499.00, 2994.00, 'North America', 'Sarah Chen', 'Credit Card'),
      ('2024-04-05', 'Metro Transit Auth', 'Enterprise License', 'Software', 10, 2500.00, 25000.00, 'North America', 'David Park', 'Wire Transfer'),
      ('2024-04-08', 'TechVentures Fund', 'Custom Integration', 'Services', 1, 35000.00, 35000.00, 'North America', 'Mike Johnson', 'Wire Transfer'),
      ('2024-04-12', 'Wellness Plus', 'Basic Plan Monthly', 'Subscription', 22, 49.00, 1078.00, 'Europe', 'Emma Wilson', 'Credit Card'),
      ('2024-04-15', 'RoboTech Industries', 'Data Analytics Suite', 'Software', 5, 8500.00, 42500.00, 'Asia Pacific', 'Yuki Tanaka', 'Wire Transfer'),
      ('2024-04-18', 'Heritage Museum Group', 'Pro Plan Annual', 'Subscription', 4, 499.00, 1996.00, 'Europe', 'Emma Wilson', 'Credit Card')
    `);

    // Table 2: Customer Data (30 rows)
    await client.query(`
      CREATE TABLE IF NOT EXISTS upload_customer_data (
        id SERIAL PRIMARY KEY,
        name TEXT, email TEXT, company TEXT, industry TEXT,
        plan TEXT, monthly_spend NUMERIC(10,2), lifetime_value NUMERIC(10,2),
        signup_date TEXT, last_active TEXT, satisfaction_score INTEGER,
        support_tickets INTEGER, country TEXT
      )
    `);
    await client.query(`TRUNCATE upload_customer_data RESTART IDENTITY`);
    await client.query(`
      INSERT INTO upload_customer_data (name, email, company, industry, plan, monthly_spend, lifetime_value, signup_date, last_active, satisfaction_score, support_tickets, country) VALUES
      ('John Smith', 'john@acmecorp.com', 'Acme Corp', 'Technology', 'Enterprise', 2500.00, 85000.00, '2021-03-15', '2024-04-18', 92, 3, 'USA'),
      ('Maria Garcia', 'maria@techstart.io', 'TechStart Inc', 'SaaS', 'Pro', 499.00, 17960.00, '2022-01-10', '2024-04-17', 88, 5, 'USA'),
      ('James Wilson', 'james@globalfin.co.uk', 'Global Finance Ltd', 'Finance', 'Enterprise', 8500.00, 204000.00, '2020-06-20', '2024-04-18', 95, 1, 'UK'),
      ('Lisa Chen', 'lisa@retailmax.com', 'RetailMax', 'Retail', 'Basic', 49.00, 1764.00, '2021-08-05', '2024-04-15', 72, 12, 'USA'),
      ('Robert Taylor', 'robert@medihealth.com', 'MediHealth', 'Healthcare', 'Enterprise', 2500.00, 60000.00, '2022-04-12', '2024-04-16', 85, 7, 'USA'),
      ('Anna Mueller', 'anna@autodrive.de', 'AutoDrive Systems', 'Automotive', 'Enterprise', 5000.00, 120000.00, '2021-11-30', '2024-04-18', 91, 2, 'Germany'),
      ('Kenji Tanaka', 'kenji@edulearn.jp', 'EduLearn Platform', 'Education', 'Pro', 499.00, 11976.00, '2022-06-18', '2024-04-14', 78, 8, 'Japan'),
      ('Sarah Brown', 'sarah@cloudnine.com', 'CloudNine Solutions', 'Cloud', 'Enterprise', 8500.00, 102000.00, '2022-08-01', '2024-04-18', 96, 0, 'USA'),
      ('Carlos Rodriguez', 'carlos@freshfood.mx', 'FreshFood Co', 'Food & Bev', 'Basic', 49.00, 882.00, '2023-02-14', '2024-04-10', 65, 15, 'Mexico'),
      ('David Kim', 'david@buildright.com', 'BuildRight Construction', 'Construction', 'Enterprise', 2500.00, 45000.00, '2022-10-22', '2024-04-17', 82, 6, 'USA'),
      ('Erik Johansson', 'erik@nordicship.se', 'Nordic Shipping', 'Logistics', 'Enterprise', 7500.00, 135000.00, '2021-09-08', '2024-04-18', 93, 1, 'Sweden'),
      ('Priya Patel', 'priya@sunrisehotels.in', 'Sunrise Hotels', 'Hospitality', 'Pro', 499.00, 8982.00, '2023-01-05', '2024-04-16', 80, 4, 'India'),
      ('Tom Williams', 'tom@peakathletics.com', 'Peak Athletics', 'Sports', 'Basic', 49.00, 1176.00, '2022-05-20', '2024-04-12', 70, 9, 'USA'),
      ('Rachel Green', 'rachel@dataflow.ai', 'DataFlow Analytics', 'Analytics', 'Enterprise', 8500.00, 170000.00, '2021-01-15', '2024-04-18', 97, 0, 'USA'),
      ('Pierre Dubois', 'pierre@greenenergy.fr', 'GreenEnergy Corp', 'Energy', 'Enterprise', 2500.00, 75000.00, '2021-07-30', '2024-04-17', 89, 3, 'France'),
      ('Amy Johnson', 'amy@smarthome.com', 'SmartHome Tech', 'IoT', 'Pro', 499.00, 14970.00, '2021-12-01', '2024-04-18', 84, 5, 'USA'),
      ('Wei Zhang', 'wei@fastlogistics.cn', 'FastLogistics', 'Logistics', 'Enterprise', 6000.00, 108000.00, '2022-03-10', '2024-04-15', 87, 4, 'China'),
      ('Michael Davis', 'michael@cybershield.com', 'CyberShield Security', 'Security', 'Enterprise', 2500.00, 37500.00, '2023-03-22', '2024-04-18', 90, 2, 'USA'),
      ('Sophie Martin', 'sophie@bioresearch.de', 'BioResearch Labs', 'Biotech', 'Enterprise', 8500.00, 153000.00, '2021-04-18', '2024-04-17', 94, 1, 'Germany'),
      ('Isabella Rossi', 'isabella@stylehouse.it', 'StyleHouse Fashion', 'Retail', 'Basic', 49.00, 1470.00, '2022-02-28', '2024-04-08', 68, 11, 'Italy'),
      ('Alex Thompson', 'alex@aerospace.com', 'AeroSpace Dynamics', 'Aerospace', 'Enterprise', 12000.00, 288000.00, '2020-09-14', '2024-04-18', 98, 0, 'USA'),
      ('Jenny Lee', 'jenny@quickserve.com', 'QuickServe Restaurants', 'Restaurant', 'Pro', 499.00, 7485.00, '2023-05-10', '2024-04-16', 76, 7, 'USA'),
      ('Hiroshi Sato', 'hiroshi@oceanic.jp', 'Oceanic Trading', 'Trading', 'Enterprise', 9500.00, 171000.00, '2021-06-25', '2024-04-18', 92, 2, 'Japan'),
      ('Hans Weber', 'hans@alpineins.ch', 'Alpine Insurance', 'Insurance', 'Enterprise', 8500.00, 136000.00, '2022-07-12', '2024-04-17', 88, 3, 'Switzerland'),
      ('Olivia White', 'olivia@pixelstudios.com', 'Pixel Studios', 'Media', 'Pro', 499.00, 5988.00, '2023-04-01', '2024-04-15', 81, 4, 'USA'),
      ('Daniel Harris', 'daniel@metrotransit.gov', 'Metro Transit Auth', 'Government', 'Enterprise', 2500.00, 30000.00, '2023-06-15', '2024-04-18', 83, 6, 'USA'),
      ('Victoria Clark', 'victoria@techventures.com', 'TechVentures Fund', 'Finance', 'Enterprise', 15000.00, 180000.00, '2022-11-08', '2024-04-18', 96, 0, 'USA'),
      ('Luca Bianchi', 'luca@wellnessplus.it', 'Wellness Plus', 'Health', 'Basic', 49.00, 588.00, '2024-01-20', '2024-04-11', 74, 3, 'Italy'),
      ('Yuki Yamamoto', 'yuki@robotech.jp', 'RoboTech Industries', 'Robotics', 'Enterprise', 8500.00, 102000.00, '2023-08-05', '2024-04-18', 91, 1, 'Japan'),
      ('Emma Clark', 'emma@heritage.org', 'Heritage Museum Group', 'Nonprofit', 'Pro', 499.00, 3992.00, '2023-09-12', '2024-04-14', 79, 5, 'UK')
    `);

    // Table 3: Employee Performance (25 rows)
    await client.query(`
      CREATE TABLE IF NOT EXISTS upload_employee_performance (
        id SERIAL PRIMARY KEY,
        employee_name TEXT, department TEXT, role TEXT,
        hire_date TEXT, salary INTEGER, performance_score NUMERIC(3,1),
        projects_completed INTEGER, hours_logged INTEGER,
        satisfaction_rating NUMERIC(3,1), training_hours INTEGER, region TEXT
      )
    `);
    await client.query(`TRUNCATE upload_employee_performance RESTART IDENTITY`);
    await client.query(`
      INSERT INTO upload_employee_performance (employee_name, department, role, hire_date, salary, performance_score, projects_completed, hours_logged, satisfaction_rating, training_hours, region) VALUES
      ('Alice Martinez', 'Engineering', 'Senior Developer', '2020-03-15', 145000, 9.2, 14, 1920, 4.5, 48, 'San Francisco'),
      ('Bob Chen', 'Engineering', 'Staff Engineer', '2019-07-01', 175000, 9.5, 18, 2040, 4.8, 32, 'San Francisco'),
      ('Carol Williams', 'Marketing', 'Marketing Director', '2018-11-20', 155000, 8.8, 22, 1880, 4.2, 24, 'New York'),
      ('Dan Patel', 'Sales', 'Account Executive', '2021-02-10', 95000, 8.5, 45, 2100, 3.9, 16, 'Chicago'),
      ('Eva Schmidt', 'Engineering', 'DevOps Lead', '2020-08-05', 160000, 9.0, 12, 1960, 4.6, 56, 'Berlin'),
      ('Frank Moore', 'Product', 'Product Manager', '2019-04-18', 140000, 8.7, 8, 1840, 4.1, 40, 'San Francisco'),
      ('Grace Kim', 'Data Science', 'ML Engineer', '2021-06-22', 155000, 9.3, 11, 1900, 4.7, 64, 'San Francisco'),
      ('Henry Brown', 'Sales', 'Sales Director', '2018-01-08', 165000, 9.1, 52, 2200, 4.3, 20, 'New York'),
      ('Ivy Nakamura', 'Design', 'UX Lead', '2020-09-14', 135000, 8.9, 16, 1860, 4.4, 36, 'Tokyo'),
      ('Jack Thompson', 'Engineering', 'Frontend Lead', '2019-12-01', 150000, 8.6, 15, 1940, 4.0, 44, 'London'),
      ('Karen Liu', 'Finance', 'CFO', '2017-06-15', 210000, 9.4, 20, 2080, 4.6, 28, 'New York'),
      ('Leo Garcia', 'Support', 'Support Lead', '2021-03-20', 85000, 8.3, 120, 1920, 3.8, 32, 'Austin'),
      ('Maya Singh', 'Engineering', 'Backend Lead', '2020-01-10', 155000, 9.1, 13, 1980, 4.5, 52, 'San Francisco'),
      ('Noah Davis', 'Marketing', 'Content Manager', '2022-05-15', 95000, 8.0, 35, 1800, 4.0, 20, 'New York'),
      ('Olivia Jones', 'HR', 'HR Director', '2019-08-22', 130000, 8.8, 18, 1840, 4.3, 48, 'San Francisco'),
      ('Peter Wilson', 'Engineering', 'QA Lead', '2021-01-05', 125000, 8.4, 28, 1900, 3.9, 40, 'London'),
      ('Quinn Foster', 'Sales', 'Enterprise Rep', '2022-03-10', 105000, 8.7, 32, 2060, 4.1, 24, 'Chicago'),
      ('Rachel Adams', 'Data Science', 'Data Analyst', '2022-07-18', 110000, 8.9, 9, 1860, 4.4, 56, 'San Francisco'),
      ('Sam Cooper', 'Product', 'Technical PM', '2020-11-30', 145000, 8.5, 10, 1920, 4.2, 36, 'New York'),
      ('Tina Nguyen', 'Design', 'UI Designer', '2021-09-08', 115000, 9.0, 20, 1840, 4.6, 28, 'San Francisco'),
      ('Uma Reddy', 'Engineering', 'Security Engineer', '2020-05-25', 165000, 9.2, 8, 1960, 4.7, 72, 'San Francisco'),
      ('Victor Lee', 'Finance', 'Financial Analyst', '2022-01-15', 100000, 8.1, 15, 1880, 3.8, 24, 'New York'),
      ('Wendy Park', 'Marketing', 'Growth Manager', '2021-11-02', 120000, 8.6, 25, 1900, 4.0, 32, 'San Francisco'),
      ('Xavier Reed', 'Support', 'Technical Support', '2023-02-20', 75000, 7.8, 85, 1840, 3.6, 40, 'Austin'),
      ('Zoe Turner', 'Engineering', 'Mobile Lead', '2020-04-12', 155000, 9.1, 12, 1940, 4.5, 48, 'London')
    `);

    // Add CSV/Excel data sources pointing to the uploaded tables
    console.log('Adding uploaded data sources for Data Explorer...');
    await client.query(`
      INSERT INTO data_sources (user_id, name, type, connection_string, status, record_count, description) VALUES
      ($1, 'Sales Transactions Q1-Q2 2024', 'CSV/Excel', 'upload_sales_transactions', 'active', 30, 'Quarterly sales transaction data exported from CRM'),
      ($1, 'Customer Database Export', 'CSV/Excel', 'upload_customer_data', 'active', 30, 'Full customer database with engagement metrics'),
      ($1, 'Employee Performance Review', 'CSV/Excel', 'upload_employee_performance', 'active', 25, 'Annual employee performance data across all departments')
    `, [userId]);

    console.log('Database seeded successfully!');
    console.log('Demo credentials: demo@aianalyst.com / demo123456');

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase();
