-- Adds support for linking a shipment to a "main" shipment. Updating the
-- main shipment's status cascades to every shipment that links to it.
-- Run this once against the existing production database (e.g. via phpMyAdmin).

ALTER TABLE shipments
  ADD COLUMN parent_shipment_id INT DEFAULT NULL AFTER notes,
  ADD CONSTRAINT fk_shipments_parent
    FOREIGN KEY (parent_shipment_id) REFERENCES shipments(id) ON DELETE SET NULL;

CREATE INDEX idx_shipments_parent ON shipments(parent_shipment_id);
