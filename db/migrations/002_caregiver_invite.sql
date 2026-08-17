-- Migration 002: Add invite_code to caregiver_link, make caregiver_id nullable
-- Run this in Supabase SQL Editor before using the invite flow.

ALTER TABLE caregiver_link ALTER COLUMN caregiver_id DROP NOT NULL;
ALTER TABLE caregiver_link ADD COLUMN invite_code VARCHAR(10) UNIQUE;
