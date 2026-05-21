const express = require('express');
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/stats — dashboard statistics
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [[totals]] = await db.query(`
      SELECT
        COUNT(*) as total,
        SUM(current_status = 'delivered') as delivered,
        SUM(current_status != 'delivered') as active,
        SUM(current_status = 'departed_ningbo') as pending
      FROM shipments
    `);

    const [recent] = await db.query(`
      SELECT tracking_number, customer_name, current_status, updated_at
      FROM shipments ORDER BY updated_at DESC LIMIT 10
    `);

    const [statusBreakdown] = await db.query(`
      SELECT current_status as status, COUNT(*) as count
      FROM shipments GROUP BY current_status
    `);

    const [monthlyTrend] = await db.query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count
      FROM shipments
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY month ORDER BY month ASC
    `);

    res.json({
      totals,
      recentShipments: recent,
      statusBreakdown,
      monthlyTrend,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
