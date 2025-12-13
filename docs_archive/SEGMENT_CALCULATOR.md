# 🧮 Segment-Kalkylator - DHL Lead Hunter

## 📊 Beräkningsformel

**Fraktomsättning = Bolagsomsättning × 5%**

---

## 📋 Segment-Tabell

| Segment | Fraktomsättning/år | Bolagsomsättning | Beskrivning |
|---------|-------------------|------------------|-------------|
| **DM** | 0 - 250,000 kr | 0 - 5 MSEK | Direct Marketing |
| **TS** | 250,000 - 750,000 kr | 5 - 15 MSEK | Telesales |
| **FS** | 750,000 - 5,000,000 kr | 15 - 100 MSEK | Field Sales |
| **KAM** | 5,000,000+ kr | 100+ MSEK | Key Account Manager |

---

## 🔢 Snabbkalkylator

### Från Bolagsomsättning → Segment

| Bolagsomsättning | × 5% | = Fraktomsättning | → Segment |
|------------------|------|-------------------|-----------|
| 1 MSEK | × 5% | = 50,000 kr | **DM** |
| 3 MSEK | × 5% | = 150,000 kr | **DM** |
| 5 MSEK | × 5% | = 250,000 kr | **DM/TS** (gräns) |
| 10 MSEK | × 5% | = 500,000 kr | **TS** |
| 15 MSEK | × 5% | = 750,000 kr | **TS/FS** (gräns) |
| 20 MSEK | × 5% | = 1,000,000 kr | **FS** |
| 50 MSEK | × 5% | = 2,500,000 kr | **FS** |
| 100 MSEK | × 5% | = 5,000,000 kr | **FS/KAM** (gräns) |
| 150 MSEK | × 5% | = 7,500,000 kr | **KAM** |
| 200 MSEK | × 5% | = 10,000,000 kr | **KAM** |

---

## 💡 Exempel

### Exempel 1: Liten Webbshop
```
Bolagsomsättning: 3 MSEK
Fraktomsättning: 3,000,000 × 5% = 150,000 kr
Segment: DM (< 250,000 kr)
Säljkanal: Direktmarknadsföring, email
```

### Exempel 2: Medelstort E-handelsföretag
```
Bolagsomsättning: 25 MSEK
Fraktomsättning: 25,000,000 × 5% = 1,250,000 kr
Segment: FS (750,000 - 5,000,000 kr)
Säljkanal: Säljare ute, personliga möten
```

### Exempel 3: Stor Grossist
```
Bolagsomsättning: 180 MSEK
Fraktomsättning: 180,000,000 × 5% = 9,000,000 kr
Segment: KAM (> 5,000,000 kr)
Säljkanal: Dedikerad KAM, strategiskt partnerskap
```

---

## 🎯 Automatisk Segment-Klassificering

### JavaScript-Funktion
```javascript
function calculateSegment(revenueKr) {
  const freightRevenue = revenueKr * 0.05;
  
  if (freightRevenue < 250000) return 'DM';
  if (freightRevenue < 750000) return 'TS';
  if (freightRevenue < 5000000) return 'FS';
  return 'KAM';
}

// Exempel:
calculateSegment(10000000);  // 10 MSEK → "TS"
calculateSegment(50000000);  // 50 MSEK → "FS"
calculateSegment(150000000); // 150 MSEK → "KAM"
```

### SQL-Funktion
```sql
CREATE OR REPLACE FUNCTION calculate_segment(revenue_tkr INTEGER)
RETURNS VARCHAR(10) AS $$
DECLARE
  freight_revenue_kr INTEGER;
BEGIN
  -- Konvertera TKR till KR och beräkna fraktomsättning (5%)
  freight_revenue_kr := (revenue_tkr * 1000) * 0.05;
  
  IF freight_revenue_kr < 250000 THEN
    RETURN 'DM';
  ELSIF freight_revenue_kr < 750000 THEN
    RETURN 'TS';
  ELSIF freight_revenue_kr < 5000000 THEN
    RETURN 'FS';
  ELSE
    RETURN 'KAM';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Användning:
SELECT 
  company_name,
  revenue_tkr,
  calculate_segment(revenue_tkr) as suggested_segment,
  segment as current_segment
FROM leads
WHERE calculate_segment(revenue_tkr) != segment;
```

---

## 📊 Segment-Fördelning (Typisk)

### Antal Kunder
```
DM:  40% av alla kunder (många små)
TS:  35% av alla kunder
FS:  20% av alla kunder
KAM: 5% av alla kunder (få stora)
```

### Omsättning
```
DM:  2% av total fraktomsättning
TS:  8% av total fraktomsättning
FS:  30% av total fraktomsättning
KAM: 60% av total fraktomsättning
```

---

## 🔄 Gränsfall

### Vid Exakt Gräns
```
Fraktomsättning: 250,000 kr (exakt gräns DM/TS)
→ Rekommendation: TS (uppgradera)

Fraktomsättning: 750,000 kr (exakt gräns TS/FS)
→ Rekommendation: FS (uppgradera)

Fraktomsättning: 5,000,000 kr (exakt gräns FS/KAM)
→ Rekommendation: KAM (uppgradera)
```

### Nära Gräns (±10%)
```
Fraktomsättning: 225,000 kr (90% av DM-gräns)
→ Rekommendation: Förbered uppgradering till TS

Fraktomsättning: 675,000 kr (90% av TS-gräns)
→ Rekommendation: Förbered uppgradering till FS
```

---

## 🎯 Validering

### Kontrollera Segment-Klassificering
```sql
-- Hitta felklassificerade leads
SELECT 
  company_name,
  revenue_tkr,
  (revenue_tkr * 1000 * 0.05) as freight_revenue_kr,
  segment as current_segment,
  calculate_segment(revenue_tkr) as correct_segment
FROM leads
WHERE segment != calculate_segment(revenue_tkr)
  AND segment != 'UNKNOWN'
ORDER BY revenue_tkr DESC;
```

### Bulk-Korrigering
```sql
-- Uppdatera alla felklassificerade leads
UPDATE leads
SET segment = calculate_segment(revenue_tkr)
WHERE segment != calculate_segment(revenue_tkr)
  AND segment != 'UNKNOWN'
  AND revenue_tkr IS NOT NULL;
```

---

## 📈 Trender

### Upptäck Växande Kunder
```sql
-- Kunder som snart bör uppgraderas
SELECT 
  company_name,
  revenue_tkr,
  segment,
  (revenue_tkr * 1000 * 0.05) as freight_revenue_kr,
  CASE 
    WHEN segment = 'DM' AND (revenue_tkr * 1000 * 0.05) > 225000 
      THEN 'Snart TS'
    WHEN segment = 'TS' AND (revenue_tkr * 1000 * 0.05) > 675000 
      THEN 'Snart FS'
    WHEN segment = 'FS' AND (revenue_tkr * 1000 * 0.05) > 4500000 
      THEN 'Snart KAM'
  END as upgrade_alert
FROM leads
WHERE upgrade_alert IS NOT NULL;
```

---

## 💡 Best Practices

### 1. Använd Alltid Fraktomsättning
```
❌ Fel: Klassificera baserat på bolagsomsättning
✅ Rätt: Beräkna fraktomsättning (5%) först
```

### 2. Uppdatera Regelbundet
```
- Kontrollera segment varje kvartal
- Uppdatera när ny finansiell data finns
- Automatisk påminnelse vid tillväxt
```

### 3. Dokumentera Manuella Ändringar
```
Om segment ändras manuellt (inte baserat på omsättning):
- Dokumentera anledning
- Sätt flagga i systemet
- Granska vid nästa uppdatering
```

### 4. Kommunicera Uppgraderingar
```
När kund uppgraderas (t.ex. TS → FS):
1. Informera kund om bättre service
2. Tilldela ny säljare
3. Handover-möte
4. Uppdatera avtal
```

---

## 🎉 Sammanfattning

### Formel
**Fraktomsättning = Bolagsomsättning × 5%**

### Segment-Gränser
- **DM**: 0 - 250,000 kr fraktomsättning
- **TS**: 250,000 - 750,000 kr
- **FS**: 750,000 - 5,000,000 kr
- **KAM**: 5,000,000+ kr

### Automatisering
```javascript
segment = calculateSegment(bolagsomsättning);
```

**Använd denna kalkylator för korrekt segment-klassificering!** 🎯
