-- UPDATE_INQUIRY_SCHEMA.sql
-- Run this script to add new columns to ProjectInquiry for enhanced proposal features

ALTER TABLE "ProjectInquiry" ADD COLUMN IF NOT EXISTS "title" text;
ALTER TABLE "ProjectInquiry" ADD COLUMN IF NOT EXISTS "inquiry_type" text default 'general'; -- 'general', 'proposal'
ALTER TABLE "ProjectInquiry" ADD COLUMN IF NOT EXISTS "contact_name" text;
ALTER TABLE "ProjectInquiry" ADD COLUMN IF NOT EXISTS "contact_email" text;
ALTER TABLE "ProjectInquiry" ADD COLUMN IF NOT EXISTS "contact_phone" text;
