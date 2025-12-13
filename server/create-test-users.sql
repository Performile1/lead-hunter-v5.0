-- Skapa DHL Sweden tenant
INSERT INTO tenants (id, company_name, domain, subdomain, primary_color, secondary_color, search_term, status)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'DHL Sweden',
  'dhl.se',
  'dhl-sweden',
  '#D40511',
  '#FFCC00',
  'DHL',
  'active'
) ON CONFLICT (subdomain) DO NOTHING;

-- Skapa Stockholm terminal
INSERT INTO terminals (id, name, code, city, status)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'Stockholm Terminal',
  'STO',
  'Stockholm',
  'active'
) ON CONFLICT (code) DO NOTHING;

-- 1. Tenant Admin för DHL Sweden
-- Lösenord: TenantAdmin2024!
INSERT INTO users (id, email, password_hash, full_name, role, tenant_id, status)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'admin@dhl.se',
  '$2b$10$YourHashedPasswordHere',
  'DHL Admin',
  'admin',
  '11111111-1111-1111-1111-111111111111',
  'active'
) ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  tenant_id = EXCLUDED.tenant_id;

-- 2. Manager
-- Lösenord: Manager2024!
INSERT INTO users (id, email, password_hash, full_name, role, tenant_id, status)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  'manager@dhl.se',
  '$2b$10$YourHashedPasswordHere',
  'Team Manager',
  'manager',
  '11111111-1111-1111-1111-111111111111',
  'active'
) ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  tenant_id = EXCLUDED.tenant_id;

-- 3. Terminal Chef
-- Lösenord: Terminal2024!
INSERT INTO users (id, email, password_hash, full_name, role, tenant_id, terminal_name, terminal_code, status)
VALUES (
  '55555555-5555-5555-5555-555555555555',
  'terminal@dhl.se',
  '$2b$10$YourHashedPasswordHere',
  'Stockholm Terminal Chef',
  'terminal_manager',
  '11111111-1111-1111-1111-111111111111',
  'Stockholm Terminal',
  'STO',
  'active'
) ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  tenant_id = EXCLUDED.tenant_id,
  terminal_code = EXCLUDED.terminal_code;

-- 4. Säljare FS
-- Lösenord: Sales2024!
INSERT INTO users (id, email, password_hash, full_name, role, tenant_id, manager_id, status)
VALUES (
  '66666666-6666-6666-6666-666666666666',
  'sales@dhl.se',
  '$2b$10$YourHashedPasswordHere',
  'Field Sales Representative',
  'fs',
  '11111111-1111-1111-1111-111111111111',
  '44444444-4444-4444-4444-444444444444',
  'active'
) ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  tenant_id = EXCLUDED.tenant_id,
  manager_id = EXCLUDED.manager_id;

-- 5. Säljare TS
-- Lösenord: Sales2024!
INSERT INTO users (id, email, password_hash, full_name, role, tenant_id, manager_id, status)
VALUES (
  '77777777-7777-7777-7777-777777777777',
  'telesales@dhl.se',
  '$2b$10$YourHashedPasswordHere',
  'Telesales Representative',
  'ts',
  '11111111-1111-1111-1111-111111111111',
  '44444444-4444-4444-4444-444444444444',
  'active'
) ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  tenant_id = EXCLUDED.tenant_id,
  manager_id = EXCLUDED.manager_id;

-- Lägg till postnummer för Stockholm terminal
INSERT INTO terminal_postal_codes (terminal_id, postal_code, city, priority)
SELECT 
  '22222222-2222-2222-2222-222222222222',
  postal_code,
  'Stockholm',
  1
FROM (
  VALUES ('100'), ('101'), ('102'), ('103'), ('104'), ('105'), ('106'), ('107'), ('108'), ('109'),
         ('110'), ('111'), ('112'), ('113'), ('114'), ('115'), ('116'), ('117'), ('118'), ('119'),
         ('120'), ('121'), ('122'), ('123'), ('124'), ('125'), ('126'), ('127'), ('128'), ('129')
) AS codes(postal_code)
ON CONFLICT DO NOTHING;
