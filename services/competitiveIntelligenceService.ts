/**
 * Competitive Intelligence Service
 * Analysera konkurrens-situation och generera säljrekommendationer
 * 
 * KRITISKT FÖR DHL:
 * - Är de redan DHL-kund?
 * - Vilka konkurrenter använder de?
 * - Opportunity score (hur bra lead?)
 * - Säljpitch (vad ska säljaren säga?)
 */

import { LeadData } from '../types';

interface CompetitiveIntelligence {
  lead_id: string;
  
  // DHL Status
  is_dhl_customer: boolean;
  dhl_services: string[];
  dhl_checkout_position?: number;
  
  // Konkurrenter
  primary_competitor?: string;
  all_competitors: string[];
  competitor_count: number;
  
  // Opportunity Score (0-100)
  opportunity_score: number;
  opportunity_reason: string;
  
  // Rekommendation
  recommended_action: 'contact_now' | 'contact_soon' | 'monitor' | 'ignore';
  sales_pitch: string;
  
  // Insights
  insights: string[];
  competitive_advantages: string[];
  potential_objections: string[];
}

/**
 * Analysera competitive intelligence från website scraping
 */
export function analyzeCompetitiveIntelligence(
  websiteAnalysis: LeadData['websiteAnalysis'],
  leadData: LeadData
): CompetitiveIntelligence {
  
  if (!websiteAnalysis) {
    return {
      lead_id: leadData.id || '',
      is_dhl_customer: false,
      dhl_services: [],
      all_competitors: [],
      competitor_count: 0,
      opportunity_score: 0,
      opportunity_reason: 'Ingen websiteanalys tillgänglig',
      recommended_action: 'monitor',
      sales_pitch: '',
      insights: [],
      competitive_advantages: [],
      potential_objections: []
    };
  }

  const intelligence: CompetitiveIntelligence = {
    lead_id: leadData.id || '',
    is_dhl_customer: leadData.usesDhl === 'Ja',
    dhl_services: [],
    all_competitors: [],
    competitor_count: 0,
    opportunity_score: 0,
    opportunity_reason: '',
    recommended_action: 'monitor',
    sales_pitch: '',
    insights: [],
    competitive_advantages: [],
    potential_objections: []
  };

  // Extrahera konkurrenter från shipping_providers
  const shippingProviders = websiteAnalysis.shipping_providers || [];
  const competitors = shippingProviders.filter(p => !p.toLowerCase().includes('dhl'));
  
  intelligence.all_competitors = competitors;
  intelligence.competitor_count = competitors.length;
  
  if (competitors.length > 0) {
    intelligence.primary_competitor = competitors[0];
  }

  // DHL-tjänster
  const dhlProviders = shippingProviders.filter(p => p.toLowerCase().includes('dhl'));
  
  if (dhlProviders.length > 0) {
    intelligence.is_dhl_customer = true;
    intelligence.dhl_services = dhlProviders;
    
    // Hitta DHL position
    const dhlIndex = shippingProviders.findIndex(p => p.toLowerCase().includes('dhl'));
    if (dhlIndex >= 0) {
      intelligence.dhl_checkout_position = dhlIndex + 1;
    }
  }

  // Beräkna Opportunity Score
  intelligence.opportunity_score = calculateOpportunityScore(websiteAnalysis, leadData);
  intelligence.opportunity_reason = generateOpportunityReason(websiteAnalysis, leadData, intelligence);

  // Rekommenderad action
  intelligence.recommended_action = determineRecommendedAction(intelligence);

  // Generera säljpitch
  intelligence.sales_pitch = generateSalesPitch(websiteAnalysis, leadData, intelligence);

  // Generera insights
  intelligence.insights = generateInsights(websiteAnalysis, leadData, intelligence);

  // Competitive advantages
  intelligence.competitive_advantages = generateCompetitiveAdvantages(websiteAnalysis, leadData, intelligence);

  // Potential objections
  intelligence.potential_objections = generatePotentialObjections(websiteAnalysis, leadData, intelligence);

  return intelligence;
}

/**
 * Beräkna Opportunity Score (0-100)
 */
function calculateOpportunityScore(websiteAnalysis: LeadData['websiteAnalysis'], leadData: LeadData): number {
  let score = 50; // Baseline

  if (!websiteAnalysis) return score;

  // E-handel = bra! (+20)
  if (websiteAnalysis.ecommerce_platform) {
    score += 20;
  }

  // Checkout = ännu bättre! (+10)
  if (websiteAnalysis.has_checkout) {
    score += 10;
  }

  // Inte DHL-kund = stor opportunity! (+30)
  const hasDHL = websiteAnalysis.shipping_providers?.some(p => p.toLowerCase().includes('dhl'));
  if (!hasDHL) {
    score += 30;
  } else {
    // Redan DHL-kund men inte först i checkout = upsell opportunity (+10)
    const dhlIndex = websiteAnalysis.shipping_providers?.findIndex(p => p.toLowerCase().includes('dhl'));
    if (dhlIndex !== undefined && dhlIndex > 0) {
      score += 10;
    } else {
      score -= 20; // Redan nöjd DHL-kund
    }
  }

  // Många konkurrenter = svårare (+0 till -20)
  const competitorCount = websiteAnalysis.shipping_providers?.filter(p => !p.toLowerCase().includes('dhl')).length || 0;
  score -= Math.min(competitorCount, 4) * 5;

  // Hög omsättning = bättre lead (+20)
  const revenueTkr = leadData.financials?.revenueCurrent || 0;
  if (revenueTkr > 50000) {
    score += 20;
  } else if (revenueTkr > 10000) {
    score += 10;
  }

  // International shipping = DHL's styrka! (+15)
  if (websiteAnalysis.international_shipping) {
    score += 15;
  }

  // Många marknader = DHL's styrka! (+10)
  const marketCount = leadData.markets?.split(',').length || 0;
  if (marketCount > 2) {
    score += 10;
  }

  // Segment (KAM/FS = bättre)
  if (leadData.segment === 'KAM') {
    score += 15;
  } else if (leadData.segment === 'FS') {
    score += 10;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Generera opportunity reason
 */
function generateOpportunityReason(
  websiteAnalysis: LeadData['websiteAnalysis'],
  leadData: LeadData,
  intelligence: CompetitiveIntelligence
): string {
  const reasons: string[] = [];

  if (!intelligence.is_dhl_customer) {
    reasons.push('Inte DHL-kund ännu');
  }

  if (websiteAnalysis?.international_shipping) {
    reasons.push('International shipping (DHL\'s styrka)');
  }

  const marketCount = leadData.markets?.split(',').length || 0;
  if (marketCount > 2) {
    reasons.push(`Säljer på ${marketCount} marknader`);
  }

  const revenueTkr = leadData.financials?.revenueCurrent || 0;
  if (revenueTkr > 50000) {
    reasons.push('Hög omsättning (KAM-potential)');
  }

  if (websiteAnalysis?.ecommerce_platform) {
    reasons.push(`E-handel (${websiteAnalysis.ecommerce_platform})`);
  }

  if (intelligence.competitor_count > 0) {
    reasons.push(`Använder ${intelligence.competitor_count} konkurrenter`);
  }

  return reasons.join(', ');
}

/**
 * Bestäm rekommenderad action
 */
function determineRecommendedAction(
  intelligence: CompetitiveIntelligence
): 'contact_now' | 'contact_soon' | 'monitor' | 'ignore' {
  
  if (intelligence.opportunity_score >= 80) {
    return 'contact_now';
  } else if (intelligence.opportunity_score >= 60) {
    return 'contact_soon';
  } else if (intelligence.opportunity_score >= 40) {
    return 'monitor';
  } else {
    return 'ignore';
  }
}

/**
 * Generera säljpitch
 */
function generateSalesPitch(
  websiteAnalysis: LeadData['websiteAnalysis'],
  leadData: LeadData,
  intelligence: CompetitiveIntelligence
): string {
  const pitches: string[] = [];

  // Inte DHL-kund
  if (!intelligence.is_dhl_customer) {
    pitches.push(`Hej! Jag ser att ni använder ${intelligence.primary_competitor || 'andra transportörer'} för er e-handel.`);
    
    if (websiteAnalysis?.international_shipping) {
      pitches.push('Eftersom ni skickar internationellt skulle DHL Express kunna erbjuda snabbare leveranser och bättre tracking.');
    }
    
    const marketCount = leadData.markets?.split(',').length || 0;
    if (marketCount > 2) {
      pitches.push(`Med er närvaro på ${marketCount} marknader kan DHL erbjuda en global lösning med lokala leveranser.`);
    }
  } else {
    // Redan DHL-kund - upsell
    pitches.push('Hej! Jag ser att ni redan använder DHL, vilket är fantastiskt!');
    
    if (intelligence.dhl_checkout_position && intelligence.dhl_checkout_position > 1) {
      pitches.push('Jag märker att DHL inte är er primära leveransalternativ i checkout. Skulle ni vara intresserade av att diskutera hur vi kan bli er föredragna partner?');
    }
    
    const hasParcelLocker = leadData.deliveryServices?.includes('Paketskåp');
    if (hasParcelLocker) {
      pitches.push('Jag ser att ni erbjuder paketskåp. DHL har ett växande nätverk av paketskåp som kan komplettera er nuvarande lösning.');
    }
  }

  // Segment-specifikt
  if (leadData.segment === 'KAM') {
    pitches.push('Som ett större företag kan vi erbjuda en dedikerad Key Account Manager och skräddarsydda lösningar.');
  }

  return pitches.join(' ');
}

/**
 * Generera insights
 */
function generateInsights(
  websiteAnalysis: LeadData['websiteAnalysis'],
  leadData: LeadData,
  intelligence: CompetitiveIntelligence
): string[] {
  const insights: string[] = [];

  // E-handelsplattform
  if (websiteAnalysis?.ecommerce_platform) {
    insights.push(`E-handelsplattform: ${websiteAnalysis.ecommerce_platform}`);
  }

  // Konkurrenter
  if (intelligence.competitor_count > 0) {
    insights.push(`Använder ${intelligence.competitor_count} konkurrenter: ${intelligence.all_competitors.join(', ')}`);
  }

  // Leveransalternativ
  if (leadData.deliveryServices && leadData.deliveryServices.length > 0) {
    insights.push(`Leveransalternativ: ${leadData.deliveryServices.join(', ')}`);
  }

  // Marknader
  if (leadData.markets) {
    insights.push(`Marknader: ${leadData.markets}`);
  }

  // International shipping
  if (websiteAnalysis?.international_shipping) {
    insights.push('International shipping');
  }

  // Nyckeltal
  if (websiteAnalysis?.financial_metrics) {
    if (websiteAnalysis.financial_metrics.revenue) {
      insights.push(`Omsättning: ${websiteAnalysis.financial_metrics.revenue} MSEK`);
    }
    if (websiteAnalysis.financial_metrics.employees) {
      insights.push(`Anställda: ${websiteAnalysis.financial_metrics.employees}`);
    }
  }

  // Likviditet från leadData
  if (leadData.liquidity) {
    insights.push(`Likviditet: ${leadData.liquidity}`);
  }

  return insights;
}

/**
 * Generera competitive advantages
 */
function generateCompetitiveAdvantages(
  websiteAnalysis: LeadData['websiteAnalysis'],
  leadData: LeadData,
  intelligence: CompetitiveIntelligence
): string[] {
  const advantages: string[] = [];

  // International shipping
  if (websiteAnalysis?.international_shipping) {
    advantages.push('DHL Express är marknadsledande för internationella leveranser');
    advantages.push('Globalt nätverk med lokala leveranser');
  }

  // Många marknader
  const marketCount = leadData.markets?.split(',').length || 0;
  if (marketCount > 2) {
    advantages.push('DHL finns i över 220 länder');
    advantages.push('En partner för alla marknader');
  }

  // E-handel
  if (websiteAnalysis?.ecommerce_platform) {
    advantages.push('Integrationer med alla stora e-handelsplattformar');
    advantages.push('Automatisk orderhantering och tracking');
  }

  // Premium segment
  if (leadData.segment === 'KAM' || leadData.segment === 'FS') {
    advantages.push('Dedikerad Key Account Manager');
    advantages.push('Skräddarsydda lösningar för stora volymer');
  }

  return advantages;
}

/**
 * Generera potential objections
 */
function generatePotentialObjections(
  websiteAnalysis: LeadData['websiteAnalysis'],
  leadData: LeadData,
  intelligence: CompetitiveIntelligence
): string[] {
  const objections: string[] = [];

  // Redan använder konkurrent
  if (intelligence.primary_competitor) {
    objections.push(`"Vi är nöjda med ${intelligence.primary_competitor}"`);
    objections.push(`Svar: Jag förstår! Många av våra bästa kunder använde tidigare ${intelligence.primary_competitor}. Skulle ni vara öppna för en jämförelse?`);
  }

  // Pris
  objections.push('"DHL är för dyrt"');
  objections.push('Svar: Vi fokuserar på total cost of ownership. Med färre förseningar, bättre tracking och nöjdare kunder blir DHL ofta mer kostnadseffektivt.');

  // Redan har lösning
  if (intelligence.is_dhl_customer) {
    objections.push('"Vi använder redan DHL för vissa sändningar"');
    objections.push('Svar: Fantastiskt! Låt oss diskutera hur vi kan bli er primära partner för alla leveranser.');
  }

  // Små volymer
  if (leadData.segment === 'DM' || leadData.segment === 'TS') {
    objections.push('"Vi har för små volymer"');
    objections.push('Svar: Vi har lösningar för alla storlekar. Många av våra största kunder började som små e-handlare.');
  }

  return objections;
}

export default {
  analyzeCompetitiveIntelligence
};
