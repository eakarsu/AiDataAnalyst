import pool from './config/database.js';
import { initializeDatabase } from './models/schema.js';
import bcrypt from 'bcryptjs';

async function seedDatabase() {
  const client = await pool.connect();

  try {
    console.log('Initializing database schema...');
    await initializeDatabase();

    console.log('Clearing existing data...');
    await client.query('TRUNCATE users, data_sources, dashboards, reports, ai_insights, queries, alerts, predictions, anomalies, data_exports, scheduled_jobs, collaborations, activity_log, templates, integrations RESTART IDENTITY CASCADE');

    console.log('Seeding users...');
    const hashedPassword = await bcrypt.hash('demo123456', 10);
    const userResult = await client.query(`
      INSERT INTO users (email, password, name) VALUES
      ('demo@aianalyst.com', $1, 'Demo User'),
      ('admin@aianalyst.com', $1, 'Admin User'),
      ('analyst@aianalyst.com', $1, 'Data Analyst'),
      ('manager@aianalyst.com', $1, 'Project Manager'),
      ('developer@aianalyst.com', $1, 'Developer')
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
