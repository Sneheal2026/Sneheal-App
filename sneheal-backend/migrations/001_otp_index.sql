CREATE INDEX idx_otp_active_lookup
ON otp_verifications (phone, is_used, expires_at);
