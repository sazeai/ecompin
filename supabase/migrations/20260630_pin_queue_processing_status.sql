-- ============================================================================
-- Migration: 20260630_pin_queue_processing_status.sql
--
-- Purpose : Add 'processing' to the pin_queue.status CHECK constraint so the
--           publisher's atomic-claim step can lock rows without violating it.
--
-- Background:
--   The publisher in trigger/publish-pins.ts performs an optimistic lock by
--   flipping pin_queue.status from 'pending' to 'processing' before publishing.
--   The original constraint only allowed ('pending','published','cancelled'),
--   so every claim UPDATE failed silently — no pin was ever published.
--
-- Safety:
--   • Idempotent: safe to re-run. Uses DO blocks + IF EXISTS guards.
--   • Atomic: wrapped in a transaction so any failure rolls back cleanly.
--   • Non-destructive: all previously-valid statuses remain valid.
-- ============================================================================

BEGIN;

DO $$
BEGIN
  -- 1. Drop the old check constraint if it exists.
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'pin_queue_status_check'
      AND conrelid = 'public.pin_queue'::regclass
  ) THEN
    ALTER TABLE public.pin_queue DROP CONSTRAINT pin_queue_status_check;
  END IF;
END $$;

-- 2. Re-create the constraint with 'processing' included.
ALTER TABLE public.pin_queue
  ADD CONSTRAINT pin_queue_status_check
  CHECK (status IN ('pending', 'processing', 'published', 'cancelled'));

-- 3. Index: makes the publisher's hot-path query
--    (WHERE user_id = ? AND status = 'pending' ORDER BY priority, created_at)
--    fast even when the queue grows large.
CREATE INDEX IF NOT EXISTS idx_pin_queue_user_status_priority_created
  ON public.pin_queue (user_id, status, priority, created_at);

COMMIT;