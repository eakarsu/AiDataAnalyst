import { Router } from 'express';
import fs from 'fs';
import csv from 'csv-parser';
import XLSX from 'xlsx';
import { extname } from 'path';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = Router();

function sanitizeColumnName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
    .substring(0, 63);
}

function inferColumnType(values) {
  const sample = values.filter(v => v !== null && v !== '').slice(0, 100);
  if (sample.length === 0) return 'TEXT';

  const allNumbers = sample.every(v => !isNaN(Number(v)));
  if (allNumbers) {
    const hasDecimals = sample.some(v => String(v).includes('.'));
    return hasDecimals ? 'NUMERIC' : 'INTEGER';
  }

  const datePattern = /^\d{4}-\d{2}-\d{2}|^\d{1,2}\/\d{1,2}\/\d{2,4}/;
  const allDates = sample.every(v => datePattern.test(String(v)));
  if (allDates) return 'TIMESTAMP';

  const allBooleans = sample.every(v => ['true', 'false', '0', '1', 'yes', 'no'].includes(String(v).toLowerCase()));
  if (allBooleans) return 'BOOLEAN';

  return 'TEXT';
}

function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

function parseXLSX(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet);
}

// POST /api/upload - Upload and parse file
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const ext = extname(req.file.originalname).toLowerCase();
    let rows;

    if (ext === '.csv') {
      rows = await parseCSV(req.file.path);
    } else if (ext === '.xlsx' || ext === '.xls') {
      rows = parseXLSX(req.file.path);
    } else {
      return res.status(400).json({ error: 'Unsupported file format' });
    }

    if (rows.length === 0) {
      return res.status(400).json({ error: 'File is empty' });
    }

    // Determine columns and types
    const originalColumns = Object.keys(rows[0]);
    const columns = originalColumns.map(col => ({
      original: col,
      sanitized: sanitizeColumnName(col),
      type: inferColumnType(rows.map(r => r[col]))
    }));

    // Create table name from file
    const tableName = `upload_${req.user.id}_${Date.now()}`;

    // Create table
    const columnDefs = columns.map(c => `"${c.sanitized}" ${c.type}`).join(', ');
    await pool.query(`CREATE TABLE IF NOT EXISTS "${tableName}" (id SERIAL PRIMARY KEY, ${columnDefs})`);

    // Insert rows in batches
    const batchSize = 100;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const colNames = columns.map(c => `"${c.sanitized}"`).join(', ');

      for (const row of batch) {
        const values = columns.map((c, idx) => {
          const val = row[c.original];
          if (val === null || val === '' || val === undefined) return null;
          if (c.type === 'INTEGER') return parseInt(val) || null;
          if (c.type === 'NUMERIC') return parseFloat(val) || null;
          if (c.type === 'BOOLEAN') return ['true', '1', 'yes'].includes(String(val).toLowerCase());
          return String(val);
        });
        const placeholders = values.map((_, idx) => `$${idx + 1}`).join(', ');
        await pool.query(`INSERT INTO "${tableName}" (${colNames}) VALUES (${placeholders})`, values);
      }
    }

    // Create data source record
    const result = await pool.query(
      `INSERT INTO data_sources (user_id, name, type, connection_string, status, record_count, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        req.user.id,
        req.file.originalname,
        'CSV/Excel',
        tableName,
        'active',
        rows.length,
        `Uploaded file: ${req.file.originalname} (${columns.length} columns, ${rows.length} rows)`
      ]
    );

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      source: result.rows[0],
      columns: columns.map(c => ({ name: c.sanitized, original: c.original, type: c.type })),
      rowCount: rows.length
    });
  } catch (error) {
    console.error('Upload error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to process file: ' + error.message });
  }
});

// GET /api/upload/:sourceId/data - Get paginated data
router.get('/:sourceId/data', authenticateToken, async (req, res) => {
  try {
    const { sourceId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const offset = (page - 1) * limit;

    const source = await pool.query(
      'SELECT * FROM data_sources WHERE id = $1 AND user_id = $2',
      [sourceId, req.user.id]
    );

    if (source.rows.length === 0) {
      return res.status(404).json({ error: 'Data source not found' });
    }

    const tableName = source.rows[0].connection_string;
    const countResult = await pool.query(`SELECT COUNT(*) FROM "${tableName}"`);
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await pool.query(
      `SELECT * FROM "${tableName}" ORDER BY id LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      data: dataResult.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Get data error:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// GET /api/upload/:sourceId/columns - Get column info
router.get('/:sourceId/columns', authenticateToken, async (req, res) => {
  try {
    const { sourceId } = req.params;

    const source = await pool.query(
      'SELECT * FROM data_sources WHERE id = $1 AND user_id = $2',
      [sourceId, req.user.id]
    );

    if (source.rows.length === 0) {
      return res.status(404).json({ error: 'Data source not found' });
    }

    const tableName = source.rows[0].connection_string;
    const columnsResult = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = $1 AND column_name != 'id'
      ORDER BY ordinal_position
    `, [tableName]);

    res.json(columnsResult.rows);
  } catch (error) {
    console.error('Get columns error:', error);
    res.status(500).json({ error: 'Failed to fetch columns' });
  }
});

export default router;
