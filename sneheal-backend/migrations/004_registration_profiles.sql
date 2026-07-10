-- Migration: 004_registration_profiles
-- Description: Create profile tables for doctor and delivery agent roles
-- Date: 2026-07-10

-- Doctor clinic/practice information
CREATE TABLE IF NOT EXISTS doctor_profiles (
    user_id BIGINT PRIMARY KEY,
    clinic_address_line VARCHAR(500) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(6) NOT NULL,
    landmark VARCHAR(200) DEFAULT '',
    verification_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Delivery agent KYC documents
CREATE TABLE IF NOT EXISTS delivery_agent_profiles (
    user_id BIGINT PRIMARY KEY,
    aadhar_image_base64 LONGTEXT NOT NULL,
    aadhar_mime_type VARCHAR(50) NOT NULL,
    license_image_base64 LONGTEXT NOT NULL,
    license_mime_type VARCHAR(50) NOT NULL,
    verification_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for admin queries by verification status
CREATE INDEX idx_doctor_verification ON doctor_profiles (verification_status);
CREATE INDEX idx_delivery_agent_verification ON delivery_agent_profiles (verification_status);
