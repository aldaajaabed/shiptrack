const express = require('express');
const db = require('../config/db');

const router = express.Router();

// GET /api/track/:tracking_number — public endpoint for customers
router.get('/:tracking_number', async (req, res) => {
  try {
    const { tracking_number } = req.params;
    const [rows] = await db.query(
      'SELECT id, tracking_number, customer_name, phone, departure_date, estimated_arrival, current_status, tracking_url, qr_code_path, notes, updated_at FROM shipments WHERE tracking_number = ?',
      [tracking_number.toUpperCase()]
    );
    if (!rows.length) return res.status(404).json({ error: 'Shipment not found' });

    const shipment = rows[0];

    const [history] = await db.query(
      'SELECT id, status, note, timestamp FROM shipment_status_history WHERE shipment_id = ? ORDER BY timestamp ASC',
      [shipment.id]
    );

    const [images] = await db.query(
      'SELECT id, image_path, caption FROM shipment_images WHERE shipment_id = ? ORDER BY sort_order ASC',
      [shipment.id]
    );

    // Don't expose internal id in public response
    const { id, ...publicShipment } = shipment;
    res.json({ ...publicShipment, history, images });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
