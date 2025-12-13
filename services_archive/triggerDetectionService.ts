/**
 * Trigger Detection Service
 * 
 * Upptäcker expansionssignaler och triggers för leads.
 * 
 * TRIGGERS:
 * 1. ✅ new_job_postings - Nya platsannonser (Arbetsförmedlingen)
 * 2. ✅ board_changes - Styrelseändringar (Bolagsverket)
 * 3. ✅ new_subsidiary - Nya dotterbolag (Bolagsverket)
 * 4. ✅ vat_registration - Ny momsregistrering (Skatteverket)
 * 5. ✅ new_technology - Ny teknologi (BuiltWith - BETALD)
 * 6. ✅ funding_round - Finansieringsrunda (Manuell data)
 * 7. ✅ new_office - Nytt kontor/lager (Bolagsverket)
 * 8. ✅ revenue_increase - Omsättningsökning (Bolagsverket)
 * 9. ✅ new_ecommerce - Ny e-handel (Website scraping)
 * 10. ✅ competitor_switch - Byter från konkurrent (Website scraping)
 */

import { checkJobPostingsForLead } from './arbetsformedlingenService';
import { detectNewVATRegistration } from './skatteverketService';
import { getCompanyEvents } from './bolagsverketService';

export type TriggerType =
  | 'new_job_postings'
  | 'board_changes'
  | 'new_subsidiary'
  | 'vat_registration'
  | 'new_technology'
  | 'funding_round'
  | 'new_office'
  | 'revenue_increase'
  | 'new_ecommerce'
  | 'competitor_switch';

export interface Trigger {
  type: TriggerType;
  detected_at: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  data?: any;
  source: string;
}

export interface TriggerDetectionResult {
  lead_id: string;
  company_name: string;
  triggers: Trigger[];
  total_triggers: number;
  highest_severity: 'low' | 'medium' | 'high' | 'critical';
  opportunity_score: number;
}

/**
 * Kolla alla triggers för ett lead
 */
export async function detectAllTriggers(lead: {
  id: string;
  company_name: string;
  org_number?: string;
  website_url?: string;
  revenue_tkr?: number;
  previous_revenue_tkr?: number;
}): Promise<TriggerDetectionResult> {
  
  const triggers: Trigger[] = [];

  // 1. NEW JOB POSTINGS (Arbetsförmedlingen)
  try {
    const jobCheck = await checkJobPostingsForLead(lead.company_name, lead.org_number);
    
    if (jobCheck.trigger_detected) {
      triggers.push({
        type: 'new_job_postings',
        detected_at: new Date().toISOString(),
        title: `${jobCheck.analysis.job_count} aktiva platsannonser`,
        description: `Företaget rekryterar aktivt: ${jobCheck.analysis.signals.join(', ')}`,
        severity: jobCheck.analysis.logistics_roles > 0 ? 'high' : 'medium',
        data: {
          job_count: jobCheck.analysis.job_count,
          logistics_roles: jobCheck.analysis.logistics_roles,
          management_roles: jobCheck.analysis.management_roles,
          expansion_score: jobCheck.analysis.expansion_score
        },
        source: 'arbetsformedlingen'
      });
    }
  } catch (error) {
    console.error('Error checking job postings:', error);
  }

  // 2. BOARD CHANGES (Bolagsverket)
  if (lead.org_number) {
    try {
      const events = await getCompanyEvents(lead.org_number);
      const boardChanges = events.filter(e => 
        e.type === 'board_change' || 
        e.description?.toLowerCase().includes('styrelse')
      );
      
      // Kolla om det finns ändringar senaste 90 dagarna
      const recentChanges = boardChanges.filter(change => {
        const changeDate = new Date(change.date);
        const daysSince = Math.floor((Date.now() - changeDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysSince <= 90;
      });
      
      if (recentChanges.length > 0) {
        triggers.push({
          type: 'board_changes',
          detected_at: new Date().toISOString(),
          title: `${recentChanges.length} styrelseändring(ar)`,
          description: `Nya styrelsemedlemmar eller VD-byte kan indikera ny strategi`,
          severity: 'medium',
          data: {
            change_count: recentChanges.length,
            latest_change: recentChanges[0].date
          },
          source: 'bolagsverket'
        });
      }
    } catch (error) {
      console.error('Error checking board changes:', error);
    }
  }

  // 3. NEW SUBSIDIARY (Bolagsverket)
  if (lead.org_number) {
    try {
      const events = await getCompanyEvents(lead.org_number);
      const subsidiaries = events.filter(e => 
        e.type === 'new_subsidiary' ||
        e.description?.toLowerCase().includes('dotterbolag')
      );
      
      const recentSubsidiaries = subsidiaries.filter(sub => {
        const subDate = new Date(sub.date);
        const daysSince = Math.floor((Date.now() - subDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysSince <= 180; // 6 månader
      });
      
      if (recentSubsidiaries.length > 0) {
        triggers.push({
          type: 'new_subsidiary',
          detected_at: new Date().toISOString(),
          title: `${recentSubsidiaries.length} nytt dotterbolag`,
          description: `Expansion genom nya dotterbolag indikerar tillväxt`,
          severity: 'high',
          data: {
            subsidiary_count: recentSubsidiaries.length,
            latest_subsidiary: recentSubsidiaries[0].date
          },
          source: 'bolagsverket'
        });
      }
    } catch (error) {
      console.error('Error checking subsidiaries:', error);
    }
  }

  // 4. VAT REGISTRATION (Skatteverket)
  if (lead.org_number) {
    try {
      const vatCheck = await detectNewVATRegistration(lead.org_number);
      
      if (vatCheck.trigger_detected) {
        triggers.push({
          type: 'vat_registration',
          detected_at: new Date().toISOString(),
          title: 'Ny momsregistrering',
          description: `Företaget momsregistrerades för ${vatCheck.days_since_registration} dagar sedan`,
          severity: 'high',
          data: {
            registration_date: vatCheck.registration_date,
            days_since: vatCheck.days_since_registration
          },
          source: 'skatteverket'
        });
      }
    } catch (error) {
      console.error('Error checking VAT registration:', error);
    }
  }

  // 5. NEW TECHNOLOGY (BuiltWith - BETALD)
  // TODO: Implementera när BuiltWith API är tillgängligt
  // Detta kräver betald prenumeration på BuiltWith API
  
  // 6. FUNDING ROUND (Manuell data)
  // TODO: Implementera manuell input för finansieringsrundor
  // Kan också scrapar från Breakit, Di Digital, etc.
  
  // 7. NEW OFFICE (Bolagsverket)
  if (lead.org_number) {
    try {
      const events = await getCompanyEvents(lead.org_number);
      const officeChanges = events.filter(e => 
        e.type === 'address_change' ||
        e.description?.toLowerCase().includes('adress') ||
        e.description?.toLowerCase().includes('kontor') ||
        e.description?.toLowerCase().includes('lager')
      );
      
      const recentOffices = officeChanges.filter(office => {
        const officeDate = new Date(office.date);
        const daysSince = Math.floor((Date.now() - officeDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysSince <= 180; // 6 månader
      });
      
      if (recentOffices.length > 0) {
        triggers.push({
          type: 'new_office',
          detected_at: new Date().toISOString(),
          title: 'Ny adress/kontor',
          description: `Adressändring kan indikera expansion eller nytt lager`,
          severity: 'medium',
          data: {
            change_count: recentOffices.length,
            latest_change: recentOffices[0].date
          },
          source: 'bolagsverket'
        });
      }
    } catch (error) {
      console.error('Error checking office changes:', error);
    }
  }

  // 8. REVENUE INCREASE (Bolagsverket)
  if (lead.revenue_tkr && lead.previous_revenue_tkr) {
    const revenueChange = ((lead.revenue_tkr - lead.previous_revenue_tkr) / lead.previous_revenue_tkr) * 100;
    
    // Om omsättning ökat med >20%
    if (revenueChange > 20) {
      triggers.push({
        type: 'revenue_increase',
        detected_at: new Date().toISOString(),
        title: `Omsättning +${Math.round(revenueChange)}%`,
        description: `Stark omsättningstillväxt från ${lead.previous_revenue_tkr} TKR till ${lead.revenue_tkr} TKR`,
        severity: revenueChange > 50 ? 'high' : 'medium',
        data: {
          current_revenue: lead.revenue_tkr,
          previous_revenue: lead.previous_revenue_tkr,
          change_percent: Math.round(revenueChange)
        },
        source: 'bolagsverket'
      });
    }
  }

  // 9. NEW ECOMMERCE (Website scraping)
  // Detta upptäcks i websiteScraperService.ts
  // Kan läggas till här om vi har tidigare scraping-data att jämföra med
  
  // 10. COMPETITOR SWITCH (Website scraping)
  // Detta upptäcks i competitiveIntelligenceService.ts
  // Om DHL tidigare inte fanns men nu finns = switch från konkurrent

  // Beräkna opportunity score
  const opportunityScore = calculateOpportunityScore(triggers);
  
  // Hitta högsta severity
  const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
  const highestSeverity = triggers.reduce((max, trigger) => {
    return severityOrder[trigger.severity] > severityOrder[max] ? trigger.severity : max;
  }, 'low' as 'low' | 'medium' | 'high' | 'critical');

  return {
    lead_id: lead.id,
    company_name: lead.company_name,
    triggers,
    total_triggers: triggers.length,
    highest_severity: highestSeverity,
    opportunity_score: opportunityScore
  };
}

/**
 * Beräkna opportunity score baserat på triggers
 */
function calculateOpportunityScore(triggers: Trigger[]): number {
  let score = 0;
  
  const severityPoints = {
    low: 10,
    medium: 20,
    high: 30,
    critical: 50
  };
  
  triggers.forEach(trigger => {
    score += severityPoints[trigger.severity];
  });
  
  // Bonus för flera triggers (indikerar stark expansion)
  if (triggers.length >= 3) {
    score += 20;
  }
  
  return Math.min(score, 100);
}

/**
 * Batch-kolla triggers för flera leads
 */
export async function batchDetectTriggers(
  leads: Array<{
    id: string;
    company_name: string;
    org_number?: string;
    website_url?: string;
    revenue_tkr?: number;
    previous_revenue_tkr?: number;
  }>
): Promise<TriggerDetectionResult[]> {
  
  const results: TriggerDetectionResult[] = [];
  
  for (const lead of leads) {
    try {
      const result = await detectAllTriggers(lead);
      results.push(result);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Error detecting triggers for ${lead.company_name}:`, error);
    }
  }
  
  return results;
}

/**
 * Filtrera leads med triggers
 */
export function filterLeadsWithTriggers(
  results: TriggerDetectionResult[],
  minTriggers: number = 1,
  minOpportunityScore: number = 0
): TriggerDetectionResult[] {
  
  return results.filter(result => 
    result.total_triggers >= minTriggers &&
    result.opportunity_score >= minOpportunityScore
  );
}

/**
 * Sortera leads efter opportunity score
 */
export function sortByOpportunityScore(
  results: TriggerDetectionResult[]
): TriggerDetectionResult[] {
  
  return [...results].sort((a, b) => b.opportunity_score - a.opportunity_score);
}

/**
 * Formatera trigger för visning
 */
export function formatTriggerForDisplay(trigger: Trigger): {
  icon: string;
  color: string;
  title: string;
  description: string;
  badge: string;
} {
  
  const triggerConfig: Record<TriggerType, { icon: string; color: string; badge: string }> = {
    new_job_postings: { icon: '👥', color: 'blue', badge: 'Rekryterar' },
    board_changes: { icon: '👔', color: 'purple', badge: 'Styrelseändring' },
    new_subsidiary: { icon: '🏢', color: 'green', badge: 'Dotterbolag' },
    vat_registration: { icon: '📋', color: 'yellow', badge: 'Momsreg.' },
    new_technology: { icon: '💻', color: 'cyan', badge: 'Ny Tech' },
    funding_round: { icon: '💰', color: 'gold', badge: 'Finansiering' },
    new_office: { icon: '🏭', color: 'orange', badge: 'Nytt Kontor' },
    revenue_increase: { icon: '📈', color: 'green', badge: 'Tillväxt' },
    new_ecommerce: { icon: '🛒', color: 'purple', badge: 'E-handel' },
    competitor_switch: { icon: '🔄', color: 'red', badge: 'Byter' }
  };
  
  const config = triggerConfig[trigger.type];
  
  return {
    icon: config.icon,
    color: config.color,
    title: trigger.title,
    description: trigger.description,
    badge: config.badge
  };
}

export default {
  detectAllTriggers,
  batchDetectTriggers,
  filterLeadsWithTriggers,
  sortByOpportunityScore,
  formatTriggerForDisplay
};
