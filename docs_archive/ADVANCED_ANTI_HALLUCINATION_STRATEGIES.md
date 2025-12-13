# 🧠 Avancerade Anti-Hallucinerings-Strategier

## 🎯 Ytterligare Metoder för att Stoppa Hallucinationer & Laziness

---

## 1. 🔍 MULTI-SOURCE VERIFICATION

### Kräv Flera Källor för Kritisk Data
```typescript
// services/multiSourceVerifier.ts

interface SourcedData {
  value: any;
  source: string;
  confidence: number;
  timestamp: string;
}

interface VerificationResult {
  verified: boolean;
  value: any;
  sources: string[];
  confidence: number;
}

/**
 * Kräv att data verifieras från minst 2 källor
 */
export async function verifyWithMultipleSources(
  companyName: string,
  dataType: 'revenue' | 'org_number' | 'address' | 'phone'
): Promise<VerificationResult> {
  
  const sources: SourcedData[] = [];
  
  // Källa 1: Bolagsverket
  try {
    const bolagsverketData = await fetchFromBolagsverket(companyName, dataType);
    if (bolagsverketData) {
      sources.push({
        value: bolagsverketData,
        source: 'Bolagsverket',
        confidence: 0.95,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Bolagsverket fetch failed:', error);
  }
  
  // Källa 2: Allabolag
  try {
    const allabolagData = await fetchFromAllabolag(companyName, dataType);
    if (allabolagData) {
      sources.push({
        value: allabolagData,
        source: 'Allabolag',
        confidence: 0.90,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Allabolag fetch failed:', error);
  }
  
  // Källa 3: Företagets webbplats
  try {
    const websiteData = await fetchFromWebsite(companyName, dataType);
    if (websiteData) {
      sources.push({
        value: websiteData,
        source: 'Company Website',
        confidence: 0.85,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Website fetch failed:', error);
  }
  
  // Kräv minst 2 källor
  if (sources.length < 2) {
    return {
      verified: false,
      value: null,
      sources: sources.map(s => s.source),
      confidence: 0
    };
  }
  
  // Kolla om källorna är överens
  const values = sources.map(s => s.value);
  const uniqueValues = [...new Set(values)];
  
  if (uniqueValues.length === 1) {
    // Alla källor överens - hög confidence
    const avgConfidence = sources.reduce((sum, s) => sum + s.confidence, 0) / sources.length;
    return {
      verified: true,
      value: uniqueValues[0],
      sources: sources.map(s => s.source),
      confidence: avgConfidence
    };
  } else {
    // Källorna är inte överens - välj den med högst confidence
    const best = sources.reduce((prev, curr) => 
      curr.confidence > prev.confidence ? curr : prev
    );
    return {
      verified: false,
      value: best.value,
      sources: sources.map(s => s.source),
      confidence: best.confidence * 0.5 // Halvera confidence vid konflikt
    };
  }
}
```

---

## 2. 🎲 RANDOMIZED TESTING

### Testa AI med Kända Företag
```typescript
// services/aiQualityTester.ts

const KNOWN_COMPANIES = [
  {
    company_name: 'H&M Hennes & Mauritz AB',
    org_number: '556042-7220',
    expected_revenue_range: [200000000, 250000000], // TKR
    expected_segment: 'KAM'
  },
  {
    company_name: 'Boozt Fashion AB',
    org_number: '556793-5183',
    expected_revenue_range: [2000000, 3000000],
    expected_segment: 'FS'
  },
  {
    company_name: 'Ellos Group AB',
    org_number: '556144-4559',
    expected_revenue_range: [3000000, 4000000],
    expected_segment: 'KAM'
  }
];

/**
 * Testa AI:n med kända företag för att upptäcka hallucinationer
 */
export async function testAIQuality(): Promise<{
  passed: boolean;
  score: number;
  failures: string[];
}> {
  
  const failures: string[] = [];
  let correctAnswers = 0;
  
  for (const known of KNOWN_COMPANIES) {
    try {
      const aiResponse = await enrichCompanyWithAI({
        company_name: known.company_name,
        org_number: known.org_number
      });
      
      // Kolla org.nummer
      if (aiResponse.org_number !== known.org_number) {
        failures.push(`${known.company_name}: Wrong org number (got ${aiResponse.org_number}, expected ${known.org_number})`);
      } else {
        correctAnswers++;
      }
      
      // Kolla omsättning (inom range)
      if (aiResponse.revenue_tkr) {
        const [min, max] = known.expected_revenue_range;
        if (aiResponse.revenue_tkr < min || aiResponse.revenue_tkr > max) {
          failures.push(`${known.company_name}: Revenue out of range (got ${aiResponse.revenue_tkr}, expected ${min}-${max})`);
        } else {
          correctAnswers++;
        }
      }
      
      // Kolla segment
      if (aiResponse.segment !== known.expected_segment) {
        failures.push(`${known.company_name}: Wrong segment (got ${aiResponse.segment}, expected ${known.expected_segment})`);
      } else {
        correctAnswers++;
      }
      
    } catch (error) {
      failures.push(`${known.company_name}: Error - ${error.message}`);
    }
  }
  
  const totalTests = KNOWN_COMPANIES.length * 3; // 3 tests per företag
  const score = (correctAnswers / totalTests) * 100;
  
  return {
    passed: score >= 80, // Kräv minst 80% rätt
    score,
    failures
  };
}

/**
 * Kör kvalitetstest innan varje batch
 */
export async function runPreBatchQualityCheck(): Promise<boolean> {
  console.log('Running AI quality check...');
  
  const result = await testAIQuality();
  
  console.log(`AI Quality Score: ${result.score.toFixed(1)}%`);
  
  if (!result.passed) {
    console.error('AI QUALITY CHECK FAILED!');
    console.error('Failures:', result.failures);
    return false;
  }
  
  console.log('✅ AI quality check passed');
  return true;
}
```

---

## 3. 📊 STATISTICAL ANOMALY DETECTION

### Upptäck Onormala Mönster
```typescript
// services/anomalyDetector.ts

interface LeadBatch {
  leads: Lead[];
  timestamp: string;
}

/**
 * Upptäck statistiska anomalier i en batch av leads
 */
export function detectAnomalies(batch: LeadBatch): {
  anomalies: string[];
  suspicious: boolean;
} {
  
  const anomalies: string[] = [];
  const leads = batch.leads;
  
  // 1. Kolla om för många har samma omsättning
  const revenues = leads.map(l => l.revenue_tkr).filter(Boolean);
  const revenueFrequency = new Map<number, number>();
  
  revenues.forEach(rev => {
    revenueFrequency.set(rev, (revenueFrequency.get(rev) || 0) + 1);
  });
  
  for (const [revenue, count] of revenueFrequency) {
    if (count > leads.length * 0.3) { // Mer än 30% har samma omsättning
      anomalies.push(`${count} leads have identical revenue: ${revenue} TKR`);
    }
  }
  
  // 2. Kolla om för många har samma telefonnummer
  const phones = leads.map(l => l.phone_number).filter(Boolean);
  const phoneFrequency = new Map<string, number>();
  
  phones.forEach(phone => {
    phoneFrequency.set(phone, (phoneFrequency.get(phone) || 0) + 1);
  });
  
  for (const [phone, count] of phoneFrequency) {
    if (count > 1) {
      anomalies.push(`${count} leads have identical phone: ${phone}`);
    }
  }
  
  // 3. Kolla om för många har samma stad
  const cities = leads.map(l => l.city).filter(Boolean);
  const cityFrequency = new Map<string, number>();
  
  cities.forEach(city => {
    cityFrequency.set(city, (cityFrequency.get(city) || 0) + 1);
  });
  
  for (const [city, count] of cityFrequency) {
    if (count > leads.length * 0.5) { // Mer än 50% i samma stad
      anomalies.push(`${count} leads in same city: ${city}`);
    }
  }
  
  // 4. Kolla om omsättningar är för "runda"
  const roundRevenues = revenues.filter(rev => rev % 10000 === 0);
  if (roundRevenues.length > revenues.length * 0.5) {
    anomalies.push(`${roundRevenues.length}/${revenues.length} revenues are round numbers (likely estimated)`);
  }
  
  // 5. Kolla om alla har samma segment
  const segments = leads.map(l => l.segment);
  const uniqueSegments = new Set(segments);
  if (uniqueSegments.size === 1 && leads.length > 10) {
    anomalies.push(`All ${leads.length} leads have same segment: ${Array.from(uniqueSegments)[0]}`);
  }
  
  // 6. Kolla om för få har webbplats
  const withWebsite = leads.filter(l => l.website_url).length;
  if (withWebsite < leads.length * 0.3) {
    anomalies.push(`Only ${withWebsite}/${leads.length} leads have website (expected >30%)`);
  }
  
  // 7. Kolla om för få har email
  const withEmail = leads.filter(l => l.email_structure).length;
  if (withEmail < leads.length * 0.2) {
    anomalies.push(`Only ${withEmail}/${leads.length} leads have email structure (expected >20%)`);
  }
  
  return {
    anomalies,
    suspicious: anomalies.length > 0
  };
}
```

---

## 4. 🔄 INCREMENTAL VALIDATION

### Validera Steg-för-Steg
```typescript
// services/incrementalValidator.ts

/**
 * Validera data i flera steg istället för allt på en gång
 */
export async function enrichWithIncrementalValidation(
  company: { company_name: string; org_number?: string }
): Promise<Lead | null> {
  
  // STEG 1: Validera grunddata
  console.log(`Step 1: Validating ${company.company_name}...`);
  
  if (!isValidCompanyName(company.company_name)) {
    console.error('❌ Invalid company name');
    return null;
  }
  
  if (company.org_number && !isValidOrgNumber(company.org_number)) {
    console.error('❌ Invalid org number');
    return null;
  }
  
  const exclusionCheck = await checkExclusions(company.company_name, company.org_number);
  if (exclusionCheck.excluded) {
    console.error(`❌ Excluded: ${exclusionCheck.reason}`);
    return null;
  }
  
  console.log('✅ Step 1 passed');
  
  // STEG 2: Hämta org.nummer (om saknas)
  if (!company.org_number) {
    console.log('Step 2: Fetching org number...');
    
    const orgNumber = await fetchOrgNumber(company.company_name);
    
    if (!orgNumber) {
      console.error('❌ Could not find org number');
      return null;
    }
    
    if (!isValidOrgNumber(orgNumber)) {
      console.error('❌ Fetched org number is invalid');
      return null;
    }
    
    company.org_number = orgNumber;
    console.log(`✅ Step 2 passed: ${orgNumber}`);
  }
  
  // STEG 3: Hämta ekonomisk data
  console.log('Step 3: Fetching financial data...');
  
  const financialData = await fetchFinancialData(company.org_number);
  
  if (!financialData || !financialData.revenue_tkr) {
    console.error('❌ Could not fetch financial data');
    return null;
  }
  
  // Validera omsättning
  if (financialData.revenue_tkr <= 0 || financialData.revenue_tkr > 100000000) {
    console.error('❌ Revenue out of reasonable range');
    return null;
  }
  
  console.log(`✅ Step 3 passed: ${financialData.revenue_tkr} TKR`);
  
  // STEG 4: Hämta kontaktinfo
  console.log('Step 4: Fetching contact info...');
  
  const contactInfo = await fetchContactInfo(company.org_number);
  
  // Validera telefonnummer om det finns
  if (contactInfo.phone_number && !isValidPhoneNumber(contactInfo.phone_number)) {
    console.warn('⚠️ Phone number looks suspicious, removing');
    contactInfo.phone_number = null;
  }
  
  console.log('✅ Step 4 passed');
  
  // STEG 5: Segmentera
  console.log('Step 5: Determining segment...');
  
  const segment = determineSegment(financialData.revenue_tkr, company.company_name);
  
  console.log(`✅ Step 5 passed: ${segment}`);
  
  // STEG 6: Bygg lead-objekt
  const lead: Lead = {
    company_name: company.company_name,
    org_number: company.org_number,
    segment,
    revenue_tkr: financialData.revenue_tkr,
    ...contactInfo,
    source: 'incremental_validation',
    analysis_date: new Date().toISOString()
  };
  
  // STEG 7: Final validering
  console.log('Step 6: Final validation...');
  
  const validation = validateAIResponse(lead);
  
  if (!validation.valid) {
    console.error('❌ Final validation failed:', validation.errors);
    return null;
  }
  
  if (validation.warnings.length > 0) {
    console.warn('⚠️ Warnings:', validation.warnings);
  }
  
  console.log('✅ All steps passed!');
  
  return lead;
}
```

---

## 5. 🎯 CONFIDENCE SCORING

### Ge Varje Lead en Confidence Score
```typescript
// services/confidenceScorer.ts

interface ConfidenceFactors {
  hasValidOrgNumber: boolean;
  hasMultipleSources: boolean;
  hasWebsite: boolean;
  hasVerifiedRevenue: boolean;
  hasContactInfo: boolean;
  noAnomalies: boolean;
  ageOfData: number; // dagar
}

/**
 * Beräkna confidence score för ett lead
 */
export function calculateConfidenceScore(
  lead: Lead,
  factors: ConfidenceFactors
): number {
  
  let score = 0;
  
  // Org.nummer (30 poäng)
  if (factors.hasValidOrgNumber) {
    score += 30;
  }
  
  // Flera källor (20 poäng)
  if (factors.hasMultipleSources) {
    score += 20;
  }
  
  // Webbplats (15 poäng)
  if (factors.hasWebsite) {
    score += 15;
  }
  
  // Verifierad omsättning (20 poäng)
  if (factors.hasVerifiedRevenue) {
    score += 20;
  }
  
  // Kontaktinfo (10 poäng)
  if (factors.hasContactInfo) {
    score += 10;
  }
  
  // Inga anomalier (5 poäng)
  if (factors.noAnomalies) {
    score += 5;
  }
  
  // Dra av för gammal data
  if (factors.ageOfData > 365) {
    score -= 10; // Data äldre än 1 år
  } else if (factors.ageOfData > 180) {
    score -= 5; // Data äldre än 6 månader
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Filtrera leads baserat på confidence score
 */
export function filterByConfidence(
  leads: Array<Lead & { confidence_score: number }>,
  minScore: number = 70
): Array<Lead & { confidence_score: number }> {
  
  return leads.filter(lead => lead.confidence_score >= minScore);
}
```

---

## 6. 🚨 REAL-TIME MONITORING

### Övervaka AI-Kvalitet i Realtid
```typescript
// services/aiMonitor.ts

interface AIMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageConfidence: number;
  anomaliesDetected: number;
  exclusionsHit: number;
  invalidOrgNumbers: number;
  invalidCompanyNames: number;
  lastUpdated: string;
}

class AIMonitor {
  private metrics: AIMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageConfidence: 0,
    anomaliesDetected: 0,
    exclusionsHit: 0,
    invalidOrgNumbers: 0,
    invalidCompanyNames: 0,
    lastUpdated: new Date().toISOString()
  };
  
  private confidenceScores: number[] = [];
  
  /**
   * Logga ett AI-request
   */
  logRequest(success: boolean, confidence?: number) {
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
      if (confidence) {
        this.confidenceScores.push(confidence);
        this.metrics.averageConfidence = 
          this.confidenceScores.reduce((a, b) => a + b, 0) / this.confidenceScores.length;
      }
    } else {
      this.metrics.failedRequests++;
    }
    
    this.metrics.lastUpdated = new Date().toISOString();
    
    // Kolla om success rate är för låg
    const successRate = this.metrics.successfulRequests / this.metrics.totalRequests;
    if (successRate < 0.5 && this.metrics.totalRequests > 10) {
      this.alert('LOW_SUCCESS_RATE', `Success rate: ${(successRate * 100).toFixed(1)}%`);
    }
    
    // Kolla om average confidence är för låg
    if (this.metrics.averageConfidence < 60 && this.confidenceScores.length > 10) {
      this.alert('LOW_CONFIDENCE', `Average confidence: ${this.metrics.averageConfidence.toFixed(1)}`);
    }
  }
  
  /**
   * Logga en anomali
   */
  logAnomaly(type: string, details: string) {
    this.metrics.anomaliesDetected++;
    console.warn(`🚨 ANOMALY DETECTED: ${type} - ${details}`);
    
    // Om för många anomalier, stoppa AI
    if (this.metrics.anomaliesDetected > 5) {
      this.alert('TOO_MANY_ANOMALIES', `${this.metrics.anomaliesDetected} anomalies detected`);
    }
  }
  
  /**
   * Logga en exkludering
   */
  logExclusion() {
    this.metrics.exclusionsHit++;
  }
  
  /**
   * Logga ogiltigt org.nummer
   */
  logInvalidOrgNumber() {
    this.metrics.invalidOrgNumbers++;
    
    // Om för många ogiltiga org.nummer, AI hallucinerar
    const invalidRate = this.metrics.invalidOrgNumbers / this.metrics.totalRequests;
    if (invalidRate > 0.3 && this.metrics.totalRequests > 10) {
      this.alert('HIGH_INVALID_ORG_RATE', `${(invalidRate * 100).toFixed(1)}% invalid org numbers`);
    }
  }
  
  /**
   * Logga ogiltigt företagsnamn
   */
  logInvalidCompanyName() {
    this.metrics.invalidCompanyNames++;
  }
  
  /**
   * Skicka alert
   */
  private alert(type: string, message: string) {
    console.error(`🚨🚨🚨 ALERT: ${type} - ${message}`);
    
    // Här kan du skicka email, Slack-notis, etc.
    // sendSlackAlert(type, message);
    // sendEmailAlert(type, message);
  }
  
  /**
   * Hämta metrics
   */
  getMetrics(): AIMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Återställ metrics
   */
  reset() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageConfidence: 0,
      anomaliesDetected: 0,
      exclusionsHit: 0,
      invalidOrgNumbers: 0,
      invalidCompanyNames: 0,
      lastUpdated: new Date().toISOString()
    };
    this.confidenceScores = [];
  }
}

export const aiMonitor = new AIMonitor();
```

---

## 7. 🎓 LEARNING FROM MISTAKES

### Lär av Tidigare Fel
```typescript
// services/mistakeLogger.ts

interface Mistake {
  id: string;
  type: 'hallucination' | 'invalid_org' | 'invalid_name' | 'lazy_response' | 'other';
  company_name: string;
  org_number?: string;
  ai_response: any;
  expected_response?: any;
  detected_at: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Logga ett misstag för framtida lärande
 */
export async function logMistake(mistake: Omit<Mistake, 'id' | 'detected_at'>) {
  const fullMistake: Mistake = {
    ...mistake,
    id: generateUUID(),
    detected_at: new Date().toISOString()
  };
  
  // Spara i databas
  await db.query(`
    INSERT INTO ai_mistakes (id, type, company_name, org_number, ai_response, expected_response, detected_at, severity)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [
    fullMistake.id,
    fullMistake.type,
    fullMistake.company_name,
    fullMistake.org_number,
    JSON.stringify(fullMistake.ai_response),
    JSON.stringify(fullMistake.expected_response),
    fullMistake.detected_at,
    fullMistake.severity
  ]);
  
  console.error(`🚨 Mistake logged: ${mistake.type} for ${mistake.company_name}`);
}

/**
 * Hämta vanligaste misstagen
 */
export async function getCommonMistakes(limit: number = 10): Promise<{
  type: string;
  count: number;
  examples: string[];
}[]> {
  
  const result = await db.query(`
    SELECT 
      type,
      COUNT(*) as count,
      ARRAY_AGG(company_name ORDER BY detected_at DESC LIMIT 5) as examples
    FROM ai_mistakes
    WHERE detected_at > NOW() - INTERVAL '30 days'
    GROUP BY type
    ORDER BY count DESC
    LIMIT $1
  `, [limit]);
  
  return result.rows;
}

/**
 * Generera förbättrad prompt baserat på misstag
 */
export async function generateImprovedPrompt(): Promise<string> {
  const mistakes = await getCommonMistakes(5);
  
  let improvedPrompt = ANTI_HALLUCINATION_PROMPT;
  
  improvedPrompt += '\n\n## COMMON MISTAKES TO AVOID:\n';
  
  for (const mistake of mistakes) {
    improvedPrompt += `\n### ${mistake.type.toUpperCase()} (${mistake.count} occurrences)\n`;
    improvedPrompt += `Examples of companies where this happened:\n`;
    mistake.examples.forEach(ex => {
      improvedPrompt += `- ${ex}\n`;
    });
    improvedPrompt += `\n**DO NOT repeat these mistakes!**\n`;
  }
  
  return improvedPrompt;
}
```

---

## 🎯 SAMMANFATTNING

### 7 Avancerade Strategier

1. **Multi-Source Verification** ✅
   - Kräv 2+ källor för kritisk data
   - Jämför källor mot varandra
   - Ge confidence score baserat på överensstämmelse

2. **Randomized Testing** ✅
   - Testa AI med kända företag
   - Kör kvalitetstest innan varje batch
   - Kräv 80%+ rätt svar

3. **Statistical Anomaly Detection** ✅
   - Upptäck onormala mönster
   - Flagga lazy responses
   - Validera fördelningar

4. **Incremental Validation** ✅
   - Validera steg-för-steg
   - Stoppa tidigt vid fel
   - Logga varje steg

5. **Confidence Scoring** ✅
   - Ge varje lead en score 0-100
   - Filtrera på min score
   - Visa score i UI

6. **Real-Time Monitoring** ✅
   - Övervaka AI-kvalitet live
   - Skicka alerts vid problem
   - Stoppa AI vid för många fel

7. **Learning from Mistakes** ✅
   - Logga alla misstag
   - Analysera vanligaste fel
   - Förbättra prompt automatiskt

### Implementationsordning

1. **Fas 1 (Kritiskt):**
   - Org.nummer-validering
   - Företagsnamn-validering
   - Exkluderingskontroll
   - CSV-uppladdning

2. **Fas 2 (Viktigt):**
   - Multi-source verification
   - Anomaly detection
   - Confidence scoring

3. **Fas 3 (Förbättring):**
   - Randomized testing
   - Real-time monitoring
   - Learning from mistakes

**Status:** ✅ Komplett strategi-guide klar!
