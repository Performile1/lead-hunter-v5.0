/**
 * Trigger Detection Service
 * Upptäcker säljmöjligheter och triggers för kontakt
 * 
 * TRIGGERS:
 * - Expansion (nya marknader, nya produkter)
 * - Growth (ökad omsättning, anställningar)
 * - Technology change (ny e-handelsplattform)
 * - Competitor issues (konkurrent har problem)
 * - Seasonal (högsäsong närmar sig)
 */

import { LeadData } from '../types';

export interface Trigger {
  type: 'expansion' | 'growth' | 'tech_change' | 'competitor_issue' | 'seasonal' | 'financial' | 'hiring';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action_recommendation: string;
  detected_at: string;
  confidence: number; // 0-100
}

export interface TriggerAnalysis {
  lead_id: string;
  company_name: string;
  triggers: Trigger[];
  total_trigger_score: number;
  recommended_contact_timing: 'immediate' | 'this_week' | 'this_month' | 'monitor';
  priority_level: 'hot' | 'warm' | 'cold';
}

/**
 * Analysera triggers för ett lead
 */
export function detectTriggers(leadData: LeadData): TriggerAnalysis {
  const triggers: Trigger[] = [];
  
  // 1. EXPANSION TRIGGERS
  triggers.push(...detectExpansionTriggers(leadData));
  
  // 2. GROWTH TRIGGERS
  triggers.push(...detectGrowthTriggers(leadData));
  
  // 3. TECH CHANGE TRIGGERS
  triggers.push(...detectTechChangeTriggers(leadData));
  
  // 4. FINANCIAL TRIGGERS
  triggers.push(...detectFinancialTriggers(leadData));
  
  // 5. HIRING TRIGGERS
  triggers.push(...detectHiringTriggers(leadData));
  
  // 6. SEASONAL TRIGGERS
  triggers.push(...detectSeasonalTriggers(leadData));
  
  // Beräkna total trigger score
  const totalScore = calculateTriggerScore(triggers);
  
  // Bestäm kontakt-timing
  const contactTiming = determineContactTiming(triggers, totalScore);
  
  // Bestäm prioritet
  const priority = determinePriority(triggers, totalScore);
  
  return {
    lead_id: leadData.id || '',
    company_name: leadData.companyName || '',
    triggers,
    total_trigger_score: totalScore,
    recommended_contact_timing: contactTiming,
    priority_level: priority
  };
}

/**
 * Expansion triggers - nya marknader, produkter
 */
function detectExpansionTriggers(leadData: LeadData): Trigger[] {
  const triggers: Trigger[] = [];
  
  // Internationell expansion
  if (leadData.websiteAnalysis?.international_shipping) {
    triggers.push({
      type: 'expansion',
      severity: 'high',
      title: 'Internationell expansion',
      description: 'Företaget skickar internationellt - perfekt för DHL Express',
      action_recommendation: 'Kontakta för att diskutera internationella leveranslösningar',
      detected_at: new Date().toISOString(),
      confidence: 90
    });
  }
  
  // Många marknader
  if (leadData.websiteAnalysis?.tech_stack?.markets && 
      leadData.websiteAnalysis.tech_stack.markets.length > 3) {
    triggers.push({
      type: 'expansion',
      severity: 'high',
      title: `Aktiv på ${leadData.websiteAnalysis.tech_stack.markets.length} marknader`,
      description: 'Företaget har bred geografisk närvaro - behöver global logistikpartner',
      action_recommendation: 'Pitch DHL som global one-stop-shop',
      detected_at: new Date().toISOString(),
      confidence: 85
    });
  }
  
  return triggers;
}

/**
 * Growth triggers - tillväxt, ökad omsättning
 */
function detectGrowthTriggers(leadData: LeadData): Trigger[] {
  const triggers: Trigger[] = [];
  
  // Stark omsättningstillväxt
  if (leadData.revenueTkr && leadData.previousRevenueTkr) {
    const growth = ((leadData.revenueTkr - leadData.previousRevenueTkr) / leadData.previousRevenueTkr) * 100;
    
    if (growth > 50) {
      triggers.push({
        type: 'growth',
        severity: 'high',
        title: `${growth.toFixed(0)}% omsättningstillväxt`,
        description: 'Stark tillväxt indikerar ökade logistikbehov',
        action_recommendation: 'Kontakta nu - de behöver skalbar logistiklösning',
        detected_at: new Date().toISOString(),
        confidence: 95
      });
    } else if (growth > 20) {
      triggers.push({
        type: 'growth',
        severity: 'medium',
        title: `${growth.toFixed(0)}% omsättningstillväxt`,
        description: 'God tillväxt - kan behöva uppgradera logistik',
        action_recommendation: 'Kontakta inom kort för att diskutera skalning',
        detected_at: new Date().toISOString(),
        confidence: 80
      });
    }
  }
  
  // Hög omsättning = KAM-potential
  if (leadData.revenueTkr && leadData.revenueTkr > 100000) {
    triggers.push({
      type: 'growth',
      severity: 'high',
      title: 'KAM-potential (>100 MSEK)',
      description: 'Stor omsättning kvalificerar för Key Account Management',
      action_recommendation: 'Eskalera till KAM-team',
      detected_at: new Date().toISOString(),
      confidence: 100
    });
  }
  
  return triggers;
}

/**
 * Tech change triggers - ny plattform, ny checkout
 */
function detectTechChangeTriggers(leadData: LeadData): Trigger[] {
  const triggers: Trigger[] = [];
  
  // Ny e-handelsplattform (indikeras av modern tech stack)
  if (leadData.websiteAnalysis?.ecommerce_platform) {
    const modernPlatforms = ['Shopify', 'Centra', 'Sitoo', 'Commerce Cloud'];
    if (modernPlatforms.includes(leadData.websiteAnalysis.ecommerce_platform)) {
      triggers.push({
        type: 'tech_change',
        severity: 'medium',
        title: `Modern e-handelsplattform: ${leadData.websiteAnalysis.ecommerce_platform}`,
        description: 'Moderna plattformar = öppenhet för nya integrationer',
        action_recommendation: 'Pitch DHL:s API-integrationer och plugins',
        detected_at: new Date().toISOString(),
        confidence: 70
      });
    }
  }
  
  // Ny checkout-lösning
  if (leadData.websiteAnalysis?.checkout_providers?.includes('Klarna')) {
    triggers.push({
      type: 'tech_change',
      severity: 'low',
      title: 'Använder Klarna Checkout',
      description: 'Klarna-kunder är ofta öppna för premium-leveranser',
      action_recommendation: 'Pitch DHL Express som premium-alternativ',
      detected_at: new Date().toISOString(),
      confidence: 60
    });
  }
  
  return triggers;
}

/**
 * Financial triggers - ekonomiska förändringar
 */
function detectFinancialTriggers(leadData: LeadData): Trigger[] {
  const triggers: Trigger[] = [];
  
  // Stark likviditet
  if (leadData.liquidity && leadData.liquidity.includes('Mycket god')) {
    triggers.push({
      type: 'financial',
      severity: 'medium',
      title: 'Mycket god likviditet',
      description: 'Stark ekonomi - kan investera i premium-leveranser',
      action_recommendation: 'Pitch premium-tjänster utan prisfokus',
      detected_at: new Date().toISOString(),
      confidence: 75
    });
  }
  
  // Inget Kronofogden
  if (leadData.kronofogdenCheck && leadData.kronofogdenCheck.includes('Inga anmärkningar')) {
    triggers.push({
      type: 'financial',
      severity: 'low',
      title: 'Ren kredithistorik',
      description: 'Inga betalningsanmärkningar - låg risk',
      action_recommendation: 'Erbjud standardvillkor',
      detected_at: new Date().toISOString(),
      confidence: 100
    });
  }
  
  return triggers;
}

/**
 * Hiring triggers - rekrytering indikerar tillväxt
 */
function detectHiringTriggers(leadData: LeadData): Trigger[] {
  const triggers: Trigger[] = [];
  
  // Logistik-roller (från LinkedIn-sökning)
  if (leadData.decisionMakers?.some(dm => 
    dm.title?.toLowerCase().includes('logistik') || 
    dm.title?.toLowerCase().includes('supply chain')
  )) {
    triggers.push({
      type: 'hiring',
      severity: 'high',
      title: 'Logistik-chef identifierad',
      description: 'Rätt beslutsfattare finns - hög konverteringschans',
      action_recommendation: 'Kontakta logistik-chefen direkt',
      detected_at: new Date().toISOString(),
      confidence: 90
    });
  }
  
  return triggers;
}

/**
 * Seasonal triggers - säsongsmönster
 */
function detectSeasonalTriggers(leadData: LeadData): Trigger[] {
  const triggers: Trigger[] = [];
  const currentMonth = new Date().getMonth() + 1; // 1-12
  
  // Q4 (okt-dec) = högsäsong för e-handel
  if (currentMonth >= 10 && currentMonth <= 12) {
    triggers.push({
      type: 'seasonal',
      severity: 'high',
      title: 'Q4 högsäsong',
      description: 'Black Friday och jul närmar sig - ökade volymer',
      action_recommendation: 'Kontakta NU för att säkra kapacitet',
      detected_at: new Date().toISOString(),
      confidence: 100
    });
  }
  
  // Sommar (jun-aug) = förberedelse för högsäsong
  if (currentMonth >= 6 && currentMonth <= 8) {
    triggers.push({
      type: 'seasonal',
      severity: 'medium',
      title: 'Förberedelse för högsäsong',
      description: 'Bra timing att diskutera Q4-kapacitet',
      action_recommendation: 'Boka möte för Q4-planering',
      detected_at: new Date().toISOString(),
      confidence: 80
    });
  }
  
  return triggers;
}

/**
 * Beräkna total trigger score
 */
function calculateTriggerScore(triggers: Trigger[]): number {
  let score = 0;
  
  triggers.forEach(trigger => {
    const severityWeight = {
      high: 30,
      medium: 20,
      low: 10
    };
    
    const weight = severityWeight[trigger.severity];
    const confidenceFactor = trigger.confidence / 100;
    
    score += weight * confidenceFactor;
  });
  
  return Math.min(100, Math.round(score));
}

/**
 * Bestäm kontakt-timing
 */
function determineContactTiming(
  triggers: Trigger[], 
  score: number
): 'immediate' | 'this_week' | 'this_month' | 'monitor' {
  
  // Hög-severity triggers = immediate
  const highSeverityCount = triggers.filter(t => t.severity === 'high').length;
  
  if (highSeverityCount >= 2 || score >= 80) {
    return 'immediate';
  } else if (highSeverityCount >= 1 || score >= 60) {
    return 'this_week';
  } else if (score >= 40) {
    return 'this_month';
  } else {
    return 'monitor';
  }
}

/**
 * Bestäm prioritet
 */
function determinePriority(
  triggers: Trigger[], 
  score: number
): 'hot' | 'warm' | 'cold' {
  
  if (score >= 70) {
    return 'hot';
  } else if (score >= 40) {
    return 'warm';
  } else {
    return 'cold';
  }
}

/**
 * Formatera triggers för visning
 */
export function formatTriggersForDisplay(analysis: TriggerAnalysis): string {
  if (analysis.triggers.length === 0) {
    return 'Inga triggers identifierade';
  }
  
  const lines: string[] = [];
  
  lines.push(`🎯 ${analysis.triggers.length} triggers identifierade (Score: ${analysis.total_trigger_score}/100)`);
  lines.push(`📊 Prioritet: ${analysis.priority_level.toUpperCase()}`);
  lines.push(`⏰ Kontakta: ${analysis.recommended_contact_timing}`);
  lines.push('');
  
  analysis.triggers.forEach((trigger, index) => {
    const icon = trigger.severity === 'high' ? '🔥' : trigger.severity === 'medium' ? '⚡' : '💡';
    lines.push(`${icon} ${trigger.title}`);
    lines.push(`   ${trigger.description}`);
    lines.push(`   → ${trigger.action_recommendation}`);
    if (index < analysis.triggers.length - 1) {
      lines.push('');
    }
  });
  
  return lines.join('\n');
}

export default {
  detectTriggers,
  formatTriggersForDisplay
};
