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

// Tracking numbers are displayed with a leading "#" throughout the UI,
// so strip one off if a copy-pasted value includes it.
function normalizeTrackingNumber(value) {
  return value.trim().replace(/^#/, '').toUpperCase();
}

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
        (SELECT COUNT(*) FROM shipment_images si WHERE si.shipment_id = s.id) as image_count,
        (SELECT COUNT(*) FROM shipments c WHERE c.parent_shipment_id = s.id) as children_count,
        p.tracking_number as parent_tracking_number
      FROM shipments s LEFT JOIN shipments p ON p.id = s.parent_shipment_id WHERE 1=1
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

    let parent = null;
    if (shipment.parent_shipment_id) {
      const [parentRows] = await db.query(
        'SELECT id, tracking_number, customer_name FROM shipments WHERE id = ?',
        [shipment.parent_shipment_id]
      );
      parent = parentRows[0] || null;
    }
    const [children] = await db.query(
      'SELECT id, tracking_number, customer_name, current_status FROM shipments WHERE parent_shipment_id = ? ORDER BY created_at ASC',
      [shipment.id]
    );

    res.json({ ...shipment, history, images, parent, children });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/shipments — create shipment
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { customer_name, phone, departure_date, estimated_arrival, notes } = req.body;
    let { tracking_number, parent_tracking_number } = req.body;
    if (!customer_name || !phone) return res.status(400).json({ error: 'Customer name and phone required' });

    let parent_shipment_id = null;
    if (parent_tracking_number) {
      const [parentRows] = await db.query(
        'SELECT id, parent_shipment_id FROM shipments WHERE tracking_number = ?',
        [normalizeTrackingNumber(parent_tracking_number)]
      );
      if (!parentRows.length) return res.status(400).json({ error: 'Main shipment tracking number not found' });
      if (parentRows[0].parent_shipment_id) {
        return res.status(400).json({ error: 'That shipment is itself linked to a main shipment; pick the top-level one' });
      }
      parent_shipment_id = parentRows[0].id;
    }

    if (tracking_number) {
      tracking_number = normalizeTrackingNumber(tracking_number);
      if (!/^[A-Z0-9-]{3,30}$/.test(tracking_number)) {
        return res.status(400).json({ error: 'Tracking number must be 3-30 characters: letters, numbers, or dashes only' });
      }
      const [existing] = await db.query('SELECT id FROM shipments WHERE tracking_number = ?', [tracking_number]);
      if (existing.length) return res.status(409).json({ error: 'Tracking number already exists' });
    } else {
      let attempts = 0;
      do {
        tracking_number = generateTrackingNumber();
        const [existing] = await db.query('SELECT id FROM shipments WHERE tracking_number = ?', [tracking_number]);
        if (!existing.length) break;
        attempts++;
      } while (attempts < 10);
    }

    const tracking_url = `${process.env.TRACKING_BASE_URL || 'http://localhost:5173/track'}/${tracking_number}`;

    // Generate QR code
    const qrDir = path.join(process.env.UPLOAD_DIR || './uploads', 'qr');
    if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });
    const qrFilename = `qr-${tracking_number}.png`;
    const qrPath = path.join(qrDir, qrFilename);
    await QRCode.toFile(qrPath, tracking_url, { width: 400, margin: 2 });
    const qr_code_path = `/uploads/qr/${qrFilename}`;

    const [result] = await db.query(
      `INSERT INTO shipments (tracking_number, customer_name, phone, departure_date, estimated_arrival, notes, qr_code_path, tracking_url, parent_shipment_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tracking_number, customer_name, phone, departure_date || null, estimated_arrival || null, notes || null, qr_code_path, tracking_url, parent_shipment_id]
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
    const { customer_name, phone, departure_date, estimated_arrival, notes, parent_tracking_number } = req.body;

    let parent_shipment_id = null;
    if (parent_tracking_number) {
      const [parentRows] = await db.query(
        'SELECT id, parent_shipment_id FROM shipments WHERE tracking_number = ?',
        [normalizeTrackingNumber(parent_tracking_number)]
      );
      if (!parentRows.length) return res.status(400).json({ error: 'Main shipment tracking number not found' });
      if (parentRows[0].id === parseInt(req.params.id)) {
        return res.status(400).json({ error: 'A shipment cannot be its own main shipment' });
      }
      if (parentRows[0].parent_shipment_id) {
        return res.status(400).json({ error: 'That shipment is itself linked to a main shipment; pick the top-level one' });
      }
      const [childCheck] = await db.query('SELECT id FROM shipments WHERE parent_shipment_id = ? LIMIT 1', [req.params.id]);
      if (childCheck.length) {
        return res.status(400).json({ error: 'This shipment already has shipments linked to it and cannot also be linked to a main shipment' });
      }
      parent_shipment_id = parentRows[0].id;
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(
        `UPDATE shipments SET customer_name=?, phone=?, departure_date=?, estimated_arrival=?, notes=?, parent_shipment_id=?, updated_at=NOW()
         WHERE id=?`,
        [customer_name, phone, departure_date || null, estimated_arrival || null, notes || null, parent_shipment_id, req.params.id]
      );
      await conn.query('INSERT INTO activity_logs (user_id, action, description) VALUES (?, ?, ?)',
        [req.user.id, 'UPDATE_SHIPMENT', `Updated shipment ID ${req.params.id}`]);

      // Cascade departure/arrival dates to every shipment linked to this one as their main shipment
      const [children] = await conn.query('SELECT id FROM shipments WHERE parent_shipment_id = ?', [req.params.id]);
      if (children.length) {
        await conn.query(
          'UPDATE shipments SET departure_date=?, estimated_arrival=?, updated_at=NOW() WHERE parent_shipment_id=?',
          [departure_date || null, estimated_arrival || null, req.params.id]
        );
        await conn.query('INSERT INTO activity_logs (user_id, action, description) VALUES (?, ?, ?)',
          [req.user.id, 'CASCADE_DATES', `Cascaded departure/arrival dates to ${children.length} linked shipment(s) from shipment ${req.params.id}`]);
      }

      await conn.commit();
      const [rows] = await db.query('SELECT * FROM shipments WHERE id = ?', [req.params.id]);
      res.json(rows[0]);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/shipments/:id/status — update status
router.patch('/:id/status', authMiddleware, async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { status, note } = req.body;
    if (!STATUS_ORDER.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    await conn.beginTransaction();

    await conn.query('UPDATE shipments SET current_status = ?, updated_at = NOW() WHERE id = ?', [status, req.params.id]);
    await conn.query(
      'INSERT INTO shipment_status_history (shipment_id, status, note) VALUES (?, ?, ?)',
      [req.params.id, status, note || null]
    );
    await conn.query('INSERT INTO activity_logs (user_id, action, description) VALUES (?, ?, ?)',
      [req.user.id, 'UPDATE_STATUS', `Updated shipment ${req.params.id} to ${status}`]);

    // Cascade to every shipment linked to this one as their main shipment
    const [children] = await conn.query(
      'SELECT id, tracking_number FROM shipments WHERE parent_shipment_id = ?', [req.params.id]
    );
    for (const child of children) {
      await conn.query('UPDATE shipments SET current_status = ?, updated_at = NOW() WHERE id = ?', [status, child.id]);
      await conn.query(
        'INSERT INTO shipment_status_history (shipment_id, status, note) VALUES (?, ?, ?)',
        [child.id, status, note || 'تم التحديث تلقائيًا من الشحنة الرئيسية']
      );
    }
    if (children.length) {
      await conn.query('INSERT INTO activity_logs (user_id, action, description) VALUES (?, ?, ?)',
        [req.user.id, 'CASCADE_STATUS', `Cascaded status ${status} to ${children.length} linked shipment(s) from shipment ${req.params.id}`]);
    }

    await conn.commit();
    res.json({ message: 'Status updated', status, cascaded: children.length });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
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
