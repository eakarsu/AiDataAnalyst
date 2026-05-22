import pool from '../config/database.js';

export async function initializeSpreadsheetSchema() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // spreadsheet_workbooks
    await client.query(`
      CREATE TABLE IF NOT EXISTS spreadsheet_workbooks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'active',
        is_archived BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // cell_grids
    await client.query(`
      CREATE TABLE IF NOT EXISTS cell_grids (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        workbook_id INTEGER REFERENCES spreadsheet_workbooks(id) ON DELETE CASCADE,
        sheet_name VARCHAR(255) NOT NULL,
        sheet_purpose VARCHAR(100),
        cell_data JSONB DEFAULT '{}',
        conditional_formats JSONB DEFAULT '[]',
        frozen_panes JSONB DEFAULT '{}',
        merged_cells JSONB DEFAULT '[]',
        data_validations JSONB DEFAULT '[]',
        quality_score DECIMAL(5,2),
        row_count INTEGER DEFAULT 0,
        col_count INTEGER DEFAULT 0,
        is_archived BOOLEAN DEFAULT false,
        ai_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // formula_engine_entries
    await client.query(`
      CREATE TABLE IF NOT EXISTS formula_engine_entries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        grid_id INTEGER REFERENCES cell_grids(id) ON DELETE CASCADE,
        cell_ref VARCHAR(50) NOT NULL,
        formula_text TEXT NOT NULL,
        formula_type VARCHAR(100),
        is_volatile BOOLEAN DEFAULT false,
        is_circular BOOLEAN DEFAULT false,
        recompute_cost_ms INTEGER,
        named_ranges JSONB DEFAULT '[]',
        result_value TEXT,
        error_type VARCHAR(50),
        is_archived BOOLEAN DEFAULT false,
        ai_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ai_fill_down_actions
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_fill_down_actions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        grid_id INTEGER REFERENCES cell_grids(id) ON DELETE CASCADE,
        source_range VARCHAR(100) NOT NULL,
        target_range VARCHAR(100) NOT NULL,
        fill_mode VARCHAR(100),
        fill_direction VARCHAR(50) DEFAULT 'down',
        pattern_detected TEXT,
        confidence_score DECIMAL(5,2),
        fill_explanation TEXT,
        actual_values JSONB DEFAULT '[]',
        is_archived BOOLEAN DEFAULT false,
        ai_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // nl_formula_translations
    await client.query(`
      CREATE TABLE IF NOT EXISTS nl_formula_translations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        grid_id INTEGER REFERENCES cell_grids(id) ON DELETE CASCADE,
        natural_language TEXT NOT NULL,
        generated_formula TEXT,
        confidence_score DECIMAL(5,2),
        question_difficulty VARCHAR(50),
        intent_class VARCHAR(100),
        alternative_formulas JSONB DEFAULT '[]',
        validation_passed BOOLEAN,
        is_archived BOOLEAN DEFAULT false,
        ai_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // pivot_engine_configs
    await client.query(`
      CREATE TABLE IF NOT EXISTS pivot_engine_configs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        grid_id INTEGER REFERENCES cell_grids(id) ON DELETE CASCADE,
        pivot_name VARCHAR(255) NOT NULL,
        row_keys JSONB DEFAULT '[]',
        col_keys JSONB DEFAULT '[]',
        value_fields JSONB DEFAULT '[]',
        aggregation_type VARCHAR(50) DEFAULT 'sum',
        filter_config JSONB DEFAULT '{}',
        refresh_cost_estimate DECIMAL(10,4),
        clarity_score DECIMAL(5,2),
        use_case VARCHAR(100),
        is_archived BOOLEAN DEFAULT false,
        ai_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // charts_api_configs
    await client.query(`
      CREATE TABLE IF NOT EXISTS charts_api_configs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        grid_id INTEGER REFERENCES cell_grids(id) ON DELETE CASCADE,
        chart_name VARCHAR(255) NOT NULL,
        chart_type VARCHAR(100) NOT NULL,
        chart_purpose VARCHAR(100),
        data_source_range VARCHAR(255),
        axis_config JSONB DEFAULT '{}',
        color_palette JSONB DEFAULT '[]',
        annotations JSONB DEFAULT '[]',
        effectiveness_score DECIMAL(5,2),
        alt_text TEXT,
        is_archived BOOLEAN DEFAULT false,
        ai_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // collab_presence_sessions
    await client.query(`
      CREATE TABLE IF NOT EXISTS collab_presence_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        grid_id INTEGER REFERENCES cell_grids(id) ON DELETE CASCADE,
        session_token VARCHAR(255) NOT NULL,
        cursor_position JSONB DEFAULT '{}',
        active_cell VARCHAR(50),
        is_idle BOOLEAN DEFAULT false,
        idle_since TIMESTAMP,
        health_score DECIMAL(5,2),
        comments JSONB DEFAULT '[]',
        edit_summary TEXT,
        is_archived BOOLEAN DEFAULT false,
        ai_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query('COMMIT');
    console.log('Spreadsheet schema initialized successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error initializing spreadsheet schema:', error);
    throw error;
  } finally {
    client.release();
  }
}

export default initializeSpreadsheetSchema;
