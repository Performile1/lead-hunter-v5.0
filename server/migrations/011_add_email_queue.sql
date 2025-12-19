-- Migration: Add email_queue table
-- Created: 2025-12-18
-- Description: Email queue for asynchronous email sending with retry logic

CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Email details
  to_email VARCHAR(255) NOT NULL,
  from_email VARCHAR(255),
  reply_to VARCHAR(255),
  subject VARCHAR(500) NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT,
  
  -- Attachments (stored as JSON array)
  attachments JSONB,
  
  -- Email metadata
  email_type VARCHAR(50), -- welcome, password_reset, notification, lead_alert, etc
  related_entity_type VARCHAR(50), -- lead, customer, user, etc
  related_entity_id UUID,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  
  -- Error tracking
  last_error TEXT,
  last_attempt_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  scheduled_for TIMESTAMP DEFAULT NOW(), -- When to send (for delayed emails)
  sent_at TIMESTAMP,
  
  -- Priority (1-10, lower = higher priority)
  priority INTEGER DEFAULT 5,
  
  -- Constraints
  CONSTRAINT email_queue_status_check CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'cancelled')),
  CONSTRAINT email_queue_priority_check CHECK (priority BETWEEN 1 AND 10)
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status, priority, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_email_queue_tenant ON email_queue(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_type ON email_queue(email_type);
CREATE INDEX IF NOT EXISTS idx_email_queue_pending ON email_queue(status, scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_email_queue_created ON email_queue(created_at DESC);

-- Comments
COMMENT ON TABLE email_queue IS 'Queue for asynchronous email sending with retry logic';
COMMENT ON COLUMN email_queue.status IS 'Email status: pending, sending, sent, failed, cancelled';
COMMENT ON COLUMN email_queue.priority IS 'Priority 1-10, lower number = higher priority';
COMMENT ON COLUMN email_queue.scheduled_for IS 'When to send the email (for delayed sending)';

-- Function to queue an email
CREATE OR REPLACE FUNCTION queue_email(
  p_tenant_id UUID,
  p_to_email VARCHAR(255),
  p_subject VARCHAR(500),
  p_html_body TEXT,
  p_email_type VARCHAR(50) DEFAULT NULL,
  p_priority INTEGER DEFAULT 5,
  p_from_email VARCHAR(255) DEFAULT NULL,
  p_text_body TEXT DEFAULT NULL,
  p_scheduled_for TIMESTAMP DEFAULT NOW()
) RETURNS UUID AS $$
DECLARE
  v_email_id UUID;
BEGIN
  INSERT INTO email_queue (
    tenant_id,
    to_email,
    from_email,
    subject,
    html_body,
    text_body,
    email_type,
    priority,
    scheduled_for
  ) VALUES (
    p_tenant_id,
    p_to_email,
    p_from_email,
    p_subject,
    p_html_body,
    p_text_body,
    p_email_type,
    p_priority,
    p_scheduled_for
  ) RETURNING id INTO v_email_id;
  
  RETURN v_email_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get next pending email
CREATE OR REPLACE FUNCTION get_next_pending_email()
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  to_email VARCHAR(255),
  from_email VARCHAR(255),
  subject VARCHAR(500),
  html_body TEXT,
  text_body TEXT,
  attachments JSONB,
  attempts INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.tenant_id,
    e.to_email,
    e.from_email,
    e.subject,
    e.html_body,
    e.text_body,
    e.attachments,
    e.attempts
  FROM email_queue e
  WHERE e.status = 'pending'
    AND e.scheduled_for <= NOW()
    AND e.attempts < e.max_attempts
  ORDER BY e.priority ASC, e.created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
END;
$$ LANGUAGE plpgsql;

-- Function to mark email as sending
CREATE OR REPLACE FUNCTION mark_email_sending(
  p_email_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE email_queue
  SET 
    status = 'sending',
    attempts = attempts + 1,
    last_attempt_at = NOW()
  WHERE id = p_email_id
    AND status = 'pending';
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to mark email as sent
CREATE OR REPLACE FUNCTION mark_email_sent(
  p_email_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE email_queue
  SET 
    status = 'sent',
    sent_at = NOW()
  WHERE id = p_email_id;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to mark email as failed
CREATE OR REPLACE FUNCTION mark_email_failed(
  p_email_id UUID,
  p_error_message TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_updated INTEGER;
  v_attempts INTEGER;
  v_max_attempts INTEGER;
BEGIN
  -- Get current attempts
  SELECT attempts, max_attempts
  INTO v_attempts, v_max_attempts
  FROM email_queue
  WHERE id = p_email_id;
  
  -- If max attempts reached, mark as failed permanently
  IF v_attempts >= v_max_attempts THEN
    UPDATE email_queue
    SET 
      status = 'failed',
      last_error = p_error_message
    WHERE id = p_email_id;
  ELSE
    -- Otherwise, set back to pending for retry
    UPDATE email_queue
    SET 
      status = 'pending',
      last_error = p_error_message,
      scheduled_for = NOW() + INTERVAL '5 minutes' * attempts -- Exponential backoff
    WHERE id = p_email_id;
  END IF;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old sent emails (keep for 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_emails()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM email_queue
  WHERE status = 'sent'
    AND sent_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- Function to get email queue stats
CREATE OR REPLACE FUNCTION get_email_queue_stats()
RETURNS TABLE (
  total_pending INTEGER,
  total_sending INTEGER,
  total_sent_today INTEGER,
  total_failed INTEGER,
  avg_send_time_seconds NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE status = 'pending')::INTEGER as total_pending,
    COUNT(*) FILTER (WHERE status = 'sending')::INTEGER as total_sending,
    COUNT(*) FILTER (WHERE status = 'sent' AND sent_at >= CURRENT_DATE)::INTEGER as total_sent_today,
    COUNT(*) FILTER (WHERE status = 'failed')::INTEGER as total_failed,
    AVG(EXTRACT(EPOCH FROM (sent_at - created_at))) FILTER (WHERE status = 'sent')::NUMERIC as avg_send_time_seconds
  FROM email_queue;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT queue_email(
--   'tenant-id'::UUID,
--   'user@example.com',
--   'Welcome to Lead Hunter',
--   '<h1>Welcome!</h1><p>Thanks for joining.</p>',
--   'welcome',
--   5,
--   'noreply@leadhunter.com'
-- );
