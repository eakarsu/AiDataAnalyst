import pool from '../config/database.js';

export async function initializeWarehouseSchema() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ingestion_connectors
    await client.query(`
      CREATE TABLE IF NOT EXISTS ingestion_connectors (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        source_type VARCHAR(100) NOT NULL,
        connection_config JSONB DEFAULT '{}',
        schema_mapping JSONB DEFAULT '{}',
        incremental_key VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        last_run TIMESTAMP,
        last_run_status VARCHAR(50),
        run_count INTEGER DEFAULT 0,
        pii_fields JSONB DEFAULT '[]',
        throttle_config JSONB DEFAULT '{}',
        is_archived BOOLEAN DEFAULT false,
        ai_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // parquet_iceberg_tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS parquet_iceberg_tables (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        connector_id INTEGER REFERENCES ingestion_connectors(id) ON DELETE SET NULL,
        table_name VARCHAR(255) NOT NULL,
        namespace VARCHAR(255),
        partition_spec JSONB DEFAULT '{}',
        sort_order JSONB DEFAULT '{}',
        file_size_bytes BIGINT DEFAULT 0,
        snapshot_count INTEGER DEFAULT 0,
        record_count BIGINT DEFAULT 0,
        storage_location TEXT,
        format_version INTEGER DEFAULT 2,
        schema_json JSONB DEFAULT '{}',
        health_score DECIMAL(5,2),
        is_archived BOOLEAN DEFAULT false,
        ai_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // query_engine_entries
    await client.query(`
      CREATE TABLE IF NOT EXISTS query_engine_entries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        sql_text TEXT NOT NULL,
        query_intent VARCHAR(100),
        query_pattern VARCHAR(100),
        status VARCHAR(50) DEFAULT 'pending',
        execution_time_ms INTEGER,
        rows_returned INTEGER,
        bytes_scanned BIGINT,
        cost_estimate DECIMAL(10,4),
        error_message TEXT,
        query_plan JSONB DEFAULT '{}',
        optimization_hints JSONB DEFAULT '[]',
        is_archived BOOLEAN DEFAULT false,
        ai_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // transform_dbt_models
    await client.query(`
      CREATE TABLE IF NOT EXISTS transform_dbt_models (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        model_name VARCHAR(255) NOT NULL,
        model_layer VARCHAR(50) DEFAULT 'staging',
        materialization VARCHAR(50) DEFAULT 'view',
        sql_definition TEXT,
        ref_targets JSONB DEFAULT '[]',
        tests JSONB DEFAULT '[]',
        yml_doc TEXT,
        build_time_ms INTEGER,
        coverage_score DECIMAL(5,2),
        is_stale BOOLEAN DEFAULT false,
        incremental_strategy VARCHAR(100),
        warehouse_cost_estimate DECIMAL(10,4),
        is_archived BOOLEAN DEFAULT false,
        ai_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // semantic_layer_metrics
    await client.query(`
      CREATE TABLE IF NOT EXISTS semantic_layer_metrics (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        metric_name VARCHAR(255) NOT NULL,
        dimension VARCHAR(255),
        grain VARCHAR(100),
        formula TEXT,
        synonyms JSONB DEFAULT '[]',
        pre_aggregation_config JSONB DEFAULT '{}',
        quality_score DECIMAL(5,2),
        usage_count INTEGER DEFAULT 0,
        is_deprecated BOOLEAN DEFAULT false,
        rls_rules JSONB DEFAULT '[]',
        is_archived BOOLEAN DEFAULT false,
        ai_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // lineage_assets
    await client.query(`
      CREATE TABLE IF NOT EXISTS lineage_assets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        asset_name VARCHAR(255) NOT NULL,
        asset_type VARCHAR(100) NOT NULL,
        upstream_assets JSONB DEFAULT '[]',
        downstream_assets JSONB DEFAULT '[]',
        column_lineage JSONB DEFAULT '{}',
        tags JSONB DEFAULT '[]',
        completeness_score DECIMAL(5,2),
        dependency_type VARCHAR(100),
        is_orphan BOOLEAN DEFAULT false,
        is_archived BOOLEAN DEFAULT false,
        ai_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // access_policies
    await client.query(`
      CREATE TABLE IF NOT EXISTS access_policies (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        policy_name VARCHAR(255) NOT NULL,
        data_sensitivity VARCHAR(50) DEFAULT 'medium',
        rls_rules JSONB DEFAULT '[]',
        mask_rules JSONB DEFAULT '[]',
        role_assignments JSONB DEFAULT '[]',
        jit_access_config JSONB DEFAULT '{}',
        effectiveness_score DECIMAL(5,2),
        is_active BOOLEAN DEFAULT true,
        is_archived BOOLEAN DEFAULT false,
        ai_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // materialized_views
    await client.query(`
      CREATE TABLE IF NOT EXISTS materialized_views (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        view_name VARCHAR(255) NOT NULL,
        sql_definition TEXT NOT NULL,
        grain VARCHAR(100),
        refresh_strategy VARCHAR(100) DEFAULT 'full',
        refresh_window_cron VARCHAR(100),
        last_refreshed TIMESTAMP,
        refresh_cost_estimate DECIMAL(10,4),
        hit_count INTEGER DEFAULT 0,
        roi_score DECIMAL(5,2),
        mv_pattern VARCHAR(100),
        is_stale BOOLEAN DEFAULT false,
        is_archived BOOLEAN DEFAULT false,
        ai_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query('COMMIT');
    console.log('Warehouse schema initialized successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error initializing warehouse schema:', error);
    throw error;
  } finally {
    client.release();
  }
}

export default initializeWarehouseSchema;
