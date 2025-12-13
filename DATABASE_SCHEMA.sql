-- DHL Lead Hunter - Komplett Database Schema
-- Multi-user system med roller, områden, postnummer, terminal chefer och centraliserad data
-- Version: 2.0 - Allt i en fil

-- ============================================
-- ANVÄNDARE & AUTENTISERING
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'terminal_manager', 'fs', 'ts', 'kam', 'dm')),
    terminal_name VARCHAR(255),
    terminal_code VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    avatar_url TEXT,
    phone VARCHAR(50)
);

-- Användares tilldelade områden OCH postnummer
CREATE TABLE user_regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    region_name VARCHAR(100) NOT NULL, -- "Västra Götaland", "Stockholm", etc.
    postal_codes TEXT[], -- Array av postnummer (första 3 siffrorna)
    region_type VARCHAR(50) DEFAULT 'geographic' CHECK (region_type IN ('geographic', 'postal_code', 'mixed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, region_name)
);

COMMENT ON COLUMN user_regions.postal_codes IS 'Array av postnummer som användaren har åtkomst till';
COMMENT ON COLUMN user_regions.region_type IS 'Typ av region: geographic (stad/län), postal_code (postnummer), mixed (båda)';

-- API-nycklar per användare (för programmatisk åtkomst)
CREATE TABLE user_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    key_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    last_used TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MANAGER HIERARKI
-- ============================================

-- Team-struktur för managers
CREATE TABLE manager_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manager_id UUID REFERENCES users(id) ON DELETE CASCADE,
    team_member_id UUID REFERENCES users(id) ON DELETE CASCADE,
    team_name VARCHAR(255),
    role_in_team VARCHAR(100), -- 'Team Lead', 'Senior', 'Junior', etc.
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    added_by UUID REFERENCES users(id),
    UNIQUE(manager_id, team_member_id)
);

CREATE INDEX idx_manager_teams_manager ON manager_teams(manager_id);
CREATE INDEX idx_manager_teams_member ON manager_teams(team_member_id);

COMMENT ON TABLE manager_teams IS 'Managers kan se alla sina teammedlemmars leads';
COMMENT ON COLUMN manager_teams.role_in_team IS 'Roll i teamet för rapportering och statistik';

-- ============================================
-- SYSTEM-INSTÄLLNINGAR
-- ============================================

CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- LLM-konfiguration
-- LLM-konfiguration (utökad)
CREATE TABLE llm_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(100) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    api_key_encrypted TEXT,
    is_enabled BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    max_tokens INTEGER DEFAULT 8000,
    temperature DECIMAL(3, 2) DEFAULT 0.2,
    cost_per_1m_tokens DECIMAL(10, 4),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, model_name)
);

CREATE INDEX idx_llm_configs_enabled ON llm_configurations(is_enabled);
CREATE INDEX idx_llm_configs_priority ON llm_configurations(priority);

-- API-konfigurationer (News, Tech, Data APIs)
CREATE TABLE api_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('llm', 'news', 'tech', 'data', 'other')),
    provider_name VARCHAR(100) NOT NULL,
    api_key_encrypted TEXT,
    api_endpoint TEXT,
    is_enabled BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    rate_limit_per_day INTEGER,
    rate_limit_per_minute INTEGER,
    cost_per_request DECIMAL(10, 4),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(service_type, provider_name)
);

CREATE INDEX idx_api_configs_type ON api_configurations(service_type);
CREATE INDEX idx_api_configs_enabled ON api_configurations(is_enabled);

COMMENT ON TABLE api_configurations IS 'Centraliserad konfiguration för alla externa API:er (LLM, News, Tech, etc.)';

-- ============================================
-- LEADS & FÖRETAGSDATA
-- ============================================

CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    org_number VARCHAR(20) UNIQUE,
    segment VARCHAR(10) CHECK (segment IN ('DM', 'TS', 'FS', 'KAM', 'UNKNOWN')),
    
    -- Adresser
    address TEXT,
    postal_code VARCHAR(10),
    city VARCHAR(100),
    visiting_address TEXT,
    warehouse_address TEXT,
    return_address TEXT,
    assigned_terminal_id UUID,
    assigned_salesperson_id UUID REFERENCES users(id),
    assigned_at TIMESTAMP,
    assigned_by UUID REFERENCES users(id),
    
    -- Kontakt
    phone_number VARCHAR(50),
    website_url TEXT,
    email_structure VARCHAR(100),
    
    -- Ekonomi
    revenue_tkr INTEGER,
    revenue_year VARCHAR(10),
    freight_budget_tkr INTEGER,
    financial_data JSONB, -- Historisk data, tillväxt, etc.
    
    -- Juridiskt & Kredit
    legal_status VARCHAR(100),
    credit_rating VARCHAR(50),
    credit_description TEXT,
    kronofogden_check TEXT,
    has_ftax VARCHAR(10),
    
    -- Logistik & Tech
    logistics_profile TEXT,
    markets TEXT,
    carriers TEXT,
    uses_dhl VARCHAR(10),
    ecommerce_platform VARCHAR(100),
    delivery_services JSONB,
    checkout_position TEXT,
    
    -- Företagsinfo
    parent_company VARCHAR(255),
    multi_brands TEXT,
    liquidity VARCHAR(50),
    trend_risk TEXT,
    trigger TEXT,
    
    -- Nyheter & Omdömen
    latest_news TEXT,
    latest_news_url TEXT,
    rating JSONB,
    
    -- Metadata
    source VARCHAR(50) CHECK (source IN ('ai', 'cache', 'manual', 'import')),
    analysis_date TIMESTAMP,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Sökdata
    source_links JSONB,
    search_log JSONB,
    
    -- Lead Tracking (NY!)
    view_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMP,
    last_viewed_by UUID REFERENCES users(id),
    unique_viewers INTEGER DEFAULT 0,
    total_time_viewed_seconds INTEGER DEFAULT 0
);

-- Index för snabbare sökningar
CREATE INDEX idx_leads_org_number ON leads(org_number);
CREATE INDEX idx_leads_company_name ON leads(company_name);
CREATE INDEX idx_leads_segment ON leads(segment);
CREATE INDEX idx_leads_created_by ON leads(created_by);
CREATE INDEX idx_leads_postal_code ON leads(postal_code);
CREATE INDEX idx_leads_city ON leads(city);
CREATE INDEX idx_leads_terminal ON leads(assigned_terminal_id);
CREATE INDEX idx_leads_salesperson ON leads(assigned_salesperson_id);

-- Beslutsfattare
CREATE TABLE decision_makers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    email VARCHAR(255),
    linkedin_url TEXT,
    direct_phone VARCHAR(50),
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_decision_makers_lead_id ON decision_makers(lead_id);

-- ============================================
-- LEAD TRACKING (Detaljerad logg)
-- ============================================

CREATE TABLE lead_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    time_spent_seconds INTEGER DEFAULT 0,
    tab_viewed VARCHAR(50), -- 'overview', 'contacts', 'competitive', 'website', 'history'
    action_taken VARCHAR(100), -- 'opened', 'exported', 'assigned', 'contacted', etc.
    ip_address VARCHAR(50),
    user_agent TEXT
);

CREATE INDEX idx_lead_views_lead ON lead_views(lead_id);
CREATE INDEX idx_lead_views_user ON lead_views(user_id);
CREATE INDEX idx_lead_views_date ON lead_views(viewed_at);

COMMENT ON TABLE lead_views IS 'Detaljerad logg över alla lead-visningar för analytics';

-- ============================================
-- EXKLUDERINGAR (DELAD MELLAN ANVÄNDARE)
-- ============================================

CREATE TABLE exclusions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    org_number VARCHAR(20),
    exclusion_type VARCHAR(50) CHECK (exclusion_type IN ('existing_customer', 'competitor', 'blacklist', 'incorrect_data', 'manual')),
    reason TEXT,
    added_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_name, org_number)
);

CREATE INDEX idx_exclusions_company_name ON exclusions(company_name);
CREATE INDEX idx_exclusions_org_number ON exclusions(org_number);
CREATE INDEX idx_exclusions_type ON exclusions(exclusion_type);

-- ============================================
-- NEDLADDNINGAR & EXPORTS
-- ============================================

CREATE TABLE downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    lead_ids UUID[] NOT NULL,
    file_format VARCHAR(20) CHECK (file_format IN ('csv', 'excel', 'json')),
    file_size_bytes INTEGER,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_downloads_user_id ON downloads(user_id);
CREATE INDEX idx_downloads_created_at ON downloads(created_at);

-- ============================================
-- AKTIVITETSLOGG
-- ============================================

CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    details JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action_type ON activity_logs(action_type);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- ============================================
-- CACHE (KANDIDATER)
-- ============================================

CREATE TABLE candidate_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_data JSONB NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    org_number VARCHAR(20),
    segment VARCHAR(10),
    revenue_tkr INTEGER,
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP,
    access_count INTEGER DEFAULT 0
);

CREATE INDEX idx_candidate_cache_company_name ON candidate_cache(company_name);
CREATE INDEX idx_candidate_cache_segment ON candidate_cache(segment);

-- ============================================
-- SÖKHISTORIK
-- ============================================

CREATE TABLE search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    search_params JSONB NOT NULL,
    region VARCHAR(100),
    results_count INTEGER,
    cache_hits INTEGER DEFAULT 0,
    api_calls_used INTEGER DEFAULT 0,
    duration_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_search_history_user_id ON search_history(user_id);
CREATE INDEX idx_search_history_created_at ON search_history(created_at);

-- ============================================
-- API-ANVÄNDNING & KOSTNADER
-- ============================================

CREATE TABLE api_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    provider VARCHAR(50) NOT NULL,
    model_name VARCHAR(100),
    tokens_used INTEGER,
    cost_usd DECIMAL(10, 4),
    request_type VARCHAR(50), -- 'search', 'analysis', 'batch'
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX idx_api_usage_provider ON api_usage(provider);
CREATE INDEX idx_api_usage_created_at ON api_usage(created_at);

-- ============================================
-- BACKUPS
-- ============================================

CREATE TABLE backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    backup_type VARCHAR(50) CHECK (backup_type IN ('manual', 'automatic', 'scheduled')),
    data JSONB NOT NULL,
    lead_count INTEGER,
    file_size_bytes INTEGER,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_backups_created_at ON backups(created_at);

-- ============================================
-- LEAD MONITORING (BEVAKNING)
-- ============================================

-- Lead Monitoring (Bevakning)
CREATE TABLE lead_monitoring (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    interval_days INTEGER NOT NULL DEFAULT 30,
    next_check_date TIMESTAMP NOT NULL,
    last_check_date TIMESTAMP,
    notification_email VARCHAR(255),
    auto_reanalyze BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    check_count INTEGER DEFAULT 0,
    
    -- Triggers (händelser att bevaka)
    trigger_revenue_increase BOOLEAN DEFAULT false,
    trigger_revenue_decrease BOOLEAN DEFAULT false,
    trigger_bankruptcy BOOLEAN DEFAULT false,
    trigger_liquidation BOOLEAN DEFAULT false,
    trigger_payment_remarks BOOLEAN DEFAULT false,
    trigger_warehouse_move BOOLEAN DEFAULT false,
    trigger_news BOOLEAN DEFAULT false,
    trigger_segment_change BOOLEAN DEFAULT false,
    
    -- Tröskelvärden
    revenue_change_threshold_percent INTEGER DEFAULT 10,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_monitoring_next_check ON lead_monitoring(next_check_date) WHERE is_active = true;
CREATE INDEX idx_monitoring_user ON lead_monitoring(user_id);
CREATE INDEX idx_monitoring_lead ON lead_monitoring(lead_id);

-- Monitoring Executions (Körningshistorik)
CREATE TABLE monitoring_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monitoring_id UUID REFERENCES lead_monitoring(id) ON DELETE CASCADE,
    executed_at TIMESTAMP DEFAULT NOW(),
    changes_detected TEXT,
    changes_data JSONB,
    error_message TEXT,
    duration_ms INTEGER,
    
    -- Triggers som aktiverades
    triggered_events JSONB,
    notification_sent BOOLEAN DEFAULT false
);

CREATE INDEX idx_executions_monitoring ON monitoring_executions(monitoring_id);
CREATE INDEX idx_executions_date ON monitoring_executions(executed_at);

-- Trigger Events Log (Detaljerad logg av triggers)
CREATE TABLE trigger_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monitoring_id UUID REFERENCES lead_monitoring(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    trigger_type VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    change_percentage DECIMAL(10,2),
    severity VARCHAR(20) DEFAULT 'medium',
    notification_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_trigger_events_monitoring ON trigger_events(monitoring_id);
CREATE INDEX idx_trigger_events_lead ON trigger_events(lead_id);
CREATE INDEX idx_trigger_events_type ON trigger_events(trigger_type);
CREATE INDEX idx_trigger_events_date ON trigger_events(created_at);

-- ============================================
-- SCHEDULED BATCH JOBS (SCHEMALAGDA BATCH-JOBB)
-- ============================================

-- Scheduled Batch Jobs
CREATE TABLE scheduled_batch_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    job_name VARCHAR(255) NOT NULL,
    job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('search', 'analysis', 'both')),
    
    -- Schema
    schedule_time TIME NOT NULL,
    schedule_days VARCHAR(50) DEFAULT 'weekdays',
    is_active BOOLEAN DEFAULT true,
    
    -- Sökparametrar
    search_query TEXT,
    search_filters JSONB,
    max_results INTEGER DEFAULT 50,
    
    -- Analysparametrar
    analysis_protocol VARCHAR(50) DEFAULT 'quick',
    llm_provider VARCHAR(50) DEFAULT 'gemini',
    auto_assign BOOLEAN DEFAULT false,
    assign_to_terminal UUID REFERENCES terminals(id),
    
    -- Statistik
    last_run_at TIMESTAMP,
    next_run_at TIMESTAMP,
    total_runs INTEGER DEFAULT 0,
    total_leads_found INTEGER DEFAULT 0,
    total_leads_analyzed INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_scheduled_jobs_next_run ON scheduled_batch_jobs(next_run_at) WHERE is_active = true;
CREATE INDEX idx_scheduled_jobs_created_by ON scheduled_batch_jobs(created_by);
CREATE INDEX idx_scheduled_jobs_type ON scheduled_batch_jobs(job_type);

-- Batch Job Executions (Körningshistorik)
CREATE TABLE batch_job_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES scheduled_batch_jobs(id) ON DELETE CASCADE,
    executed_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'running',
    
    -- Resultat
    leads_found INTEGER DEFAULT 0,
    leads_analyzed INTEGER DEFAULT 0,
    leads_created INTEGER DEFAULT 0,
    leads_skipped INTEGER DEFAULT 0,
    
    -- Detaljer
    execution_time_ms INTEGER,
    error_message TEXT,
    execution_log JSONB,
    
    completed_at TIMESTAMP
);

CREATE INDEX idx_batch_executions_job ON batch_job_executions(job_id);
CREATE INDEX idx_batch_executions_date ON batch_job_executions(executed_at);
CREATE INDEX idx_batch_executions_status ON batch_job_executions(status);

-- ============================================
-- WEBSITE SCRAPING (E-HANDEL ANALYS)
-- ============================================

-- Website Analysis (Scraping-resultat)
CREATE TABLE website_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    scraped_at TIMESTAMP DEFAULT NOW(),
    
    -- E-handel
    ecommerce_platform VARCHAR(100),
    has_checkout BOOLEAN DEFAULT false,
    checkout_providers JSONB,
    
    -- Transportörer (KRITISKT!)
    shipping_providers JSONB,
    has_dhl BOOLEAN DEFAULT false,
    dhl_position INTEGER,
    competitor_count INTEGER DEFAULT 0,
    
    -- Leveransalternativ
    delivery_options JSONB,
    
    -- Fraktvillkor
    free_shipping_threshold INTEGER,
    standard_shipping_cost INTEGER,
    express_available BOOLEAN DEFAULT false,
    international_shipping BOOLEAN DEFAULT false,
    
    -- Marknader
    markets JSONB,
    
    -- Teknologier
    technologies JSONB,
    
    -- Nyckeltal
    liquidity DECIMAL(10,2),
    solidity DECIMAL(10,2),
    profit_margin DECIMAL(10,2),
    
    -- Metadata
    scrape_duration_ms INTEGER,
    scrape_status VARCHAR(50) DEFAULT 'completed',
    error_message TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_website_analysis_lead ON website_analysis(lead_id);
CREATE INDEX idx_website_analysis_has_dhl ON website_analysis(has_dhl);
CREATE INDEX idx_website_analysis_platform ON website_analysis(ecommerce_platform);
CREATE INDEX idx_website_analysis_scraped ON website_analysis(scraped_at);

-- Shipping Providers (Detaljerad transportör-info)
CREATE TABLE shipping_provider_detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    website_analysis_id UUID REFERENCES website_analysis(id) ON DELETE CASCADE,
    provider_name VARCHAR(100) NOT NULL,
    provider_type VARCHAR(50), -- 'dhl', 'competitor', 'other'
    
    -- Position
    position_in_checkout INTEGER,
    is_default BOOLEAN DEFAULT false,
    
    -- Detaljer
    mentioned_on_pages JSONB,
    logo_found BOOLEAN DEFAULT false,
    has_tracking BOOLEAN DEFAULT false,
    
    -- Kostnad (om synlig)
    cost_sek INTEGER,
    delivery_time_days INTEGER,
    
    detected_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shipping_detections_analysis ON shipping_provider_detections(website_analysis_id);
CREATE INDEX idx_shipping_detections_provider ON shipping_provider_detections(provider_name);
CREATE INDEX idx_shipping_detections_type ON shipping_provider_detections(provider_type);

-- Competitive Intelligence (Konkurrent-analys)
CREATE TABLE competitive_intelligence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    
    -- DHL Status
    is_dhl_customer BOOLEAN DEFAULT false,
    dhl_services JSONB, -- Vilka DHL-tjänster de använder
    dhl_checkout_position INTEGER,
    
    -- Konkurrenter
    primary_competitor VARCHAR(100),
    all_competitors JSONB,
    competitor_count INTEGER DEFAULT 0,
    
    -- Opportunity Score
    opportunity_score INTEGER, -- 0-100
    opportunity_reason TEXT,
    
    -- Rekommendation
    recommended_action VARCHAR(50), -- 'contact', 'monitor', 'ignore'
    sales_pitch TEXT,
    
    analyzed_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_competitive_intel_lead ON competitive_intelligence(lead_id);
CREATE INDEX idx_competitive_intel_dhl ON competitive_intelligence(is_dhl_customer);
CREATE INDEX idx_competitive_intel_score ON competitive_intelligence(opportunity_score);

-- ============================================
-- TERMINALER (NYA TABELLER)
-- ============================================

-- Terminaler
CREATE TABLE terminals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(10),
    region VARCHAR(100),
    manager_user_id UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_terminals_code ON terminals(code);
CREATE INDEX idx_terminals_manager ON terminals(manager_user_id);

COMMENT ON TABLE terminals IS 'DHL-terminaler i Sverige';

-- Terminal-postnummer mapping
CREATE TABLE terminal_postal_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    terminal_id UUID REFERENCES terminals(id) ON DELETE CASCADE,
    postal_code VARCHAR(10) NOT NULL,
    city VARCHAR(100),
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(terminal_id, postal_code)
);

CREATE INDEX idx_terminal_postal_codes_terminal ON terminal_postal_codes(terminal_id);
CREATE INDEX idx_terminal_postal_codes_postal ON terminal_postal_codes(postal_code);

COMMENT ON TABLE terminal_postal_codes IS 'Postnummer som tillhör varje terminal';

-- Lägg till foreign key för leads
ALTER TABLE leads ADD CONSTRAINT fk_leads_terminal 
    FOREIGN KEY (assigned_terminal_id) REFERENCES terminals(id);

-- ============================================
-- INITIAL DATA
-- ============================================

-- Admin-användare (lösenord: Admin123! - ÄNDRA DETTA!)
INSERT INTO users (email, password_hash, full_name, role, status) VALUES
('admin@dhl.se', '$2b$10$YourHashedPasswordHere', 'System Administrator', 'admin', 'active');

-- System-inställningar
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('app_name', 'DHL Lead Hunter', 'string', 'Applikationens namn'),
('max_leads_per_search', '50', 'number', 'Max antal leads per sökning'),
('cache_ttl_days', '30', 'number', 'Antal dagar att behålla cache'),
('enable_auto_backup', 'true', 'boolean', 'Automatiska backups'),
('backup_interval_hours', '24', 'number', 'Backup-intervall i timmar'),
('default_segment', 'FS', 'string', 'Standard-segment för nya användare');

-- LLM-konfigurationer
INSERT INTO llm_configurations (provider, model_name, is_enabled, priority, cost_per_1m_tokens, metadata) VALUES
('Google Gemini', 'gemini-2.0-flash-exp', true, 100, 0.30, '{"features": ["web_search", "grounding"], "free_tier": true}'),
('Groq', 'llama-3.1-70b-versatile', true, 90, 0.00, '{"features": ["fast", "free"], "free_tier": true}'),
('OpenAI', 'gpt-4o-mini', false, 80, 0.60, '{"features": ["high_quality"]}'),
('Anthropic Claude', 'claude-3-5-haiku-20241022', false, 70, 4.00, '{"features": ["long_context", "reasoning"]}'),
('Ollama', 'llama3.1', false, 60, 0.00, '{"features": ["local", "free"], "local": true}');

-- API-konfigurationer
INSERT INTO api_configurations (service_type, provider_name, is_enabled, priority, metadata) VALUES
-- News APIs
('news', 'NewsAPI.org', false, 100, '{"features": ["global_news", "swedish_news"], "rate_limit": "100/day"}'),
('news', 'Breakit API', false, 90, '{"features": ["swedish_tech_news"], "language": "sv"}'),
-- Tech Analysis
('tech', 'BuiltWith', false, 100, '{"features": ["tech_stack", "ecommerce_detection"]}'),
('tech', 'Wappalyzer', false, 90, '{"features": ["tech_stack", "fast"]}'),
-- Data APIs
('data', 'Bolagsverket', true, 100, '{"features": ["official_data", "free"], "free": true}'),
('data', 'Kronofogden', true, 100, '{"features": ["bankruptcy", "free"], "free": true}'),
('data', 'UC', false, 80, '{"features": ["credit_rating", "financial_data"]}'),
('data', 'SCB', true, 70, '{"features": ["statistics", "sni_codes", "free"], "free": true}'),
-- Search APIs
('other', 'Tavily Search', false, 100, '{"features": ["web_search", "llm_optimized"]}');

-- Terminaler
INSERT INTO terminals (name, code, city, region, status) VALUES
('DHL Stockholm', 'STO', 'Stockholm', 'Stockholm', 'active'),
('DHL Göteborg', 'GOT', 'Göteborg', 'Västra Götaland', 'active'),
('DHL Malmö', 'MAL', 'Malmö', 'Skåne', 'active'),
('DHL Uppsala', 'UPP', 'Uppsala', 'Uppsala', 'active'),
('DHL Linköping', 'LIN', 'Linköping', 'Östergötland', 'active'),
('DHL Örebro', 'ORE', 'Örebro', 'Örebro', 'active'),
('DHL Västerås', 'VAS', 'Västerås', 'Västmanland', 'active'),
('DHL Jönköping', 'JON', 'Jönköping', 'Jönköping', 'active'),
('DHL Helsingborg', 'HEL', 'Helsingborg', 'Skåne', 'active'),
('DHL Norrköping', 'NOR', 'Norrköping', 'Östergötland', 'active');

-- Postnummer för Stockholm terminal (100-139)
INSERT INTO terminal_postal_codes (terminal_id, postal_code, city, priority) 
SELECT id, postal_code, 'Stockholm', 1 FROM terminals, 
(SELECT generate_series(100, 139)::text AS postal_code) AS postal_data
WHERE terminals.code = 'STO';

-- Postnummer för Göteborg terminal (400-439)
INSERT INTO terminal_postal_codes (terminal_id, postal_code, city, priority)
SELECT id, postal_code, 'Göteborg', 1 FROM terminals,
(SELECT generate_series(400, 439)::text AS postal_code) AS postal_data
WHERE terminals.code = 'GOT';

-- Postnummer för Malmö terminal (200-239)
INSERT INTO terminal_postal_codes (terminal_id, postal_code, city, priority)
SELECT id, postal_code, 'Malmö', 1 FROM terminals,
(SELECT generate_series(200, 239)::text AS postal_code) AS postal_data
WHERE terminals.code = 'MAL';

-- ============================================
-- VIEWS FÖR RAPPORTER
-- ============================================

-- Användare med statistik
CREATE VIEW user_stats AS
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.role,
    COUNT(DISTINCT l.id) as leads_created,
    COUNT(DISTINCT d.id) as downloads_count,
    COUNT(DISTINCT s.id) as searches_count,
    SUM(a.cost_usd) as total_cost_usd,
    MAX(u.last_login) as last_login
FROM users u
LEFT JOIN leads l ON l.created_by = u.id
LEFT JOIN downloads d ON d.user_id = u.id
LEFT JOIN search_history s ON s.user_id = u.id
LEFT JOIN api_usage a ON a.user_id = u.id
GROUP BY u.id, u.email, u.full_name, u.role;

-- Daglig användning
CREATE VIEW daily_usage AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_searches,
    SUM(results_count) as total_results,
    SUM(api_calls_used) as total_api_calls,
    AVG(duration_ms) as avg_duration_ms
FROM search_history
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- LLM-kostnader per dag
CREATE VIEW daily_llm_costs AS
SELECT 
    DATE(created_at) as date,
    provider,
    COUNT(*) as request_count,
    SUM(tokens_used) as total_tokens,
    SUM(cost_usd) as total_cost_usd
FROM api_usage
GROUP BY DATE(created_at), provider
ORDER BY date DESC, total_cost_usd DESC;

-- ============================================
-- VIEWS FÖR TERMINAL MANAGERS
-- ============================================

-- View för terminal managers att se sina kunder
CREATE OR REPLACE VIEW terminal_manager_leads AS
SELECT 
    l.*,
    t.name as terminal_name,
    t.code as terminal_code,
    u.full_name as manager_name
FROM leads l
LEFT JOIN terminals t ON l.assigned_terminal_id = t.id
LEFT JOIN users u ON t.manager_user_id = u.id;

-- View för att se leads per postnummer
CREATE OR REPLACE VIEW leads_by_postal_code AS
SELECT 
    l.postal_code,
    l.city,
    COUNT(*) as lead_count,
    SUM(l.revenue_tkr) as total_revenue_tkr,
    t.name as assigned_terminal,
    t.code as terminal_code
FROM leads l
LEFT JOIN terminals t ON l.assigned_terminal_id = t.id
WHERE l.postal_code IS NOT NULL
GROUP BY l.postal_code, l.city, t.name, t.code
ORDER BY lead_count DESC;

-- ============================================
-- FUNKTIONER
-- ============================================

-- Funktion för att hitta terminal baserat på postnummer
CREATE OR REPLACE FUNCTION find_terminal_by_postal_code(p_postal_code VARCHAR)
RETURNS UUID AS $$
DECLARE
    v_terminal_id UUID;
BEGIN
    SELECT terminal_id INTO v_terminal_id
    FROM terminal_postal_codes
    WHERE postal_code = LEFT(p_postal_code, 3)
    ORDER BY priority DESC
    LIMIT 1;
    
    RETURN v_terminal_id;
END;
$$ LANGUAGE plpgsql;

-- Funktion för att automatiskt tilldela terminal till lead
CREATE OR REPLACE FUNCTION auto_assign_terminal()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.postal_code IS NOT NULL AND NEW.assigned_terminal_id IS NULL THEN
        NEW.assigned_terminal_id := find_terminal_by_postal_code(NEW.postal_code);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger för auto-tilldelning
CREATE TRIGGER trigger_auto_assign_terminal
    BEFORE INSERT OR UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_terminal();

-- Uppdatera updated_at automatiskt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers för updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- KOMMENTARER
-- ============================================

COMMENT ON TABLE users IS 'DHL-säljare, terminal chefer och administratörer';
COMMENT ON TABLE user_regions IS 'Geografiska områden och postnummer som användare har tillgång till';
COMMENT ON TABLE leads IS 'Alla företag/leads i systemet med postnummer och terminal-tilldelning';
COMMENT ON TABLE exclusions IS 'Företag som ska exkluderas från sökningar (delat mellan alla användare)';
COMMENT ON TABLE activity_logs IS 'Logg över alla användaraktiviteter';
COMMENT ON TABLE api_usage IS 'Spårning av API-användning och kostnader';
COMMENT ON TABLE llm_configurations IS 'Konfiguration av olika LLM-providers';
COMMENT ON TABLE terminals IS 'DHL-terminaler med ansvariga managers';
COMMENT ON TABLE terminal_postal_codes IS 'Postnummer som tillhör varje terminal';
COMMENT ON COLUMN users.terminal_name IS 'Terminal namn för terminal managers';
COMMENT ON COLUMN leads.assigned_terminal_id IS 'Automatiskt tilldelad terminal baserat på postnummer';
