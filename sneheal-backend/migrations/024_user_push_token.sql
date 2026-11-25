-- Migration: 024_user_push_token.sql
-- Description: Adds push_token column to users table for push notifications (Expo / FCM)
-- Safe: NULL DEFAULT NULL ensures existing users and previous app versions are completely unaffected.

ALTER TABLE users ADD COLUMN push_token VARCHAR(255) NULL DEFAULT NULL;
