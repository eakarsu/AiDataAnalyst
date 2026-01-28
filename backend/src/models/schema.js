import pool from '../config/database.js';

export async function initializeDatabase() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Data Sources table
    await client.query(`
      CREATE TABLE IF NOT EXISTS data_sources (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        connection_string TEXT,
        status VARCHAR(50) DEFAULT 'active',
        last_sync TIMESTAMP,
        record_count INTEGER DEFAULT 0,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Dashboards table
    await client.query(`
      CREATE TABLE IF NOT EXISTS dashboards (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        layout JSONB DEFAULT '{}',
        is_public BOOLEAN DEFAULT false,
        share_token VARCHAR(64) UNIQUE,
        views INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add share_token column if it doesn't exist (for existing databases)
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS share_token VARCHAR(64) UNIQUE;
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);

    // Reports table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        dashboard_id INTEGER REFERENCES dashboards(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        query TEXT,
        visualization_config JSONB DEFAULT '{}',
        schedule VARCHAR(100),
        last_run TIMESTAMP,
        status VARCHAR(50) DEFAULT 'active',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // AI Insights table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_insights (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        report_id INTEGER REFERENCES reports(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        insight_type VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        confidence DECIMAL(5,2),
        impact VARCHAR(50),
        recommendations JSONB DEFAULT '[]',
        data_points JSONB DEFAULT '{}',
        status VARCHAR(50) DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Queries table (for natural language queries)
    await client.query(`
      CREATE TABLE IF NOT EXISTS queries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        natural_language_query TEXT NOT NULL,
        generated_sql TEXT,
        result_summary TEXT,
        execution_time INTEGER,
        row_count INTEGER,
        status VARCHAR(50) DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Alerts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        report_id INTEGER REFERENCES reports(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        condition TEXT NOT NULL,
        threshold DECIMAL(15,2),
        frequency VARCHAR(50) DEFAULT 'hourly',
        notification_channels JSONB DEFAULT '["email"]',
        is_active BOOLEAN DEFAULT true,
        last_triggered TIMESTAMP,
        trigger_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Predictions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS predictions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        model_type VARCHAR(100) NOT NULL,
        target_metric VARCHAR(255) NOT NULL,
        prediction_period VARCHAR(50) NOT NULL,
        predicted_value DECIMAL(15,2),
        confidence_interval JSONB DEFAULT '{}',
        accuracy DECIMAL(5,2),
        features_used JSONB DEFAULT '[]',
        status VARCHAR(50) DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Anomalies table
    await client.query(`
      CREATE TABLE IF NOT EXISTS anomalies (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        data_source_id INTEGER REFERENCES data_sources(id) ON DELETE SET NULL,
        metric_name VARCHAR(255) NOT NULL,
        expected_value DECIMAL(15,2),
        actual_value DECIMAL(15,2),
        deviation_percentage DECIMAL(5,2),
        severity VARCHAR(50) DEFAULT 'medium',
        description TEXT,
        is_resolved BOOLEAN DEFAULT false,
        detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP
      )
    `);

    // Data Exports table
    await client.query(`
      CREATE TABLE IF NOT EXISTS data_exports (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        report_id INTEGER REFERENCES reports(id) ON DELETE SET NULL,
        format VARCHAR(50) NOT NULL,
        file_path TEXT,
        file_size INTEGER,
        row_count INTEGER,
        status VARCHAR(50) DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Scheduled Jobs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS scheduled_jobs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        job_type VARCHAR(100) NOT NULL,
        job_name VARCHAR(255) NOT NULL,
        cron_expression VARCHAR(100),
        last_run TIMESTAMP,
        next_run TIMESTAMP,
        status VARCHAR(50) DEFAULT 'active',
        config JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Collaborations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS collaborations (
        id SERIAL PRIMARY KEY,
        dashboard_id INTEGER REFERENCES dashboards(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        permission VARCHAR(50) DEFAULT 'view',
        invited_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(dashboard_id, user_id)
      )
    `);

    // Activity Log table
    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50),
        entity_id INTEGER,
        details JSONB DEFAULT '{}',
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Templates table
    await client.query(`
      CREATE TABLE IF NOT EXISTS templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT,
        config JSONB DEFAULT '{}',
        preview_image TEXT,
        usage_count INTEGER DEFAULT 0,
        is_premium BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Integrations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS integrations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        service_name VARCHAR(100) NOT NULL,
        service_type VARCHAR(50) NOT NULL,
        credentials JSONB DEFAULT '{}',
        status VARCHAR(50) DEFAULT 'connected',
        last_sync TIMESTAMP,
        sync_frequency VARCHAR(50) DEFAULT 'daily',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query('COMMIT');
    console.log('Database schema initialized successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error initializing database schema:', error);
    throw error;
  } finally {
    client.release();
  }
}

export default initializeDatabase;
