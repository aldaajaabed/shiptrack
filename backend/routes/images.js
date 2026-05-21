const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// POST /api/images/:shipmentId — upload images
router.post('/:shipmentId', authMiddleware, upload.array('images', 20), async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const { captions } = req.body; // optional array of captions
    const captionsArr = Array.isArray(captions) ? captions : [captions];

    const [shipment] = await db.query('SELECT id FROM shipments WHERE id = ?', [shipmentId]);
    if (!shipment.length) return res.status(404).json({ error: 'Shipment not found' });

    const [[{ maxOrder }]] = await db.query(
      'SELECT COALESCE(MAX(sort_order), -1) as maxOrder FROM shipment_images WHERE shipment_id = ?',
      [shipmentId]
    );

    const inserted = [];
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const image_path = `/uploads/${file.filename}`;
      const caption = captionsArr[i] || null;
      const sort_order = maxOrder + 1 + i;
      const [result] = await db.query(
        'INSERT INTO shipment_images (shipment_id, image_path, caption, sort_order) VALUES (?, ?, ?, ?)',
        [shipmentId, image_path, caption, sort_order]
      );
      inserted.push({ id: result.insertId, image_path, caption, sort_order });
    }

    res.status(201).json({ uploaded: inserted });
  } catch (err) {
    // Clean up uploaded files on error
    if (req.files) req.files.forEach(f => fs.unlink(f.path, () => {}));
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/images/:imageId
router.delete('/:imageId', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM shipment_images WHERE id = ?', [req.params.imageId]);
    if (!rows.length) return res.status(404).json({ error: 'Image not found' });

    const image = rows[0];
    const filePath = path.join(process.env.UPLOAD_DIR || './uploads', path.basename(image.image_path));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await db.query('DELETE FROM shipment_images WHERE id = ?', [req.params.imageId]);
    res.json({ message: 'Image deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/images/reorder — reorder images
router.patch('/reorder', authMiddleware, async (req, res) => {
  try {
    const { orderedIds } = req.body; // array of image IDs in desired order
    for (let i = 0; i < orderedIds.length; i++) {
      await db.query('UPDATE shipment_images SET sort_order = ? WHERE id = ?', [i, orderedIds[i]]);
    }
    res.json({ message: 'Order updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/images/:imageId/caption
router.patch('/:imageId/caption', authMiddleware, async (req, res) => {
  try {
    const { caption } = req.body;
    await db.query('UPDATE shipment_images SET caption = ? WHERE id = ?', [caption, req.params.imageId]);
    res.json({ message: 'Caption updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
