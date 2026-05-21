const express = require('express');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const STATUS_ORDER = [
  'departed_ningbo', 'at_sea', 'arrived_aqaba',
  'customs_clearance', 'ready_for_delivery', 'delivered'
];

// Generate unique tracking number
function generateTrackingNumber() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const letters = Array.from({ length: 2 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const digits = Math.floor(10000 + Math.random() * 90000);
  return `${letters}${digits}`;
}

// GET /api/shipments — list all shipments with optional search/filter
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    let query = `
      SELECT s.*, 
        (SELECT COUNT(*) FROM shipment_images si WHERE si.shipment_id = s.id) as image_count
      FROM shipments s WHERE 1=1
    `;
    const params = [];
    if (search) {
      query += ' AND (s.tracking_number LIKE ? OR s.customer_name LIKE ? OR s.phone LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    if (status) { query += ' AND s.current_status = ?'; params.push(status); }
    query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const [rows] = await db.query(query, params);
    const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM shipments');
    res.json({ shipments: rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/shipments/:id — single shipment with history and images
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM shipments WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Shipment not found' });
    const shipment = rows[0];

    const [history] = await db.query(
      'SELECT * FROM shipment_status_history WHERE shipment_id = ? ORDER BY timestamp ASC',
      [shipment.id]
    );
    const [images] = await db.query(
      'SELECT * FROM shipment_images WHERE shipment_id = ? ORDER BY sort_order ASC',
      [shipment.id]
    );

    res.json({ ...shipment, history, images });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/shipments — create shipment
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { customer_name, phone, departure_date, estimated_arrival, notes } = req.body;
    if (!customer_name || !phone) return res.status(400).json({ error: 'Customer name and phone required' });

    let tracking_number;
    let attempts = 0;
    do {
      tracking_number = generateTrackingNumber();
      const [existing] = await db.query('SELECT id FROM shipments WHERE tracking_number = ?', [tracking_number]);
      if (!existing.length) break;
      attempts++;
    } while (attempts < 10);

    const tracking_url = `${process.env.TRACKING_BASE_URL || 'http://localhost:5173/track'}/${tracking_number}`;

    // Generate QR code
    const qrDir = path.join(process.env.UPLOAD_DIR || './uploads', 'qr');
    if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });
    const qrFilename = `qr-${tracking_number}.png`;
    const qrPath = path.join(qrDir, qrFilename);
    await QRCode.toFile(qrPath, tracking_url, { width: 400, margin: 2 });
    const qr_code_path = `/uploads/qr/${qrFilename}`;

    const [result] = await db.query(
      `INSERT INTO shipments (tracking_number, customer_name, phone, departure_date, estimated_arrival, notes, qr_code_path, tracking_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [tracking_number, customer_name, phone, departure_date || null, estimated_arrival || null, notes || null, qr_code_path, tracking_url]
    );

    // Insert initial status history
    await db.query(
      'INSERT INTO shipment_status_history (shipment_id, status, note) VALUES (?, ?, ?)',
      [result.insertId, 'departed_ningbo', 'تم مغادرة ميناء نينغبو']
    );

    // Log activity
    await db.query('INSERT INTO activity_logs (user_id, action, description) VALUES (?, ?, ?)',
      [req.user.id, 'CREATE_SHIPMENT', `Created shipment ${tracking_number}`]);

    const [newShipment] = await db.query('SELECT * FROM shipments WHERE id = ?', [result.insertId]);
    res.status(201).json(newShipment[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/shipments/:id — update shipment info
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { customer_name, phone, departure_date, estimated_arrival, notes } = req.body;
    await db.query(
      `UPDATE shipments SET customer_name=?, phone=?, departure_date=?, estimated_arrival=?, notes=?, updated_at=NOW()
       WHERE id=?`,
      [customer_name, phone, departure_date || null, estimated_arrival || null, notes || null, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM shipments WHERE id = ?', [req.params.id]);
    await db.query('INSERT INTO activity_logs (user_id, action, description) VALUES (?, ?, ?)',
      [req.user.id, 'UPDATE_SHIPMENT', `Updated shipment ID ${req.params.id}`]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/shipments/:id/status — update status
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status, note } = req.body;
    if (!STATUS_ORDER.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    await db.query('UPDATE shipments SET current_status = ?, updated_at = NOW() WHERE id = ?', [status, req.params.id]);
    await db.query(
      'INSERT INTO shipment_status_history (shipment_id, status, note) VALUES (?, ?, ?)',
      [req.params.id, status, note || null]
    );
    await db.query('INSERT INTO activity_logs (user_id, action, description) VALUES (?, ?, ?)',
      [req.user.id, 'UPDATE_STATUS', `Updated shipment ${req.params.id} to ${status}`]);

    res.json({ message: 'Status updated', status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/shipments/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT tracking_number FROM shipments WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Shipment not found' });
    await db.query('DELETE FROM shipments WHERE id = ?', [req.params.id]);
    await db.query('INSERT INTO activity_logs (user_id, action, description) VALUES (?, ?, ?)',
      [req.user.id, 'DELETE_SHIPMENT', `Deleted shipment ${rows[0].tracking_number}`]);
    res.json({ message: 'Shipment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
