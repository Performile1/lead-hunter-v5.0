-- ============================================
-- CHECK ALL TABLES IN DATABASE
-- ============================================
-- Kör denna SQL i Supabase SQL Editor för att se alla tabeller

-- 1. Lista alla tabeller med antal rader
SELECT 
  schemaname,
  tablename,
  (SELECT COUNT(*) FROM pg_catalog.pg_class c 
   JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace 
   WHERE c.relname = t.tablename AND n.nspname = t.schemaname) as exists,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_catalog.pg_tables t
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY schemaname, tablename;

-- 2. Detaljerad information om varje tabell
SELECT 
  table_schema,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 3. Räkna rader i varje tabell
DO $$
DECLARE
  table_record RECORD;
  row_count INTEGER;
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'TABLE ROW COUNTS';
  RAISE NOTICE '============================================';
  
  FOR table_record IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM %I', table_record.tablename) INTO row_count;
    RAISE NOTICE '% : % rows', RPAD(table_record.tablename, 40), row_count;
  END LOOP;
END $$;

-- 4. Kolla specifika tabeller vi förväntar oss
SELECT 
  table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = expected_tables.table_name
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM (
  VALUES 
    ('tenants'),
    ('users'),
    ('user_settings'),
    ('leads'),
    ('customers'),
    ('monitoring_history'),
    ('customer_notes'),
    ('cronjobs'),
    ('tenant_usage'),
    ('error_reports'),
    ('tenant_settings'),
    ('audit_logs'),
    ('api_quota'),
    ('shared_lead_access'),
    ('lead_deep_analysis'),
    ('notifications'),
    ('email_queue'),
    ('batch_analysis_jobs'),
    ('batch_analysis_items')
) AS expected_tables(table_name)
ORDER BY table_name;

-- 5. Visa kolumner för varje tabell
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 6. Kolla indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 7. Kolla functions/routines
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 8. Snabb översikt - Alla tabeller med radantal (endast existerande tabeller)
DO $$
DECLARE
  table_record RECORD;
  row_count INTEGER;
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'ROW COUNTS FOR ALL TABLES';
  RAISE NOTICE '============================================';
  
  FOR table_record IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM %I', table_record.tablename) INTO row_count;
    RAISE NOTICE '%-40s : %s rows', table_record.tablename, row_count;
  END LOOP;
  
  RAISE NOTICE '============================================';
END $$;

-- 9. Kolla vilka migrations som har körts (om du har en migrations tabell)
-- Om du inte har en migrations tabell, skippa denna
-- SELECT * FROM migrations ORDER BY id;

-- 10. Sammanfattning
SELECT 
  COUNT(*) as total_tables,
  SUM(CASE WHEN table_type = 'BASE TABLE' THEN 1 ELSE 0 END) as base_tables,
  SUM(CASE WHEN table_type = 'VIEW' THEN 1 ELSE 0 END) as views
FROM information_schema.tables
WHERE table_schema = 'public';
