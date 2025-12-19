-- ============================================
-- QUICK TABLE CHECK - Enkel översikt
-- ============================================

-- Kör denna för en snabb översikt av alla tabeller

SELECT 
  t.table_name,
  CASE 
    WHEN t.table_name IN (
      'tenants', 'users', 'user_settings', 'leads', 'customers',
      'monitoring_history', 'customer_notes', 'cronjobs', 'tenant_usage',
      'error_reports', 'tenant_settings', 'audit_logs', 'api_quota',
      'shared_lead_access', 'lead_deep_analysis', 'notifications',
      'email_queue', 'batch_analysis_jobs', 'batch_analysis_items'
    ) THEN '✅ Expected'
    ELSE '📋 Other'
  END as status,
  (
    SELECT COUNT(*) 
    FROM information_schema.columns c 
    WHERE c.table_schema = 'public' 
    AND c.table_name = t.table_name
  ) as column_count,
  pg_size_pretty(pg_total_relation_size('public.' || t.table_name)) as size
FROM information_schema.tables t
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
ORDER BY 
  CASE 
    WHEN t.table_name IN (
      'tenants', 'users', 'user_settings', 'leads', 'customers',
      'monitoring_history', 'customer_notes', 'cronjobs', 'tenant_usage',
      'error_reports', 'tenant_settings', 'audit_logs', 'api_quota',
      'shared_lead_access', 'lead_deep_analysis', 'notifications',
      'email_queue', 'batch_analysis_jobs', 'batch_analysis_items'
    ) THEN 1
    ELSE 2
  END,
  t.table_name;
