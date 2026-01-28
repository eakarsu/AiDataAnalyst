import { Router } from 'express';
import pool from '../config/database.js';

const router = Router();

// GET /public/dashboard/:shareToken - View shared dashboard (no auth required)
router.get('/dashboard/:shareToken', async (req, res) => {
  try {
    const { shareToken } = req.params;

    const result = await pool.query(
      `SELECT d.*, u.name as owner_name
       FROM dashboards d
       JOIN users u ON d.user_id = u.id
       WHERE d.share_token = $1 AND d.is_public = true`,
      [shareToken]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dashboard not found or not shared' });
    }

    // Increment views
    await pool.query(
      'UPDATE dashboards SET views = views + 1 WHERE id = $1',
      [result.rows[0].id]
    );

    const dashboard = result.rows[0];
    // Remove sensitive fields
    delete dashboard.user_id;

    res.json(dashboard);
  } catch (error) {
    console.error('Public dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

export default router;
