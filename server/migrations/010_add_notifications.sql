-- Migration: Add notifications table
-- Created: 2025-12-18
-- Description: Notification system for users - new leads, quota warnings, customer updates, etc.

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification details
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Metadata
  data JSONB, -- Additional context (lead_id, customer_id, etc)
  link VARCHAR(500), -- URL to related resource
  
  -- Status
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  
  -- Priority
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
  
  -- Created by (optional - for system notifications this can be NULL)
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- Optional expiration for temporary notifications
  
  -- Constraints
  CONSTRAINT notifications_type_check CHECK (type IN (
    'new_lead', 
    'lead_assigned', 
    'quota_warning', 
    'quota_exceeded',
    'customer_update', 
    'customer_converted',
    'checkout_change', 
    'competitor_detected',
    'error_report', 
    'system_alert',
    'cronjob_complete',
    'cronjob_failed',
    'message',
    'warning'
  )),
  CONSTRAINT notifications_priority_check CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON notifications(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority, read);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = FALSE;

-- Comments
COMMENT ON TABLE notifications IS 'User notifications for leads, customers, system alerts, etc';
COMMENT ON COLUMN notifications.type IS 'Type of notification (new_lead, quota_warning, etc)';
COMMENT ON COLUMN notifications.data IS 'JSON object with additional context (lead_id, customer_id, etc)';
COMMENT ON COLUMN notifications.priority IS 'Priority level: low, normal, high, urgent';

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_tenant_id UUID,
  p_user_id UUID,
  p_type VARCHAR(50),
  p_title VARCHAR(255),
  p_message TEXT,
  p_data JSONB DEFAULT NULL,
  p_link VARCHAR(500) DEFAULT NULL,
  p_priority VARCHAR(20) DEFAULT 'normal'
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    tenant_id,
    user_id,
    type,
    title,
    message,
    data,
    link,
    priority
  ) VALUES (
    p_tenant_id,
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_data,
    p_link,
    p_priority
  ) RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(
  p_notification_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE notifications
  SET read = TRUE, read_at = NOW()
  WHERE id = p_notification_id
    AND user_id = p_user_id
    AND read = FALSE;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(
  p_user_id UUID
) RETURNS INTEGER AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE notifications
  SET read = TRUE, read_at = NOW()
  WHERE user_id = p_user_id
    AND read = FALSE;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$ LANGUAGE plpgsql;

-- Function to get unread count for user
CREATE OR REPLACE FUNCTION get_unread_notification_count(
  p_user_id UUID
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM notifications
  WHERE user_id = p_user_id
    AND read = FALSE
    AND (expires_at IS NULL OR expires_at > NOW());
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-delete expired notifications (runs daily via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE expires_at IS NOT NULL
    AND expires_at < NOW();
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT create_notification(
--   'tenant-id'::UUID,
--   'user-id'::UUID,
--   'new_lead',
--   'Nytt lead tilldelat',
--   'Du har fått ett nytt lead: Acme AB',
--   '{"lead_id": "lead-uuid", "company_name": "Acme AB"}'::JSONB,
--   '/leads/lead-uuid',
--   'normal'
-- );
