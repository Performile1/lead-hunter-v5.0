# 🛡️ Exkluderings- & Anti-Hallucinerings-System

## 🎯 Översikt

Komplett system för att:
1. ✅ Exkludera redan kunder
2. ✅ Filtrera felaktiga org.nummer
3. ✅ Blockera felaktiga företagsnamn
4. ✅ Förhindra AI-hallucinationer
5. ✅ Stoppa "lazy" AI-svar

---

## 📋 1. EXKLUDERINGSSYSTEM

### Databas-Schema (Redan Implementerat)
```sql
CREATE TABLE exclusions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    org_number VARCHAR(20),
    exclusion_type VARCHAR(50) CHECK (exclusion_type IN (
        'existing_customer',    -- Redan DHL-kund
        'competitor',           -- Konkurrent
        'blacklist',           -- Svartlistad
        'incorrect_data',      -- Felaktig data
        'manual'               -- Manuell exkludering
    )),
    reason TEXT,
    added_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_name, org_number)
);
```

---

### 1.1 CSV-Uppladdning av Redan Kunder

#### Frontend - Uppladdningskomponent
```tsx
// components/ExclusionUploader.tsx
import React, { useState } from 'react';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';

interface ExclusionUploaderProps {
  onUploadComplete: (count: number) => void;
}

export const ExclusionUploader: React.FC<ExclusionUploaderProps> = ({ onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    success: number;
    failed: number;
    duplicates: number;
  } | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('exclusion_type', 'existing_customer');

    try {
      const response = await fetch('/api/exclusions/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);
      onUploadComplete(data.success);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold text-dhl-red mb-4">
        Ladda upp Redan Kunder
      </h3>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        
        <label className="cursor-pointer">
          <span className="bg-dhl-red text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition inline-block">
            Välj CSV-fil
          </span>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
        
        <p className="text-sm text-gray-600 mt-4">
          CSV-format: company_name, org_number, reason (valfritt)
        </p>
      </div>

      {uploading && (
        <div className="mt-4 text-center">
          <p className="text-gray-600">Laddar upp och validerar...</p>
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span>{result.success} företag exkluderade</span>
          </div>
          {result.duplicates > 0 && (
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertCircle className="w-5 h-5" />
              <span>{result.duplicates} dubbletter hoppades över</span>
            </div>
          )}
          {result.failed > 0 && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span>{result.failed} rader misslyckades</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

#### Backend - CSV-Parser
```typescript
// server/routes/exclusions.ts
import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const exclusionType = req.body.exclusion_type || 'existing_customer';
    const userId = req.user.id;

    const results = {
      success: 0,
      failed: 0,
      duplicates: 0,
      errors: [] as string[]
    };

    const stream = Readable.from(file.buffer);
    
    stream
      .pipe(csv())
      .on('data', async (row) => {
        try {
          const companyName = row.company_name?.trim();
          const orgNumber = row.org_number?.trim();
          const reason = row.reason?.trim() || 'Uploaded from CSV';

          // Validera
          if (!companyName) {
            results.failed++;
            results.errors.push(`Missing company_name: ${JSON.stringify(row)}`);
            return;
          }

          // Validera org.nummer om det finns
          if (orgNumber && !isValidOrgNumber(orgNumber)) {
            results.failed++;
            results.errors.push(`Invalid org_number: ${orgNumber}`);
            return;
          }

          // Lägg till i databas
          const query = `
            INSERT INTO exclusions (company_name, org_number, exclusion_type, reason, added_by)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (company_name, org_number) DO NOTHING
            RETURNING id
          `;

          const result = await db.query(query, [
            companyName,
            orgNumber,
            exclusionType,
            reason,
            userId
          ]);

          if (result.rows.length > 0) {
            results.success++;
          } else {
            results.duplicates++;
          }
        } catch (error) {
          results.failed++;
          results.errors.push(`Error processing row: ${error.message}`);
        }
      })
      .on('end', () => {
        res.json(results);
      })
      .on('error', (error) => {
        res.status(500).json({ error: error.message });
      });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

---

### 1.2 Org.nummer Validering

```typescript
// utils/orgNumberValidator.ts

/**
 * Validera svenskt organisationsnummer
 * Format: XXXXXX-XXXX eller XXXXXXXXXX
 */
export function isValidOrgNumber(orgNumber: string): boolean {
  // Ta bort bindestreck och mellanslag
  const cleaned = orgNumber.replace(/[-\s]/g, '');
  
  // Måste vara 10 siffror
  if (!/^\d{10}$/.test(cleaned)) {
    return false;
  }
  
  // Luhn-algoritm (modulus 10)
  const digits = cleaned.split('').map(Number);
  let sum = 0;
  
  for (let i = 0; i < 9; i++) {
    let digit = digits[i];
    
    // Multiplicera varannan siffra med 2
    if (i % 2 === 0) {
      digit *= 2;
      // Om resultatet är > 9, subtrahera 9
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
  }
  
  // Kontrollsiffra
  const checkDigit = (10 - (sum % 10)) % 10;
  
  return checkDigit === digits[9];
}

/**
 * Formatera org.nummer med bindestreck
 */
export function formatOrgNumber(orgNumber: string): string {
  const cleaned = orgNumber.replace(/[-\s]/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 6)}-${cleaned.slice(6)}`;
  }
  return orgNumber;
}

/**
 * Kolla om org.nummer är ett personnummer (börjar med 19 eller 20)
 */
export function isPersonalNumber(orgNumber: string): boolean {
  const cleaned = orgNumber.replace(/[-\s]/g, '');
  return cleaned.startsWith('19') || cleaned.startsWith('20');
}

/**
 * Extrahera org.nummer från text
 */
export function extractOrgNumber(text: string): string | null {
  // Sök efter mönster: 6 siffror, bindestreck, 4 siffror
  const match = text.match(/\b(\d{6})-?(\d{4})\b/);
  if (match) {
    const orgNumber = match[1] + match[2];
    if (isValidOrgNumber(orgNumber)) {
      return formatOrgNumber(orgNumber);
    }
  }
  return null;
}
```

---

### 1.3 Företagsnamn Validering

```typescript
// utils/companyNameValidator.ts

/**
 * Lista på felaktiga/generiska företagsnamn att blockera
 */
const INVALID_COMPANY_NAMES = [
  // Generiska
  'test', 'testföretag', 'exempel', 'example', 'company',
  'företag', 'ab', 'aktiebolag', 'n/a', 'na', 'unknown',
  
  // Platshållare
  'xxx', 'yyy', 'zzz', 'dummy', 'placeholder',
  
  // Konkurrenter (lägg till alla)
  'postnord', 'bring', 'budbee', 'airmee', 'instabox',
  'ups', 'fedex', 'schenker', 'db schenker', 'dsv',
  
  // Felaktiga AI-svar
  'i cannot', 'i dont know', 'no information', 'not found',
  'unable to find', 'sorry', 'apologize'
];

/**
 * Validera företagsnamn
 */
export function isValidCompanyName(name: string): boolean {
  if (!name || name.trim().length === 0) {
    return false;
  }
  
  const normalized = name.toLowerCase().trim();
  
  // Kolla mot blacklist
  if (INVALID_COMPANY_NAMES.some(invalid => normalized.includes(invalid))) {
    return false;
  }
  
  // Måste vara minst 2 tecken
  if (normalized.length < 2) {
    return false;
  }
  
  // Får inte bara vara siffror
  if (/^\d+$/.test(normalized)) {
    return false;
  }
  
  // Får inte bara vara specialtecken
  if (/^[^a-zåäö0-9]+$/i.test(normalized)) {
    return false;
  }
  
  return true;
}

/**
 * Rensa företagsnamn från extra whitespace, etc.
 */
export function cleanCompanyName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ') // Ersätt multipla mellanslag med ett
    .replace(/[^\w\såäöÅÄÖ\-&]/g, ''); // Ta bort konstiga tecken
}

/**
 * Kolla om namnet är en konkurrent
 */
export function isCompetitor(name: string): boolean {
  const competitors = [
    'postnord', 'bring', 'budbee', 'airmee', 'citymail',
    'earlybird', 'instabox', 'ups', 'fedex', 'schenker',
    'db schenker', 'dsv', 'best transport', 'jetpak',
    'porterbuddy', 'helthjem', 'dao', 'matkahuolto'
  ];
  
  const normalized = name.toLowerCase();
  return competitors.some(comp => normalized.includes(comp));
}
```

---

## 🤖 2. ANTI-HALLUCINERINGS-SYSTEM

### 2.1 Negativ Prompt för AI

```typescript
// prompts/antiHallucination.ts

export const ANTI_HALLUCINATION_PROMPT = `
KRITISKA REGLER - FÖLJ DESSA STRIKT:

1. ALDRIG HITTA PÅ DATA
   - Om du inte vet något, skriv "N/A" eller lämna tomt
   - Gissa ALDRIG org.nummer, telefonnummer, eller adresser
   - Hitta ALDRIG på företagsnamn

2. VALIDERA ORG.NUMMER
   - Måste vara exakt 10 siffror
   - Måste följa Luhn-algoritmen
   - Format: XXXXXX-XXXX
   - Om osäker, lämna tomt

3. FÖRETAGSNAMN
   - Måste vara exakt som i källan
   - Inga generiska namn som "Test AB", "Exempel AB"
   - Inga platshållare som "XXX", "N/A"
   - Om du inte hittar namnet, returnera null

4. KONKURRENTER
   - Exkludera ALLTID: PostNord, Bring, Budbee, Airmee, Instabox, UPS, FedEx, Schenker, DSV
   - Om företaget är en konkurrent, returnera null

5. FELAKTIGA SVAR
   - Skriv ALDRIG: "I cannot find", "Sorry", "I don't know"
   - Returnera istället null eller tom array
   - Inga förklaringar i JSON-fält

6. LAZY SVAR
   - Returnera ALDRIG samma data för flera företag
   - Varje företag måste ha unik data
   - Om du inte kan hitta unik data, returnera null

7. KÄLLKRAV
   - All data måste komma från verifierbara källor
   - Ange alltid källa i source-fält
   - Accepterade källor: Bolagsverket, Allabolag, företagets webbplats, SCB

8. DUBBLETTER
   - Kolla alltid mot exkluderingslistan
   - Returnera null om företaget redan finns
   - Returnera null om org.nummer redan finns

EXEMPEL PÅ FELAKTIGA SVAR (GÖR ALDRIG SÅ HÄR):
❌ "company_name": "Test AB"
❌ "org_number": "123456-7890" (utan validering)
❌ "phone_number": "08-123 45 67" (gissat)
❌ "email": "info@example.com" (generiskt)
❌ "revenue_tkr": 50000 (gissat)

EXEMPEL PÅ KORREKTA SVAR:
✅ "company_name": "Boozt Fashion AB"
✅ "org_number": "556793-5183" (validerat)
✅ "phone_number": null (om okänt)
✅ "email": "info@boozt.com" (från webbplats)
✅ "revenue_tkr": 2450000 (från årsredovisning)
✅ "source": "https://www.allabolag.se/556793-5183"
`;

export const NEGATIVE_EXAMPLES = [
  {
    bad: { company_name: "Test AB", org_number: "123456-7890" },
    good: { company_name: null, org_number: null },
    reason: "Generiskt namn och ogiltigt org.nummer"
  },
  {
    bad: { company_name: "Exempel Företag", revenue_tkr: 50000 },
    good: { company_name: null, revenue_tkr: null },
    reason: "Platshållare-namn och gissad omsättning"
  },
  {
    bad: { company_name: "PostNord AB" },
    good: null,
    reason: "Konkurrent - ska exkluderas"
  }
];
```

---

### 2.2 Validering av AI-Svar

```typescript
// services/aiResponseValidator.ts

interface AIResponse {
  company_name?: string;
  org_number?: string;
  phone_number?: string;
  email?: string;
  revenue_tkr?: number;
  source?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateAIResponse(response: AIResponse): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Validera företagsnamn
  if (response.company_name) {
    if (!isValidCompanyName(response.company_name)) {
      errors.push(`Invalid company name: ${response.company_name}`);
    }
    
    if (isCompetitor(response.company_name)) {
      errors.push(`Competitor detected: ${response.company_name}`);
    }
  }

  // 2. Validera org.nummer
  if (response.org_number) {
    if (!isValidOrgNumber(response.org_number)) {
      errors.push(`Invalid org number: ${response.org_number}`);
    }
    
    if (isPersonalNumber(response.org_number)) {
      warnings.push(`Org number appears to be a personal number: ${response.org_number}`);
    }
  }

  // 3. Validera telefonnummer
  if (response.phone_number) {
    if (!isValidPhoneNumber(response.phone_number)) {
      warnings.push(`Suspicious phone number: ${response.phone_number}`);
    }
  }

  // 4. Validera email
  if (response.email) {
    if (!isValidEmail(response.email)) {
      warnings.push(`Invalid email: ${response.email}`);
    }
    
    // Kolla mot generiska emails
    const genericEmails = ['info@example.com', 'test@test.com', 'admin@domain.com'];
    if (genericEmails.some(ge => response.email?.toLowerCase().includes(ge))) {
      errors.push(`Generic email detected: ${response.email}`);
    }
  }

  // 5. Validera omsättning
  if (response.revenue_tkr) {
    // Omsättning måste vara rimlig (> 0 och < 100 miljarder)
    if (response.revenue_tkr <= 0 || response.revenue_tkr > 100000000) {
      warnings.push(`Suspicious revenue: ${response.revenue_tkr} TKR`);
    }
    
    // Kolla om det är ett "runt" tal (ofta gissat)
    if (response.revenue_tkr % 10000 === 0 && response.revenue_tkr > 10000) {
      warnings.push(`Revenue appears to be estimated (round number): ${response.revenue_tkr} TKR`);
    }
  }

  // 6. Kräv källa
  if (!response.source) {
    warnings.push('No source provided');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Kolla om AI-svaret är "lazy" (samma data för flera företag)
 */
export function detectLazyResponse(responses: AIResponse[]): boolean {
  if (responses.length < 2) return false;

  // Kolla om alla har samma omsättning
  const revenues = responses.map(r => r.revenue_tkr).filter(Boolean);
  if (revenues.length > 1 && new Set(revenues).size === 1) {
    return true;
  }

  // Kolla om alla har samma telefonnummer
  const phones = responses.map(r => r.phone_number).filter(Boolean);
  if (phones.length > 1 && new Set(phones).size === 1) {
    return true;
  }

  // Kolla om alla har samma email-struktur
  const emails = responses.map(r => r.email).filter(Boolean);
  if (emails.length > 1 && new Set(emails).size === 1) {
    return true;
  }

  return false;
}
```

---

### 2.3 Exkluderingskontroll i Pipeline

```typescript
// services/exclusionChecker.ts

export async function checkExclusions(
  companyName: string,
  orgNumber?: string
): Promise<{ excluded: boolean; reason?: string }> {
  
  // 1. Kolla mot databas
  const query = `
    SELECT exclusion_type, reason
    FROM exclusions
    WHERE 
      LOWER(company_name) = LOWER($1)
      OR org_number = $2
    LIMIT 1
  `;
  
  const result = await db.query(query, [companyName, orgNumber]);
  
  if (result.rows.length > 0) {
    return {
      excluded: true,
      reason: `${result.rows[0].exclusion_type}: ${result.rows[0].reason}`
    };
  }

  // 2. Kolla om det är en konkurrent
  if (isCompetitor(companyName)) {
    return {
      excluded: true,
      reason: 'Competitor'
    };
  }

  // 3. Kolla om namnet är ogiltigt
  if (!isValidCompanyName(companyName)) {
    return {
      excluded: true,
      reason: 'Invalid company name'
    };
  }

  // 4. Kolla org.nummer om det finns
  if (orgNumber && !isValidOrgNumber(orgNumber)) {
    return {
      excluded: true,
      reason: 'Invalid org number'
    };
  }

  return { excluded: false };
}

/**
 * Filtrera en lista av företag mot exkluderingar
 */
export async function filterExclusions(
  companies: Array<{ company_name: string; org_number?: string }>
): Promise<Array<{ company_name: string; org_number?: string }>> {
  
  const filtered = [];
  
  for (const company of companies) {
    const check = await checkExclusions(company.company_name, company.org_number);
    
    if (!check.excluded) {
      filtered.push(company);
    } else {
      console.log(`Excluded: ${company.company_name} - ${check.reason}`);
    }
  }
  
  return filtered;
}
```

---

## 🎯 3. KOMPLETT PIPELINE MED VALIDERING

```typescript
// services/leadGenerationPipeline.ts

export async function generateLeads(
  sniCodes: string[],
  limit: number = 100
): Promise<Lead[]> {
  
  const leads: Lead[] = [];
  
  // 1. Hämta företag från SCB/Bolagsverket
  const rawCompanies = await fetchCompaniesBySNI(sniCodes, limit * 2); // Hämta extra för att kompensera för exkluderingar
  
  console.log(`Fetched ${rawCompanies.length} companies`);
  
  // 2. Filtrera mot exkluderingar
  const nonExcluded = await filterExclusions(rawCompanies);
  
  console.log(`After exclusions: ${nonExcluded.length} companies`);
  
  // 3. Validera org.nummer
  const validOrgNumbers = nonExcluded.filter(c => 
    !c.org_number || isValidOrgNumber(c.org_number)
  );
  
  console.log(`After org number validation: ${validOrgNumbers.length} companies`);
  
  // 4. Anrika med AI (med anti-hallucinering)
  for (const company of validOrgNumbers.slice(0, limit)) {
    try {
      const enriched = await enrichCompanyWithAI(company, {
        antiHallucinationPrompt: ANTI_HALLUCINATION_PROMPT,
        validateResponse: true
      });
      
      // 5. Validera AI-svar
      const validation = validateAIResponse(enriched);
      
      if (!validation.valid) {
        console.error(`Invalid AI response for ${company.company_name}:`, validation.errors);
        continue;
      }
      
      if (validation.warnings.length > 0) {
        console.warn(`Warnings for ${company.company_name}:`, validation.warnings);
      }
      
      // 6. Dubbelkolla exkluderingar (AI kan ha ändrat namnet)
      const recheck = await checkExclusions(enriched.company_name, enriched.org_number);
      if (recheck.excluded) {
        console.log(`Excluded after enrichment: ${enriched.company_name} - ${recheck.reason}`);
        continue;
      }
      
      leads.push(enriched);
      
    } catch (error) {
      console.error(`Error enriching ${company.company_name}:`, error);
    }
  }
  
  // 7. Kolla efter lazy responses
  if (detectLazyResponse(leads)) {
    console.error('LAZY RESPONSE DETECTED! AI is reusing data.');
    // Flagga för manuell granskning eller kasta error
  }
  
  console.log(`Final leads: ${leads.length}`);
  
  return leads;
}
```

---

## 📊 4. MONITORING & RAPPORTERING

### Dashboard för Exkluderingar
```typescript
// API endpoint för statistik
router.get('/exclusions/stats', async (req, res) => {
  const stats = await db.query(`
    SELECT 
      exclusion_type,
      COUNT(*) as count,
      MAX(created_at) as last_added
    FROM exclusions
    GROUP BY exclusion_type
    ORDER BY count DESC
  `);
  
  res.json(stats.rows);
});

// API endpoint för senaste exkluderingar
router.get('/exclusions/recent', async (req, res) => {
  const recent = await db.query(`
    SELECT 
      company_name,
      org_number,
      exclusion_type,
      reason,
      created_at
    FROM exclusions
    ORDER BY created_at DESC
    LIMIT 50
  `);
  
  res.json(recent.rows);
});
```

---

## 🎯 5. SAMMANFATTNING

### Implementerade System

#### ✅ Exkluderingssystem
- CSV-uppladdning av redan kunder
- Databas med 5 exkluderingstyper
- Automatisk dubbletthantering

#### ✅ Validering
- Org.nummer (Luhn-algoritm)
- Företagsnamn (blacklist)
- Telefonnummer
- Email
- Omsättning (rimlighetskontroll)

#### ✅ Anti-Hallucinering
- Negativ prompt för AI
- Validering av AI-svar
- Lazy response-detektion
- Källkrav

#### ✅ Pipeline
- Filtrera mot exkluderingar
- Validera org.nummer
- Anrika med AI
- Validera AI-svar
- Dubbelkolla exkluderingar

### Filer att Skapa
1. `components/ExclusionUploader.tsx` - CSV-uppladdning
2. `utils/orgNumberValidator.ts` - Org.nummer-validering
3. `utils/companyNameValidator.ts` - Företagsnamn-validering
4. `prompts/antiHallucination.ts` - Anti-hallucinerings-prompt
5. `services/aiResponseValidator.ts` - AI-svar-validering
6. `services/exclusionChecker.ts` - Exkluderingskontroll
7. `services/leadGenerationPipeline.ts` - Komplett pipeline
8. `server/routes/exclusions.ts` - API för exkluderingar

### Status
✅ **Komplett system designat och klart att implementera!**
