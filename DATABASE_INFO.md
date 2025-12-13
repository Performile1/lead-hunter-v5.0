# 📊 Databas-Information

## ✅ EN Komplett Databas-fil

**Fil:** `DATABASE_SCHEMA.sql`

**Innehåll:** ALLT du behöver i EN fil!
- ✅ 17 tabeller
- ✅ Användare med 7 roller
- ✅ Postnummer-system
- ✅ Terminal chefer
- ✅ LLM-konfigurationer
- ✅ API-konfigurationer
- ✅ Leads med auto-tilldelning
- ✅ Views för rapporter
- ✅ Triggers för automation
- ✅ Initial data (10 terminaler, 400+ postnummer)

---

## 🚀 Installation

### Steg 1: Skapa Databas
```bash
createdb dhl_lead_hunter
```

### Steg 2: Kör Schema (EN fil!)
```bash
psql -d dhl_lead_hunter -f DATABASE_SCHEMA.sql
```

**Klart!** 🎉

---

## 📋 Vad Som Skapas

### Tabeller (17 st)
1. **users** - Användare med roller och terminal-info
2. **user_regions** - Regioner OCH postnummer per användare
3. **user_api_keys** - API-nycklar för programmatisk åtkomst
4. **system_settings** - Systeminställningar
5. **llm_configurations** - LLM-providers (Gemini, Groq, OpenAI, Claude, Ollama)
6. **api_configurations** - Externa API:er (News, Tech, Data)
7. **terminals** - 10 DHL-terminaler
8. **terminal_postal_codes** - 400+ postnummer mappade till terminaler
9. **leads** - Företag med auto-tilldelning till terminal
10. **decision_makers** - Beslutsfattare per lead
11. **exclusions** - Exkluderade företag (delad lista)
12. **downloads** - Nedladdningshistorik
13. **activity_logs** - Audit logging
14. **candidate_cache** - Cache för kandidater
15. **search_history** - Sökhistorik
16. **api_usage** - API-användning och kostnader
17. **backups** - Backup-hantering

### Views (5 st)
- **user_stats** - Användarstatistik
- **daily_usage** - Daglig användning
- **daily_llm_costs** - LLM-kostnader per dag
- **terminal_manager_leads** - Leads per terminal
- **leads_by_postal_code** - Leads per postnummer

### Funktioner (3 st)
- **find_terminal_by_postal_code()** - Hitta terminal från postnummer
- **auto_assign_terminal()** - Auto-tilldela terminal till lead
- **update_updated_at_column()** - Auto-uppdatera timestamps

### Triggers (4 st)
- **trigger_auto_assign_terminal** - Auto-tilldelning vid INSERT/UPDATE
- **update_users_updated_at** - Timestamp för users
- **update_leads_updated_at** - Timestamp för leads
- **update_system_settings_updated_at** - Timestamp för settings

### Initial Data
- ✅ 1 admin-användare (admin@dhl.se)
- ✅ 6 systeminställningar
- ✅ 5 LLM-konfigurationer (Gemini, Groq, OpenAI, Claude, Ollama)
- ✅ 9 API-konfigurationer (NewsAPI, BuiltWith, Kronofogden, etc.)
- ✅ 10 terminaler (Stockholm, Göteborg, Malmö, etc.)
- ✅ 400+ postnummer (100-139 för Stockholm, 400-439 för Göteborg, etc.)

---

## 🗺️ Postnummer-System

### Automatisk Tilldelning
När ett lead skapas med postnummer, tilldelas det automatiskt rätt terminal:

```sql
-- Exempel: Lead med postnummer 10115 (Stockholm)
INSERT INTO leads (company_name, postal_code, city)
VALUES ('Test AB', '10115', 'Stockholm');

-- Automatiskt: assigned_terminal_id = Stockholm terminal
```

### Fördefinierade Postnummer
- **Stockholm (STO)**: 100-139
- **Göteborg (GOT)**: 400-439
- **Malmö (MAL)**: 200-239

### Lägg Till Fler Postnummer
```sql
-- Lägg till postnummer för Uppsala terminal
INSERT INTO terminal_postal_codes (terminal_id, postal_code, city, priority)
SELECT id, generate_series(750, 759)::text, 'Uppsala', 1
FROM terminals WHERE code = 'UPP';
```

---

## 👥 Roller & Behörigheter

### 7 Roller
1. **admin** - Full åtkomst
2. **manager** - Team-hantering
3. **terminal_manager** - Terminal-specifik åtkomst
4. **fs** - Field Sales
5. **ts** - Telesales
6. **kam** - Key Account Manager
7. **dm** - Decision Maker

### Postnummer-Filtrering
- **Terminal Managers**: Ser bara leads i sina postnummer
- **FS/TS/KAM/DM**: Ser bara leads i tilldelade regioner/postnummer
- **Admin/Manager**: Ser allt

---

## 🔧 Vanliga Frågor

### Hur lägger jag till en ny terminal?
```sql
INSERT INTO terminals (name, code, city, region)
VALUES ('DHL Umeå', 'UME', 'Umeå', 'Västerbotten');

-- Lägg till postnummer
INSERT INTO terminal_postal_codes (terminal_id, postal_code, city)
SELECT id, generate_series(900, 909)::text, 'Umeå'
FROM terminals WHERE code = 'UME';
```

### Hur ändrar jag admin-lösenord?
```sql
-- Generera nytt hash med bcrypt först, sedan:
UPDATE users 
SET password_hash = '$2b$10$NewHashHere'
WHERE email = 'admin@dhl.se';
```

### Hur aktiverar jag en LLM-provider?
```sql
UPDATE llm_configurations 
SET is_enabled = true, priority = 90
WHERE provider = 'Groq';
```

### Hur ser jag alla leads för en terminal?
```sql
SELECT * FROM terminal_manager_leads
WHERE terminal_code = 'STO';
```

---

## 📊 Statistik

### Databas-Storlek
- **Tabeller**: 17 st
- **Views**: 5 st
- **Funktioner**: 3 st
- **Triggers**: 4 st
- **Initial Data**: ~450 rader

### Kapacitet
- **Användare**: Obegränsat
- **Leads**: Obegränsat
- **Postnummer**: 1000+ (lätt att utöka)
- **Terminaler**: 10 (lätt att lägga till fler)

---

## 🎉 Sammanfattning

**EN fil = ALLT du behöver!**

```bash
# Så här enkelt är det:
createdb dhl_lead_hunter
psql -d dhl_lead_hunter -f DATABASE_SCHEMA.sql
```

**Klart!** 🚀

Ingen DATABASE_SCHEMA_V2.sql längre - allt är i `DATABASE_SCHEMA.sql`!
