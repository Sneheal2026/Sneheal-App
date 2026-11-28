-- Migration: 025_order_prescription_mode.sql
-- Description: Adds prescription_mode to orders table to support user choice: uploaded prescription or free doctor consultation call.
-- Safe: ENUM('upload', 'doctor_consultation') NOT NULL DEFAULT 'upload' ensures 100% backward compatibility for all existing orders.

ALTER TABLE orders
  ADD COLUMN prescription_mode ENUM('upload', 'doctor_consultation') NOT NULL DEFAULT 'upload' AFTER prescription_status;
