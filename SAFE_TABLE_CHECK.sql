-- ============================================
-- SAFE TABLE CHECK - Kollar endast existerande tabeller
-- ============================================
-- Denna query failar INTE om tabeller saknas

-- 1. Lista ALLA existerande tabeller
SELECT 
  table_name,
  pg_size_pretty(pg_total_relation_size('public.' || table_name)) as size,
  (SELECT COUNT(*) FROM information_schema.columns c 
   WHERE c.table_schema = 'public' AND c.table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Kolla vilka förväntade tabeller som SAKNAS
SELECT 
  expected_table,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = expected_table
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM (
  SELECT unnest(ARRAY[
    'tenants',
    'users',
    'user_settings',
    'leads',
    'customers',
    'monitoring_history',
    'customer_notes',
    'customer_monitoring_schedule',
    'cronjobs',
    'tenant_usage',
    'error_reports',
    'tenant_settings',
    'audit_logs',
    'api_quota',
    'shared_lead_access',
    'lead_deep_analysis',
    'notifications',
    'email_queue',
    'batch_analysis_jobs',
    'batch_analysis_items'
  ]) as expected_table
) expected_tables
ORDER BY 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = expected_table
    ) THEN 1
    ELSE 2
  END,
  expected_table;

-- 3. Räkna rader i ALLA existerande tabeller
DO $$
DECLARE
  table_record RECORD;
  row_count INTEGER;
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'TABLE ROW COUNTS (Only existing tables)';
  RAISE NOTICE '============================================';
  
  FOR table_record IN 
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM %I', table_record.table_name) INTO row_count;
    RAISE NOTICE '%-40s : %s rows', table_record.table_name, row_count;
  END LOOP;
  
  RAISE NOTICE '============================================';
END $$;
