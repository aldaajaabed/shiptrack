-- ============================================
-- ShipTrack LCL - MySQL Database Schema
-- China → Jordan Sea Freight Platform
-- ============================================

CREATE DATABASE IF NOT EXISTS shiptrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE shiptrack;

-- Users (admin accounts)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'superadmin') DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Shipments
CREATE TABLE shipments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tracking_number VARCHAR(20) NOT NULL UNIQUE,
  customer_name VARCHAR(150) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  departure_date DATE,
  estimated_arrival DATE,
  current_status ENUM(
    'departed_ningbo',
    'at_sea',
    'arrived_aqaba',
    'customs_clearance',
    'ready_for_delivery',
    'delivered'
  ) DEFAULT 'departed_ningbo',
  qr_code_path VARCHAR(255),
  tracking_url VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Shipment Status History
CREATE TABLE shipment_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shipment_id INT NOT NULL,
  status ENUM(
    'departed_ningbo',
    'at_sea',
    'arrived_aqaba',
    'customs_clearance',
    'ready_for_delivery',
    'delivered'
  ) NOT NULL,
  note TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
);

-- Shipment Images
CREATE TABLE shipment_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shipment_id INT NOT NULL,
  image_path VARCHAR(255) NOT NULL,
  caption VARCHAR(255),
  sort_order INT DEFAULT 0,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
);

-- Activity Logs
CREATE TABLE activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Seed default admin user (password: Admin@1234)
INSERT INTO users (name, email, password, role) VALUES
('Super Admin', 'admin@shiptrack.jo', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'superadmin');

-- Indexes
CREATE INDEX idx_shipments_tracking ON shipments(tracking_number);
CREATE INDEX idx_status_history_shipment ON shipment_status_history(shipment_id);
CREATE INDEX idx_images_shipment ON shipment_images(shipment_id);
