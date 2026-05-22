import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    summary: { metrics_tracked: 64, semantic_drifts: 7, dashboard_impacts: 12, owner_reviews: 5 },
    drifts: [
      { metric: 'active_users', source: 'product_events', change: 'definition excludes trials', impact: 'high', action: 'version metric contract' },
      { metric: 'gross_margin', source: 'finance_mart', change: 'refund timing shifted', impact: 'medium', action: 'backfill dashboard annotation' },
      { metric: 'ticket_sla', source: 'support_dw', change: 'priority enum remapped', impact: 'medium', action: 'update semantic layer' },
    ],
  });
});

router.post('/compare', (req, res) => {
  const { oldDefinition = '', newDefinition = '' } = req.body || {};
  res.json({ drift: oldDefinition !== newDefinition, recommendation: oldDefinition !== newDefinition ? 'require analyst approval before publishing' : 'definitions match' });
});

export default router;
